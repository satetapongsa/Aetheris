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
  currentUser,
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
  }, [session.messages, isStreaming]);

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

  return (
    <section className="chat-viewport custom-scroll" ref={viewportRef}>
      <div className="chat-thread-container">
        {/* Session Metadata Header */}
        <div className="session-meta-bar">
          <div className="meta-left">
            <span className="material-symbols-outlined text-primary">chat</span>
            <span className="session-title-text">{session.title}</span>
            <span className="bullet">•</span>
            <span className="session-topic-text">{session.topic}</span>
          </div>
          <div className="meta-right">
            <span className="material-symbols-outlined">lock</span>
            <span>SOC-2 End-to-End Encrypted</span>
          </div>
        </div>

        {/* Messages List */}
        <div className="messages-list">
          {session.messages.map((msg, idx) => {
            if (msg.sender === 'user') {
              return (
                <div key={idx} className="message-user-wrap">
                  <div className="user-meta-row">
                    <span>{currentUser.name}</span>
                    <span style={{ color: 'var(--outline)', fontSize: '10px' }}>
                      {msg.time || 'เมื่อสักครู่'}
                    </span>
                  </div>
                  <div className="user-message-row">
                    <div className="user-bubble">{msg.content}</div>
                    <div className="user-bubble-avatar">{currentUser.initials}</div>
                  </div>
                </div>
              );
            }

            // AI Assistant Message
            const isThoughtExpanded = !!expandedThoughts[idx];
            return (
              <div key={idx} className="message-ai-wrap">
                <div className="ai-avatar-box">
                  <svg viewBox="0 0 100 100" fill="none">
                    <defs>
                      <linearGradient id={`aethGradMsg-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8B5CF6"/>
                        <stop offset="50%" stopColor="#3B82F6"/>
                        <stop offset="100%" stopColor="#06B6D4"/>
                      </linearGradient>
                      <radialGradient id={`centerGlowMsg-${idx}`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4"/>
                        <stop offset="100%" stopColor="#0F172A" stopOpacity="0"/>
                      </radialGradient>
                    </defs>
                    <rect width="100" height="100" rx="24" fill="#0D0E15"/>
                    <circle cx="50" cy="50" r="32" fill={`url(#centerGlowMsg-${idx})`}/>
                    <circle cx="50" cy="50" r="28" stroke={`url(#aethGradMsg-${idx})`} strokeWidth="4" strokeDasharray="8 4"/>
                    <circle cx="50" cy="50" r="16" stroke="#FFFFFF" strokeOpacity="0.9" strokeWidth="3"/>
                    <circle cx="50" cy="50" r="5" fill="#38BDF8"/>
                    <circle cx="50" cy="22" r="3.5" fill="#C084FC"/>
                    <circle cx="78" cy="50" r="3.5" fill="#22D3EE"/>
                  </svg>
                </div>

                <div className="ai-body-col">
                  {/* Meta Header */}
                  <div className="ai-meta-header">
                    <div className="ai-name-group">
                      <span className="ai-model-name">
                        {msg.modelName || 'Aetheris 2.5 Pro Neural'}
                      </span>
                      <span className="material-symbols-outlined verified-icon">verified</span>
                      <span className="ai-duration">{msg.duration || ''}</span>
                    </div>
                    <div className="ai-action-buttons">
                      <button
                        className="btn-icon-subtle"
                        title="คัดลอกคำตอบทั้งหมด"
                        onClick={() => {
                          const fullText = (msg.paragraphs || []).join('\n\n');
                          onCopyText(fullText, 'คัดลอกข้อความคำตอบเรียบร้อยแล้ว');
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                          content_copy
                        </span>
                      </button>
                      <button
                        className="btn-icon-subtle"
                        title="สร้างคำตอบใหม่"
                        onClick={onRetry}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                          refresh
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Thought / Reasoning Bar */}
                  {msg.thoughtSummary && (
                    <>
                      <div
                        className="reasoning-bar"
                        onClick={() => toggleThought(idx)}
                      >
                        <div className="reasoning-left">
                          <span className="material-symbols-outlined">check_circle</span>
                          <span><strong>{msg.thoughtSummary}</strong></span>
                        </div>
                        <span className="material-symbols-outlined text-outline">
                          {isThoughtExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                      </div>
                      {isThoughtExpanded && (
                        <div className="reasoning-details">
                          {msg.thoughtDetails}
                        </div>
                      )}
                    </>
                  )}

                  {/* Text Content */}
                  <div className="ai-text-content">
                    {msg.paragraphs?.map((p, pIdx) => (
                      <p key={pIdx} dangerouslySetInnerHTML={{ __html: p }} />
                    ))}

                    {/* Feature Cards Grid */}
                    {msg.featureCards && msg.featureCards.length > 0 && (
                      <div className="feature-cards-grid">
                        {msg.featureCards.map((card, cIdx) => (
                          <div key={cIdx} className="feature-mini-card">
                            <div className={`mini-card-header ${card.type === 'primary' ? 'primary-tag' : 'secondary-tag'}`}>
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                                {card.icon}
                              </span>
                              <span>{card.title}</span>
                            </div>
                            <p className="mini-card-desc">{card.desc}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Code Block */}
                    {msg.codeBlock && (
                      <div className="code-block-wrapper">
                        <div className="code-header-bar">
                          <div className="code-title-group">
                            <div className="window-dots">
                              <span className="dot dot-red"></span>
                              <span className="dot dot-yellow"></span>
                              <span className="dot dot-green"></span>
                            </div>
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

                  {/* Suggestions Chips */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="suggestion-chips-row">
                      <span className="suggestion-label">ข้อเสนอแนะถัดไป:</span>
                      {msg.suggestions.map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          className="suggestion-chip"
                          onClick={() => onSendSuggestion(sug)}
                        >
                          <span className="material-symbols-outlined text-primary" style={{ fontSize: '14px' }}>
                            add_circle
                          </span>
                          <span>{sug}</span>
                        </button>
                      ))}
                      <div className="feedback-actions">
                        <button
                          className="btn-icon-subtle"
                          title="คำตอบมีประโยชน์"
                          onClick={() => onFeedback('like')}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                            thumb_up
                          </span>
                        </button>
                        <button
                          className="btn-icon-subtle"
                          title="ต้องการคำตอบที่ดีกว่า"
                          onClick={() => onFeedback('dislike')}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                            thumb_down
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Streaming Indicator */}
        {isStreaming && (
          <div className="ai-typing-indicator">
            <div className="ai-avatar-mini">
              <div className="ai-pulse-dot"></div>
            </div>
            <div className="typing-content">
              <div className="thinking-stream-pill">
                <span className="material-symbols-outlined spin-icon text-primary">autorenew</span>
                <span>{streamingStatusText}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
