import React, { useState, useRef, useEffect } from 'react';
import type { ModelId } from '../types';

interface TopNavProps {
  currentModel: ModelId;
  onSelectModel: (model: ModelId) => void;
  onOpenLogin: () => void;
  currentUser?: { name: string; isLoggedIn: boolean };
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

const MODEL_LABELS: Record<ModelId, { name: string; desc: string; badge: string }> = {
  'aetheris-2.5-pro': { name: 'Aetheris 2.5 Pro', desc: 'โมเดลหลักทรงพลัง ตอบฉลาดและโค้ดดิ่งแม่นยำ', badge: 'PRO' },
  'aetheris-deep-reasoning': { name: 'Aetheris Reasoning', desc: 'คิดวิเคราะห์เชิงลึก แก้ปัญหาและตรรกะซับซ้อน', badge: 'REASON' },
  'aetheris-fast-flash': { name: 'Aetheris Flash', desc: 'ตอบเร็วเป็นพิเศษ สั้นกระชับ ประหยัดโทเคน', badge: 'FAST' }
};

export const TopNav: React.FC<TopNavProps> = ({
  currentModel,
  onSelectModel,
  onOpenLogin,
  currentUser,
  sidebarCollapsed,
  onToggleSidebar
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
    <header className="tech-header">
      <div className="tech-header-left">
        {/* Toggle Sidebar Button (shown when sidebar is closed or on mobile devices) */}
        <button
          className={`tech-icon-btn ${sidebarCollapsed ? 'show-desktop' : 'hide-desktop'} mobile-menu-btn`}
          onClick={onToggleSidebar}
          aria-label="Open sidebar"
          title="เปิดแถบเมนูประวัติแชท"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        {/* AI Brand / Profile Logo (Desktop only when collapsed) */}
        {sidebarCollapsed && (
          <div className="tech-header-brand" title="Aetheris AI Platform">
            <div className="tech-header-logo-wrap">
              <img src="/aetheris-logo.png" alt="Aetheris" className="tech-header-logo-img" />
            </div>
            <div className="tech-header-titles">
              <span className="tech-header-brand-name">AETHERIS</span>
              <span className="tech-header-brand-sub">AI CORE</span>
            </div>
          </div>
        )}

        {/* Model Selector Pill */}
        <div className="tech-model-dropdown-wrapper" ref={dropdownRef}>
          <button
            className="tech-model-pill"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          >
            <span className="tech-status-dot"></span>
            <span className="tech-model-current-name">{MODEL_LABELS[currentModel].name}</span>
            <span className="tech-badge-inline">{MODEL_LABELS[currentModel].badge}</span>
            <span className="material-symbols-outlined icon-chevron">expand_more</span>
          </button>

          {dropdownOpen && (
            <div className="tech-dropdown-menu">
              <div className="tech-dropdown-header">ENGINE SELECTION</div>
              {(Object.keys(MODEL_LABELS) as ModelId[]).map((key) => {
                const item = MODEL_LABELS[key];
                const isActive = currentModel === key;
                return (
                  <button
                    key={key}
                    className={`tech-dropdown-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      onSelectModel(key);
                      setDropdownOpen(false);
                    }}
                  >
                    <div className="tech-dropdown-item-left">
                      <span className="material-symbols-outlined tech-item-icon">
                        {key === 'aetheris-deep-reasoning' ? 'psychology' : key === 'aetheris-fast-flash' ? 'bolt' : 'neurology'}
                      </span>
                      <div>
                        <div className="tech-item-title-row">
                          <span className="tech-item-title">{item.name}</span>
                          <span className="tech-badge-small">{item.badge}</span>
                        </div>
                        <div className="tech-item-desc">{item.desc}</div>
                      </div>
                    </div>
                    {isActive && (
                      <span className="material-symbols-outlined text-tech-accent">check</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Header Right */}
      <div className="tech-header-right">
        <div className="tech-system-status">
          <span className="tech-live-indicator"></span>
          <span className="tech-status-text">ONLINE</span>
        </div>

        {!currentUser?.isLoggedIn ? (
          <div className="tech-auth-buttons">
            <button className="tech-btn-signin" onClick={onOpenLogin}>
              เข้าสู่ระบบ
            </button>
            <button className="tech-btn-signup" onClick={onOpenLogin}>
              สมัครใช้งาน
            </button>
          </div>
        ) : (
          <button className="tech-user-pill" onClick={onOpenLogin} title="จัดการบัญชี">
            <span className="tech-user-avatar">{currentUser.name.slice(0, 1).toUpperCase()}</span>
            <span className="tech-user-name">{currentUser.name}</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default TopNav;
