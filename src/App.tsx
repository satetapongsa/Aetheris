import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { ChatViewport } from './components/ChatViewport';
import { PromptDeck } from './components/PromptDeck';
import { LoginModal } from './components/LoginModal';
import { CheckoutModal } from './components/CheckoutModal';
import { SettingsModal } from './components/SettingsModal';
import { NeuralGraphModal } from './components/NeuralGraphModal';
import { AnalyticsModal } from './components/AnalyticsModal';
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
  const [thinkingMode, setThinkingMode] = useState<boolean>(true);
  const [webSearchActive, setWebSearchActive] = useState<boolean>(true);
  const [deepReasoningActive, setDeepReasoningActive] = useState<boolean>(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState<boolean>(false);
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: string }[]>([]);
  const [promptText, setPromptText] = useState<string>('');

  // Streaming State
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingStatusText, setStreamingStatusText] = useState<string>('กำลังคิดและประมวลผลคำตอบ...');

  // Live Latency
  const [latencyMs, setLatencyMs] = useState<number>(24);

  // Modals State
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState<boolean>(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [nodesModalOpen, setNodesModalOpen] = useState<boolean>(false);
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState<boolean>(false);

  // Parameters
  const [parameters, setParameters] = useState<ModelParameterState>({
    temperature: 0.7,
    topP: 0.95,
    maxTokens: 8192,
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
    }, 4000);
  };

  // Check saved session on mount
  useEffect(() => {
    authService.getMe().then(user => {
      if (user) {
        setCurrentUser(user);
      }
    });
  }, []);

  // Live Latency Jitter
  useEffect(() => {
    const timer = setInterval(() => {
      setLatencyMs(Math.floor(Math.random() * 8) + 21);
    }, 4500);
    return () => clearInterval(timer);
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
        setNodesModalOpen(false);
        setAnalyticsModalOpen(false);
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
      topic: 'บทสนทนาใหม่กับ Aetheris AI',
      category: 'today',
      icon: 'chat_bubble',
      messages: [] // Clean empty messages!
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setMobileSidebarOpen(false);
    showToast('สร้างบทสนทนาใหม่แล้ว', 'success', 'add_comment');
  };

  const handleSendMessage = (textToSend?: string) => {
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
          sessionTitle = isFirstMessage ? (text.slice(0, 28) || 'การสนทนาใหม่') : s.title;
          sessionTopic = isFirstMessage ? (text.slice(0, 48) || 'หัวข้อการสนทนา') : s.topic;
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

    triggerSimulatedAIResponse(fullContent, false, sessionTitle, sessionTopic);
  };

  const triggerSimulatedAIResponse = async (
    userPrompt: string,
    isRetry: boolean = false,
    updatedTitle?: string,
    updatedTopic?: string
  ) => {
    setIsStreaming(true);
    setStreamingStatusText(
      thinkingMode
        ? 'Aetheris Deep Neural กำลังวิเคราะห์โจทย์และเหตุผล...'
        : 'Aetheris กำลังประมวลผลคำตอบ...'
    );

    let aiResponse: Message;
    try {
      // Call backend API (DeepSeek powered)
      aiResponse = await chatService.sendMessage(userPrompt, {
        sessionId: activeSessionId,
        thinkingMode,
        temperature: parameters.temperature,
        maxTokens: parameters.maxTokens,
        systemPrompt: parameters.systemPrompt,
        sessionTitle: updatedTitle || activeSession.title,
        sessionTopic: updatedTopic || activeSession.topic,
        apiKey: parameters.apiKey
      });
    } catch {
      // Graceful fallback to local synthesis if backend server is not running
      await new Promise(r => setTimeout(r, thinkingMode ? 2000 : 1200));
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

    showToast(`ประมวลผลสำเร็จด้วยโมเดล ${aiResponse.modelName || 'Aetheris 2.5 Pro Neural'}`, 'success', 'neurology');
  };

  const generateContextualResponse = (prompt: string): Message => {
    const lower = prompt.toLowerCase();
    const modelDisplayName =
      currentModel === 'aetheris-deep-reasoning'
        ? 'Aetheris Deep Reasoning'
        : currentModel === 'aetheris-fast-flash'
        ? 'Aetheris Fast Flash'
        : 'Aetheris 2.5 Pro Neural';

    if (lower.includes('useoptimistic') || lower.includes('optimistic')) {
      return {
        sender: 'ai',
        modelName: modelDisplayName,
        duration: 'เสร็จสิ้นใน 2.1 วินาที',
        thoughtSummary: 'Thought for 2.1s: วิเคราะห์ React 19 useOptimistic Hook สำหรับ instant UI feedback ระหว่าง network roundtrip',
        thoughtDetails: 'useOptimistic ช่วยให้ UI เปลี่ยนแปลงล่วงหน้าทันทีที่ผู้ใช้กดส่ง และจะ rollback กลับอัตโนมัติหาก server action ส่ง error กลับมา',
        paragraphs: [
          'การใช้ <code class="inline-code">useOptimistic</code> ใน <strong>React 19</strong> ช่วยมอบประสบการณ์ใช้งานแบบ Zero-Latency โดยแสดงผลล่วงหน้าก่อนที่ Server Action จะตอบกลับ:'
        ],
        codeBlock: {
          filename: 'OptimisticMessageList.tsx',
          language: 'TypeScript',
          code: `import { useOptimistic } from "react";

export function MessageFeed({ messages, sendMessageAction }: { messages: string[]; sendMessageAction: (text: string) => Promise<void> }) {
  const [optimisticMessages, setOptimistic] = useOptimistic(
    messages,
    (current, newMessage: string) => [...current, newMessage]
  );

  async function handleSend(formData: FormData) {
    const text = formData.get("text") as string;
    setOptimistic(text); // แสดงข้อความบน UI ทันที
    await sendMessageAction(text);
  }

  return (
    <form action={handleSend}>
      <ul>{optimisticMessages.map((m, i) => <li key={i}>{m}</li>)}</ul>
      <input name="text" placeholder="พิมพ์ข้อความ..." required />
      <button type="submit">ส่งทันที</button>
    </form>
  );
}`
        },
        suggestions: [
          'วิธีจัดการ Rollback Animation เมื่อ Network Error',
          'ตัวอย่าง Zod Schema Validation บน Server Action'
        ]
      };
    }

    if (lower.includes('zod') || lower.includes('validation')) {
      return {
        sender: 'ai',
        modelName: modelDisplayName,
        duration: 'เสร็จสิ้นใน 2.4 วินาที',
        thoughtSummary: 'Thought for 2.4s: Type-safe schema validation ด้วย Zod v3.24 บน Next.js Server Actions',
        thoughtDetails: 'ตรวจทาน SafeParse methodology เพื่อคืนค่า fieldErrors ไปยัง client โดยไม่ต้อง throw uncaught exceptions',
        paragraphs: [
          'การทำ Server Action Validation ด้วย <strong>Zod</strong> อย่างเป็นมาตรฐาน สามารถนำ <code class="inline-code">schema.safeParse()</code> มาใช้งานร่วมกับ Return Type ของ Action ได้อย่างปลอดภัย:'
        ],
        codeBlock: {
          filename: 'authAction.ts',
          language: 'TypeScript',
          code: `"use server";
import { z } from "zod";

const UserRegisterSchema = z.object({
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
});

export async function registerAction(prevState: any, formData: FormData) {
  const parsed = UserRegisterSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors, success: false };
  }
  return { success: true };
}`
        },
        suggestions: [
          'วิธีผูก fieldErrors เข้ากับ Tailwind error class',
          'การทำ Debounced Client-side Validation'
        ]
      };
    }

    return {
      sender: 'ai',
      modelName: modelDisplayName,
      duration: 'เสร็จสิ้นใน 1.7 วินาที',
      thoughtSummary: `Thought for 1.7s: ประมวลผลคำสั่ง "${prompt.slice(0, 32)}..." ด้วย Neural Graph Synthesis`,
      thoughtDetails: `วิเคราะห์โครงสร้างข้อมูล, ค้นหา Context จากโมเดล ${modelDisplayName} และตรวจสอบความสอดคล้องทางตรรกะแบบเรียลไทม์`,
      paragraphs: [
        `ผมได้ทำการวิเคราะห์คำถามของคุณเกี่ยวกับ <strong>"${prompt}"</strong> เรียบร้อยแล้ว`,
        'นี่คือแนวทางที่แนะนำตามมาตรฐาน Best Practices ที่เน้นความเสถียร ประสิทธิภาพสูง และรองรับการขยายตัว (Scalability):'
      ],
      featureCards: [
        {
          title: 'High Throughput Architecture',
          desc: 'ออกแบบให้ latency ต่ำและใช้ทรัพยากร compute คุ้มค่าที่สุด',
          type: 'primary',
          icon: 'speed'
        },
        {
          title: 'Zero-Trust Security',
          desc: 'เข้ารหัส end-to-end พร้อมรองรับ audit logging ตามมาตรฐาน SOC-2',
          type: 'secondary',
          icon: 'security'
        }
      ],
      suggestions: [
        'ขอตัวอย่างการนำไปใช้งานจริง (Implementation Example)',
        'วิเคราะห์จุดที่อาจเกิด Performance Bottleneck'
      ]
    };
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast(label, 'success', 'content_copy');
    });
  };

  const handleShareSession = () => {
    const dummyUrl = `${window.location.origin}/share/${activeSessionId}`;
    handleCopyText(dummyUrl, 'สร้างและคัดลอกลิงก์แชร์เซสชันแล้ว');
  };

  const handleVoiceToggle = () => {
    if (!isVoiceRecording) {
      setIsVoiceRecording(true);
      showToast('กำลังฟังเสียงของคุณ... (กำลังแปลงเป็นข้อความ)', 'info', 'mic');
      setTimeout(() => {
        setPromptText('ช่วยอธิบายความแตกต่างระหว่าง Server Action กับ Route Handler ใน Next.js หน่อย');
        setIsVoiceRecording(false);
        showToast('แปลงเสียงเป็นข้อความเรียบร้อย', 'success', 'check');
      }, 3000);
    } else {
      setIsVoiceRecording(false);
    }
  };

  const handleAttachFiles = (files: FileList) => {
    const newFiles = Array.from(files).map(f => ({
      name: f.name,
      size: (f.size / 1024).toFixed(1) + ' KB'
    }));
    setAttachedFiles(prev => [...prev, ...newFiles]);
    showToast(`แนบไฟล์สำเร็จ ${newFiles.length} รายการ`, 'success', 'attach_file');
  };

  return (
    <div className="app-layout">
      {/* Ambient Auroras */}
      <div className="ambient-glow-container" aria-hidden="true">
        <div className="ambient-aurora-1"></div>
        <div className="ambient-aurora-2"></div>
        <div className="ambient-aurora-3"></div>
      </div>

      {/* 1. Collapsible Sidebar */}
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

      {/* 2. Main Workspace */}
      <main className="main-workspace">
        <TopNav
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          currentModel={currentModel}
          onSelectModel={setCurrentModel}
          thinkingMode={thinkingMode}
          onToggleThinkingMode={() => {
            setThinkingMode(!thinkingMode);
            showToast(`Thinking Mode: ${!thinkingMode ? 'Active' : 'Paused'}`, 'info', 'psychology');
          }}
          latencyMs={latencyMs}
          onOpenNodes={() => setNodesModalOpen(true)}
          onOpenAnalytics={() => setAnalyticsModalOpen(true)}
          onShareSession={handleShareSession}
          onOpenCheckout={() => setCheckoutModalOpen(true)}
          onOpenLogin={() => setLoginModalOpen(true)}
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
            showToast(
              type === 'like'
                ? 'ขอบคุณสำหรับคำติชม! ระบบจะจดจำรูปแบบนี้'
                : 'ขอบคุณสำหรับข้อเสนอแนะ ระบบจะนำไปปรับปรุงคำตอบถัดไป',
              type === 'like' ? 'success' : 'info',
              type === 'like' ? 'thumb_up' : 'thumb_down'
            );
          }}
          onRetry={() => {
            const lastUser = [...activeSession.messages].reverse().find(m => m.sender === 'user');
            if (lastUser && lastUser.content) {
              triggerSimulatedAIResponse(lastUser.content, true);
            }
          }}
        />

        {/* 4. Floating Command Prompt Deck */}
        <PromptDeck
          promptText={promptText}
          onPromptChange={setPromptText}
          onSend={() => handleSendMessage()}
          attachedFiles={attachedFiles}
          onRemoveFile={(i) => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))}
          onAttachFiles={handleAttachFiles}
          webSearchActive={webSearchActive}
          onToggleWebSearch={() => {
            setWebSearchActive(!webSearchActive);
            showToast(`Web Search: ${!webSearchActive ? 'เปิด' : 'ปิด'}`, 'info', 'public');
          }}
          deepReasoningActive={deepReasoningActive}
          onToggleDeepReasoning={() => {
            setDeepReasoningActive(!deepReasoningActive);
            showToast(`Deep Reasoning: ${!deepReasoningActive ? 'เปิด' : 'ปิด'}`, 'info', 'neurology');
          }}
          isVoiceRecording={isVoiceRecording}
          onToggleVoice={handleVoiceToggle}
        />
      </main>

      {/* Modals */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={(updated) => {
          setCurrentUser(prev => ({ ...prev, ...updated }));
          showToast(`ยินดีต้อนรับคุณ ${updated.name || currentUser.name}! เข้าสู่ระบบสำเร็จ`, 'success', 'verified');
        }}
      />

      <CheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        onPaymentSuccess={() => {
          setCurrentUser(prev => ({ ...prev, tier: 'PRO UNLIMITED' }));
          showToast('การชำระเงินสำเร็จ! บัญชีของคุณได้รับการอัปเกรดเป็น Aetheris Pro Unlimited แล้ว', 'success', 'verified');
        }}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        parameters={parameters}
        onSave={(params) => {
          setParameters(params);
          showToast('บันทึกพารามิเตอร์โมเดลเรียบร้อยแล้ว', 'success', 'tune');
        }}
      />

      <NeuralGraphModal
        isOpen={nodesModalOpen}
        onClose={() => setNodesModalOpen(false)}
      />

      <AnalyticsModal
        isOpen={analyticsModalOpen}
        onClose={() => setAnalyticsModalOpen(false)}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}
export default App;
