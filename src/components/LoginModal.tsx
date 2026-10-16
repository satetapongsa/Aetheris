import React, { useState } from 'react';
import type { User } from '../types';
import { authService } from '../services/api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: Partial<User>) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('alex.mercer@neural.io');
  const [password, setPassword] = useState('password123');
  const [fullName, setFullName] = useState('Alex Mercer');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (activeTab === 'signup') {
        const result = await authService.register(email, password, fullName);
        onLoginSuccess(result.user);
      } else {
        const result = await authService.login(email, password);
        onLoginSuccess(result.user);
      }
      onClose();
    } catch (err: any) {
      console.warn('[Auth Service]:', err.message);
      // If server is not responding, fallback to local login
      const name = activeTab === 'signup' && fullName ? fullName : email.split('@')[0];
      onLoginSuccess({
        email,
        name,
        initials: name.slice(0, 2).toUpperCase(),
        isLoggedIn: true
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocial = (provider: string) => {
    onLoginSuccess({
      name: `Alex (${provider})`,
      email: `alex.${provider.toLowerCase()}@neural.io`,
      initials: 'AM',
      isLoggedIn: true
    });
    onClose();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card modal-login-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Header */}
        <div className="auth-header text-center">
          <div className="auth-logo-badge">
            <svg className="brand-svg-sm" viewBox="0 0 100 100" fill="none">
              <defs>
                <linearGradient id="aethGradLogin" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8B5CF6"/>
                  <stop offset="50%" stopColor="#3B82F6"/>
                  <stop offset="100%" stopColor="#06B6D4"/>
                </linearGradient>
                <radialGradient id="centerGlowLogin" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4"/>
                  <stop offset="100%" stopColor="#0F172A" stopOpacity="0"/>
                </radialGradient>
              </defs>
              <rect width="100" height="100" rx="24" fill="#0D0E15"/>
              <circle cx="50" cy="50" r="32" fill="url(#centerGlowLogin)"/>
              <circle cx="50" cy="50" r="28" stroke="url(#aethGradLogin)" strokeWidth="4" strokeDasharray="8 4"/>
              <circle cx="50" cy="50" r="16" stroke="#FFFFFF" strokeOpacity="0.9" strokeWidth="3"/>
              <circle cx="50" cy="50" r="5" fill="#38BDF8"/>
            </svg>
          </div>
          <h2 className="auth-title">ยินดีต้อนรับสู่ Aetheris AI</h2>
          <p className="auth-subtitle">ระบบปัญญาประดิษฐ์ยุคใหม่สำหรับนักพัฒนาและองค์กร</p>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${activeTab === 'signin' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('signin');
              setErrorMessage(null);
            }}
          >
            เข้าสู่ระบบ
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('signup');
              setErrorMessage(null);
            }}
          >
            สมัครสมาชิกใหม่
          </button>
        </div>

        {errorMessage && (
          <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(249, 115, 134, 0.15)', border: '1px solid rgba(249, 115, 134, 0.3)', color: 'var(--error)', fontSize: '12px' }}>
            {errorMessage}
          </div>
        )}

        {/* Social Logins */}
        <div className="social-logins-stack">
          <button
            type="button"
            className="btn-social"
            onClick={() => handleSocial('Google')}
          >
            <svg className="social-icon" viewBox="0 0 24 24">
              <path d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" fill="#EA4335"></path>
              <path d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" fill="#4285F4"></path>
              <path d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" fill="#FBBC05"></path>
              <path d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" fill="#34A853"></path>
            </svg>
            <span>ดำเนินการต่อด้วย Google</span>
          </button>

          <button
            type="button"
            className="btn-social"
            onClick={() => handleSocial('GitHub')}
          >
            <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor">
              <path clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" fillRule="evenodd"></path>
            </svg>
            <span>ดำเนินการต่อด้วย GitHub</span>
          </button>
        </div>

        <div className="auth-divider">
          <span>หรือเข้าสู่ระบบด้วยอีเมล</span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {activeTab === 'signup' && (
            <div className="form-group">
              <label className="form-label">ชื่อ - นามสกุล (Full Name)</label>
              <div className="input-with-icon">
                <span className="material-symbols-outlined input-icon">badge</span>
                <input
                  type="text"
                  placeholder="Alex Mercer"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">อีเมลการทำงาน (Work Email)</label>
            <div className="input-with-icon">
              <span className="material-symbols-outlined input-icon">mail</span>
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label">รหัสผ่าน (Password)</label>
              <a href="#" className="link-forgot-pass" onClick={(e) => e.preventDefault()}>
                ลืมรหัสผ่าน?
              </a>
            </div>
            <div className="input-with-icon">
              <span className="material-symbols-outlined input-icon">lock</span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="btn-toggle-eye"
                onClick={() => setShowPassword(!showPassword)}
                title="แสดง/ซ่อนรหัสผ่าน"
              >
                <span className="material-symbols-outlined">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button type="submit" className="btn-auth-submit" disabled={isLoading}>
            <span>{isLoading ? 'กำลังเข้าสู่ระบบ...' : activeTab === 'signin' ? 'เข้าสู่ระบบเพื่อใช้งาน' : 'สร้างบัญชีผู้ใช้งานใหม่'}</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </form>

        <div className="auth-footer-note">
          เข้าใช้งานถือว่ายอมรับ <a href="#">ข้อตกลงการใช้งาน</a> และ <a href="#">นโยบายความเป็นส่วนตัว</a>
        </div>
      </div>
    </div>
  );
};
