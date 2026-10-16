'use client';

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Users,
  MessageSquare,
  Activity,
  ShieldBan,
  Trash2,
  ShieldCheck,
  Search,
  Sparkles,
  CheckCircle2,
  Clock,
  Cpu
} from 'lucide-react';

export default function AdminPanel() {
  const [d, setD] = useState<any>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then(setD);
  }, []);

  async function act(id: string, op: 'ban' | 'delete', banned?: boolean) {
    if (op === 'delete' && !confirm('ต้องการลบผู้ใช้งานนี้และประวัติการสนทนาทั้งหมดอย่างถาวรหรือไม่?')) return;
    await fetch(`/api/admin/users${op === 'delete' ? `?id=${id}` : ''}`, {
      method: op === 'delete' ? 'DELETE' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: op === 'ban' ? JSON.stringify({ id, banned }) : undefined,
    });
    setD(await fetch('/api/admin/users').then((r) => r.json()));
  }

  const filteredUsers = d?.users?.filter((u: any) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  return (
    <main className="min-h-screen bg-[#0e0e12] text-[#e7e4f0] antialiased selection:bg-[#4d4f74] selection:text-[#e1e1ff] p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Navigation & Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#484751]/30">
          <div>
            <a
              href="/"
              className="mb-3 inline-flex items-center gap-2 text-xs font-medium text-[#aca9b6] hover:text-[#c2c3ee] transition"
            >
              <ArrowLeft size={14} /> กลับสู่หน้าแชท (Back to Chat)
            </a>
            <div className="flex items-center gap-2.5">
              <h1 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Admin Console
              </h1>
              <span className="rounded-full bg-[#4d4f74]/40 px-2 py-0.5 text-[10px] font-mono text-[#c2c3ee] border border-[#c2c3ee]/20">
                Luminescent Slate
              </span>
            </div>
            <p className="mt-1 text-xs text-[#aca9b6]">
              ระบบควบคุมสถานะโหนด สถิติการใช้งาน และการจัดการบัญชีผู้ใช้ Aetheris AI
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#191920] border border-[#484751]/30 text-xs text-[#aca9b6]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>System Mesh: Operational</span>
            </div>
          </div>
        </div>

        {!d ? (
          <div className="flex items-center justify-center py-20 text-sm text-[#aca9b6]">
            <Activity className="animate-spin mr-2 text-[#c2c3ee]" size={18} />
            กำลังโหลดข้อมูลแดชบอร์ด...
          </div>
        ) : (
          <>
            {/* KPI Metrics Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['จำนวนผู้ใช้งาน (Users)', d.stats?.users, Users, 'Registered accounts'],
                ['บทสนทนา (Conversations)', d.stats?.chats, MessageSquare, 'Active dialogue sessions'],
                ['โทเคนทั้งหมด (Tokens)', d.stats?.tokens, Cpu, 'Neural inference compute'],
                ['คำขอระบบ (API Requests)', d.stats?.requests, Activity, 'Processed query units'],
              ].map(([label, val, Icon, desc]: any) => (
                <div
                  key={label}
                  className="rounded-2xl border border-[#484751]/30 bg-[#131319]/90 p-5 shadow-sm hover:border-[#76747f]/40 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#aca9b6]">{label}</span>
                    <div className="p-2 rounded-lg bg-[#191920] border border-[#484751]/30 text-[#c2c3ee]">
                      <Icon size={16} />
                    </div>
                  </div>
                  <p className="mt-4 font-headline text-2xl font-bold text-white tracking-tight">
                    {Number(val || 0).toLocaleString()}
                  </p>
                  <p className="mt-1 text-[11px] text-[#76747f]">{desc}</p>
                </div>
              ))}
            </div>

            {/* Users Management Section */}
            <section className="overflow-hidden rounded-2xl border border-[#484751]/30 bg-[#131319]/90 shadow-sm">
              <div className="border-b border-[#484751]/30 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#191920]/60">
                <div>
                  <h2 className="font-headline text-base font-semibold text-white">รายชื่อผู้ใช้งาน (Accounts)</h2>
                  <p className="text-xs text-[#aca9b6]">จัดการสิทธิ์ การระงับการใช้งาน และข้อมูลผู้ใช้</p>
                </div>

                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#76747f]" />
                  <input
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="ค้นหาชื่อ หรือ อีเมล..."
                    className="w-full sm:w-64 pl-9 pr-3 py-1.5 rounded-lg border border-[#484751]/40 bg-[#0e0e12]/80 text-xs text-[#e7e4f0] placeholder:text-[#76747f] focus:outline-none focus:border-[#c2c3ee]/50"
                  />
                </div>
              </div>

              <div className="divide-y divide-[#484751]/20">
                {filteredUsers?.map((u: any) => (
                  <div
                    key={u.id}
                    className="flex flex-wrap items-center gap-4 px-5 py-3.5 hover:bg-[#191920]/50 transition"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#393a4d] to-[#4d4f74] border border-[#76747f]/30 font-bold text-xs text-[#c2c3ee]">
                      {u.name?.[0]?.toUpperCase() || 'U'}
                    </div>

                    <div className="min-w-40 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{u.name}</span>
                        {u.role === 'ADMIN' && (
                          <span className="rounded-full bg-[#4d4f74]/50 px-2 py-0.2 text-[9px] font-mono font-semibold text-[#c2c3ee] border border-[#c2c3ee]/30">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#76747f]">{u.email}</p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[#aca9b6]">
                      <span className="px-2.5 py-1 rounded-lg bg-[#191920] border border-[#484751]/30">
                        {u._count?.chats || 0} chats
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium ${
                          u.banned
                            ? 'bg-rose-950/30 border-rose-900/50 text-rose-300'
                            : 'bg-emerald-950/30 border-emerald-900/50 text-emerald-300'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.banned ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                        {u.banned ? 'Banned' : 'Active'}
                      </span>
                    </div>

                    {u.role !== 'ADMIN' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => act(u.id, 'ban', !u.banned)}
                          title={u.banned ? 'Unban User' : 'Ban User'}
                          className="rounded-lg border border-[#484751]/30 bg-[#191920] p-2 text-[#aca9b6] hover:text-white hover:border-[#76747f] transition"
                        >
                          <ShieldBan size={14} />
                        </button>
                        <button
                          onClick={() => act(u.id, 'delete')}
                          title="Delete user"
                          className="rounded-lg border border-[#484751]/30 bg-[#191920] p-2 text-[#aca9b6] hover:text-rose-400 hover:border-rose-900/60 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Recent Conversations */}
            <section className="overflow-hidden rounded-2xl border border-[#484751]/30 bg-[#131319]/90 shadow-sm">
              <div className="border-b border-[#484751]/30 p-5 bg-[#191920]/60">
                <h2 className="font-headline text-base font-semibold text-white">
                  บทสนทนาล่าสุดในระบบ (Recent Sessions)
                </h2>
              </div>
              <div className="divide-y divide-[#484751]/20">
                {d.chats?.map((c: any) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between px-5 py-3 text-xs hover:bg-[#191920]/50 transition"
                  >
                    <div className="flex items-center gap-2.5 truncate max-w-md">
                      <MessageSquare size={13} className="text-[#c2c3ee] shrink-0" />
                      <span className="truncate text-white font-medium">{c.title || 'Untitled chat'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[#76747f]">
                      <span>{c.user?.name}</span>
                      <span>•</span>
                      <span className="font-mono">{c._count?.messages || 0} msgs</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
