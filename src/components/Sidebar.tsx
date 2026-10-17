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
            <img src="/aetheris-logo.png" alt="Aetheris Logo" className="gpt-logo-img" />
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
              className="gpt-icon-btn collapse-toggle-btn"
              onClick={() => {
                onToggleCollapse();
                onCloseMobile();
              }}
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
