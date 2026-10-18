import React, { useState, useEffect, useRef } from 'react';
import type { ChatSession, User } from '../types';

interface ChatViewportProps {
  session: ChatSession;
  currentUser: User;
  isStreaming: boolean;
  streamingStatusText: string;
  onSendSuggestion: (text: string) => void;
  onCopyText: (text: string, label: string) => void;
  onFeedback: (type: 'like' | 'dislike') => void;
  onRetry: () => void;
}

export const ChatViewport: React.FC<ChatViewportProps> = ({
  session,
  currentUser: _currentUser,
  isStreaming,
  streamingStatusText,
  onSendSuggestion,
  onCopyText,
  onFeedback,
  onRetry
}) => {
  const [expandedThoughts, setExpandedThoughts] = useState<Record<number, boolean>>({});
  const [copiedCodeKey, setCopiedCodeKey] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState<boolean>(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUpRef = useRef<boolean>(false);

  const toggleThought = (idx: number) => {
    setExpandedThoughts(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handleCopyCode = (code: string, key: string) => {
    onCopyText(code, 'คัดลอกโค้ดไปยังคลิปบอร์ดแล้ว');
    setCopiedCodeKey(key);
    setTimeout(() => {
      setCopiedCodeKey(null);
    }, 2000);
  };

  // Scroll to absolute bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior });
      isUserScrolledUpRef.current = false;
      setShowScrollBottom(false);
    }
  };

  // Detect user scrolling
  const handleScroll = () => {
    if (!viewportRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

    // If user scrolled up more than 120px from bottom
    if (distanceFromBottom > 120) {
      isUserScrolledUpRef.current = true;
      setShowScrollBottom(true);
    } else {
      isUserScrolledUpRef.current = false;
      setShowScrollBottom(false);
    }
  };

  // Auto-scroll on new messages or during AI streaming ONLY if user is not reviewing previous messages
  useEffect(() => {
    if (!isUserScrolledUpRef.current) {
      scrollToBottom('smooth');
    }
  }, [session?.messages, isStreaming, streamingStatusText]);

  // When active session changes, reset and scroll to bottom instantly
  useEffect(() => {
    isUserScrolledUpRef.current = false;
    setShowScrollBottom(false);
    scrollToBottom('auto');
  }, [session?.id]);

  const escapeHtml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const formatCodeSyntax = (code: string) => {
    return code.split('\n').map((line, i) => {
      let formatted = escapeHtml(line);

      formatted = formatted.replace(
        /\b(import|export|from|function|const|let|var|return|type|interface|class|async|await|if|else|for|while|try|catch|new|def|public|private)\b/g,
        '<span class="syntax-keyword">$1</span>'
      );
      formatted = formatted.replace(
        /(&quot;.*?&quot;|&#39;.*?&#39;|`.*?`)/g,
        '<span class="syntax-string">$1</span>'
      );
      formatted = formatted.replace(
        /\b(string|number|boolean|void|any|Promise|Array|Record|null|undefined|true|false)\b/g,
        '<span class="syntax-type">$1</span>'
      );
      formatted = formatted.replace(
        /(\/\/.*$|#.*$)/g,
        '<span class="syntax-comment">$1</span>'
      );

      return (
        <span key={i} className="code-line-row">
          <span className="code-line-num">{i + 1}</span>
          <span className="code-line-text" dangerouslySetInnerHTML={{ __html: formatted }} />
        </span>
      );
    });
  };

  const formatMarkdown = (text: string): string => {
    if (!text) return '';
    let res = escapeHtml(text);
    // Bold **text**
    res = res.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic *text*
    res = res.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Inline code `code`
    res = res.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    // Bullet lines starting with -
    res = res.replace(/^-\s+(.+)$/gm, '• $1');
    return res;
  };

  // Helper to render mixed paragraph with markdown code blocks: ```lang ... ```
  const renderParagraphContent = (p: string, msgIdx: number, pIdx: number) => {
    if (!p.includes('```')) {
      return <p key={pIdx} className="ai-paragraph" dangerouslySetInnerHTML={{ __html: formatMarkdown(p) }} />;
    }

    const segments: React.ReactNode[] = [];
    const parts = p.split(/(```[\s\S]*?```)/g);

    parts.forEach((part, partIdx) => {
      if (!part) return;
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).split('\n');
        const lang = lines[0].trim() || 'code';
        const codeText = lines.slice(1).join('\n').trim() || lines[0];
        const key = `inline-${msgIdx}-${pIdx}-${partIdx}`;

        segments.push(
          <div key={key} className="code-block-wrapper">
            <div className="code-header-bar">
              <div className="code-title-group">
                <span className="material-symbols-outlined text-tech-accent" style={{ fontSize: '15px' }}>
                  terminal
                </span>
                <span className="filename-text">{lang}</span>
                <span className="lang-badge">{lang.toUpperCase()}</span>
              </div>
              <button
                className="btn-copy-code"
                onClick={() => handleCopyCode(codeText, key)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                  {copiedCodeKey === key ? 'check' : 'content_copy'}
                </span>
                <span>{copiedCodeKey === key ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ด'}</span>
              </button>
            </div>
            <pre className="code-pre">
              <code>{formatCodeSyntax(codeText)}</code>
            </pre>
          </div>
        );
      } else {
        segments.push(
          <p key={`p-${partIdx}`} className="ai-paragraph" dangerouslySetInnerHTML={{ __html: formatMarkdown(part) }} />
        );
      }
    });

    return <div key={pIdx} className="ai-mixed-block">{segments}</div>;
  };

  const hasMessages = session && session.messages && session.messages.length > 0;

  return (
    <section
      className="chat-viewport custom-scroll"
      ref={viewportRef}
      onScroll={handleScroll}
    >
      <div className="chat-thread-container">
        {/* Clean Tech Empty State (When no messages yet) */}
        {!hasMessages ? (
          <div className="tech-empty-state">
            <div className="tech-logo-halo">
              <img src="/aetheris-logo.png" alt="Aetheris AI" className="tech-main-logo" />
            </div>

            <h1 className="tech-hero-title">
              มีอะไรให้ <span className="tech-gradient-text">Aetheris</span> ช่วยคุณวันนี้?
            </h1>
            <p className="tech-hero-subtitle">
              ผู้ช่วย AI อัจฉริยะ ตอบคำถาม เขียนโค้ด และวิเคราะห์ข้อมูลอย่างแม่นยำ ตรงไปตรงมา
            </p>

            <div className="tech-quick-grid">
              <button
                className="tech-card-action"
                onClick={() => onSendSuggestion('เขียนโค้ด React TypeScript สำหรับเชื่อมต่อ API อย่างมีประสิทธิภาพ')}
              >
                <span className="material-symbols-outlined tech-action-icon">code</span>
                <span className="tech-action-text">เขียนโค้ด React TypeScript</span>
              </button>

              <button
                className="tech-card-action"
                onClick={() => onSendSuggestion('ช่วยออกแบบสถาปัตยกรรมระบบคลาวด์ Microservices')}
              >
                <span className="material-symbols-outlined tech-action-icon">hub</span>
                <span className="tech-action-text">ออกแบบสถาปัตยกรรมระบบ</span>
              </button>

              <button
                className="tech-card-action"
                onClick={() => onSendSuggestion('วิเคราะห์แนวทางการ Optimize Database Query ให้เร็วขึ้น 10 เท่า')}
              >
                <span className="material-symbols-outlined tech-action-icon">database</span>
                <span className="tech-action-text">Optimize Database Query</span>
              </button>

              <button
                className="tech-card-action"
                onClick={() => onSendSuggestion('ตรวจสอบวันเวลาและสภาพอากาศปัจจุบัน')}
              >
                <span className="material-symbols-outlined tech-action-icon">wb_sunny</span>
                <span className="tech-action-text">ตรวจสอบวันเวลาและสภาพอากาศ</span>
              </button>
            </div>
          </div>
        ) : (
          /* Messages List */
          <div className="messages-list">
            {session.messages.map((msg, idx) => {
              if (msg.sender === 'user') {
                return (
                  <div key={idx} className="message-row user-row">
                    <div className="message-content user-content">
                      <div className="user-bubble">{msg.content}</div>
                    </div>
                  </div>
                );
              }

              // AI Assistant Message
              const isThoughtExpanded = !!expandedThoughts[idx];
              const codeKey = `block-${idx}`;

              return (
                <div key={idx} className="message-row assistant-row">
                  <div className="assistant-avatar">
                    <img src="/aetheris-logo.png" alt="Aetheris Profile" className="assistant-avatar-img" />
                  </div>

                  <div className="message-content assistant-content">
                    <div className="assistant-header">
                      <span className="assistant-name">Aetheris</span>
                      <span className="tech-model-tag">AI CORE</span>
                    </div>

                    {/* Thought / Reasoning Bar */}
                    {msg.thoughtSummary && (
                      <div className="thought-wrapper">
                        <button
                          type="button"
                          className="reasoning-bar"
                          onClick={() => toggleThought(idx)}
                        >
                          <div className="reasoning-left">
                            <span className="material-symbols-outlined text-tech-accent">psychology</span>
                            <span>{msg.thoughtSummary}</span>
                          </div>
                          <span className="material-symbols-outlined text-outline">
                            {isThoughtExpanded ? 'expand_less' : 'expand_more'}
                          </span>
                        </button>
                        {isThoughtExpanded && (
                          <div className="reasoning-details">
                            {msg.thoughtDetails}
                          </div>
                        )}
                      </div>
                    )}

                    {/* AI Text Content & Code Blocks */}
                    <div className="ai-text-content">
                      {msg.paragraphs && msg.paragraphs.length > 0 ? (
                        msg.paragraphs.map((p, pIdx) => renderParagraphContent(p, idx, pIdx))
                      ) : msg.content ? (
                        renderParagraphContent(msg.content, idx, 0)
                      ) : null}

                      {/* Standalone Code Block if separated and not already embedded in paragraphs */}
                      {msg.codeBlock && (!msg.paragraphs || !msg.paragraphs.some(p => p.includes('```'))) && (
                        <div className="code-block-wrapper">
                          <div className="code-header-bar">
                            <div className="code-title-group">
                              <span className="material-symbols-outlined text-tech-accent" style={{ fontSize: '15px' }}>
                                terminal
                              </span>
                              <span className="filename-text">{msg.codeBlock.filename}</span>
                              <span className="lang-badge">{msg.codeBlock.language}</span>
                            </div>
                            <button
                              className="btn-copy-code"
                              onClick={() => handleCopyCode(msg.codeBlock!.code, codeKey)}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                                {copiedCodeKey === codeKey ? 'check' : 'content_copy'}
                              </span>
                              <span>{copiedCodeKey === codeKey ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ด'}</span>
                            </button>
                          </div>
                          <pre className="code-pre">
                            <code>{formatCodeSyntax(msg.codeBlock.code)}</code>
                          </pre>
                        </div>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="assistant-actions-row">
                      <button
                        className="btn-action-icon"
                        title="คัดลอกคำตอบ"
                        onClick={() => {
                          const fullText = (msg.paragraphs || []).join('\n\n') || msg.content || '';
                          onCopyText(fullText, 'คัดลอกข้อความแล้ว');
                        }}
                      >
                        <span className="material-symbols-outlined">content_copy</span>
                      </button>
                      <button
                        className="btn-action-icon"
                        title="สร้างคำตอบใหม่"
                        onClick={onRetry}
                      >
                        <span className="material-symbols-outlined">refresh</span>
                      </button>
                      <button
                        className="btn-action-icon"
                        title="มีประโยชน์"
                        onClick={() => onFeedback('like')}
                      >
                        <span className="material-symbols-outlined">thumb_up</span>
                      </button>
                      <button
                        className="btn-action-icon"
                        title="ไม่ถูกใจ"
                        onClick={() => onFeedback('dislike')}
                      >
                        <span className="material-symbols-outlined">thumb_down</span>
                      </button>
                    </div>

                    {/* Follow-up suggestions */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="followup-pills-row">
                        {msg.suggestions.map((sug, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            className="followup-pill"
                            onClick={() => onSendSuggestion(sug)}
                          >
                            <span>{sug}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Streaming Indicator */}
        {isStreaming && (
          <div className="message-row assistant-row">
            <div className="assistant-avatar">
              <img src="/aetheris-logo.png" alt="Aetheris" className="assistant-avatar-img streaming-glow" />
            </div>
            <div className="message-content assistant-content">
              <div className="typing-stream-pill">
                <span className="material-symbols-outlined spin-icon text-tech-accent">progress_activity</span>
                <span>{streamingStatusText || 'กำลังคิดและตอบคำถาม...'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Anchor for auto scroll */}
        <div ref={bottomRef} className="scroll-anchor" />
      </div>

      {/* Floating Scroll-to-Bottom Fast Rocket Button */}
      {showScrollBottom && (
        <button
          type="button"
          className="tech-scroll-bottom-btn"
          onClick={() => scrollToBottom('smooth')}
          title="เลื่อนลงไปยังข้อความล่าสุด"
          aria-label="Scroll to bottom"
        >
          <span className="material-symbols-outlined">arrow_downward</span>
          <span className="tech-scroll-bottom-label">ล่าสุด</span>
        </button>
      )}
    </section>
  );
};

export default ChatViewport;
