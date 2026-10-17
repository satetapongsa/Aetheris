import type { ChatSession, User } from '../types';

export const INITIAL_USER: User = {
  name: 'ผู้ใช้งาน',
  email: '',
  initials: 'U',
  tier: 'FREE',
  isLoggedIn: false
};

// Clean initial sessions with 0 pre-filled mock messages
export const INITIAL_SESSIONS: ChatSession[] = [
  {
    id: 'sess-new',
    title: 'การสนทนาใหม่',
    topic: 'บทสนทนาใหม่กับ Aetheris',
    category: 'today',
    icon: 'chat_bubble',
    messages: []
  }
];
