'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { highlightCode } from '@/lib/code-highlighter';
import {
  Plus,
  Search,
  PanelLeftClose,
  PanelLeft,
  Send,
  Square,
  Copy,
  Check,
  Trash2,
  Pin,
  Star,
  Settings,
  LogOut,
  MessageSquare,
  ChevronDown,
  Shield,
  MoreHorizontal,
  Clock,
  Zap,
  Download,
  Sparkles,
  FileText,
  X,
  Brain,
  ChevronUp,
  ArrowDown,
  Pencil,
  ShieldCheck,
} from 'lucide-react';

type User = { id: string; name: string; email: string; role: string };
type Chat = {
  id: string;
  title: string;
  pinned: boolean;
  favorite: boolean;
  updatedAt: Date;
  messages?: Message[];
};
type Message = {
  id: string;
  role: string;
  content: string;
  createdAt: string | Date;
  responseTime?: string;
  tokens?: number;
};
type Usage = { used: number; limit: number };
type Props = { user: User; initialChats: Chat[]; settings: any; initialUsage?: Usage };

type PromptPreset = {
  title: string;
  category: string;
  prompt: string;
};

const enterprisePresets: PromptPreset[] = [
  {
    category: 'Business & Strategy',
    title: 'Executive Summary Brief',
    prompt: 'ช่วยเขียน Executive Summary สรุปประเด็นสำคัญของโปรเจกต์ ปัญหา แนวทางแก้ไข และผลลัพธ์ทางธุรกิจที่คาดหวัง ในรูปแบบกระชับ ชัดเจนสำหรับผู้บริหารระดับสูง',
  },
  {
    category: 'Engineering & Code',
    title: 'Code Review & Architecture',
    prompt: 'ช่วยวิเคราะห์และรีวิว Architecture ของโค้ดต่อไปนี้ พร้อมแนะนำข้อปรับปรุงเรื่อง Security, Performance, Error Handling และ Best Practices:',
  },
  {
    category: 'Operations & Comms',
    title: 'Formal Customer Response',
    prompt: 'ช่วยร่างอีเมลตอบกลับลูกค้าองค์กรอย่างเป็นทางการ โดยคงท่าทีสุภาพ เป็นมืออาชีพ ชี้แจงแนวทางแก้ไขปัญหาและ Timeline อย่างชัดเจน:',
  },
  {
    category: 'Data & Analytics',
    title: 'Meeting Action Items',
    prompt: 'ช่วยสกัดประเด็นสำคัญ (Key Takeaways), มติที่ประชุม (Decisions Made), และรายการงานที่ต้องทำต่อ (Action Items พร้อมระบุผู้รับผิดชอบและกำหนดเสร็จ) จากบันทึกต่อไปนี้:',
  },
];

const starters = [
  'Help me write a project brief',
  'Explain a complex topic simply',
  'Brainstorm names for a new product',
  'Review and improve my writing',
];

const formatModelDisplay = (m?: string) => {
  if (!m || m.toLowerCase().includes('deepseek') || m.toLowerCase().includes('zyntra') || m.toLowerCase() === 'converse') return 'Aetheris 2.5 Pro Neural';
  return m;
};

// Helper to extract <think>...</think> tag for reasoning models (DeepSeek-R1 / o1)
function parseThinkingContent(raw: string) {
  if (!raw) return { thinking: '', response: '' };
  
  // Case 1: Complete <think>...</think> block
  const completeMatch = /<think>([\s\S]*?)<\/think>([\s\S]*)/i.exec(raw);
  if (completeMatch) {
    return {
      thinking: completeMatch[1].trim(),
      response: completeMatch[2].trim(),
      isThinkingFinished: true,
    };
  }

  // Case 2: In-progress <think> tag currently streaming
  const inProgressMatch = /<think>([\s\S]*)/i.exec(raw);
  if (inProgressMatch) {
    return {
      thinking: inProgressMatch[1].trim(),
      response: '',
      isThinkingFinished: false,
    };
  }

  // Case 3: Standard response without thinking block
  return {
    thinking: '',
    response: raw,
    isThinkingFinished: true,
  };
}

function CodeBlock({ node, inline, className, children, ...props }: any) {
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : '';
  const codeContent = String(children).replace(/\n$/, '');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isMultiLine = codeContent.includes('\n');

  if (!inline && (match || isMultiLine)) {
    const highlightedHtml = highlightCode(codeContent, lang);
    const lines = codeContent.split('\n');

    return (
      <div className="vscode-code-block my-4 overflow-hidden rounded-xl border border-[#262833] bg-[#111217] text-[13px] shadow-2xl">
        {/* VS Code Window Header */}
        <div className="flex items-center justify-between border-b border-[#20222a] bg-[#16171e] px-4 py-2 text-xs">
          <div className="flex items-center gap-2.5">
            {/* macOS / VS Code window control dots */}
            <div className="flex items-center gap-1.5 opacity-80">
              <span className="h-2.5 w-2.5 rounded-full bg-[#e05c53]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#f2be3f]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#52c444]" />
            </div>
            <span className="ml-2 font-mono text-[11px] font-semibold text-[#8e92a2]">
              {lang || 'code'}
            </span>
          </div>

          <button
            onClick={handleCopy}
            type="button"
            className="flex items-center gap-1.5 rounded-md border border-[#2b2d39] bg-[#1c1e27] px-2.5 py-1 text-[11px] font-medium text-[#b5b8c7] transition hover:border-[#3c3f4e] hover:bg-[#232631] hover:text-white"
          >
            {copied ? (
              <>
                <Check size={12} className="text-white" />
                <span className="text-white">Copied</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy code</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content with Line Numbers & Syntax Highlighting */}
        <div className="flex overflow-x-auto p-3.5 leading-6">
          {/* Line Numbers */}
          <div className="vscode-line-numbers select-none text-right pr-3.5 border-r border-[#20222b] text-[12px] text-[#555866]">
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Highlighted Code */}
          <pre className="!bg-transparent !p-0 !m-0 !border-none !shadow-none !outline-none pl-3.5 overflow-visible font-mono text-[13px] text-[#e0e2e8]">
            <code
              className={`${className || ''} !bg-transparent !p-0 !border-none`}
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          </pre>
        </div>
      </div>
    );
  }

  return (
    <code className="rounded bg-[#1a1c23] px-1.5 py-0.5 font-mono text-[13px] text-[#e0e2e8] border border-[#282a35]" {...props}>
      {children}
    </code>
  );
}

export default function ChatApp({ user, initialChats, settings, initialUsage }: Props) {
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const cacheRef = useRef<Record<string, Message[]>>((() => {
    const initialMap: Record<string, Message[]> = {};
    if (initialChats) {
      for (const c of initialChats) {
        if (c.messages) {
          initialMap[c.id] = c.messages as any;
        }
      }
    }
    return initialMap;
  })());
  const activeRef = useRef<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebar, setSidebar] = useState(true);
  const [search, setSearch] = useState('');
  const [menu, setMenu] = useState(false);
  const [prefs, setPrefs] = useState(false);
  const [toast, setToast] = useState('');
  const [usage, setUsage] = useState<Usage>(initialUsage || { used: 0, limit: 100 });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // Local simulated settings for UI
  const [simTemp, setSimTemp] = useState<number>(settings?.temperature ?? 0.7);
  const [simMaxTokens, setSimMaxTokens] = useState<number>(settings?.maxTokens ?? 2048);
  const [simSystemPrompt, setSimSystemPrompt] = useState<string>(
    settings?.systemPrompt || 'You are a helpful, thoughtful AI assistant.'
  );

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [attachments, setAttachments] = useState<{ name: string; size: string; content: string }[]>([]);
  const [openThinking, setOpenThinking] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);
  const router = useRouter();

  // Scroll position tracking for "Scroll to bottom" button
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    // Show arrow if user has scrolled up more than 120px from bottom
    setShowScrollBottom(distanceToBottom > 120);
  };

  const scrollToBottom = (smooth = true) => {
    bottom.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  // Auto-collapse sidebar on mobile screens on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebar(false);
    }
  }, []);

  // Load OP mode from localStorage if previously unlocked
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isOp = localStorage.getItem('aetheris_op_mode') === '1';
      if (isOp) {
        setUsage((prev) => ({ ...prev, limit: 1000 }));
      }
    }
  }, []);

  // When active chat switches, scroll to bottom once
  useEffect(() => {
    if (active) {
      setTimeout(() => scrollToBottom(false), 50);
    }
  }, [active]);

  // Toast timer
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const visible = chats.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()));

  // Sync activeRef
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // Pre-fetch a chat into memory cache
  const prefetchChat = (id: string) => {
    if (!id || cacheRef.current[id]) return;
    fetch(`/api/chat/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.chat?.messages) {
          cacheRef.current[id] = d.chat.messages;
        }
      })
      .catch(() => {});
  };

  // Switch chat with instant transition & background fetch
  async function selectChat(id: string) {
    if (active === id) return;
    if (loading) abort.current?.abort();

    // 1. Instant switch
    setActive(id);

    // 2. If cached, display instantly
    if (cacheRef.current[id]) {
      setMessages(cacheRef.current[id]);
      setChatLoading(false);
      setTimeout(() => scrollToBottom(false), 20);
      return;
    }

    // 3. If not cached, clear current view and show sleek skeleton/loading instantly
    setMessages([]);
    setChatLoading(true);

    try {
      const r = await fetch(`/api/chat/${id}`);
      if (r.ok) {
        const d = await r.json();
        const msgs = d.chat?.messages || [];
        cacheRef.current[id] = msgs;
        // Only update if still on this active chat
        if (activeRef.current === id) {
          setMessages(msgs);
          setTimeout(() => scrollToBottom(false), 20);
        }
      } else {
        throw new Error('Failed to load chat');
      }
    } catch {
      if (activeRef.current === id) {
        setToast('Failed to load chat');
      }
    } finally {
      if (activeRef.current === id) {
        setChatLoading(false);
      }
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setSidebar(false);
      }
    }
  }

  // Create new chat - 100% instant
  function newChat() {
    if (loading) abort.current?.abort();
    setActive(null);
    setMessages([]);
    setChatLoading(false);
    setInput('');
    setAttachments([]);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebar(false);
    }
  }

  // Delete chat permanently from DB and state
  async function confirmDeleteChat() {
    if (!deleteModal || isDeleting) return;
    setIsDeleting(true);
    const idToDelete = deleteModal.id;
    try {
      delete cacheRef.current[idToDelete];
      const res = await fetch(`/api/chat/${idToDelete}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Failed to delete chat');
      }
      setChats((prev) => prev.filter((c) => c.id !== idToDelete));
      if (active === idToDelete) {
        newChat();
      }
      setToast('ลบข้อมูลการสนทนานี้ออกจากฐานข้อมูลถาวรแล้ว');
    } catch {
      setToast('เกิดข้อผิดพลาดในการลบการสนทนา');
    } finally {
      setIsDeleting(false);
      setDeleteModal(null);
    }
  }

  // Update chat pin/fav
  async function updateChat(id: string, data: object) {
    await fetch(`/api/chat/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const res = await fetch('/api/chats').then((r) => r.json());
    if (res.chats) setChats(res.chats);
  }

  // Send or edit message
  async function send(text = input, editMessageId?: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    // Check secret /op commands
    const lower = trimmed.toLowerCase();
    const isOpOn = lower === '/op on' || lower === '/op';
    const isOpOff = lower === '/op off';
    const isOpCommand = isOpOn || isOpOff;

    if (isOpOn) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('aetheris_op_mode', '1');
      }
      setUsage((prev) => ({ ...prev, limit: 1000 }));
      setToast('OP Mode: ON');
    } else if (isOpOff) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('aetheris_op_mode');
      }
      setUsage((prev) => ({ ...prev, limit: 100 }));
      setToast('OP Mode: OFF');
    } else {
      // Daily limit check for non-admin (requires at least 1% quota)
      if (user.role !== 'ADMIN' && usage.used + 1 > usage.limit) {
        setToast('โควต้าของคุณหมดแล้ว (เหลือ 0%) กรุณารอ 5 ชม. เพื่อรีเซ็ต');
        return;
      }
    }

    // Build final content combining attached documents if present
    let finalContent = trimmed;
    if (attachments.length > 0 && !editMessageId) {
      const docsSummary = attachments
        .map((a) => `[File Attachment: ${a.name}]\n\`\`\`\n${a.content}\n\`\`\``)
        .join('\n\n');
      finalContent = `${trimmed}\n\n${docsSummary}`;
      setAttachments([]);
    }

    if (!editMessageId) {
      setInput('');
    }
    const userMsgId = editMessageId || crypto.randomUUID();
    const assistantMsgId = crypto.randomUUID();

    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'ASSISTANT',
      content: '',
      createdAt: new Date().toISOString(),
      tokens: isOpCommand ? 0 : 1,
    };

    if (editMessageId) {
      // Find the index of the message being edited and replace messages from that point onward
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === editMessageId);
        if (idx !== -1) {
          const updatedUserMsg: Message = {
            ...prev[idx],
            content: finalContent,
          };
          return [...prev.slice(0, idx), updatedUserMsg, assistantMsg];
        }
        return prev;
      });
    } else {
      const userMsg: Message = {
        id: userMsgId,
        role: 'USER',
        content: finalContent,
        createdAt: new Date().toISOString(),
        tokens: 0,
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
    }

    setLoading(true);
    abort.current = new AbortController();

    // Smoothly scroll down
    setTimeout(() => scrollToBottom(true), 50);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: active || undefined,
          message: finalContent,
          editMessageId: editMessageId || undefined,
        }),
        signal: abort.current.signal,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Could not get response from AI');
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const raw = line.split('\n').find((x) => x.startsWith('data:'));
          if (!raw) continue;
          try {
            const data = JSON.parse(raw.slice(5));
            if (data.text) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId ? { ...m, content: m.content + data.text } : m
                )
              );
            }
            if (data.done) {
              if (data.chatId && data.chatId !== active) {
                setActive(data.chatId);
              }
              if (data.responseTime) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          responseTime: data.responseTime,
                          tokens: data.tokens ?? (isOpCommand ? 0 : 1),
                        }
                      : m
                  )
                );
              }
              if (data.op === true || isOpOn) {
                if (typeof window !== 'undefined') localStorage.setItem('aetheris_op_mode', '1');
                setUsage((prev) => ({ ...prev, limit: 1000 }));
              } else if (data.op === false || isOpOff) {
                if (typeof window !== 'undefined') localStorage.removeItem('aetheris_op_mode');
                setUsage((prev) => ({ ...prev, limit: 100 }));
              } else if (typeof data.limit === 'number') {
                setUsage((prev) => ({ ...prev, limit: data.limit }));
              }
              if (typeof data.used === 'number') {
                setUsage((prev) => ({ ...prev, used: data.used }));
              }
            }
            if (data.error) throw new Error(data.error);
          } catch (err: any) {
            if (err.message && !err.message.includes('JSON')) throw err;
          }
        }
      }

      // Refresh sidebar chats asynchronously
      const chatRes = await fetch('/api/chats').then((r) => r.json());
      if (chatRes.chats) setChats(chatRes.chats);
      if (chatRes.usage) {
        const isOp = typeof window !== 'undefined' && localStorage.getItem('aetheris_op_mode') === '1';
        setUsage({ used: chatRes.usage.used, limit: isOp ? 1000 : chatRes.usage.limit });
      }
      // Update cache for active chat
      if (activeRef.current) {
        setMessages((currentMsgs) => {
          cacheRef.current[activeRef.current!] = currentMsgs;
          return currentMsgs;
        });
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        setToast('Generation stopped');
      } else {
        setToast(e.message || 'Connection failed');
        setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId || m.content.length > 0));
      }
    } finally {
      setLoading(false);
      abort.current = null;
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  // Simulated preferences save (dummy UI)
  function savePrefs(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPrefs(false);
    setToast('Settings saved successfully');
  }

  function copyText(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setToast('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Export entire chat as clean, token-efficient English Markdown (.md)
  async function exportChatMarkdown(targetChatId?: string) {
    let targetMsgs = messages;
    let title = 'Chat';

    if (targetChatId && targetChatId !== active) {
      const c = chats.find((item) => item.id === targetChatId);
      if (c?.title) title = c.title;

      if (cacheRef.current[targetChatId] && cacheRef.current[targetChatId].length > 0) {
        targetMsgs = cacheRef.current[targetChatId];
      } else {
        setToast('กำลังเตรียมข้อมูลแชทสำหรับการส่งออก…');
        try {
          const res = await fetch(`/api/chat/${targetChatId}`);
          if (res.ok) {
            const data = await res.json();
            targetMsgs = data.chat?.messages || [];
            if (data.chat?.title) title = data.chat.title;
          }
        } catch {
          setToast('เกิดข้อผิดพลาดในการดึงข้อมูลแชท');
          return;
        }
      }
    } else {
      const currentChat = active ? chats.find((c) => c.id === active) : null;
      if (currentChat?.title) title = currentChat.title;
    }

    if (!targetMsgs || targetMsgs.length === 0) {
      setToast('ไม่มีข้อความในการสนทนานี้ให้ส่งออก');
      return;
    }

    const safeFilename = `${title.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'chat'}.md`;

    let md = `# ${title}\n\n`;

    for (const msg of targetMsgs) {
      if (msg.role === 'USER') {
        md += `## User\n\n${msg.content.trim()}\n\n`;
      } else if (msg.role === 'ASSISTANT') {
        const { response } = parseThinkingContent(msg.content);
        const cleanContent = (response || msg.content).trim();
        md += `## Assistant\n\n${cleanContent}\n\n`;
        md += `---\n\n`;
      }
    }

    // Create blob and trigger browser download
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = safeFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToast(`ส่งออกไฟล์ "${safeFilename}" เรียบร้อยแล้ว`);
  }

  // Handle local file reading for attachments with strict token guards
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachments.length >= 2) {
      setToast('แนบไฟล์ได้สูงสุด 2 ไฟล์ต่อครั้ง เพื่อประหยัดโทเคน');
      return;
    }

    const maxAllowed = Math.min(files.length, 2 - attachments.length);
    for (let i = 0; i < maxAllowed; i++) {
      const file = files[i];

      // Handle PDF files via server parser
      if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
        if (file.size > 5 * 1024 * 1024) {
          setToast(`ไฟล์ PDF "${file.name}" มีขนาดเกิน 5MB`);
          continue;
        }

        setToast(`กำลังอ่านข้อความจาก "${file.name}"…`);
        try {
          const fd = new FormData();
          fd.append('file', file);
          const res = await fetch('/api/parse-pdf', { method: 'POST', body: fd });
          const json = await res.json();
          if (!res.ok || json.error) {
            setToast(`ไม่สามารถแยกข้อความจาก PDF: ${json.error || 'Unknown error'}`);
            continue;
          }

          const sizeFormatted = file.size > 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${file.size} B`;
          setAttachments((prev) => [
            ...prev,
            { name: file.name, size: sizeFormatted, content: json.text },
          ]);
          setToast(`แนบ PDF "${file.name}" เรียบร้อย (${json.pages || 1} หน้า)`);
        } catch {
          setToast(`เกิดข้อผิดพลาดในการประมวลผล PDF "${file.name}"`);
        }
        continue;
      }

      // Handle text / code files (up to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setToast(`ไฟล์ "${file.name}" มีขนาดเกิน 5MB`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const textContent = (event.target?.result as string) || '';
        const sizeFormatted = file.size > 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${file.size} B`;
        // Strictly truncate text content to 2,500 chars to avoid token explosion
        const safeContent = textContent.slice(0, 2500);
        setAttachments((prev) => [
          ...prev,
          { name: file.name, size: sizeFormatted, content: safeContent },
        ]);
        setToast(`แนบ "${file.name}" เรียบร้อย (จำกัดขนาดประหยัดโทเคน)`);
      };
      reader.readAsText(file);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleThinking(msgId: string) {
    setOpenThinking((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  }

  // Quota calculation
  const quotaPercent = Math.min(100, Math.round((usage.used / usage.limit) * 100));
  const remainingPercent = Math.max(0, 100 - quotaPercent);
  const isQuotaExceeded = user.role !== 'ADMIN' && usage.used + 1 > usage.limit;

  return (
    <div className="flex h-dvh overflow-hidden bg-[#0e0e12] text-[#e7e4f0] antialiased selection:bg-[#4d4f74] selection:text-[#e1e1ff]">
      {/* Sidebar (Anchor: Luminescent Slate SideNavBar) */}
      {sidebar && (
        <aside className="flex w-[280px] shrink-0 flex-col border-r border-[#484751]/30 bg-[#131319] max-md:absolute max-md:z-30 max-md:h-full transition-all duration-200">
          {/* Header */}
          <div className="flex h-[66px] items-center justify-between px-4 border-b border-[#484751]/20">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[#1f1f27] border border-[#484751]/50 p-0.5 shadow-sm shadow-[#c2c3ee]/10 overflow-hidden">
                <img src="/aetheris-logo.svg" alt="Aetheris AI" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-headline font-bold tracking-tight text-white text-[15px]">Aetheris AI</span>
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-[#4d4f74]/40 text-[#c2c3ee] border border-[#c2c3ee]/20">v2.5</span>
                </div>
                <span className="text-[10px] text-[#aca9b6]">v2.5 Pro Neural</span>
              </div>
            </div>
            <button
              onClick={() => setSidebar(false)}
              className="rounded-lg p-1.5 text-[#aca9b6] hover:bg-[#25252e] hover:text-white transition"
              title="ยุบแถบข้าง (⌘B)"
            >
              <PanelLeftClose size={17} />
            </button>
          </div>

          {/* New Chat Primary Action Button */}
          <div className="p-3 pb-2">
            <button
              onClick={newChat}
              className="flex w-full items-center justify-between rounded-xl border border-[#484751]/40 bg-[#1f1f27]/90 px-3.5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:border-[#c2c3ee]/40 hover:bg-[#25252e] active:scale-[0.98] group"
            >
              <div className="flex items-center gap-2.5">
                <Plus size={16} className="text-[#c2c3ee] transition-transform group-hover:rotate-90" />
                <span className="font-medium text-[13px]">New Chat</span>
              </div>
              <kbd className="rounded border border-[#484751]/40 bg-[#131319] px-1.5 py-0.5 text-[10px] font-mono text-[#aca9b6]">⌘N</kbd>
            </button>

            {/* Quick Search */}
            <div className="relative mt-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#76747f]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาบทสนทนา..."
                className="w-full rounded-lg border border-[#484751]/20 bg-[#191920]/80 pl-8 pr-8 py-1.5 text-xs text-[#e7e4f0] placeholder:text-[#76747f] focus:outline-none focus:border-[#c2c3ee]/50 focus:ring-1 focus:ring-[#c2c3ee]/30 transition"
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-[#484751]/30 bg-[#1f1f27] px-1 text-[10px] font-mono text-[#76747f]">⌘K</kbd>
            </div>
          </div>

          {/* Recent Chats Section */}
          <div className="chat-scroll flex-1 overflow-y-auto px-3 space-y-1">
            <p className="px-2 pt-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-[#76747f]">
              วันนี้ (Today)
            </p>
            {visible.map((c) => (
              <div
                key={c.id}
                className={`group flex items-center rounded-lg transition-all ${
                  active === c.id
                    ? 'bg-[#1f1f27]/90 text-white border-l-2 border-[#c2c3ee]'
                    : 'text-[#aca9b6] hover:bg-[#191920] hover:text-[#e7e4f0]'
                }`}
              >
                <button
                  onClick={() => selectChat(c.id)}
                  onMouseEnter={() => prefetchChat(c.id)}
                  className="min-w-0 flex-1 truncate px-3 py-2 text-left text-[13px] flex items-center gap-2"
                >
                  <MessageSquare size={13} className={active === c.id ? 'text-[#c2c3ee]' : 'text-[#76747f]'} />
                  {c.pinned && <Pin size={11} className="inline text-[#c2c3ee]" />}
                  <span className={`truncate ${active === c.id ? 'font-medium text-white' : ''}`}>
                    {c.title || 'New chat'}
                  </span>
                </button>
                {active === c.id && <span className="w-1.5 h-1.5 rounded-full bg-[#c2c3ee] mr-2 shrink-0 animate-pulse" />}
                <div className="hidden pr-2 group-hover:flex items-center gap-0.5">
                  <button
                    title="Export as Markdown (.md)"
                    onClick={(e) => {
                      e.stopPropagation();
                      exportChatMarkdown(c.id);
                    }}
                    className="p-1 text-[#76747f] hover:text-white transition"
                  >
                    <Download size={12} />
                  </button>
                  <button
                    title="Pin"
                    onClick={() => updateChat(c.id, { pinned: !c.pinned })}
                    className="p-1 text-[#76747f] hover:text-white transition"
                  >
                    <Pin size={12} />
                  </button>
                  <button
                    title="Favorite"
                    onClick={() => updateChat(c.id, { favorite: !c.favorite })}
                    className="p-1 text-[#76747f] hover:text-amber-300 transition"
                  >
                    <Star size={12} fill={c.favorite ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteModal({ id: c.id, title: c.title || 'New chat' });
                    }}
                    className="p-1 text-[#76747f] hover:text-rose-400 transition"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quota Limit Card (Luminescent Slate Card with clean luminescent progress bar) */}
          <div className="mx-3 mb-2 rounded-xl border border-[#484751]/30 bg-[#191920]/90 p-3 shadow-sm transition hover:border-[#76747f]/40">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[#e7e4f0] truncate">Five Hour Limit Remaining</span>
                  {usage.limit >= 1000 && (
                    <span className="rounded bg-[#4d4f74]/40 px-1 py-0.2 text-[9px] font-semibold text-[#c2c3ee] border border-[#c2c3ee]/20">
                      OP
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[10px] text-[#aca9b6]">
                  {remainingPercent > 0
                    ? `${remainingPercent}% quota available · resets in 5h`
                    : 'Limit reached (0%) · resets in 5h'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-white">
                  {remainingPercent}%
                </span>
              </div>
            </div>

            {/* Clean White Quota Progress Bar */}
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#25252e]">
              <div
                className="h-full rounded-full bg-white transition-all duration-500 ease-out shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                style={{ width: `${remainingPercent}%` }}
              />
            </div>
          </div>

          {/* Footer User Profile & System Settings */}
          <div className="border-t border-[#484751]/30 p-3 bg-[#131319] space-y-1">
            <div className="grid grid-cols-2 gap-1 mb-1">
              <button
                onClick={() => {
                  setPrefs(true);
                  if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebar(false);
                }}
                className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-[#aca9b6] hover:bg-[#1f1f27] hover:text-white transition"
              >
                <Settings size={13} />
                <span>Parameters</span>
              </button>
              {user.role === 'ADMIN' ? (
                <a
                  href="/admin"
                  className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-[#aca9b6] hover:bg-[#1f1f27] hover:text-white transition"
                >
                  <Shield size={13} />
                  <span>Admin</span>
                </a>
              ) : (
                <button
                  onClick={() => setShowPresets(true)}
                  className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-[#aca9b6] hover:bg-[#1f1f27] hover:text-white transition"
                >
                  <Sparkles size={13} />
                  <span>Presets</span>
                </button>
              )}
            </div>

            {/* User Account Card */}
            <button
              onClick={() => setMenu(!menu)}
              className="flex w-full items-center justify-between p-2 rounded-xl bg-[#191920]/80 hover:bg-[#1f1f27] border border-[#484751]/30 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#4d4f74] via-[#393a4d] to-[#1f1f27] border border-[#c2c3ee]/30 flex items-center justify-center font-bold text-xs text-[#c2c3ee] tracking-tight shrink-0">
                  {user.name[0]?.toUpperCase()}
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-xs font-semibold text-white leading-tight">{user.name}</span>
                    <span className="px-1 py-0.2 rounded text-[9px] font-extrabold bg-[#c2c3ee] text-[#3b3d61]">PRO</span>
                  </div>
                  <span className="truncate text-[10px] text-[#aca9b6]">{user.email}</span>
                </div>
              </div>
              <MoreHorizontal size={15} className="text-[#76747f] shrink-0" />
            </button>

            {menu && (
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#c5c4dd] hover:bg-[#25252e] hover:text-white transition"
              >
                <LogOut size={14} /> ออกจากระบบ (Sign out)
              </button>
            )}
          </div>
        </aside>
      )}

      {/* Mobile Backdrop when Sidebar is Open */}
      {sidebar && (
        <div
          onClick={() => setSidebar(false)}
          className="fixed inset-0 z-20 bg-black/70 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Main Chat Workspace Canvas */}
      <main className="flex min-w-0 flex-1 flex-col bg-[#0e0e12] relative">
        {/* Top Header Bar (Anchor: Luminescent TopNavBar) */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#484751]/20 px-4 sm:px-6 bg-[#0e0e12]/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            {!sidebar && (
              <button
                onClick={() => setSidebar(true)}
                className="rounded-lg p-1.5 text-[#aca9b6] hover:bg-[#1f1f27] hover:text-white transition shrink-0"
              >
                <PanelLeft size={18} />
              </button>
            )}

            {/* Model Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#191920] border border-[#484751]/30 hover:border-[#c2c3ee]/40 cursor-pointer transition-colors shadow-sm shrink-0">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-white tracking-tight">Aetheris 2.5 Pro Neural</span>
              <ChevronDown size={14} className="text-[#aca9b6]" />
            </div>

            {/* Capability indicators */}
            <div className="hidden lg:flex items-center gap-2 text-[11px]">
              <span className="px-2.5 py-1 rounded-full bg-[#191920] border border-[#484751]/30 text-[#aca9b6] flex items-center gap-1.5">
                <Brain size={12} className="text-[#c2c3ee]" />
                <span>Thinking Mode: Active</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#191920] border border-[#484751]/30 text-[#aca9b6] flex items-center gap-1">
                <Zap size={12} className="text-[#c5c4dd]" />
                <span>Context: 128k</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#191920] border border-[#484751]/30 text-[#aca9b6] flex items-center gap-1">
                <Clock size={12} className="text-emerald-400" />
                <span>Latency: 24ms</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowPresets(true)}
              className="flex items-center gap-1.5 rounded-lg border border-[#484751]/30 bg-[#191920] px-3 py-1.5 text-xs font-medium text-[#c5c4dd] hover:border-[#c2c3ee]/40 hover:bg-[#1f1f27] hover:text-white transition shadow-sm"
              title="Enterprise Prompt Library"
            >
              <Sparkles size={13} className="text-[#c2c3ee]" />
              <span className="hidden sm:inline">Prompt Library</span>
            </button>
            <button
              onClick={() => exportChatMarkdown()}
              disabled={!active && messages.length === 0}
              className="flex items-center gap-1.5 rounded-lg border border-[#484751]/30 bg-[#191920] px-3 py-1.5 text-xs font-medium text-[#c5c4dd] hover:border-[#c2c3ee]/40 hover:bg-[#1f1f27] hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              title="Export conversation as Markdown (.md)"
            >
              <Download size={13} className="text-[#c2c3ee]" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </header>

        {/* Message Feed Stream */}
        <section
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="chat-scroll relative flex-1 overflow-y-auto"
        >
          <div className="mx-auto max-w-4xl px-4 sm:px-6 pb-48 pt-6 space-y-6">
            {/* Session Header / Breadcrumb */}
            <div className="flex items-center justify-between pb-3 border-b border-[#484751]/20 text-[11px] text-[#aca9b6]">
              <div className="flex items-center gap-2">
                <MessageSquare size={13} className="text-[#c2c3ee]" />
                <span className="text-white font-medium">
                  {active ? chats.find((c) => c.id === active)?.title || 'การสนทนา' : 'การสนทนาใหม่'}
                </span>
                <span>•</span>
                <span>Aetheris 2.5 Pro Neural</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-400" />
                <span>SOC-2 End-to-End Encrypted</span>
              </div>
            </div>

            {chatLoading ? (
              <div className="space-y-6 animate-pulse pt-4">
                <div className="flex gap-3.5">
                  <div className="h-8 w-8 rounded-lg bg-[#191920]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded bg-[#191920]" />
                    <div className="h-16 w-3/4 rounded-2xl bg-[#131319]" />
                  </div>
                </div>
                <div className="flex flex-row-reverse gap-3.5">
                  <div className="h-8 w-8 rounded-lg bg-[#25252e]" />
                  <div className="h-12 w-1/2 rounded-2xl bg-[#1f1f27]" />
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex min-h-[50vh] flex-col items-center justify-center text-center px-4">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#484751]/40 bg-[#191920] p-1.5 shadow-[0_0_35px_rgba(194,195,238,0.18)]">
                  <img src="/aetheris-logo.svg" alt="Aetheris AI Logo" className="w-full h-full object-contain" />
                </div>
                <h1 className="font-headline text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
                  What can I help with?
                </h1>
                <p className="text-sm text-[#aca9b6] max-w-md">
                  A clear mind makes room for better questions. Ambient intelligence for complex workflows.
                </p>

                {/* Starter Prompt Cards */}
                <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                  {starters.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="group rounded-2xl border border-[#484751]/30 bg-[#131319]/90 p-4 text-left text-sm transition hover:border-[#c2c3ee]/40 hover:bg-[#191920] shadow-sm flex flex-col justify-between"
                    >
                      <div className="font-medium text-[#e7e4f0] group-hover:text-white transition leading-snug">{s}</div>
                      <span className="mt-3 flex items-center gap-1 text-[11px] text-[#aca9b6] group-hover:text-[#c2c3ee] transition">
                        <span>Explore with Aetheris</span> <span className="text-[11px]">↗</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {(() => {
                  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'USER');
                  const lastUserMsgId = lastUserMsg?.id;

                  return messages.map((m) => {
                    const isLatestUserMessage = m.role === 'USER' && m.id === lastUserMsgId;
                    const isEditingThis = editingMessageId === m.id;

                    return (
                      <article
                        key={m.id}
                        className={`fade-in flex gap-3.5 ${
                          m.role === 'USER' ? 'flex-row-reverse' : 'flex-row'
                        }`}
                      >
                        {/* Avatar (Initials for user, glyph for assistant) */}
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold shadow-sm ${
                            m.role === 'USER'
                              ? 'bg-gradient-to-tr from-[#393a4d] to-[#4d4f74] text-[#c2c3ee] border border-[#c2c3ee]/30'
                              : 'bg-[#191920] p-1 border border-[#484751]/50 shadow-md shadow-[#c2c3ee]/10 overflow-hidden'
                          }`}
                        >
                          {m.role === 'USER' ? user.name[0]?.toUpperCase() : <img src="/aetheris-logo.svg" alt="Aetheris AI" className="w-full h-full object-contain" />}
                        </div>

                        {/* Message Bubble Body */}
                        <div
                          className={`min-w-0 ${
                            m.role === 'USER'
                              ? 'max-w-[85%] rounded-2xl rounded-tr-sm bg-[#1f1f27] border border-[#484751]/40 px-4 py-3 shadow-md'
                              : 'flex-1 space-y-3'
                          }`}
                        >
                          {/* Message Header */}
                          <div className="mb-1.5 flex items-center justify-between gap-2 text-xs font-medium text-[#aca9b6]">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">
                                {m.role === 'USER' ? user.name : 'Aetheris 2.5 Pro Neural'}
                              </span>
                              {m.role === 'ASSISTANT' && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-[#4d4f74]/40 text-[#c2c3ee] border border-[#c2c3ee]/20">
                                  VERIFIED
                                </span>
                              )}
                            </div>

                            {/* Edit Pencil Button for Latest User Question */}
                            {isLatestUserMessage && !isEditingThis && !loading && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMessageId(m.id);
                                  setEditInput(m.content);
                                }}
                                title="แก้ไขข้อความ"
                                className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-[#aca9b6] transition hover:bg-[#25252e] hover:text-white"
                              >
                                <Pencil size={11} />
                                <span className="hidden sm:inline">แก้ไขข้อความ</span>
                              </button>
                            )}
                          </div>

                          {/* Message Content */}
                          {(() => {
                            if (!m.content) {
                              return (
                                <div className="flex items-center gap-2.5 py-2.5">
                                  <span className="text-xs text-[#aca9b6]">Synthesizing response</span>
                                  <span className="flex gap-1.5">
                                    <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#c2c3ee]" />
                                    <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#c2c3ee] [animation-delay:150ms]" />
                                    <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#c2c3ee] [animation-delay:300ms]" />
                                  </span>
                                </div>
                              );
                            }

                            if (m.role === 'ASSISTANT') {
                              const { thinking, response, isThinkingFinished } = parseThinkingContent(m.content);
                              const isExpanded = openThinking[m.id] ?? !isThinkingFinished;

                              return (
                                <div className="space-y-3">
                                  {/* Thinking Process Accordion Drawer */}
                                  {thinking && (
                                    <div className="overflow-hidden rounded-xl border border-[#484751]/30 bg-[#131319] text-xs transition">
                                      <button
                                        type="button"
                                        onClick={() => toggleThinking(m.id)}
                                        className="flex w-full items-center justify-between px-3.5 py-2 font-medium text-[#c5c4dd] hover:bg-[#191920] transition"
                                      >
                                        <div className="flex items-center gap-2">
                                          <Brain size={14} className="text-[#c2c3ee]" />
                                          <span>
                                            <strong className="text-white font-medium">Thought for reasoning:</strong> {!isThinkingFinished ? '(Analyzing neural graph...)' : 'Completed'}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[#aca9b6]">
                                          <span>{isExpanded ? 'Hide' : 'Expand'}</span>
                                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                        </div>
                                      </button>
                                      {isExpanded && (
                                        <div className="border-t border-[#484751]/20 px-3.5 py-2.5 font-mono text-[11px] leading-relaxed text-[#aca9b6] whitespace-pre-wrap bg-[#0e0e12]/80">
                                          {thinking}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Main Response Markdown */}
                                  {response ? (
                                    <div className="prose text-[14px] leading-relaxed text-[#e7e4f0]">
                                      <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                          code: CodeBlock,
                                        }}
                                      >
                                        {response}
                                      </ReactMarkdown>
                                    </div>
                                  ) : !isThinkingFinished ? (
                                    <div className="flex items-center gap-2 py-1 text-xs text-[#aca9b6]">
                                      <Brain size={13} className="text-[#c2c3ee] animate-pulse" />
                                      <span>Reasoning in progress...</span>
                                    </div>
                                  ) : null}
                                </div>
                              );
                            }

                            // User message - In-place editing mode
                            if (isEditingThis) {
                              return (
                                <div className="mt-2 space-y-2.5">
                                  <textarea
                                    value={editInput}
                                    onChange={(e) => setEditInput(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        if (editInput.trim() && !loading) {
                                          const newText = editInput.trim();
                                          setEditingMessageId(null);
                                          send(newText, m.id);
                                        }
                                      } else if (e.key === 'Escape') {
                                        setEditingMessageId(null);
                                      }
                                    }}
                                    rows={Math.min(6, Math.max(2, editInput.split('\n').length))}
                                    className="w-full rounded-xl border border-[#484751]/50 bg-[#131319] p-3 text-[14px] text-white outline-none focus:border-[#c2c3ee]/60 transition"
                                    placeholder="แก้ไขคำถาม..."
                                    autoFocus
                                  />
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setEditingMessageId(null)}
                                      className="rounded-lg border border-[#484751]/40 bg-[#191920] px-3 py-1.5 text-xs font-medium text-[#aca9b6] hover:bg-[#25252e] hover:text-white transition"
                                    >
                                      ยกเลิก
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (editInput.trim() && !loading) {
                                          const newText = editInput.trim();
                                          setEditingMessageId(null);
                                          send(newText, m.id);
                                        }
                                      }}
                                      disabled={loading || !editInput.trim()}
                                      className="rounded-lg btn-gradient-primary px-3.5 py-1.5 text-xs font-semibold text-[#e1e1ff] transition disabled:opacity-50"
                                    >
                                      บันทึกและส่ง
                                    </button>
                                  </div>
                                </div>
                              );
                            }

                            // User message - Normal display
                            return (
                              <div className="prose text-[14px] leading-relaxed text-[#f2f0f7]">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    code: CodeBlock,
                                  }}
                                >
                                  {m.content}
                                </ReactMarkdown>
                              </div>
                            );
                          })()}

                          {/* Assistant Telemetry & Clean Action Bar */}
                          {m.role === 'ASSISTANT' && m.content && (
                            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#484751]/20 pt-2.5">
                              {m.responseTime && (
                                <span className="inline-flex items-center gap-1 rounded-md border border-[#484751]/30 bg-[#191920] px-2 py-0.5 text-[11px] text-[#aca9b6]">
                                  <Clock size={11} className="text-[#c2c3ee]" />
                                  {m.responseTime}
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1 rounded-md border border-[#484751]/30 bg-[#191920] px-2 py-0.5 text-[11px] text-[#aca9b6]">
                                <Zap size={11} className="text-[#c2c3ee]" />
                                {typeof m.tokens === 'number'
                                  ? `${Math.max(1, Math.round((m.tokens / usage.limit) * 100))}%`
                                  : '2%'}
                              </span>

                              <div className="flex items-center gap-1 ml-auto">
                                <button
                                  onClick={() => copyText(m.id, m.content)}
                                  title="Copy response"
                                  className="inline-flex items-center gap-1 rounded-md border border-transparent px-2 py-1 text-[11px] text-[#aca9b6] hover:border-[#484751]/40 hover:bg-[#191920] hover:text-[#e7e4f0] transition"
                                >
                                  {copiedId === m.id ? (
                                    <>
                                      <Check size={12} className="text-[#c2c3ee]" />
                                      <span className="text-[#c2c3ee]">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={12} />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  });
                })()}
              </div>
            )}
            <div ref={bottom} />
          </div>

          {/* Floating Scroll to Bottom Arrow Button */}
          {showScrollBottom && (
            <button
              type="button"
              onClick={() => scrollToBottom(true)}
              title="Scroll to bottom"
              className="sticky bottom-28 ml-auto mr-6 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-[#484751]/50 bg-[#191920]/95 text-[#c2c3ee] shadow-xl backdrop-blur hover:border-[#c2c3ee]/50 hover:bg-[#25252e] hover:text-white transition active:scale-95"
            >
              <ArrowDown size={16} />
            </button>
          )}
        </section>

        {/* Floating Command Prompt Deck (Luminescent Slate Design System) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none flex flex-col items-center justify-end bg-gradient-to-t from-[#0e0e12] via-[#0e0e12]/90 to-transparent pt-10 z-20">
          <div className="w-full max-w-4xl pointer-events-auto space-y-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className={`relative rounded-2xl bg-[#131319]/95 backdrop-blur-xl border p-3 shadow-2xl transition ${
                isQuotaExceeded
                  ? 'border-rose-900/60 opacity-80'
                  : 'border-[#484751]/40 focus-within:border-[#c2c3ee]/60 focus-within:ring-1 focus-within:ring-[#c2c3ee]/30'
              }`}
            >
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept=".pdf,application/pdf,.txt,.md,.json,.csv,.js,.ts,.tsx,.jsx,.html,.css,.py,.sql"
                className="hidden"
              />

              {/* Attachment Preview Chips */}
              {attachments.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2 pt-1 border-b border-[#484751]/20 pb-2">
                  {attachments.map((att, idx) => (
                    <div
                      key={att.name + idx}
                      className="flex items-center gap-1.5 rounded-lg border border-[#484751]/30 bg-[#191920] px-2.5 py-1 text-xs text-[#e7e4f0]"
                    >
                      <FileText size={12} className="text-[#c2c3ee]" />
                      <span className="font-medium max-w-[160px] truncate">{att.name}</span>
                      <span className="text-[10px] text-[#aca9b6]">({att.size})</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="ml-1 text-[#aca9b6] hover:text-white"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <textarea
                value={input}
                maxLength={2000}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                disabled={loading}
                rows={2}
                placeholder={
                  isQuotaExceeded
                    ? 'โควต้าหมดแล้ว (เหลือ 0%) รอ 5 ชม. เพื่อรีเซ็ต'
                    : 'พิมพ์คำถามหรือป้อนคำสั่งให้ Aetheris AI... (Shift + Enter เพื่อขึ้นบรรทัดใหม่)'
                }
                className="w-full resize-none bg-transparent text-sm leading-relaxed text-[#e7e4f0] outline-none placeholder:text-[#76747f] disabled:cursor-not-allowed px-1"
              />

              {/* Controls inside Prompt Deck */}
              <div className="flex items-center justify-between pt-2 border-t border-[#484751]/20 px-1">
                {/* Left Action Toolset */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading || attachments.length >= 2}
                    title="แนบไฟล์หรือโค้ด (.pdf, .txt, .md, .csv)"
                    className="p-1.5 rounded-lg text-[#aca9b6] hover:text-white hover:bg-[#1f1f27] transition flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPresets(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-[#c2c3ee] bg-[#4d4f74]/20 border border-[#c2c3ee]/30 hover:bg-[#4d4f74]/30 transition"
                  >
                    <Sparkles size={12} />
                    <span>Templates</span>
                  </button>

                  <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-[#c5c4dd] bg-[#191920] border border-[#484751]/30">
                    <Brain size={12} className="text-[#c2c3ee]" />
                    <span>Deep Reasoning</span>
                  </div>

                  <span className="text-[11px] text-[#76747f] hidden sm:inline ml-1 font-mono">
                    {input.length > 0 && `${input.length}/2000`}
                  </span>
                </div>

                {/* Right Action: Send Button or Stop Button */}
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-[#76747f]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>200,000 tok</span>
                  </div>

                  {loading ? (
                    <button
                      type="button"
                      onClick={() => abort.current?.abort()}
                      className="flex items-center gap-1.5 rounded-xl bg-[#25252e] border border-[#484751]/40 px-3 py-1.5 text-xs text-white hover:bg-[#34344a] transition"
                    >
                      <Square size={11} fill="currentColor" /> Stop
                    </button>
                  ) : (
                    <button
                      disabled={(!input.trim() && attachments.length === 0) || loading}
                      className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#4d4f74] to-[#c2c3ee] text-[#0e0e12] flex items-center justify-center hover:scale-105 active:scale-95 shadow-lg shadow-[#4d4f74]/30 transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <Send size={14} className="ml-0.5" />
                    </button>
                  )}
                </div>
              </div>
            </form>

            {/* Compliance Footer Note */}
            <div className="flex items-center justify-center gap-2 text-[11px] text-[#76747f] text-center px-4">
              <span>Aetheris AI อาจแสดงข้อมูลที่ไม่ถูกต้อง กรุณาตรวจสอบข้อมูลสำคัญ</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-[#aca9b6]">
                <ShieldCheck size={12} className="text-emerald-400" />
                <span>SOC2 Type II Certified & Encrypted</span>
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Preferences Modal (Simulated UI with interactive parameters) */}
      {prefs && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setPrefs(false)}
        >
          <form
            onSubmit={savePrefs}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-[#484751]/40 bg-[#131319] p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between border-b border-[#484751]/20 pb-3">
              <h2 className="font-headline text-lg font-semibold text-white">Model Parameters</h2>
              <button
                type="button"
                onClick={() => setPrefs(false)}
                className="text-[#aca9b6] hover:text-white text-lg"
              >
                ×
              </button>
            </div>
            <div className="mb-4 rounded-xl border border-[#484751]/30 bg-[#191920] p-3 text-xs text-[#aca9b6]">
              Settings are locked and managed by the system administrator for optimal latency.
            </div>
            <label className="mb-4 block text-xs font-medium text-[#aca9b6]">
              Engine Model
              <input
                name="model"
                defaultValue={formatModelDisplay(settings?.model)}
                disabled
                className="mt-1.5 w-full cursor-not-allowed rounded-lg border border-[#484751]/30 bg-[#0e0e12] p-2.5 text-xs text-[#aca9b6] outline-none font-mono"
              />
            </label>
            <label className="mb-4 block text-xs font-medium text-[#aca9b6]">
              <div className="flex items-center justify-between">
                <span>Temperature</span>
                <span className="text-xs font-mono text-[#c2c3ee]">{simTemp}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={simTemp}
                disabled
                className="mt-2 w-full cursor-not-allowed opacity-50 grayscale"
              />
            </label>
            <label className="mb-4 block text-xs font-medium text-[#aca9b6]">
              <div className="flex items-center justify-between">
                <span>Maximum Context Tokens</span>
                <span className="text-xs font-mono text-[#c2c3ee]">{simMaxTokens}</span>
              </div>
              <input
                type="range"
                min="256"
                max="8192"
                step="256"
                value={simMaxTokens}
                disabled
                className="mt-2 w-full cursor-not-allowed opacity-50 grayscale"
              />
            </label>
            <button
              type="button"
              disabled
              className="w-full mt-2 cursor-not-allowed rounded-xl bg-[#191920] border border-[#484751]/30 py-2.5 text-xs font-semibold text-[#76747f]"
            >
              Parameters Locked
            </button>
          </form>
        </div>
      )}

      {/* Enterprise Prompt Library Modal */}
      {showPresets && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setShowPresets(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-2xl border border-[#484751]/40 bg-[#131319] p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between border-b border-[#484751]/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#191920] text-[#c2c3ee] border border-[#484751]/40">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h2 className="font-headline text-base font-semibold text-white">Enterprise Prompt Library</h2>
                  <p className="text-xs text-[#aca9b6]">คลังเทมเพลตมาตรฐานสำหรับงานธุรกิจและการพัฒนา</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPresets(false)}
                className="text-[#aca9b6] hover:text-white text-lg"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {enterprisePresets.map((preset) => (
                <div
                  key={preset.title}
                  className="rounded-xl border border-[#484751]/30 bg-[#0e0e12]/80 p-4 transition hover:border-[#c2c3ee]/40 hover:bg-[#191920]"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#c2c3ee]">
                      {preset.category}
                    </span>
                    <button
                      onClick={() => {
                        setInput(preset.prompt);
                        setShowPresets(false);
                      }}
                      className="inline-flex items-center gap-1 rounded-md bg-[#191920] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#25252e] border border-[#484751]/40 transition"
                    >
                      Use Template ↗
                    </button>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">{preset.title}</h3>
                  <p className="text-xs text-[#aca9b6] leading-relaxed line-clamp-2">{preset.prompt}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup Modal */}
      {deleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => !isDeleting && setDeleteModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-rose-900/40 bg-[#131319] p-6 shadow-2xl"
          >
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-rose-500/25 bg-rose-500/10 text-rose-400">
                <Trash2 size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-headline text-base font-semibold text-white">
                  ยืนยันการลบการสนทนา
                </h3>
                <p className="mt-1 text-xs text-[#aca9b6] leading-relaxed break-words">
                  คุณแน่ใจหรือไม่ว่าต้องการลบการสนทนา <strong className="text-white">"{deleteModal.title}"</strong> ?
                </p>
                <div className="mt-3 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-[12px] text-rose-300">
                  ⚠️ ข้อมูลข้อความทั้งหมดในแชทนี้จะถูกลบออกจากฐานข้อมูลอย่างถาวร และไม่สามารถกู้คืนได้
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteModal(null)}
                className="rounded-xl border border-[#484751]/40 bg-[#191920] px-4 py-2 text-xs font-medium text-[#aca9b6] hover:bg-[#25252e] hover:text-white transition disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteChat}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-950/40 hover:bg-rose-500 transition disabled:opacity-50 cursor-pointer"
              >
                <Trash2 size={13} />
                {isDeleting ? 'กำลังลบข้อมูล…' : 'ตกลง (ลบถาวร)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-28 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-[#484751]/50 bg-[#191920] px-4 py-2 text-xs text-white shadow-2xl backdrop-blur-md">
          {toast}
        </div>
      )}
    </div>
  );
}
