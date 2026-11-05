"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Conversation, ConversationWithMessages } from "@/lib/types";
import ChatMessage, { type UIMessage } from "./ChatMessage";
import Composer, { type ComposerHandle } from "./Composer";
import Sidebar, { type Health } from "./Sidebar";
import Welcome from "./Welcome";
import { IconAlert, IconArrowDown, IconCompose, IconMenu, IconSidebar } from "./icons";

const localId = () => `local-${Math.random().toString(36).slice(2)}`;
const pathFor = (id: string | null) => (id ? `/c/${id}` : "/");
const idFromPath = () => /^\/c\/([^/]+)/.exec(window.location.pathname)?.[1] ?? null;

type SendOpts = { regenerate?: boolean; editMessageId?: string };

export default function ChatApp({ initialId }: { initialId: string | null }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(initialId);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [convLoading, setConvLoading] = useState(Boolean(initialId));
  const [busy, setBusy] = useState(false);
  const [health, setHealth] = useState<Health>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Conversation | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [queue, setQueue] = useState<{ id: string; text: string }[]>([]);

  const activeRef = useRef(activeId);
  activeRef.current = activeId;
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const composerRef = useRef<ComposerHandle>(null);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 3200);
  }, []);

  // ── Data loading ─────────────────────────────────────────────────────────
  const refreshList = useCallback(async () => {
    try {
      const r = await fetch("/api/conversations", { cache: "no-store" });
      const j = await r.json();
      if (Array.isArray(j.conversations)) setConversations(j.conversations);
      if (!r.ok && j.error) notify(j.error);
    } catch {
      notify("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    } finally {
      setListLoading(false);
    }
  }, [notify]);

  const loadConversation = useCallback(
    async (id: string) => {
      setConvLoading(true);
      try {
        const r = await fetch(`/api/conversations/${id}`, { cache: "no-store" });
        if (activeRef.current !== id) return;
        if (!r.ok) {
          notify("ไม่พบบทสนทนานี้");
          setActiveId(null);
          setMessages([]);
          window.history.replaceState(null, "", "/");
          return;
        }
        const { conversation } = (await r.json()) as { conversation: ConversationWithMessages };
        if (activeRef.current !== id) return;
        setMessages(
          conversation.messages
            .filter((m) => m.role !== "system")
            .map((m) => ({ id: m.id, role: m.role as UIMessage["role"], content: m.content })),
        );
        stickRef.current = true;
      } catch {
        notify("โหลดบทสนทนาไม่สำเร็จ");
      } finally {
        if (activeRef.current === id) setConvLoading(false);
      }
    },
    [notify],
  );

  useEffect(() => {
    refreshList();
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => {});
    if (initialId) loadConversation(initialId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Browser back / forward
  useEffect(() => {
    const onPop = () => {
      abortRef.current?.abort();
      setQueue([]);
      const id = idFromPath();
      setActiveId(id);
      setMessages([]);
      if (id) loadConversation(id);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [loadConversation]);

  // ── Navigation ───────────────────────────────────────────────────────────
  const newChat = useCallback(() => {
    abortRef.current?.abort();
    setQueue([]);
    setActiveId(null);
    setMessages([]);
    setConvLoading(false);
    setMobileOpen(false);
    if (window.location.pathname !== "/") window.history.pushState(null, "", "/");
    requestAnimationFrame(() => composerRef.current?.focus());
  }, []);

  const selectConversation = useCallback(
    (id: string) => {
      setMobileOpen(false);
      if (id === activeRef.current) return;
      abortRef.current?.abort();
      setQueue([]);
      setActiveId(id);
      setMessages([]);
      window.history.pushState(null, "", pathFor(id));
      loadConversation(id);
    },
    [loadConversation],
  );

  // Keyboard shortcut: Ctrl/Cmd + Shift + O → new chat
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        newChat();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [newChat]);

  // ── Sending ──────────────────────────────────────────────────────────────
  const send = useCallback(
    async (text: string, opts: SendOpts = {}) => {
      if (busy) return;
      const controller = new AbortController();
      abortRef.current = controller;
      const startedIn = activeRef.current;
      const assistantId = localId();
      stickRef.current = true;

      setMessages((prev) => {
        let next = prev;
        if (opts.regenerate) {
          while (next.length && next[next.length - 1].role === "assistant") next = next.slice(0, -1);
        } else if (opts.editMessageId) {
          const idx = next.findIndex((m) => m.id === opts.editMessageId);
          next = [...next.slice(0, Math.max(idx, 0)), { id: localId(), role: "user", content: text }];
        } else {
          next = [...next, { id: localId(), role: "user", content: text }];
        }
        return [...next, { id: assistantId, role: "assistant", content: "", pending: true }];
      });
      setBusy(true);

      let convId = startedIn;
      const patchAssistant = (patch: Partial<UIMessage>) =>
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, ...patch } : m)));

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: startedIn ?? undefined,
            content: text,
            regenerate: opts.regenerate,
            editMessageId: opts.editMessageId,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
          signal: controller.signal,
        });

        const headerId = res.headers.get("X-Conversation-Id");
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          convId = j.conversationId ?? convId;
          if (!startedIn && convId && activeRef.current === null) {
            setActiveId(convId);
            window.history.replaceState(null, "", pathFor(convId));
          }
          patchAssistant({ pending: false, error: true, content: j.error ?? "เกิดข้อผิดพลาด กรุณาลองใหม่" });
          return;
        }

        if (!startedIn && headerId) {
          convId = headerId;
          if (activeRef.current === null) {
            setActiveId(headerId);
            window.history.replaceState(null, "", pathFor(headerId));
          }
          const nowIso = new Date().toISOString();
          setConversations((prev) => [
            { id: headerId, title: text.slice(0, 60), createdAt: nowIso, updatedAt: nowIso },
            ...prev,
          ]);
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        let buf = "";
        let streamError = "";
        const tools: string[] = [];
        const handle = (line: string) => {
          if (!line.trim()) return;
          try {
            const ev = JSON.parse(line) as { t: string; v: string };
            if (ev.t === "text") acc += ev.v;
            else if (ev.t === "tool") tools.push(ev.v);
            else if (ev.t === "error") streamError = ev.v;
          } catch {}
        };
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          lines.forEach(handle);
          if (activeRef.current === convId) patchAssistant({ content: acc, tools: [...tools] });
        }
        handle(buf);
        if (activeRef.current === convId) {
          patchAssistant({
            pending: false,
            content: acc,
            tools: [...tools],
            ...(acc.trim()
              ? {}
              : { error: true, content: streamError || "ไม่ได้รับคำตอบจาก AI กรุณาลองใหม่" }),
          });
        }
      } catch (err) {
        if (controller.signal.aborted) {
          setMessages((prev) =>
            prev
              .map((m) => (m.id === assistantId ? { ...m, pending: false } : m))
              .filter((m) => !(m.id === assistantId && !m.content)),
          );
        } else {
          console.error(err);
          patchAssistant({ pending: false, error: true, content: "การเชื่อมต่อขัดข้อง กรุณาลองใหม่" });
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setBusy(false);
        // Sync real message ids & the generated title from the server.
        const aborted = controller.signal.aborted;
        window.setTimeout(
          () => {
            refreshList();
            if (convId && activeRef.current === convId && !abortRef.current) {
              fetch(`/api/conversations/${convId}`, { cache: "no-store" })
                .then((r) => (r.ok ? r.json() : null))
                .then((j: { conversation: ConversationWithMessages } | null) => {
                  if (!j || activeRef.current !== convId || abortRef.current) return;
                  setMessages((prev) => {
                    if (prev.some((m) => m.error || m.pending)) return prev; // keep visible error / new turn
                    const server = j.conversation.messages.filter((m) => m.role !== "system");
                    if (server.length !== prev.length) return prev;
                    return server.map((m, i) => ({
                      id: m.id,
                      role: m.role as UIMessage["role"],
                      content: m.content,
                      tools: prev[i]?.tools,
                    }));
                  });
                })
                .catch(() => {});
            }
          },
          aborted ? 700 : 50,
        );
      }
    },
    [busy, refreshList],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  // ── Message queue: typing while the AI answers queues the message ─────────
  const submit = useCallback(
    (text: string) => {
      if (busy) setQueue((q) => [...q, { id: localId(), text }]);
      else send(text);
    },
    [busy, send],
  );

  useEffect(() => {
    if (busy || queue.length === 0) return;
    const [next, ...rest] = queue;
    setQueue(rest);
    send(next.text);
  }, [busy, queue, send]);

  const unqueue = useCallback((id: string) => setQueue((q) => q.filter((x) => x.id !== id)), []);
  const editQueued = useCallback((id: string) => {
    setQueue((q) => {
      const item = q.find((x) => x.id === id);
      if (item) composerRef.current?.setText(item.text);
      return q.filter((x) => x.id !== id);
    });
  }, []);
  const regenerate = useCallback(() => send("", { regenerate: true }), [send]);
  const editMessage = useCallback((id: string, text: string) => send(text, { editMessageId: id }), [send]);

  // ── Conversation management ─────────────────────────────────────────────
  const rename = useCallback(
    async (id: string, title: string) => {
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
      const r = await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      }).catch(() => null);
      if (!r?.ok) {
        notify("เปลี่ยนชื่อไม่สำเร็จ");
        refreshList();
      }
    },
    [notify, refreshList],
  );

  const doDelete = useCallback(
    async (c: Conversation) => {
      setConfirmDelete(null);
      setConversations((prev) => prev.filter((x) => x.id !== c.id));
      if (activeRef.current === c.id) newChat();
      const r = await fetch(`/api/conversations/${c.id}`, { method: "DELETE" }).catch(() => null);
      if (r?.ok) notify("ลบแชทแล้ว");
      else {
        notify("ลบไม่สำเร็จ");
        refreshList();
      }
    },
    [newChat, notify, refreshList],
  );

  // ── Scrolling ────────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    stickRef.current = bottom;
    setAtBottom(bottom);
  };

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickRef.current = true;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  const activeTitle = conversations.find((c) => c.id === activeId)?.title;
  const empty = messages.length === 0 && !convLoading;
  const lastAssistantIdx = messages.findLastIndex((m) => m.role === "assistant");

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar
        open={sidebarOpen}
        mobileOpen={mobileOpen}
        conversations={conversations}
        loading={listLoading}
        activeId={activeId}
        health={health}
        onClose={() => setMobileOpen(false)}
        onCollapse={() => setSidebarOpen(false)}
        onNew={newChat}
        onSelect={selectConversation}
        onRename={rename}
        onDelete={setConfirmDelete}
      />

      <main className="relative flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="z-10 flex h-14 shrink-0 items-center gap-1 px-2 md:px-3">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="เปิดเมนู"
            className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-white/[0.06] hover:text-fg md:hidden"
          >
            <IconMenu />
          </button>
          {!sidebarOpen && (
            <div className="hidden items-center gap-1 md:flex">
              <button
                onClick={() => setSidebarOpen(true)}
                aria-label="เปิดแถบด้านข้าง"
                className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-white/[0.06] hover:text-fg"
              >
                <IconSidebar />
              </button>
              <button
                onClick={newChat}
                aria-label="แชทใหม่"
                className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-white/[0.06] hover:text-fg"
              >
                <IconCompose size={17} />
              </button>
            </div>
          )}
          <div className="flex min-w-0 flex-1 items-center gap-2 px-2">
            <span className="text-[17px] font-semibold tracking-tight">Aetheris</span>
            {activeTitle && (
              <span className="hidden min-w-0 truncate text-sm text-subtle sm:inline">· {activeTitle}</span>
            )}
          </div>
          <button
            onClick={newChat}
            aria-label="แชทใหม่"
            className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-white/[0.06] hover:text-fg md:hidden"
          >
            <IconCompose size={17} />
          </button>
        </header>

        {health?.ai === "missing_key" && (
          <div className="mx-auto mb-1 flex w-full max-w-3xl items-center gap-2 px-4">
            <div className="flex w-full items-center gap-2.5 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-2.5 text-sm text-amber-200">
              <IconAlert size={16} />
              <span>
                ยังไม่ได้ตั้งค่า <code className="font-mono text-xs">DEEPSEEK_API_KEY</code> — เพิ่มในไฟล์{" "}
                <code className="font-mono text-xs">.env.local</code> แล้วรีสตาร์ทเซิร์ฟเวอร์
              </span>
            </div>
          </div>
        )}

        {empty ? (
          <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 pb-[8vh]">
            <div className="w-full max-w-3xl">
              <Welcome onPick={(t) => submit(t)} />
              <div className="mt-8">
                <Composer
                  ref={composerRef}
                  busy={busy}
                  queue={queue}
                  onSend={submit}
                  onStop={stop}
                  onUnqueue={unqueue}
                  onEditQueued={editQueued}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-3xl space-y-8 px-4 pt-4 pb-10 md:px-6">
                {convLoading && messages.length === 0 ? (
                  <div className="space-y-6 pt-6">
                    {[70, 95, 55].map((w, i) => (
                      <div
                        key={i}
                        className={`h-12 animate-pulse rounded-2xl bg-white/[0.04] ${i % 2 === 0 ? "ml-auto" : ""}`}
                        style={{ width: `${w}%` }}
                      />
                    ))}
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <ChatMessage
                      key={m.id}
                      message={m}
                      isLast={i === lastAssistantIdx && i === messages.length - 1}
                      busy={busy}
                      onRegenerate={regenerate}
                      onEdit={editMessage}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="relative shrink-0 px-4 pb-3 md:px-6">
              <div className="pointer-events-none absolute inset-x-0 -top-10 h-10 bg-gradient-to-t from-base to-transparent" />
              {!atBottom && (
                <button
                  onClick={scrollToBottom}
                  aria-label="เลื่อนลงล่างสุด"
                  className="absolute -top-12 left-1/2 grid size-9 -translate-x-1/2 animate-pop place-items-center rounded-full border border-line-strong bg-elevated text-fg shadow-xl transition hover:bg-hover"
                >
                  <IconArrowDown size={16} />
                </button>
              )}
              <div className="mx-auto w-full max-w-3xl">
                <Composer
                  ref={composerRef}
                  busy={busy}
                  queue={queue}
                  onSend={submit}
                  onStop={stop}
                  onUnqueue={unqueue}
                  onEditQueued={editQueued}
                />
                <p className="mt-2 text-center text-[11.5px] text-subtle">
                  Aetheris อาจให้ข้อมูลที่ไม่ถูกต้องได้ โปรดตรวจสอบข้อมูลสำคัญอีกครั้ง
                </p>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm animate-pop rounded-2xl border border-line-strong bg-elevated p-6 shadow-2xl"
          >
            <h2 className="text-lg font-semibold">ลบแชทนี้?</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              แชท <span className="font-medium text-fg">“{confirmDelete.title}”</span> จะถูกลบถาวรและไม่สามารถกู้คืนได้
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-full border border-line-strong px-4 py-2 text-sm transition hover:bg-white/5"
              >
                ยกเลิก
              </button>
              <button
                autoFocus
                onClick={() => doDelete(confirmDelete)}
                className="rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 animate-pop rounded-full border border-line-strong bg-elevated px-4 py-2 text-sm shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}
