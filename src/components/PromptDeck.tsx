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
  isVoiceRecording: boolean;
  onToggleVoice: () => void;
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
  isVoiceRecording,
  onToggleVoice
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [promptText]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const estimatedTokens = Math.max(18, Math.round(promptText.length / 3.5) + 18);
  const canSend = promptText.trim().length > 0 || attachedFiles.length > 0;

  return (
    <footer className="prompt-deck-container">
      <div className="prompt-deck-wrapper">
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

        {/* Floating Input Box */}
        <div className="floating-prompt-box">
          <textarea
            ref={textareaRef}
            className="prompt-textarea custom-scroll"
            placeholder="พิมพ์คำถามหรือป้อนคำสั่งให้ Aetheris AI..."
            rows={1}
            value={promptText}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          {/* Bottom Toolbar */}
          <div className="prompt-toolbar">
            <div className="toolset-left">
              {/* Attach File */}
              <button
                type="button"
                className="btn-prompt-tool"
                title="แนบไฟล์หรือโค้ด"
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
                className={`tool-pill ${webSearchActive ? 'active' : ''}`}
                onClick={onToggleWebSearch}
                title="สลับการค้นหาข้อมูลบนเว็บ"
              >
                <span className="material-symbols-outlined">public</span>
                <span className="tool-pill-label">Web Search</span>
              </button>

              {/* Deep Reasoning Toggle */}
              <button
                type="button"
                className={`tool-pill ${deepReasoningActive ? 'active' : ''}`}
                onClick={onToggleDeepReasoning}
                title="สลับโหมดคิดวิเคราะห์หลายขั้นตอน"
              >
                <span className="material-symbols-outlined">neurology</span>
                <span className="tool-pill-label">Deep Reasoning</span>
              </button>

              {/* Voice Input */}
              <button
                type="button"
                className={`btn-prompt-tool ${isVoiceRecording ? 'active-pulse' : ''}`}
                title="พิมพ์ด้วยเสียง (Voice Input)"
                onClick={onToggleVoice}
              >
                <span className="material-symbols-outlined">mic</span>
              </button>
            </div>

            {/* Right: Token Counter & Send Button */}
            <div className="toolset-right">
              <div className="token-meter">
                <span className="token-dot"></span>
                <span>{estimatedTokens.toLocaleString()} tok</span>
              </div>
              <button
                type="button"
                className={`btn-send ${canSend ? 'can-send' : ''}`}
                onClick={onSend}
                disabled={!canSend}
                title="ส่งข้อความ (Enter)"
                aria-label="Send message"
              >
                <span className="material-symbols-outlined">arrow_upward</span>
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer Note */}
        <div className="disclaimer-row">
          <span>Aetheris AI อาจแสดงข้อมูลที่ไม่ถูกต้อง กรุณาตรวจสอบข้อมูลสำคัญ</span>
          <span className="disclaimer-divider">•</span>
          <span className="security-chip">
            <span className="material-symbols-outlined text-success">verified_user</span>
            <span>SOC2 Type II Encrypted</span>
          </span>
        </div>
      </div>
    </footer>
  );
};
export default PromptDeck;
