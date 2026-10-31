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

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 220)}px`;
  }, [promptText]);

  const canSend = !isStreaming && (promptText.trim().length > 0 || attachedFiles.length > 0);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (canSend) onSend();
    }
  };

  return (
    <footer className="composer-dock">
      <div className="composer">
        {attachedFiles.length > 0 && (
          <div className="attachments">
            {attachedFiles.map((f, i) => (
              <div key={i} className="attachment">
                <span className="material-symbols-outlined">description</span>
                <span className="attachment-name">{f.name}</span>
                <span className="attachment-size">{f.size}</span>
                <button type="button" className="attachment-remove" onClick={() => onRemoveFile(i)} title="นำไฟล์ออก">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          className="composer-input"
          placeholder="ถามอะไรก็ได้กับ Aetheris"
          rows={1}
          value={promptText}
          onChange={e => onPromptChange(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />

        <div className="composer-bar">
          <div className="composer-tools">
            <button type="button" className="icon-btn" title="แนบไฟล์" onClick={() => fileInputRef.current?.click()}>
              <span className="material-symbols-outlined">add</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              multiple
              onChange={e => {
                if (e.target.files) onAttachFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <button type="button" className={`chip ${webSearchActive ? 'on' : ''}`} onClick={onToggleWebSearch} title="ค้นหาข้อมูลออนไลน์">
              <span className="material-symbols-outlined">language</span>
              <span>ค้นหาเว็บ</span>
            </button>
            <button type="button" className={`chip ${deepReasoningActive ? 'on' : ''}`} onClick={onToggleDeepReasoning} title="โหมดคิดวิเคราะห์เชิงลึก">
              <span className="material-symbols-outlined">lightbulb</span>
              <span>คิดเชิงลึก</span>
            </button>
          </div>

          <button
            type="button"
            className="send-btn"
            onClick={onSend}
            disabled={!canSend}
            title={isStreaming ? 'กำลังตอบ...' : 'ส่ง (Enter)'}
            aria-label="ส่งข้อความ"
          >
            <span className={`material-symbols-outlined ${isStreaming ? 'spin' : ''}`}>
              {isStreaming ? 'progress_activity' : 'arrow_upward'}
            </span>
          </button>
        </div>
      </div>
      <p className="composer-note">Aetheris อาจให้ข้อมูลผิดพลาดได้ โปรดตรวจสอบข้อมูลสำคัญ</p>
    </footer>
  );
};

export default PromptDeck;
