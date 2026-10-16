import type { Message, User } from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('aetheris_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const authService = {
  async register(email: string, password: string, name?: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to register');
    }
    localStorage.setItem('aetheris_token', data.token);
    return data;
  },

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to login');
    }
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
      const data = await res.json();
      return data.user;
    } catch {
      return null;
    }
  },

  logout() {
    localStorage.removeItem('aetheris_token');
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

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Chat generation failed');
    }

    return data.message;
  }
};

export const healthService = {
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return await res.json();
    } catch (err) {
      return { status: 'offline', error: err };
    }
  }
};
