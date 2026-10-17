import React from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card modal-settings-card fit-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close settings">
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="auth-header text-center" style={{ marginBottom: '16px' }}>
          <div className="auth-logo-badge">
            <img src="/aetheris-logo.png" alt="Aetheris" className="auth-logo-img" />
          </div>
          <h2 className="auth-title">Aetheris System</h2>
          <p className="auth-subtitle">พารามิเตอร์และการกำหนดค่าระบบถูกล็อคตามมาตรฐาน</p>
        </div>

        <div className="founder-credit-box">
          <div className="founder-credit-label">ผู้ก่อตั้ง / Founder</div>
          <div className="founder-credit-name">satetapongsa</div>
          <div className="founder-credit-status">
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>lock</span>
            <span>Standard Parameters Locked (Temperature: 0.70 - 0.80)</span>
          </div>
        </div>

        <div className="settings-actions-footer" style={{ marginTop: '20px', justifyContent: 'center' }}>
          <button type="button" className="btn-auth-submit" style={{ width: '100%' }} onClick={onClose}>
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
