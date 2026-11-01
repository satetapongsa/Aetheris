import React from 'react';
import type { ChatSession, User } from '../types';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  currentUser: User;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  searchQuery,
  onSearchChange,
  currentUser,
  onOpenProfile,
  onOpenSettings
}) => {
  const q = searchQuery.trim().toLowerCase();
  const visible = q ? sessions.filter(s => (s.title || '').toLowerCase().includes(q)) : sessions;

  return (
    <>
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-inner">
          <div className="sidebar-top">
            <button type="button" className="brand" onClick={() => { onNewChat(); onCloseMobile(); }} title="Aetheris">
              <img src="/aetheris-logo.png" alt="Aetheris" className="brand-logo" />
              <span className="brand-name">Aetheris</span>
            </button>
            <button
              type="button"
              className="icon-btn"
              title="ปิดแถบด้านข้าง (Ctrl+B)"
              onClick={() => { if (mobileOpen) onCloseMobile(); else onToggleCollapse(); }}
            >
              <span className="material-symbols-outlined">{mobileOpen ? 'close' : 'left_panel_close'}</span>
            </button>
          </div>

          <button type="button" className="side-row new-chat" onClick={() => { onNewChat(); onCloseMobile(); }}>
            <span className="material-symbols-outlined">edit_square</span>
            <span>แชทใหม่</span>
            <kbd>Ctrl N</kbd>
          </button>

          <label className="side-search">
            <span className="material-symbols-outlined">search</span>
            <input
              type="text"
              placeholder="ค้นหาแชท"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
            />
          </label>

          <div className="side-section-label">แชท</div>
          <nav className="side-list">
            {visible.length === 0 ? (
              <div className="side-empty">{q ? 'ไม่พบแชทที่ค้นหา' : 'ยังไม่มีประวัติการสนทนา'}</div>
            ) : (
              visible.map(s => (
                <button
                  key={s.id}
                  type="button"
                  className={`side-item ${s.id === activeSessionId ? 'active' : ''}`}
                  title={s.title}
                  onClick={() => { onSelectSession(s.id); onCloseMobile(); }}
                >
                  {s.title || 'การสนทนาใหม่'}
                </button>
              ))
            )}
          </nav>

          <div className="sidebar-bottom">
            <button type="button" className="user-row" onClick={onOpenProfile}>
              <span className="avatar"><img src="/aetheris-logo.png" alt="" /></span>
              <span className="user-meta">
                <span className="user-name">{currentUser.isLoggedIn ? currentUser.name : 'ผู้ใช้งาน (Guest)'}</span>
                <span className="user-tier">{currentUser.tier === 'PRO' ? 'Pro' : 'Free'}</span>
              </span>
            </button>
            <button type="button" className="icon-btn" title="การตั้งค่า" onClick={onOpenSettings}>
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} aria-hidden="true" />}
    </>
  );
};

export default Sidebar;
