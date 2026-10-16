import type { ChatSession, User } from '../types';

export const INITIAL_USER: User = {
  name: 'Alex Mercer',
  email: 'alex.mercer@neural.io',
  initials: 'AM',
  tier: 'PRO',
  isLoggedIn: true
};

export interface StarterPrompt {
  id: string;
  category: string;
  icon: string;
  title: string;
  prompt: string;
}

export const STARTER_PROMPTS: StarterPrompt[] = [
  {
    id: 'arch',
    category: 'Full-Stack Architecture',
    icon: 'architecture',
    title: 'ออกแบบระบบ Clean Architecture',
    prompt: 'ช่วยแนะนำการออกแบบสถาปัตยกรรม Clean Architecture สำหรับโปรเจกต์ React + Node.js ที่ต้องรองรับผู้ใช้งานพร้อมกันจำนวนมาก พร้อมตัวอย่างโฟลเดอร์และ Type-safe API'
  },
  {
    id: 'react19',
    category: 'Modern Frontend',
    icon: 'bolt',
    title: 'React 19 State & Actions',
    prompt: 'ช่วยอธิบายการใช้งาน useActionState และ useOptimistic ใน React 19 พร้อมตัวอย่างโค้ดแบบสั้นสำหรับการทำ Asynchronous Form Actions'
  },
  {
    id: 'db',
    category: 'High-Performance DB',
    icon: 'database',
    title: 'Neon PostgreSQL Optimization',
    prompt: 'ขอแนวทางการทำ Connection Pooling และออกแบบ Index ใน Neon Serverless PostgreSQL ให้ latency ต่ำที่สุด'
  },
  {
    id: 'security',
    category: 'Zero-Trust Security',
    icon: 'security',
    title: 'OAuth 2.1 & API Security',
    prompt: 'สรุปมาตรฐานความปลอดภัยและ Flow การทำ OAuth 2.1 พร้อม PKCE สำหรับ Single Page Applications ที่ไม่มี client_secret'
  }
];

// Clean initial sessions with 0 pre-filled mock messages
export const INITIAL_SESSIONS: ChatSession[] = [
  {
    id: 'sess-new',
    title: 'การสนทนาใหม่',
    topic: 'บทสนทนาใหม่กับ Aetheris AI',
    category: 'today',
    icon: 'chat_bubble',
    messages: []
  }
];
