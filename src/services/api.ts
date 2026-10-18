import type { ChatSession, Message, User } from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('aetheris_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseJsonResponse<T = any>(res: Response, fallbackErrorMsg: string): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.message || fallbackErrorMsg);
    }
    return data as T;
  }

  const rawText = await res.text();
  if (!res.ok) {
    if (rawText.includes('A server error') || rawText.includes('FUNCTION_INVOCATION_FAILED')) {
      throw new Error('ระบบเซิร์ฟเวอร์หลังบ้านขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง');
    }
    const cleanText = rawText.replace(/<[^>]*>?/gm, '').trim().slice(0, 150);
    throw new Error(cleanText || fallbackErrorMsg);
  }

  try {
    return JSON.parse(rawText) as T;
  } catch {
    throw new Error(fallbackErrorMsg);
  }
}

export const authService = {
  async register(email: string, password: string, name?: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    const data = await parseJsonResponse<{ token: string; user: User }>(res, 'Failed to register');
    localStorage.setItem('aetheris_token', data.token);
    return data;
  },

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await parseJsonResponse<{ token: string; user: User }>(res, 'Failed to login');
    localStorage.setItem('aetheris_token', data.token);
    return data;
  },

  async getMe(): Promise<User | null> {
    const token = localStorage.getItem('aetheris_token');
    if (!token) return null;

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeader()
      });
      if (!res.ok) {
        localStorage.removeItem('aetheris_token');
        return null;
      }
      const data = await parseJsonResponse<{ user: User }>(res, 'Failed to load user');
      return { ...data.user, isLoggedIn: true };
    } catch {
      return null;
    }
  },

  logout() {
    localStorage.removeItem('aetheris_token');
  }
};

export const sessionService = {
  async listSessions(): Promise<ChatSession[]> {
    try {
      const res = await fetch(`${API_BASE}/sessions`, {
        headers: getAuthHeader()
      });
      if (!res.ok) return [];
      const data = await parseJsonResponse<{ sessions: any[] }>(res, 'Failed to list sessions');
      return (data.sessions || []).map(s => ({
        id: s.id,
        title: s.title,
        topic: s.topic,
        category: s.category || 'today',
        icon: s.icon || 'chat_bubble',
        messages: []
      }));
    } catch {
      return [];
    }
  },

  async getMessages(sessionId: string): Promise<Message[]> {
    try {
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/messages`, {
        headers: getAuthHeader()
      });
      if (!res.ok) return [];
      const data = await parseJsonResponse<{ messages: Message[] }>(res, 'Failed to fetch messages');
      return data.messages || [];
    } catch {
      return [];
    }
  },

  async createSession(title: string, topic?: string): Promise<ChatSession | null> {
    try {
      const res = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ title, topic })
      });
      if (!res.ok) return null;
      const data = await parseJsonResponse<{ session: any }>(res, 'Failed to create session');
      return {
        id: data.session.id,
        title: data.session.title,
        topic: data.session.topic,
        category: data.session.category || 'today',
        icon: data.session.icon || 'chat_bubble',
        messages: []
      };
    } catch {
      return null;
    }
  },

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      return res.ok;
    } catch {
      return false;
    }
  }
};

export const chatService = {
  async sendMessage(
    prompt: string,
    options: {
      sessionId: string;
      thinkingMode?: boolean;
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
      sessionTitle?: string;
      sessionTopic?: string;
      apiKey?: string;
    }
  ): Promise<Message> {
    const savedApiKey = options.apiKey || localStorage.getItem('aetheris_api_key') || '';
    const customHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    };
    if (savedApiKey) {
      customHeaders['x-api-key'] = savedApiKey;
    }

    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: customHeaders,
      body: JSON.stringify({
        prompt,
        ...options,
        apiKey: savedApiKey
      })
    });

    const data = await parseJsonResponse<{ message: Message }>(res, 'Chat generation failed');
    return data.message;
  }
};

export const healthService = {
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return await parseJsonResponse(res, 'Offline');
    } catch (err) {
      return { status: 'offline', error: err };
    }
  }
};
