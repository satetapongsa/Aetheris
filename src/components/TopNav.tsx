import React, { useState, useRef, useEffect } from 'react';
import type { ModelId } from '../types';

interface TopNavProps {
  onOpenMobileSidebar: () => void;
  currentModel: ModelId;
  onSelectModel: (model: ModelId) => void;
  thinkingMode: boolean;
  onToggleThinkingMode: () => void;
  onOpenCheckout: () => void;
  onOpenLogin: () => void;
  currentUser?: { name: string; isLoggedIn: boolean };
}

const MODEL_LABELS: Record<ModelId, { name: string; desc: string }> = {
  'aetheris-2.5-pro': { name: 'Aetheris 2.5', desc: 'โมเดลอัจฉริยะ ทำงานทั่วไปและเขียนโค้ดได้รวดเร็ว' },
  'aetheris-deep-reasoning': { name: 'Aetheris Reasoning', desc: 'คิดวิเคราะห์เชิงลึก สำหรับคณิตศาสตร์และตรรกะซับซ้อน' },
  'aetheris-fast-flash': { name: 'Aetheris Mini', desc: 'เร็วเป็นพิเศษ เหมาะกับงานถามตอบสั้นๆ' }
};

export const TopNav: React.FC<TopNavProps> = ({
  onOpenMobileSidebar,
  currentModel,
  onSelectModel,
  thinkingMode,
  onToggleThinkingMode,
  onOpenCheckout: _onOpenCheckout,
  onOpenLogin,
  currentUser
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <header className="gpt-header">
      <div className="gpt-header-left">
        <button
          className="gpt-btn-icon mobile-menu-btn"
          onClick={onOpenMobileSidebar}
          aria-label="Open sidebar"
          title="เปิดเมนูข้าง"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        {/* Model Selector Pill (ChatGPT style) */}
        <div className="gpt-model-dropdown-wrapper" ref={dropdownRef}>
          <button
            className="gpt-model-pill"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          >
            <span className="gpt-model-current-name">{MODEL_LABELS[currentModel].name}</span>
            <span className="material-symbols-outlined icon-chevron">expand_more</span>
          </button>

          {dropdownOpen && (
            <div className="gpt-dropdown-menu">
              <div className="gpt-dropdown-header">เลือกโมเดล</div>
              <button
                className={`gpt-dropdown-item ${currentModel === 'aetheris-2.5-pro' ? 'active' : ''}`}
                onClick={() => {
                  onSelectModel('aetheris-2.5-pro');
                  setDropdownOpen(false);
                }}
              >
                <div className="dropdown-item-left">
                  <span className="material-symbols-outlined">auto_awesome</span>
                  <div>
                    <div className="item-title">Aetheris 2.5</div>
                    <div className="item-desc">{MODEL_LABELS['aetheris-2.5-pro'].desc}</div>
                  </div>
                </div>
                {currentModel === 'aetheris-2.5-pro' && (
                  <span className="material-symbols-outlined text-check">check</span>
                )}
              </button>

              <button
                className={`gpt-dropdown-item ${currentModel === 'aetheris-deep-reasoning' ? 'active' : ''}`}
                onClick={() => {
                  onSelectModel('aetheris-deep-reasoning');
                  setDropdownOpen(false);
                }}
              >
                <div className="dropdown-item-left">
                  <span className="material-symbols-outlined">psychology</span>
                  <div>
                    <div className="item-title">Aetheris Reasoning</div>
                    <div className="item-desc">{MODEL_LABELS['aetheris-deep-reasoning'].desc}</div>
                  </div>
                </div>
                {currentModel === 'aetheris-deep-reasoning' && (
                  <span className="material-symbols-outlined text-check">check</span>
                )}
              </button>

              <button
                className={`gpt-dropdown-item ${currentModel === 'aetheris-fast-flash' ? 'active' : ''}`}
                onClick={() => {
                  onSelectModel('aetheris-fast-flash');
                  setDropdownOpen(false);
                }}
              >
                <div className="dropdown-item-left">
                  <span className="material-symbols-outlined">bolt</span>
                  <div>
                    <div className="item-title">Aetheris Mini</div>
                    <div className="item-desc">{MODEL_LABELS['aetheris-fast-flash'].desc}</div>
                  </div>
                </div>
                {currentModel === 'aetheris-fast-flash' && (
                  <span className="material-symbols-outlined text-check">check</span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Thinking Toggle */}
        <button
          className={`gpt-header-pill ${thinkingMode ? 'active' : ''}`}
          onClick={onToggleThinkingMode}
          title="สลับโหมดวิเคราะห์แบบละเอียด"
        >
          <span className="material-symbols-outlined">psychology</span>
          <span>คิดเชิงลึก: {thinkingMode ? 'เปิด' : 'ปิด'}</span>
        </button>
      </div>

      {/* Header Right */}
      <div className="gpt-header-right">
        {!currentUser?.isLoggedIn ? (
          <>
            <button className="gpt-btn-signin" onClick={onOpenLogin}>
              เข้าสู่ระบบ
            </button>
            <button className="gpt-btn-signup" onClick={onOpenLogin}>
              สมัครใช้งาน
            </button>
          </>
        ) : (
          <button className="gpt-user-pill" onClick={onOpenLogin} title="บัญชีผู้ใช้">
            <span className="user-avatar-small">{currentUser.name.slice(0, 1).toUpperCase()}</span>
            <span className="user-name-text">{currentUser.name}</span>
          </button>
        )}
      </div>
    </header>
  );
};
export default TopNav;
