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
    <footer className="gpt-input-dock">
      <div className="gpt-input-wrapper">
        {/* Attached Files Preview Bar */}
        {attachedFiles.length > 0 && (
          <div className="attachment-preview-bar">
            {attachedFiles.map((f, i) => (
              <div key={i} className="attached-file-chip">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '14px' }}>
                  description
                </span>
                <span className="attached-filename">{f.name}</span>
                <button
                  type="button"
                  className="btn-remove-attachment"
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

        {/* Floating Input Box (GPT Capsule) */}
        <div className="gpt-input-box">
          <textarea
            ref={textareaRef}
            className="gpt-textarea custom-scroll"
            placeholder="ถามอะไรก็ได้กับ Aetheris..."
            rows={1}
            value={promptText}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          {/* Bottom Toolbar inside the capsule */}
          <div className="gpt-input-toolbar">
            <div className="gpt-toolbar-left">
              {/* Attach File */}
              <button
                type="button"
                className="btn-gpt-tool"
                title="แนบไฟล์หรือรูปภาพ"
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
                className={`gpt-pill-tool ${webSearchActive ? 'active' : ''}`}
                onClick={onToggleWebSearch}
                title="ค้นหาเว็บ (Web Search)"
              >
                <span className="material-symbols-outlined">public</span>
                <span>ค้นหาเว็บ</span>
              </button>

              {/* Deep Reasoning Toggle */}
              <button
                type="button"
                className={`gpt-pill-tool ${deepReasoningActive ? 'active' : ''}`}
                onClick={onToggleDeepReasoning}
                title="โหมดคิดวิเคราะห์เชิงลึก"
              >
                <span className="material-symbols-outlined">psychology</span>
                <span>คิดเชิงลึก</span>
              </button>
            </div>

            {/* Right: Send Button */}
            <div className="gpt-toolbar-right">
              <button
                type="button"
                className={`btn-gpt-send ${canSend ? 'active' : ''}`}
                onClick={onSend}
                disabled={!canSend}
                title={isStreaming ? 'กำลังตอบคำถาม...' : 'ส่งข้อความ (Enter)'}
                aria-label="Send message"
              >
                <span className={`material-symbols-outlined ${isStreaming ? 'spin-icon' : ''}`}>
                  {isStreaming ? 'progress_activity' : 'arrow_upward'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer Note */}
        <div className="gpt-disclaimer">
          Aetheris อาจแสดงข้อมูลที่ไม่ถูกต้อง กรุณาตรวจสอบข้อมูลสำคัญ
        </div>
      </div>
    </footer>
  );
};
export default PromptDeck;
