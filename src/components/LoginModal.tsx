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
            <img src="/aetheris-logo.png" alt="Aetheris" className="auth-logo-img" />
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

        {/* 3. Social Logins BELOW Username/Password (Google only) */}
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
            <span>เข้าสู่ระบบด้วย Google</span>
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
