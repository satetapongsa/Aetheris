'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');

    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const r = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const j = await r.json();
      if (!r.ok) {
        setError(j.error || 'Something went wrong');
        setBusy(false);
        return;
      }
      router.push('/');
      router.refresh();
    } catch {
      setError('Connection failed. Please check your network.');
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#0e0e12] text-[#e7e4f0] antialiased selection:bg-[#4d4f74] selection:text-[#e1e1ff] overflow-hidden">
      {/* Ambient Lighting Orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="radial-ambient absolute inset-0" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-[#c2c3ee]/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-[#4d4f74]/10 rounded-full blur-[100px] pointer-events-none" />
      </div>

      {/* Header Bar */}
      <header className="relative z-10 w-full py-5 px-6 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden p-0.5 bg-gradient-to-tr from-[#3b3d52]/60 via-[#4d4f74]/40 to-[#c2c3ee]/30 flex items-center justify-center border border-[#76747f]/30 shadow-sm shadow-[#c2c3ee]/10">
            <img src="/aetheris-logo.svg" alt="Aetheris AI Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-headline text-lg font-bold tracking-tight text-white">Aetheris AI</span>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-[#1f1f27] text-[#aca9b6] border border-[#484751]/40">
              v2.5 Intelligence
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#131319]/80 border border-[#484751]/30 text-[#aca9b6]">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-medium">Core Mesh: Active</span>
          </div>
          <span className="text-xs text-[#76747f]">SOC-2 Encrypted</span>
        </div>
      </header>

      {/* Main Form Centerpiece */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[460px] mx-auto">
          {/* Card Container with subtle glassmorphism and crisp hairline border */}
          <div className="card-glass rounded-2xl p-7 sm:p-9 relative">
            {/* Header glyph & title */}
            <div className="text-center mb-7">
              <div className="inline-flex items-center justify-center mb-3.5 p-2 rounded-xl bg-[#191920]/80 border border-[#484751]/40 shadow-sm">
                <img src="/aetheris-logo.svg" alt="Aetheris AI Logo" className="w-9 h-9 object-contain" />
              </div>
              <h1 className="font-headline text-2xl sm:text-[26px] font-bold tracking-tight text-white mb-2">
                {mode === 'login' ? 'ยินดีต้อนรับกลับสู่ Aetheris AI' : 'สร้างบัญชีเข้าใช้งานใหม่'}
              </h1>
              <p className="text-sm text-[#aca9b6] max-w-sm mx-auto leading-relaxed">
                {mode === 'login'
                  ? 'ระบบปัญญาประดิษฐ์ยุคใหม่สำหรับนักพัฒนาและองค์กร'
                  : 'เริ่มต้นใช้งานพื้นที่สนทนาอัจฉริยะที่ปลอดภัยและรวดเร็ว'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={submit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-medium text-[#aca9b6] mb-1.5" htmlFor="name">
                    ชื่อ-นามสกุล หรือ Display Name
                  </label>
                  <div className="relative rounded-xl border border-[#484751]/40 bg-[#0e0e12]/60 focus-within:border-[#c2c3ee]/60 focus-within:ring-1 focus-within:ring-[#c2c3ee]/30 transition-all">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#76747f] flex items-center pointer-events-none">
                      <User size={16} />
                    </span>
                    <input
                      id="name"
                      name="name"
                      required
                      maxLength={80}
                      placeholder="Alex Mercer"
                      className="w-full pl-10 pr-4 py-2.5 bg-transparent border-0 text-sm text-[#e7e4f0] placeholder:text-[#76747f] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#aca9b6] mb-1.5" htmlFor="email">
                  อีเมลการทำงาน (Work Email)
                </label>
                <div className="relative rounded-xl border border-[#484751]/40 bg-[#0e0e12]/60 focus-within:border-[#c2c3ee]/60 focus-within:ring-1 focus-within:ring-[#c2c3ee]/30 transition-all">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#76747f] flex items-center pointer-events-none">
                    <Mail size={16} />
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-transparent border-0 text-sm text-[#e7e4f0] placeholder:text-[#76747f] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-[#aca9b6]" htmlFor="password">
                    รหัสผ่าน (Password)
                  </label>
                  {mode === 'login' && (
                    <span className="text-[11px] text-[#c2c3ee] hover:underline cursor-pointer">
                      ลืมรหัสผ่าน?
                    </span>
                  )}
                </div>
                <div className="relative rounded-xl border border-[#484751]/40 bg-[#0e0e12]/60 focus-within:border-[#c2c3ee]/60 focus-within:ring-1 focus-within:ring-[#c2c3ee]/30 transition-all">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#76747f] flex items-center pointer-events-none">
                    <Lock size={16} />
                  </span>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    minLength={mode === 'register' ? 10 : 1}
                    required
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-transparent border-0 text-sm font-mono text-[#e7e4f0] placeholder:text-[#76747f] focus:outline-none"
                  />
                </div>
                {mode === 'register' && (
                  <p className="mt-1.5 text-[11px] text-[#76747f]">ความยาวอย่างน้อย 10 ตัวอักษร</p>
                )}
              </div>

              {error && (
                <div className="rounded-xl border border-rose-900/60 bg-rose-950/30 p-3 text-xs text-rose-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full mt-2 py-2.5 px-4 rounded-xl btn-gradient-primary text-[#e1e1ff] font-semibold text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>{busy ? 'กำลังดำเนินการ...' : mode === 'login' ? 'เข้าสู่ระบบ (Sign In)' : 'สร้างบัญชีผู้ใช้ใหม่'}</span>
                {!busy && <ArrowRight size={15} />}
              </button>
            </form>

            {/* Switch Mode Prompt */}
            <div className="mt-6 pt-5 border-t border-[#484751]/30 text-center">
              <p className="text-xs text-[#aca9b6]">
                {mode === 'login' ? 'ยังไม่มีบัญชีผู้ใช้งานใช่หรือไม่? ' : 'มีบัญชีผู้ใช้งานอยู่แล้ว? '}
                <Link
                  className="font-semibold text-[#c2c3ee] hover:underline"
                  href={mode === 'login' ? '/register' : '/login'}
                >
                  {mode === 'login' ? 'ลงทะเบียนที่นี่' : 'เข้าสู่ระบบ'}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Disclaimer */}
      <footer className="relative z-10 py-5 text-center text-xs text-[#76747f] border-t border-[#484751]/20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>SOC2 Type II Certified · Zero Data Retention for Training</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="hover:text-[#aca9b6] cursor-pointer">นโยบายความเป็นส่วนตัว</span>
            <span>•</span>
            <span className="hover:text-[#aca9b6] cursor-pointer">เงื่อนไขการให้บริการ</span>
            <span>•</span>
            <span>Aetheris AI v2.5 Pro Neural</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
