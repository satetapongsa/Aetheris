import React, { useRef, useEffect } from 'react';

interface AttachedFile {
  name: string;
  size: string;
}

interface PromptDeckProps {
  promptText: string;
  onPromptChange: (text: string) => void;
  onSend: () => void;
  attachedFiles: AttachedFile[];
  onRemoveFile: (index: number) => void;
  onAttachFiles: (files: FileList) => void;
  webSearchActive: boolean;
  onToggleWebSearch: () => void;
  deepReasoningActive: boolean;
  onToggleDeepReasoning: () => void;
  isStreaming?: boolean;
}

export const PromptDeck: React.FC<PromptDeckProps> = ({
  promptText,
  onPromptChange,
  onSend,
  attachedFiles,
  onRemoveFile,
  onAttachFiles,
  webSearchActive,
  onToggleWebSearch,
  deepReasoningActive,
  onToggleDeepReasoning,
  isStreaming = false
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea to fit text naturally up to 200px
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [promptText]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming) {
        onSend();
      }
    }
  };

  const canSend = !isStreaming && (promptText.trim().length > 0 || attachedFiles.length > 0);

  return (
    <footer className="tech-input-dock">
      <div className="tech-input-wrapper">
        {/* Attached Files Preview Bar */}
        {attachedFiles.length > 0 && (
          <div className="tech-attachment-bar">
            {attachedFiles.map((f, i) => (
              <div key={i} className="tech-file-chip">
                <span className="material-symbols-outlined text-tech-accent" style={{ fontSize: '14px' }}>
                  description
                </span>
                <span className="tech-filename">{f.name}</span>
                <button
                  type="button"
                  className="tech-remove-file-btn"
                  onClick={() => onRemoveFile(i)}
                  title="ลบไฟล์"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                    close
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Floating Input Box (Dark Tech Console) */}
        <div className="tech-console-box">
          <textarea
            ref={textareaRef}
            className="tech-textarea custom-scroll"
            placeholder="ส่งคำถาม เขียนโค้ด หรือให้วิเคราะห์ข้อมูลกับ Aetheris..."
            rows={1}
            value={promptText}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          {/* Bottom Toolbar inside console */}
          <div className="tech-console-toolbar">
            <div className="tech-toolbar-tools">
              {/* Attach File */}
              <button
                type="button"
                className="tech-tool-btn"
                title="แนบไฟล์ข้อมูล (Code, Text, Config)"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="material-symbols-outlined">attach_file</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    onAttachFiles(e.target.files);
                  }
                }}
              />

              {/* Web Search Toggle */}
              <button
                type="button"
                className={`tech-toggle-pill ${webSearchActive ? 'active' : ''}`}
                onClick={onToggleWebSearch}
                title="ค้นหาข้อมูลออนไลน์สด"
              >
                <span className="material-symbols-outlined">travel_explore</span>
                <span>ค้นหาเว็บ</span>
              </button>

              {/* Deep Reasoning Toggle */}
              <button
                type="button"
                className={`tech-toggle-pill ${deepReasoningActive ? 'active' : ''}`}
                onClick={onToggleDeepReasoning}
                title="เปิดโหมดคิดวิเคราะห์ตรรกะเชิงลึก"
              >
                <span className="material-symbols-outlined">psychology</span>
                <span>คิดเชิงลึก</span>
              </button>
            </div>

            {/* Right: Send Action */}
            <div className="tech-toolbar-action">
              <button
                type="button"
                className={`tech-btn-send ${canSend ? 'active' : ''}`}
                onClick={onSend}
                disabled={!canSend}
                title={isStreaming ? 'กำลังประมวลผลคำตอบ...' : 'ส่งคำถาม (Enter)'}
                aria-label="Send message"
              >
                <span className={`material-symbols-outlined ${isStreaming ? 'spin-icon' : ''}`}>
                  {isStreaming ? 'progress_activity' : 'arrow_upward'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Tech System Tagline */}
        <div className="tech-disclaimer-bar">
          <span className="tech-mini-dot"></span>
          <span>Aetheris Autonomous AI System • Ultra-fast, High-performance & Token-efficient</span>
        </div>
      </div>
    </footer>
  );
};

export default PromptDeck;
