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
      <aside className={`tech-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Top Header: Tech Brand + New Chat */}
        <div className="tech-sidebar-top">
          <div className="tech-sidebar-brand" onClick={() => { onNewChat(); onCloseMobile(); }}>
            <div className="tech-logo-container">
              <img src="/aetheris-logo.png" alt="Aetheris Logo" className="tech-logo-img" />
            </div>
            <div className="tech-brand-meta">
              <span className="tech-brand-title">AETHERIS</span>
              <span className="tech-brand-subtitle">NEURAL SYSTEM</span>
            </div>
          </div>

          <div className="tech-sidebar-top-actions">
            <button
              className="tech-icon-action-btn"
              onClick={() => { onNewChat(); onCloseMobile(); }}
              title="สร้างบทสนทนาใหม่"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
            <button
              className="tech-icon-action-btn collapse-toggle-btn"
              onClick={() => {
                onToggleCollapse();
                onCloseMobile();
              }}
              title="ซ่อนแถบเมนู"
            >
              <span className="material-symbols-outlined">first_page</span>
            </button>
          </div>
        </div>

        {/* New Chat Primary Button */}
        <div className="tech-sidebar-action-wrap">
          <button
            type="button"
            className="tech-btn-new-chat"
            onClick={() => { onNewChat(); onCloseMobile(); }}
          >
            <span className="material-symbols-outlined">add_comment</span>
            <span>บทสนทนาใหม่</span>
            <span className="tech-kbd-badge">Ctrl+N</span>
          </button>
        </div>

        {/* Chat List */}
        <div className="tech-chat-list-container custom-scroll">
          <div className="tech-section-header">
            <span>HISTORY LOGS</span>
            <span className="tech-history-count">{sessions.length}</span>
          </div>

          {sessions.length === 0 ? (
            <div className="tech-empty-history">ไม่มีบันทึกการสนทนา</div>
          ) : (
            sessions.map((s) => {
              const isActive = s.id === activeSessionId;
              return (
                <button
                  key={s.id}
                  className={`tech-chat-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    onSelectSession(s.id);
                    onCloseMobile();
                  }}
                  title={s.title}
                >
                  <span className="material-symbols-outlined tech-chat-icon">
                    {isActive ? 'chat_bubble' : 'chat'}
                  </span>
                  <span className="tech-chat-title">{s.title || 'การสนทนาใหม่'}</span>
                  {isActive && <span className="tech-active-indicator"></span>}
                </button>
              );
            })
          )}
        </div>

        {/* Bottom User / System Section */}
        <div className="tech-sidebar-bottom">
          <div className="tech-user-card" onClick={onOpenProfile}>
            <div className="tech-user-avatar-badge">
              {currentUser.isLoggedIn ? (currentUser.name ? currentUser.name.slice(0, 1).toUpperCase() : 'U') : 'A'}
            </div>
            <div className="tech-user-details">
              <div className="tech-user-name-text">
                {currentUser.isLoggedIn ? currentUser.name : 'ผู้ใช้งาน (Guest)'}
              </div>
              <div className="tech-user-tier-label">
                <span className="tech-dot-tier"></span>
                <span>{currentUser.tier === 'PRO' ? 'PRO ACCESS' : 'TECH FREE'}</span>
              </div>
            </div>
            <button
              type="button"
              className="tech-settings-btn"
              onClick={(e) => {
                e.stopPropagation();
                onOpenSettings();
              }}
              title="การตั้งค่า"
            >
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div className="tech-sidebar-backdrop" onClick={onCloseMobile} aria-hidden="true" />
      )}
    </>
  );
};

export default Sidebar;
