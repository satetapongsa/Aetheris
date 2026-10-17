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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (activeTab === 'signup') {
        const result = await authService.register(email, password, fullName || email.split('@')[0]);
        onLoginSuccess(result.user);
      } else {
        const result = await authService.login(email, password);
        onLoginSuccess(result.user);
      }
      onClose();
    } catch (err: any) {
      console.warn('[Auth Service]:', err.message);
      setErrorMessage(err.message || 'การเข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลหรือรหัสผ่าน');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocial = (_provider: string) => {
    setErrorMessage('ยังไม่ได้เชื่อมต่อระบบ');
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card modal-login-card fit-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Compact Header */}
        <div className="auth-header text-center">
          <div className="auth-logo-badge">
            <svg className="brand-svg-sm" viewBox="0 0 100 100" fill="none">
              <defs>
                <linearGradient id="aethGradLogin" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#C2C3EE"/>
                  <stop offset="50%" stopColor="#8184B8"/>
                  <stop offset="100%" stopColor="#4D4F74"/>
                </linearGradient>
                <radialGradient id="centerGlowLogin" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#C2C3EE" stopOpacity="0.4"/>
                  <stop offset="100%" stopColor="#0E0E12" stopOpacity="0"/>
                </radialGradient>
              </defs>
              <rect width="100" height="100" rx="24" fill="#131319" stroke="rgba(194, 195, 238, 0.3)" strokeWidth="2" />
              <circle cx="50" cy="50" r="32" fill="url(#centerGlowLogin)"/>
              <path d="M50 20L72 50L50 80L28 50Z" stroke="url(#aethGradLogin)" strokeWidth="3" fill="none" />
              <line x1="22" y1="50" x2="78" y2="50" stroke="#C2C3EE" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="50" y1="24" x2="50" y2="76" stroke="#C2C3EE" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="50" cy="50" r="4.5" fill="#E1E1FF"/>
            </svg>
          </div>
          <h2 className="auth-title">ยินดีต้อนรับสู่ Aetheris</h2>
          <p className="auth-subtitle">ระบบปัญญาประดิษฐ์อัจฉริยะยุคใหม่</p>
        </div>

        {/* Tabs: Sign In / Sign Up */}
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
          <div className="auth-error-banner">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. Email & Password Form ON TOP */}
        <form onSubmit={handleSubmit} className="auth-form">
          {activeTab === 'signup' && (
            <div className="form-group">
              <label className="form-label">ชื่อ - นามสกุล (Full Name)</label>
              <div className="input-with-icon">
                <span className="material-symbols-outlined input-icon">badge</span>
                <input
                  type="text"
                  required
                  placeholder="กรอกชื่อของคุณ"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">อีเมลการทำงาน (Email)</label>
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
              {activeTab === 'signin' && (
                <a href="#" className="link-forgot-pass" onClick={(e) => e.preventDefault()}>
                  ลืมรหัสผ่าน?
                </a>
              )}
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
            <span>{isLoading ? 'กำลังประมวลผล...' : activeTab === 'signin' ? 'เข้าสู่ระบบเพื่อใช้งาน' : 'สร้างบัญชีผู้ใช้งานใหม่'}</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </form>

        {/* 2. Divider */}
        <div className="auth-divider">
          <span>หรือเข้าสู่ระบบด้วย</span>
        </div>

        {/* 3. Social Logins BELOW Username/Password */}
        <div className="social-logins-row">
          <button
            type="button"
            className="btn-social-compact"
            onClick={() => handleSocial('Google')}
            title="เข้าสู่ระบบด้วย Google"
          >
            <svg className="social-icon" viewBox="0 0 24 24">
              <path d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" fill="#EA4335"></path>
              <path d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" fill="#4285F4"></path>
              <path d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" fill="#FBBC05"></path>
              <path d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" fill="#34A853"></path>
            </svg>
            <span>Google</span>
          </button>

          <button
            type="button"
            className="btn-social-compact"
            onClick={() => handleSocial('GitHub')}
            title="เข้าสู่ระบบด้วย GitHub"
          >
            <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor">
              <path clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" fillRule="evenodd"></path>
            </svg>
            <span>GitHub</span>
          </button>
        </div>

        {/* Footer Note */}
        <div className="auth-footer-note">
          เข้าใช้งานถือว่ายอมรับ <a href="#">ข้อตกลงการใช้งาน</a> และ <a href="#">นโยบายความเป็นส่วนตัว</a>
        </div>
      </div>
    </div>
  );
};
export default LoginModal;
