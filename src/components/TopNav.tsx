import React, { useState, useRef, useEffect } from 'react';
import type { ModelId } from '../types';

interface TopNavProps {
  currentModel: ModelId;
  onSelectModel: (model: ModelId) => void;
  onOpenLogin: () => void;
  currentUser?: { name: string; isLoggedIn: boolean };
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onNewChat: () => void;
}

const MODEL_LABELS: Record<ModelId, { name: string; desc: string; icon: string }> = {
  'aetheris-2.5-pro': { name: 'Aetheris 2.5 Pro', desc: 'โมเดลหลัก ตอบฉลาดและเขียนโค้ดแม่นยำ', icon: 'neurology' },
  'aetheris-deep-reasoning': { name: 'Aetheris Reasoning', desc: 'คิดวิเคราะห์เชิงลึก แก้ปัญหาซับซ้อน', icon: 'psychology' },
  'aetheris-fast-flash': { name: 'Aetheris Flash', desc: 'ตอบเร็วพิเศษ สั้นกระชับ', icon: 'bolt' }
};

export const TopNav: React.FC<TopNavProps> = ({
  currentModel,
  onSelectModel,
  onOpenLogin,
  currentUser,
  sidebarCollapsed,
  onToggleSidebar,
  onNewChat
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  return (
    <header className={`topbar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="topbar-left">
        <button type="button" className="icon-btn sidebar-open-btn" onClick={onToggleSidebar} title="เปิดแถบด้านข้าง" aria-label="เปิดเมนู">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <button type="button" className="icon-btn new-chat-top-btn" onClick={onNewChat} title="แชทใหม่" aria-label="แชทใหม่">
          <span className="material-symbols-outlined">edit_square</span>
        </button>

        <div className="model-picker" ref={ref}>
          <button type="button" className="model-btn" onClick={() => setOpen(!open)} aria-haspopup="true" aria-expanded={open}>
            <span>{MODEL_LABELS[currentModel].name}</span>
            <span className="material-symbols-outlined">expand_more</span>
          </button>
          {open && (
            <div className="menu">
              {(Object.keys(MODEL_LABELS) as ModelId[]).map(key => {
                const item = MODEL_LABELS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    className={`menu-item ${currentModel === key ? 'active' : ''}`}
                    onClick={() => { onSelectModel(key); setOpen(false); }}
                  >
                    <span className="material-symbols-outlined menu-icon">{item.icon}</span>
                    <span className="menu-text">
                      <span className="menu-title">{item.name}</span>
                      <span className="menu-desc">{item.desc}</span>
                    </span>
                    {currentModel === key && <span className="material-symbols-outlined menu-check">check</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="topbar-right">
        {!currentUser?.isLoggedIn ? (
          <>
            <button type="button" className="btn btn-primary" onClick={onOpenLogin}>เข้าสู่ระบบ</button>
            <button type="button" className="btn btn-ghost hide-xs" onClick={onOpenLogin}>สมัครใช้งาน</button>
          </>
        ) : (
          <button type="button" className="avatar avatar-btn" onClick={onOpenLogin} title={currentUser.name}>
            {currentUser.name.slice(0, 1).toUpperCase()}
          </button>
        )}
      </div>
    </header>
  );
};

export default TopNav;
