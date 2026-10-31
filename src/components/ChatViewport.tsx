import React, { useState, useEffect, useRef } from 'react';
import type { ChatSession, Message, User } from '../types';
import { Markdown } from './Markdown';

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

const QUICK_PROMPTS = [
  { icon: 'code', title: 'เขียนโค้ด', text: 'เขียนโค้ด React TypeScript สำหรับเชื่อมต่อ API อย่างมีประสิทธิภาพ' },
  { icon: 'hub', title: 'ออกแบบระบบ', text: 'ช่วยออกแบบสถาปัตยกรรมระบบคลาวด์ Microservices' },
  { icon: 'database', title: 'Optimize Database', text: 'วิเคราะห์แนวทางการ Optimize Database Query ให้เร็วขึ้น' },
  { icon: 'wb_sunny', title: 'วันเวลาและอากาศ', text: 'ตรวจสอบวันเวลาและสภาพอากาศปัจจุบัน' }
];

/** Rebuild the full markdown answer (backend splits it on blank lines, which breaks code fences). */
function getAnswerText(msg: Message): string {
  let text = (msg.paragraphs && msg.paragraphs.length > 0 ? msg.paragraphs.join('\n\n') : msg.content) || '';
  // Offline/demo replies may carry a few simple HTML tags; map them to markdown (rendered as text, never HTML)
  text = text
    .replace(/<\/?(?:strong|b)>/gi, '**')
    .replace(/<\/?(?:em|i)>/gi, '*')
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<br\s*\/?>/gi, '\n');
  if (msg.codeBlock && !text.includes('```')) {
    const lang = (msg.codeBlock.language || '').toLowerCase();
    text += `${text ? '\n\n' : ''}\`\`\`${lang}\n${msg.codeBlock.code}\n\`\`\``;
  }
  return text;
}

export const ChatViewport: React.FC<ChatViewportProps> = ({
  session,
  isStreaming,
  streamingStatusText,
  onSendSuggestion,
  onCopyText,
  onFeedback,
  onRetry
}) => {
  const [expandedThoughts, setExpandedThoughts] = useState<Record<number, boolean>>({});
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Record<number, 'like' | 'dislike'>>({});
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUpRef = useRef(false);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior, block: 'end' });
    isUserScrolledUpRef.current = false;
    setShowScrollBottom(false);
  };

  const handleScroll = () => {
    if (!viewportRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;
    const scrolledUp = scrollHeight - (scrollTop + clientHeight) > 120;
    isUserScrolledUpRef.current = scrolledUp;
    setShowScrollBottom(scrolledUp);
  };

  useEffect(() => {
    if (!isUserScrolledUpRef.current) scrollToBottom('smooth');
  }, [session?.messages, isStreaming]);

  // Parent remounts this component per session (key), so per-session state starts fresh.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, []);

  const copy = (idx: number, text: string, label: string) => {
    onCopyText(text, label);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(cur => (cur === idx ? null : cur)), 1800);
  };

  const messages = session?.messages || [];
  const hasMessages = messages.length > 0;
  let lastAiIdx = -1;
  messages.forEach((m, i) => { if (m.sender === 'ai') lastAiIdx = i; });

  return (
    <section className="chat-scroll" ref={viewportRef} onScroll={handleScroll}>
      <div className="chat-column">
        {!hasMessages ? (
          <div className="empty-state">
            <img src="/aetheris-logo.png" alt="Aetheris" className="empty-logo" />
            <h1 className="empty-title">มีอะไรให้ช่วยวันนี้?</h1>
            <div className="empty-grid">
              {QUICK_PROMPTS.map(q => (
                <button key={q.title} type="button" className="empty-card" onClick={() => onSendSuggestion(q.text)}>
                  <span className="material-symbols-outlined">{q.icon}</span>
                  <span className="empty-card-title">{q.title}</span>
                  <span className="empty-card-text">{q.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            if (msg.sender === 'user') {
              const text = msg.content || '';
              return (
                <div key={idx} className="msg msg-user">
                  <div className="user-bubble">{text}</div>
                  <div className="msg-actions msg-actions-user">
                    <button
                      type="button"
                      className="icon-btn sm"
                      title="คัดลอกคำถาม"
                      onClick={() => copy(idx, text, 'คัดลอกคำถามแล้ว')}
                    >
                      <span className="material-symbols-outlined">{copiedIdx === idx ? 'check' : 'content_copy'}</span>
                    </button>
                  </div>
                </div>
              );
            }

            const answer = getAnswerText(msg);
            const isLast = idx === lastAiIdx;
            return (
              <div key={idx} className={`msg msg-ai ${isLast ? 'is-last' : ''}`}>
                <div className="ai-avatar">
                  <img src="/aetheris-logo.png" alt="Aetheris" />
                </div>
                <div className="ai-body">
                  {msg.thoughtSummary && (
                    <div className="thought">
                      <button
                        type="button"
                        className="thought-toggle"
                        onClick={() => setExpandedThoughts(p => ({ ...p, [idx]: !p[idx] }))}
                      >
                        <span>{msg.thoughtSummary}</span>
                        <span className="material-symbols-outlined">
                          {expandedThoughts[idx] ? 'expand_less' : 'expand_more'}
                        </span>
                      </button>
                      {expandedThoughts[idx] && <div className="thought-body">{msg.thoughtDetails}</div>}
                    </div>
                  )}

                  <Markdown text={answer} />

                  <div className="msg-actions">
                    <button type="button" className="icon-btn sm" title="คัดลอกคำตอบ" onClick={() => copy(idx, answer, 'คัดลอกคำตอบแล้ว')}>
                      <span className="material-symbols-outlined">{copiedIdx === idx ? 'check' : 'content_copy'}</span>
                    </button>
                    <button
                      type="button"
                      className={`icon-btn sm ${feedback[idx] === 'like' ? 'on' : ''}`}
                      title="คำตอบดี"
                      onClick={() => { setFeedback(p => ({ ...p, [idx]: 'like' })); onFeedback('like'); }}
                    >
                      <span className="material-symbols-outlined">thumb_up</span>
                    </button>
                    <button
                      type="button"
                      className={`icon-btn sm ${feedback[idx] === 'dislike' ? 'on' : ''}`}
                      title="คำตอบไม่ดี"
                      onClick={() => { setFeedback(p => ({ ...p, [idx]: 'dislike' })); onFeedback('dislike'); }}
                    >
                      <span className="material-symbols-outlined">thumb_down</span>
                    </button>
                    {isLast && !isStreaming && (
                      <button type="button" className="icon-btn sm" title="สร้างคำตอบใหม่" onClick={onRetry}>
                        <span className="material-symbols-outlined">refresh</span>
                      </button>
                    )}
                    {msg.duration && <span className="msg-meta">{msg.duration}</span>}
                  </div>

                  {isLast && !isStreaming && msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="suggestions">
                      {msg.suggestions.map((s, si) => (
                        <button key={si} type="button" className="suggestion" onClick={() => onSendSuggestion(s)}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {isStreaming && (
          <div className="msg msg-ai">
            <div className="ai-avatar pulsing">
              <img src="/aetheris-logo.png" alt="Aetheris" />
            </div>
            <div className="ai-body">
              <div className="typing" aria-live="polite">
                <span className="dot" /><span className="dot" /><span className="dot" />
                <span className="typing-text">{streamingStatusText}</span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} className="scroll-anchor" />
      </div>

      {showScrollBottom && (
        <button type="button" className="scroll-bottom" onClick={() => scrollToBottom('smooth')} aria-label="เลื่อนไปข้อความล่าสุด">
          <span className="material-symbols-outlined">arrow_downward</span>
        </button>
      )}
    </section>
  );
};

export default ChatViewport;
