import React, { useState } from 'react';
import type { ModelParameterState } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  parameters: ModelParameterState;
  onSave: (params: ModelParameterState) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  parameters,
  onSave
}) => {
  const [temp, setTemp] = useState(parameters.temperature);
  const [topP, setTopP] = useState(parameters.topP);
  const [maxTokens, setMaxTokens] = useState(parameters.maxTokens);
  const [systemPrompt, setSystemPrompt] = useState(parameters.systemPrompt);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      temperature: temp,
      topP,
      maxTokens,
      systemPrompt
    });
    onClose();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card modal-settings-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close settings">
          <span className="material-symbols-outlined">close</span>
        </button>

        <h3 className="settings-main-title">
          <span className="material-symbols-outlined text-primary">tune</span>
          <span>พารามิเตอร์โมเดลและการตั้งค่าระบบ</span>
        </h3>

        <div className="settings-sections-list">
          {/* Temperature */}
          <div className="setting-item">
            <div className="setting-label-row">
              <div>
                <label className="setting-name">Temperature (ความคิดสร้างสรรค์)</label>
                <p className="setting-desc">ค่าต่ำ = แม่นยำ ตรงไปตรงมา, ค่าสูง = สร้างสรรค์ หลากหลาย</p>
              </div>
              <span className="setting-val">{temp.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={temp}
              className="slider-input"
              onChange={(e) => setTemp(parseFloat(e.target.value))}
            />
          </div>

          {/* Top P */}
          <div className="setting-item">
            <div className="setting-label-row">
              <div>
                <label className="setting-name">Top P (Nucleus Sampling)</label>
                <p className="setting-desc">ควบคุมความหลากหลายของคำที่เลือกใช้</p>
              </div>
              <span className="setting-val">{topP.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={topP}
              className="slider-input"
              onChange={(e) => setTopP(parseFloat(e.target.value))}
            />
          </div>

          {/* Max Output Tokens */}
          <div className="setting-item">
            <div className="setting-label-row">
              <div>
                <label className="setting-name">Max Output Tokens</label>
                <p className="setting-desc">จำนวน token สูงสุดในการตอบสนองแต่ละครั้ง</p>
              </div>
              <span className="setting-val">{maxTokens.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="1024"
              max="32768"
              step="1024"
              value={maxTokens}
              className="slider-input"
              onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
            />
          </div>

          {/* System Prompt */}
          <div className="setting-item">
            <label className="setting-name">System Instructions (คำสั่งระบบ)</label>
            <textarea
              className="form-input form-input-plain text-area-param"
              rows={3}
              placeholder="ระบุตัวตนและบริบทเฉพาะของโมเดล เช่น: คุณคือ AI Senior Software Architect ที่มีความเชี่ยวชาญด้าน TypeScript, React 19 และ Cloud Architecture"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
            />
          </div>
        </div>

        <div className="settings-actions-footer">
          <button type="button" className="btn-subtle" onClick={onClose}>
            ยกเลิก
          </button>
          <button type="button" className="btn-gradient-primary" onClick={handleSave}>
            บันทึกการตั้งค่า
          </button>
        </div>
      </div>
    </div>
  );
};
