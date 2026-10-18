import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { ChatViewport } from './components/ChatViewport';
import { PromptDeck } from './components/PromptDeck';
import { LoginModal } from './components/LoginModal';
import { CheckoutModal } from './components/CheckoutModal';
import { SettingsModal } from './components/SettingsModal';
import { ToastContainer } from './components/ToastContainer';
import { authService, chatService } from './services/api';
import { INITIAL_SESSIONS, INITIAL_USER } from './data/initialData';
import type { ChatSession, Message, ModelId, ModelParameterState, ToastMessage, User } from './types';

export function App() {
  // Session & User State
  const [sessions, setSessions] = useState<ChatSession[]>(INITIAL_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState<string>(INITIAL_SESSIONS[0]?.id || 'sess-new');
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USER);

  // Layout & Navigation State
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Model & Tool Controls
  const [currentModel, setCurrentModel] = useState<ModelId>('aetheris-2.5-pro');
  const [webSearchActive, setWebSearchActive] = useState<boolean>(false);
  const [deepReasoningActive, setDeepReasoningActive] = useState<boolean>(false);
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: string }[]>([]);
  const [promptText, setPromptText] = useState<string>('');

  // Streaming State
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingStatusText, setStreamingStatusText] = useState<string>('กำลังคิดและประมวลผลคำตอบ...');

  // Modals State
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState<boolean>(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);

  // Fixed Standard System Parameters (Defined by Founder, locked)
  const [parameters] = useState<ModelParameterState>({
    temperature: 0.75, // standard 7-8 range
    topP: 0.95,
    maxTokens: 4096,
    systemPrompt: '',
    apiKey: localStorage.getItem('aetheris_api_key') || ''
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (text: string, type: 'info' | 'success' | 'error' = 'info', icon: string = 'info') => {
    const id = 'toast-' + Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { id, text, type, icon }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // Check saved session on mount
  useEffect(() => {
    authService.getMe().then(user => {
      if (user) {
        setCurrentUser(user);
      }
    });
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSidebarCollapsed(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewChat();
      }
      if (e.key === 'Escape') {
        setLoginModalOpen(false);
        setCheckoutModalOpen(false);
        setSettingsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  const handleNewChat = () => {
    const newId = 'sess-' + Date.now();
    const newSession: ChatSession = {
      id: newId,
      title: 'การสนทนาใหม่',
      topic: 'บทสนทนาใหม่กับ Aetheris',
      category: 'today',
      icon: 'chat_bubble',
      messages: []
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setMobileSidebarOpen(false);
  };

  const handleSendMessage = (textToSend?: string) => {
    if (isStreaming) return;
    const text = (textToSend || promptText).trim();
    if (!text && attachedFiles.length === 0) return;

    if (!textToSend) {
      setPromptText('');
    }

    let fullContent = text;
    if (attachedFiles.length > 0) {
      const filesInfo = attachedFiles.map(f => `[แนบไฟล์: ${f.name}]`).join(' ');
      fullContent = `${filesInfo}\n${fullContent}`;
      setAttachedFiles([]);
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`;

    const userMessage: Message = {
      sender: 'user',
      time: timeStr,
      content: fullContent
    };

    let sessionTitle = activeSession.title;
    let sessionTopic = activeSession.topic;

    setSessions(prev =>
      prev.map(s => {
        if (s.id === activeSessionId) {
          const isFirstMessage = s.messages.length === 0;
          sessionTitle = isFirstMessage ? (text.slice(0, 30) || 'การสนทนาใหม่') : s.title;
          sessionTopic = isFirstMessage ? (text.slice(0, 50) || 'หัวข้อการสนทนา') : s.topic;
          return {
            ...s,
            title: sessionTitle,
            topic: sessionTopic,
            messages: [...s.messages, userMessage]
          };
        }
        return s;
      })
    );

    triggerAIResponse(fullContent, false, sessionTitle, sessionTopic);
  };

  const triggerAIResponse = async (
    userPrompt: string,
    isRetry: boolean = false,
    updatedTitle?: string,
    updatedTopic?: string
  ) => {
    setIsStreaming(true);
    setStreamingStatusText(
      deepReasoningActive
        ? 'Aetheris กำลังคิดวิเคราะห์...'
        : 'Aetheris กำลังประมวลผลคำตอบ...'
    );

    let aiResponse: Message;
    try {
      // Call backend API (DeepSeek powered)
      aiResponse = await chatService.sendMessage(userPrompt, {
        sessionId: activeSessionId,
        thinkingMode: deepReasoningActive,
        temperature: parameters.temperature,
        maxTokens: parameters.maxTokens,
        systemPrompt: parameters.systemPrompt,
        sessionTitle: updatedTitle || activeSession.title,
        sessionTopic: updatedTopic || activeSession.topic,
        apiKey: parameters.apiKey
      });
    } catch {
      // Fallback
      await new Promise(r => setTimeout(r, deepReasoningActive ? 1500 : 800));
      aiResponse = generateContextualResponse(userPrompt);
    } finally {
      setIsStreaming(false);
    }

    setSessions(prev =>
      prev.map(s => {
        if (s.id === activeSessionId) {
          let updatedMessages = [...s.messages];
          if (isRetry && updatedMessages.length > 0 && updatedMessages[updatedMessages.length - 1].sender === 'ai') {
            updatedMessages.pop();
          }
          return {
            ...s,
            messages: [...updatedMessages, aiResponse]
          };
        }
        return s;
      })
    );
  };

  const generateContextualResponse = (prompt: string): Message => {
    const p = prompt.trim();
    const lower = p.toLowerCase();
    let answer = '';

    if (lower.includes('เวลา') || lower.includes('กี่โมง') || lower.includes('time') || lower.includes('date') || lower.includes('วัน')) {
      const nowStr = new Intl.DateTimeFormat('th-TH', {
        timeZone: 'Asia/Bangkok',
        dateStyle: 'full',
        timeStyle: 'medium'
      }).format(new Date());
      answer = `ขณะนี้คือ ${nowStr} (เวลาประเทศไทย ICT)`;
    } else if (lower.includes('สวัสดี') || lower.includes('hello') || lower.includes('hi')) {
      answer = 'สวัสดีครับ ผม Aetheris ยินดีช่วยเหลือ มีคำถามหรือต้องการให้ช่วยงานด้านใด สอบถามได้ทันทีครับ';
    } else if (lower.includes('ใครสร้าง') || lower.includes('ผู้สร้าง') || lower.includes('คือใคร') || lower.includes('who are you')) {
      answer = 'ผมคือ Aetheris ผู้ช่วยปัญญาประดิษฐ์อัจฉริยะ ออกแบบมาเพื่อตอบคำถาม วิเคราะห์ข้อมูล เขียนโค้ด และแก้ปัญหาเชิงตรรกะอย่างกระชับ รวดเร็ว และแม่นยำ';
    } else {
      answer = `ได้รับคำถามแล้วครับ: "${p}" สำหรับประเด็นนี้สามารถวิเคราะห์และดำเนินการได้โดยคำนึงถึงเป้าหมาย ความถูกต้อง และความคุ้มค่าในการใช้งาน หากต้องการให้ลงรายละเอียด ขั้นตอนการทำ หรือตัวอย่างโค้ด แจ้งข้อมูลเพิ่มเติมได้ทันทีครับ`;
    }

    return {
      sender: 'ai',
      modelName: 'Aetheris',
      paragraphs: [answer]
    };
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast(label, 'success', 'content_copy');
    });
  };

  const handleAttachFiles = (files: FileList) => {
    const newFiles = Array.from(files).map(f => ({
      name: f.name,
      size: (f.size / 1024).toFixed(1) + ' KB'
    }));
    setAttachedFiles(prev => [...prev, ...newFiles]);
    showToast(`แนบไฟล์ ${newFiles.length} ไฟล์`, 'success', 'attach_file');
  };

  return (
    <div className="tech-app-container">
      {/* 1. Tech Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewChat={handleNewChat}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentUser={currentUser}
        onOpenProfile={() => setLoginModalOpen(true)}
        onOpenSettings={() => setSettingsModalOpen(true)}
      />

      {/* 2. Main Tech Workspace */}
      <main className="tech-main-workspace">
        <TopNav
          currentModel={currentModel}
          onSelectModel={setCurrentModel}
          onOpenLogin={() => setLoginModalOpen(true)}
          currentUser={currentUser}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => {
            setSidebarCollapsed(false);
            setMobileSidebarOpen(true);
          }}
        />

        {/* 3. Central Chat Viewport */}
        <ChatViewport
          session={activeSession}
          currentUser={currentUser}
          isStreaming={isStreaming}
          streamingStatusText={streamingStatusText}
          onSendSuggestion={handleSendMessage}
          onCopyText={handleCopyText}
          onFeedback={(type) => {
            showToast(type === 'like' ? 'ขอบคุณสำหรับคำติชม' : 'ขอบคุณสำหรับข้อเสนอแนะ', 'info', type === 'like' ? 'thumb_up' : 'thumb_down');
          }}
          onRetry={() => {
            const lastUser = [...activeSession.messages].reverse().find(m => m.sender === 'user');
            if (lastUser && lastUser.content) {
              triggerAIResponse(lastUser.content, true);
            }
          }}
        />

        {/* 4. GPT Input Dock */}
        <PromptDeck
          promptText={promptText}
          onPromptChange={setPromptText}
          onSend={() => handleSendMessage()}
          attachedFiles={attachedFiles}
          onRemoveFile={(i) => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))}
          onAttachFiles={handleAttachFiles}
          webSearchActive={webSearchActive}
          onToggleWebSearch={() => setWebSearchActive(!webSearchActive)}
          deepReasoningActive={deepReasoningActive}
          onToggleDeepReasoning={() => setDeepReasoningActive(!deepReasoningActive)}
          isStreaming={isStreaming}
        />
      </main>

      {/* Modals */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={(updated) => {
          setCurrentUser(prev => ({ ...prev, ...updated }));
          showToast(`ยินดีต้อนรับ ${updated.name || currentUser.name}!`, 'success', 'check');
        }}
      />

      <CheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        onPaymentSuccess={() => {
          setCurrentUser(prev => ({ ...prev, tier: 'PRO' }));
          showToast('อัปเกรดเป็น Aetheris Pro เรียบร้อยแล้ว', 'success', 'check');
        }}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}
export default App;
