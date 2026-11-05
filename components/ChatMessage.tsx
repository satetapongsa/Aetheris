"use client";

import { memo, useEffect, useRef, useState } from "react";
import Markdown from "./Markdown";
import {
  IconChart,
  IconCheck,
  IconClock,
  IconCloud,
  IconCopy,
  IconGlobe,
  IconPencil,
  IconRefresh,
  IconSearch,
} from "./icons";

export interface UIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
  error?: boolean;
  /** Labels of live-data tools the AI used for this answer. */
  tools?: string[];
}

function toolIcon(label: string) {
  if (label.startsWith("ดึงราคา") || label.startsWith("ค้นหาสัญลักษณ์")) return IconChart;
  if (label.startsWith("ตรวจสอบวัน")) return IconClock;
  if (label.startsWith("ดูสภาพอากาศ")) return IconCloud;
  if (label.startsWith("ค้นเว็บ")) return IconSearch;
  return IconGlobe;
}

function ToolSteps({ tools, running }: { tools: string[]; running: boolean }) {
  return (
    <div className="mb-3 flex flex-wrap gap-1.5">
      {tools.map((label, i) => {
        const Icon = toolIcon(label);
        const active = running && i >= tools.length - 1;
        return (
          <span
            key={i}
            className={`inline-flex max-w-full animate-fade-in items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
              active ? "border-accent/30 bg-accent/10 text-fg" : "border-line bg-white/[0.03] text-subtle"
            }`}
          >
            <Icon size={13} className={active ? "animate-pulse text-accent" : ""} />
            <span className="truncate">{label}</span>
            {!active && <IconCheck size={12} className="text-emerald-400/80" />}
          </span>
        );
      })}
    </div>
  );
}

type Props = {
  message: UIMessage;
  isLast: boolean;
  busy: boolean;
  onRegenerate?: () => void;
  onEdit?: (id: string, text: string) => void;
};

function ActionButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="grid size-8 place-items-center rounded-lg text-subtle transition hover:bg-white/[0.06] hover:text-fg"
    >
      {children}
    </button>
  );
}

function useCopy() {
  const [copied, setCopied] = useState(false);
  return {
    copied,
    copy: async (text: string) => {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    },
  };
}

function ChatMessage({ message, isLast, busy, onRegenerate, onEdit }: Props) {
  const { copied, copy } = useCopy();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const editRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing || !editRef.current) return;
    const el = editRef.current;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [editing]);

  useEffect(() => {
    const el = editRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 360)}px`;
  }, [draft, editing]);

  if (message.role === "user") {
    const canEdit = Boolean(onEdit) && !busy && !message.id.startsWith("local-");
    return (
      <div className="group flex animate-fade-in flex-col items-end">
        {editing ? (
          <div className="w-full max-w-[85%] rounded-3xl border border-line-strong bg-elevated p-3">
            <textarea
              ref={editRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setEditing(false);
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  if (draft.trim()) {
                    setEditing(false);
                    onEdit?.(message.id, draft.trim());
                  }
                }
              }}
              className="w-full resize-none bg-transparent px-2 py-1 text-[15.5px] leading-relaxed outline-none"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditing(false);
                  setDraft(message.content);
                }}
                className="rounded-full px-4 py-1.5 text-sm text-muted transition hover:bg-white/5 hover:text-fg"
              >
                ยกเลิก
              </button>
              <button
                disabled={!draft.trim()}
                onClick={() => {
                  setEditing(false);
                  onEdit?.(message.id, draft.trim());
                }}
                className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-40"
              >
                ส่ง
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="max-w-[88%] whitespace-pre-wrap sm:max-w-[80%] break-words rounded-3xl rounded-br-lg bg-elevated px-5 py-2.5 text-[15.5px] leading-relaxed text-fg">
              {message.content}
            </div>
            <div className="mt-1 flex gap-0.5 opacity-0 transition group-hover:opacity-100 max-md:opacity-100">
              <ActionButton label="คัดลอก" onClick={() => copy(message.content)}>
                {copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
              </ActionButton>
              {canEdit && (
                <ActionButton
                  label="แก้ไข"
                  onClick={() => {
                    setDraft(message.content);
                    setEditing(true);
                  }}
                >
                  <IconPencil size={15} />
                </ActionButton>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // Assistant
  const thinking = message.pending && !message.content;
  return (
    <div className="group flex animate-fade-in gap-4">
      <div className="mt-0.5 hidden size-8 shrink-0 overflow-hidden rounded-full ring-1 ring-line sm:block">
        <img src="/aetheris-logo.png" alt="" className="size-full scale-110 object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        {message.tools && message.tools.length > 0 && (
          <ToolSteps tools={message.tools} running={Boolean(thinking)} />
        )}
        {thinking ? (
          <div className="typing flex h-7 items-center gap-1.5 text-muted">
            <span /> <span /> <span />
          </div>
        ) : message.error ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/[0.07] px-4 py-3 text-sm text-red-200">
            {message.content}
          </div>
        ) : (
          <Markdown content={message.content + (message.pending ? " ▍" : "")} />
        )}

        {!message.pending && !message.error && (
          <div
            className={`mt-2 -ml-1.5 flex gap-0.5 transition ${isLast ? "opacity-100" : "opacity-0 group-hover:opacity-100 max-md:opacity-100"}`}
          >
            <ActionButton label="คัดลอก" onClick={() => copy(message.content)}>
              {copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
            </ActionButton>
            {isLast && onRegenerate && !busy && (
              <ActionButton label="สร้างคำตอบใหม่" onClick={onRegenerate}>
                <IconRefresh size={15} />
              </ActionButton>
            )}
          </div>
        )}
        {message.error && isLast && onRegenerate && !busy && (
          <button
            onClick={onRegenerate}
            className="mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-muted transition hover:bg-white/5 hover:text-fg"
          >
            <IconRefresh size={14} /> ลองอีกครั้ง
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(ChatMessage);
