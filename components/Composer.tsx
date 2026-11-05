"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { IconArrowUp, IconPencil, IconStop, IconX } from "./icons";

export type ComposerHandle = { focus: () => void; setText: (t: string) => void };
export type QueuedMessage = { id: string; text: string };

type Props = {
  busy: boolean;
  disabled?: boolean;
  queue?: QueuedMessage[];
  onSend: (text: string) => void;
  onStop: () => void;
  onUnqueue?: (id: string) => void;
  onEditQueued?: (id: string) => void;
  placeholder?: string;
};

const Composer = forwardRef<ComposerHandle, Props>(function Composer(
  { busy, disabled, queue = [], onSend, onStop, onUnqueue, onEditQueued, placeholder = "ถาม Aetheris ได้ทุกเรื่อง..." },
  ref,
) {
  const [text, setText] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => taRef.current?.focus(),
    setText: (t: string) => {
      setText(t);
      requestAnimationFrame(() => taRef.current?.focus());
    },
  }));

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    const fit = () => {
      el.style.height = "auto";
      if (el.value) el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
    };
    fit();
    let lastWidth = el.clientWidth;
    const ro = new ResizeObserver(() => {
      if (el.clientWidth !== lastWidth) {
        lastWidth = el.clientWidth;
        fit();
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [text]);

  const hasText = text.trim().length > 0;
  const canSend = hasText && !disabled;

  const submit = () => {
    if (!canSend) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className="relative w-full">
      {queue.length > 0 && (
        <div className="mb-2 space-y-1.5 rounded-2xl border border-line bg-panel/90 p-2 backdrop-blur">
          <div className="flex items-center gap-2 px-2 pt-0.5 text-[11.5px] font-medium tracking-wide text-subtle">
            <span className="size-1.5 animate-pulse rounded-full bg-accent" />
            รอคิว {queue.length} ข้อความ · จะส่งต่อให้อัตโนมัติเมื่อตอบเสร็จ
          </div>
          {queue.map((q, i) => (
            <div
              key={q.id}
              className="group flex animate-fade-in items-center gap-2 rounded-xl bg-white/[0.03] py-1.5 pr-1 pl-3 text-sm"
            >
              <span className="shrink-0 text-xs text-subtle tabular-nums">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-muted">{q.text}</span>
              {onEditQueued && (
                <button
                  onClick={() => onEditQueued(q.id)}
                  aria-label="แก้ไขข้อความในคิว"
                  title="แก้ไข"
                  className="grid size-7 shrink-0 place-items-center rounded-lg text-subtle transition hover:bg-white/[0.06] hover:text-fg"
                >
                  <IconPencil size={13} />
                </button>
              )}
              {onUnqueue && (
                <button
                  onClick={() => onUnqueue(q.id)}
                  aria-label="ลบออกจากคิว"
                  title="ลบออกจากคิว"
                  className="grid size-7 shrink-0 place-items-center rounded-lg text-subtle transition hover:bg-white/[0.06] hover:text-fg"
                >
                  <IconX size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="relative flex items-end gap-2 rounded-[28px] border border-line-strong bg-panel/95 p-2 pl-4 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.8)] backdrop-blur transition focus-within:border-white/20 sm:pl-5"
      >
        <textarea
          ref={taRef}
          rows={1}
          value={text}
          autoFocus
          disabled={disabled}
          placeholder={busy ? "พิมพ์ข้อความถัดไปได้เลย — จะเข้าคิวรอส่ง" : placeholder}
          enterKeyHint="send"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          className="max-h-[220px] min-h-[40px] min-w-0 flex-1 resize-none bg-transparent py-2 text-base leading-6 text-fg outline-none placeholder:text-subtle disabled:opacity-50 sm:text-[15.5px]"
        />
        {busy && (
          <button
            type="button"
            onClick={onStop}
            aria-label="หยุด"
            title="หยุดการตอบ"
            className={`grid size-10 shrink-0 place-items-center rounded-full transition ${
              hasText ? "border border-line-strong text-fg hover:bg-white/[0.06]" : "bg-white text-black hover:bg-white/85"
            }`}
          >
            <IconStop size={15} />
          </button>
        )}
        {(!busy || hasText) && (
          <button
            type="submit"
            disabled={!canSend}
            aria-label={busy ? "เพิ่มเข้าคิว" : "ส่ง"}
            title={busy ? "เพิ่มเข้าคิว (Enter)" : "ส่ง (Enter)"}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-black transition hover:bg-white/85 disabled:bg-white/10 disabled:text-white/30"
          >
            <IconArrowUp size={18} />
          </button>
        )}
      </form>
    </div>
  );
});

export default Composer;
