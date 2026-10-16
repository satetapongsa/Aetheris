import React, { useState, useRef, useEffect } from 'react';
import type { ModelId } from '../types';

interface TopNavProps {
  onOpenMobileSidebar: () => void;
  currentModel: ModelId;
  onSelectModel: (model: ModelId) => void;
  thinkingMode: boolean;
  onToggleThinkingMode: () => void;
  latencyMs: number;
  onOpenNodes: () => void;
  onOpenAnalytics: () => void;
  onShareSession: () => void;
  onOpenCheckout: () => void;
  onOpenLogin: () => void;
  currentUser?: { name: string; isLoggedIn: boolean };
}

const MODEL_NAMES: Record<ModelId, { full: string; short: string }> = {
  'aetheris-2.5-pro': { full: 'Aetheris 2.5 Pro Neural', short: 'Aetheris 2.5 Pro' },
  'aetheris-deep-reasoning': { full: 'Aetheris Deep Reasoning', short: 'Deep Reasoning' },
  'aetheris-fast-flash': { full: 'Aetheris Fast Flash', short: 'Fast Flash' }
};

export const TopNav: React.FC<TopNavProps> = ({
  onOpenMobileSidebar,
  currentModel,
  onSelectModel,
  thinkingMode,
  onToggleThinkingMode,
  latencyMs,
  onOpenNodes,
  onOpenAnalytics,
  onShareSession,
  onOpenCheckout,
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
    <header className="top-nav">
      <div className="top-nav-left">
        <button
          className="btn-icon mobile-menu-btn"
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation menu"
          title="เปิดเมนู"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        {/* Model Selector Dropdown */}
        <div className="model-selector-wrapper" ref={dropdownRef}>
          <button
            className="model-selector-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          >
            <span className="model-status-dot"></span>
            <span className="model-name-text">
              <span className="model-full-name">{MODEL_NAMES[currentModel].full}</span>
              <span className="model-short-name">{MODEL_NAMES[currentModel].short}</span>
            </span>
            <span className="material-symbols-outlined icon-chevron">expand_more</span>
          </button>

          {dropdownOpen && (
            <div className="model-dropdown-menu">
              <div className="dropdown-header">โมเดลปัญญาประดิษฐ์ (Select Model)</div>
              <button
                className={`dropdown-item ${currentModel === 'aetheris-2.5-pro' ? 'active' : ''}`}
                onClick={() => {
                  onSelectModel('aetheris-2.5-pro');
                  setDropdownOpen(false);
                }}
              >
                <div className="dropdown-item-title">
                  <span className="material-symbols-outlined item-icon text-primary">psychology</span>
                  <strong>Aetheris 2.5 Pro Neural</strong>
                </div>
                <span className="dropdown-item-desc">เร็วที่สุดสำหรับงานทั่วไป เขียนโค้ด และการคิดวิเคราะห์</span>
              </button>

              <button
                className={`dropdown-item ${currentModel === 'aetheris-deep-reasoning' ? 'active' : ''}`}
                onClick={() => {
                  onSelectModel('aetheris-deep-reasoning');
                  setDropdownOpen(false);
                }}
              >
                <div className="dropdown-item-title">
                  <span className="material-symbols-outlined item-icon text-secondary">neurology</span>
                  <strong>Aetheris Deep Reasoning</strong>
                </div>
                <span className="dropdown-item-desc">การคิดเชิงลึกหลายชั้นสำหรับคณิตศาสตร์และตรรกะซับซ้อน</span>
              </button>

              <button
                className={`dropdown-item ${currentModel === 'aetheris-fast-flash' ? 'active' : ''}`}
                onClick={() => {
                  onSelectModel('aetheris-fast-flash');
                  setDropdownOpen(false);
                }}
              >
                <div className="dropdown-item-title">
                  <span className="material-symbols-outlined item-icon text-accent">bolt</span>
                  <strong>Aetheris Fast Flash</strong>
                </div>
                <span className="dropdown-item-desc">ตอบสนองรวดเร็วระดับมิลลิวินาทีสำหรับงานถามตอบทั่วไป</span>
              </button>
            </div>
          )}
        </div>

        {/* Model Capabilities Badges */}
        <div className="capabilities-badges">
          <button
            className={`capability-pill ${thinkingMode ? 'active' : ''}`}
            onClick={onToggleThinkingMode}
            title="คลิกเพื่อสลับโหมดการคิด"
          >
            <span className="material-symbols-outlined text-primary">psychology</span>
            <span>Thinking: <strong>{thinkingMode ? 'ON' : 'OFF'}</strong></span>
          </button>
          <div className="capability-pill">
            <span className="material-symbols-outlined text-secondary">memory</span>
            <span>Context: 128k</span>
          </div>
          <div className="capability-pill">
            <span className="material-symbols-outlined text-success">speed</span>
            <span>Latency: {latencyMs}ms</span>
          </div>
        </div>
      </div>

      {/* Top Nav Right Actions */}
      <div className="top-nav-right">
        <button className="btn-icon" onClick={onOpenNodes} title="Neural Graph Nodes Visualizer">
          <span className="material-symbols-outlined">hub</span>
        </button>
        <button className="btn-icon desktop-only-btn" onClick={onOpenAnalytics} title="สถิติและการทำงาน (Performance Analytics)">
          <span className="material-symbols-outlined">analytics</span>
        </button>
        <div className="nav-divider"></div>
        <button className="btn-subtle" onClick={onShareSession} title="แชร์บทสนทนา">
          <span className="material-symbols-outlined">ios_share</span>
          <span className="btn-label-text">แชร์</span>
        </button>
        <button className="btn-gradient-primary" onClick={onOpenCheckout} title="อัปเกรดเป็น Aetheris Pro">
          <span className="material-symbols-outlined">rocket_launch</span>
          <span className="btn-label-text">อัปเกรด Pro</span>
        </button>
        <button className="btn-subtle" onClick={onOpenLogin} title="บัญชีผู้ใช้งาน">
          <span className="material-symbols-outlined">person</span>
          <span className="btn-label-text">{currentUser?.isLoggedIn ? currentUser.name : 'เข้าสู่ระบบ'}</span>
        </button>
      </div>
    </header>
  );
};
export default TopNav;
