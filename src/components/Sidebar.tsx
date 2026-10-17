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
  currentUser,
  onOpenProfile,
  onOpenSettings
}) => {
  return (
    <>
      <aside className={`gpt-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Top Header: Logo + New Chat Icon */}
        <div className="gpt-sidebar-top">
          <div className="gpt-sidebar-brand" onClick={() => { onNewChat(); onCloseMobile(); }}>
            <div className="gpt-logo-icon">
              <svg viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="44" fill="#212121" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="2"/>
                <path d="M50 24L68 50L50 76L32 50Z" stroke="#f0f0f5" strokeWidth="3" fill="none" />
                <line x1="28" y1="50" x2="72" y2="50" stroke="#f0f0f5" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="50" y1="28" x2="50" y2="72" stroke="#f0f0f5" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="50" cy="50" r="3.5" fill="#f0f0f5" />
              </svg>
            </div>
            <span className="gpt-brand-text">Aetheris</span>
          </div>

          <div className="gpt-sidebar-top-actions">
            <button
              className="gpt-icon-btn"
              onClick={() => { onNewChat(); onCloseMobile(); }}
              title="แชทใหม่"
            >
              <span className="material-symbols-outlined">edit_square</span>
            </button>
            <button
              className="gpt-icon-btn desktop-collapse"
              onClick={onToggleCollapse}
              title="ซ่อนแถบข้าง"
            >
              <span className="material-symbols-outlined">left_panel_close</span>
            </button>
          </div>
        </div>

        {/* Chat List (Clean GPT History) */}
        <div className="gpt-chat-list-container custom-scroll">
          <div className="gpt-history-label">บทสนทนาล่าสุด</div>
          {sessions.length === 0 ? (
            <div className="gpt-empty-history">ไม่มีบทสนทนา</div>
          ) : (
            sessions.map((s) => {
              const isActive = s.id === activeSessionId;
              return (
                <button
                  key={s.id}
                  className={`gpt-chat-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    onSelectSession(s.id);
                    onCloseMobile();
                  }}
                  title={s.title}
                >
                  <span className="material-symbols-outlined gpt-chat-icon">chat_bubble</span>
                  <span className="gpt-chat-title">{s.title || 'การสนทนาใหม่'}</span>
                </button>
              );
            })
          )}
        </div>

        {/* Bottom User Section */}
        <div className="gpt-sidebar-bottom">
          <div className="gpt-user-menu" onClick={onOpenProfile}>
            <div className="gpt-user-avatar">
              {currentUser.isLoggedIn ? (currentUser.name ? currentUser.name.slice(0, 1).toUpperCase() : 'U') : 'U'}
            </div>
            <div className="gpt-user-name">
              {currentUser.isLoggedIn ? currentUser.name : 'เข้าสู่ระบบ'}
            </div>
            <button
              type="button"
              className="gpt-user-settings-btn"
              onClick={(e) => {
                e.stopPropagation();
                onOpenSettings();
              }}
              title="ตั้งค่า"
            >
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div className="gpt-sidebar-backdrop" onClick={onCloseMobile} aria-hidden="true" />
      )}
    </>
  );
};
export default Sidebar;
