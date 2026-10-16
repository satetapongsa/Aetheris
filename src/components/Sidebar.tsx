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
  const filter = searchQuery.trim().toLowerCase();

  const getFilteredSessions = (category: 'today' | 'week' | 'older') => {
    return sessions.filter(s => {
      const matchCat = s.category === category;
      const matchQuery = !filter || s.title.toLowerCase().includes(filter) || s.topic.toLowerCase().includes(filter);
      return matchCat && matchQuery;
    });
  };

  const renderGroup = (title: string, category: 'today' | 'week' | 'older') => {
    const items = getFilteredSessions(category);

    return (
      <div className="history-group">
        <div className="history-group-title">{title}</div>
        <nav className="history-items">
          {items.length === 0 ? (
            <div style={{ padding: '6px 10px', fontSize: '11px', color: 'var(--outline)' }}>
              ไม่มีบทสนทนา
            </div>
          ) : (
            items.map(s => {
              const isActive = s.id === activeSessionId;
              return (
                <button
                  key={s.id}
                  className={`history-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    onSelectSession(s.id);
                    onCloseMobile();
                  }}
                  title={s.topic}
                >
                  <div className="history-item-left">
                    <span className="material-symbols-outlined history-item-icon">
                      {s.icon || 'chat_bubble'}
                    </span>
                    <span className="history-item-text">{s.title}</span>
                  </div>
                  {isActive && <span className="history-active-pulse" />}
                </button>
              );
            })
          )}
        </nav>
      </div>
    );
  };

  return (
    <>
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="brand-container">
            <div className="brand-logo-frame">
              <svg className="brand-svg" viewBox="0 0 100 100" fill="none">
                <defs>
                  <linearGradient id="aethGradSide" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8B5CF6"/>
                    <stop offset="50%" stopColor="#3B82F6"/>
                    <stop offset="100%" stopColor="#06B6D4"/>
                  </linearGradient>
                  <radialGradient id="centerGlowSide" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4"/>
                    <stop offset="100%" stopColor="#0F172A" stopOpacity="0"/>
                  </radialGradient>
                </defs>
                <rect width="100" height="100" rx="24" fill="#0D0E15"/>
                <circle cx="50" cy="50" r="32" fill="url(#centerGlowSide)"/>
                <circle cx="50" cy="50" r="28" stroke="url(#aethGradSide)" strokeWidth="4" strokeDasharray="8 4"/>
                <circle cx="50" cy="50" r="16" stroke="#FFFFFF" strokeOpacity="0.9" strokeWidth="3"/>
                <circle cx="50" cy="50" r="5" fill="#38BDF8"/>
                <circle cx="50" cy="22" r="3.5" fill="#C084FC"/>
                <circle cx="78" cy="50" r="3.5" fill="#22D3EE"/>
              </svg>
            </div>
            <div className="brand-text-block">
              <div className="brand-title-row">
                <span className="brand-title">Aetheris AI</span>
                <span className="badge-version">v2.5</span>
              </div>
              <span className="brand-subtitle">v2.5 Pro Neural</span>
            </div>
          </div>
          <div className="sidebar-header-actions">
            <button
              className="btn-icon mobile-close-sidebar-btn"
              onClick={onCloseMobile}
              title="ปิดเมนู"
              aria-label="Close sidebar"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <button
              className="btn-icon desktop-collapse-btn"
              onClick={onToggleCollapse}
              title="ยุบแถบข้าง (⌘B)"
              aria-label="Toggle Sidebar"
            >
              <span className="material-symbols-outlined">dock_to_right</span>
            </button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="sidebar-action-bar">
          <button className="btn-new-chat" onClick={() => { onNewChat(); onCloseMobile(); }}>
            <div className="btn-new-chat-left">
              <span className="material-symbols-outlined icon-add">add</span>
              <span>บทสนทนาใหม่ (New Chat)</span>
            </div>
            <kbd className="kbd-shortcut">⌘N</kbd>
          </button>

          <div className="search-box">
            <span className="material-symbols-outlined search-icon">search</span>
            <input
              type="text"
              placeholder="ค้นหาบทสนทนา..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Search chats"
            />
            <kbd className="kbd-shortcut-search">⌘K</kbd>
          </div>
        </div>

        {/* Chat History Container */}
        <div className="sidebar-history-container custom-scroll">
          {renderGroup('วันนี้ (Today)', 'today')}
          {renderGroup('7 วันที่ผ่านมา (Previous 7 Days)', 'week')}
          {renderGroup('บทสนทนาก่อนหน้า (Older)', 'older')}
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="footer-tabs-grid">
            <button className="footer-tab-btn" onClick={onOpenSettings}>
              <span className="material-symbols-outlined">tune</span>
              <span>พารามิเตอร์</span>
            </button>
            <button className="footer-tab-btn" onClick={onOpenSettings}>
              <span className="material-symbols-outlined">settings</span>
              <span>การตั้งค่า</span>
            </button>
          </div>

          <div className="user-profile-card" onClick={onOpenProfile}>
            <div className="user-profile-info">
              <div className="user-avatar">{currentUser.initials}</div>
              <div className="user-text-col">
                <div className="user-name-row">
                  <span className="user-name">{currentUser.name}</span>
                  <span className="badge-pro">{currentUser.tier}</span>
                </div>
                <span className="user-email">{currentUser.email || 'คลิกเพื่อเข้าสู่ระบบ'}</span>
              </div>
            </div>
            <button className="btn-icon-subtle btn-user-options" title="บัญชีผู้ใช้งาน">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div className="sidebar-backdrop active" onClick={onCloseMobile} aria-hidden="true" />
      )}
    </>
  );
};
