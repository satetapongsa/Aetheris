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
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const toggleThought = (idx: number) => {
    setExpandedThoughts(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handleCopyCode = (code: string, idx: number) => {
    onCopyText(code, 'คัดลอกโค้ดไปยังคลิปบอร์ดแล้ว');
    setCopiedCodeIdx(idx);
    setTimeout(() => {
      setCopiedCodeIdx(null);
    }, 2000);
  };

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [session?.messages, isStreaming]);

  const formatCodeSyntax = (code: string) => {
    return code.split('\n').map((line, i) => {
      let formatted = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

      formatted = formatted.replace(
        /\b(import|export|from|function|const|let|var|return|type|async|await)\b/g,
        '<span class="syntax-keyword">$1</span>'
      );
      formatted = formatted.replace(
        /(&quot;.*?&quot;|&#39;.*?&#39;|`.*?`)/g,
        '<span class="syntax-string">$1</span>'
      );
      formatted = formatted.replace(
        /\b(string|number|boolean|ProfileState|Event|void|any)\b/g,
        '<span class="syntax-type">$1</span>'
      );
      formatted = formatted.replace(
        /(\/\/.*$)/g,
        '<span class="syntax-comment">$1</span>'
      );

      return (
        <span key={i} style={{ display: 'block' }}>
          <span style={{ color: 'var(--outline)', userSelect: 'none', display: 'inline-block', width: '28px', fontSize: '11px' }}>
            {i + 1}
          </span>
          {'  '}
          <span dangerouslySetInnerHTML={{ __html: formatted }} />
        </span>
      );
    });
  };

  const formatMarkdown = (text: string): string => {
    if (!text) return '';
    let res = text;
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

  const hasMessages = session && session.messages && session.messages.length > 0;

  return (
    <section className="chat-viewport custom-scroll" ref={viewportRef}>
      <div className="chat-thread-container">
        {/* Clean GPT-style Empty State (When no messages yet) */}
        {!hasMessages ? (
          <div className="gpt-empty-center">
            <div className="gpt-brand-emblem">
              <img src="/aetheris-logo.png" alt="Aetheris" className="gpt-empty-logo-img" />
            </div>
            <h1 className="gpt-empty-title">มีอะไรให้ Aetheris ช่วยวันนี้ไหม?</h1>
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
              return (
                <div key={idx} className="message-row assistant-row">
                  <div className="assistant-avatar">
                    <img src="/aetheris-logo.png" alt="Aetheris Profile" className="assistant-avatar-img" />
                  </div>

                  <div className="message-content assistant-content">
                    <div className="assistant-header">
                      <span className="assistant-name">Aetheris</span>
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
                            <span className="material-symbols-outlined">psychology</span>
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

                    {/* Text Content */}
                    <div className="ai-text-content">
                      {msg.paragraphs?.map((p, pIdx) => (
                        <p key={pIdx} dangerouslySetInnerHTML={{ __html: formatMarkdown(p) }} />
                      ))}

                      {/* Code Block */}
                      {msg.codeBlock && (
                        <div className="code-block-wrapper">
                          <div className="code-header-bar">
                            <div className="code-title-group">
                              <span className="material-symbols-outlined text-primary" style={{ fontSize: '16px' }}>
                                code
                              </span>
                              <span className="filename-text">{msg.codeBlock.filename}</span>
                              <span className="lang-badge">{msg.codeBlock.language}</span>
                            </div>
                            <button
                              className="btn-copy-code"
                              onClick={() => handleCopyCode(msg.codeBlock!.code, idx)}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                                {copiedCodeIdx === idx ? 'check' : 'content_copy'}
                              </span>
                              <span>{copiedCodeIdx === idx ? 'Copied!' : 'Copy code'}</span>
                            </button>
                          </div>
                          <pre className="code-pre">
                            <code>{formatCodeSyntax(msg.codeBlock.code)}</code>
                          </pre>
                        </div>
                      )}
                    </div>

                    {/* Actions Row */}
                    <div className="assistant-actions-row">
                      <button
                        className="btn-action-icon"
                        title="คัดลอกคำตอบ"
                        onClick={() => {
                          const fullText = (msg.paragraphs || []).join('\n\n');
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

                    {/* Optional Follow-up Suggestions */}
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
              <svg viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="44" fill="#1e1e24" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="2"/>
                <circle cx="50" cy="50" r="6" fill="#f0f0f5" className="pulse-circle" />
              </svg>
            </div>
            <div className="message-content assistant-content">
              <div className="typing-stream-pill">
                <span className="material-symbols-outlined spin-icon text-primary">progress_activity</span>
                <span>{streamingStatusText || 'กำลังคิดและตอบคำถาม...'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
export default ChatViewport;
