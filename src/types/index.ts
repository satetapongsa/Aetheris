export interface User {
  name: string;
  email: string;
  initials: string;
  tier: string;
  isLoggedIn: boolean;
}

export interface FeatureCard {
  title: string;
  desc: string;
  type: 'primary' | 'secondary';
  icon: string;
}

export interface CodeBlockData {
  filename: string;
  language: string;
  code: string;
}

export interface Message {
  sender: 'user' | 'ai';
  time?: string;
  content?: string;
  modelName?: string;
  duration?: string;
  thoughtSummary?: string;
  thoughtDetails?: string;
  paragraphs?: string[];
  featureCards?: FeatureCard[];
  codeBlock?: CodeBlockData;
  suggestions?: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  topic: string;
  category: 'today' | 'week' | 'older';
  icon: string;
  messages: Message[];
}

export interface ToastMessage {
  id: string;
  text: string;
  type?: 'info' | 'success' | 'error';
  icon?: string;
}

export type ModelId = 'aetheris-2.5-pro' | 'aetheris-deep-reasoning' | 'aetheris-fast-flash';

export interface ModelParameterState {
  temperature: number;
  topP: number;
  maxTokens: number;
  systemPrompt: string;
}
