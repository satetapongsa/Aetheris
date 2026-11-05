"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { IconArrowUp, IconStop } from "./icons";

export type ComposerHandle = { focus: () => void; setText: (t: string) => void };

type Props = {
  busy: boolean;
  disabled?: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  placeholder?: string;
};

const Composer = forwardRef<ComposerHandle, Props>(function Composer(
  { busy, disabled, onSend, onStop, placeholder = "ถาม Aetheris ได้ทุกเรื่อง..." },
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

  const canSend = text.trim().length > 0 && !busy && !disabled;

  const submit = () => {
    if (!canSend) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className="relative w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="relative flex items-end gap-2 rounded-[28px] border border-line-strong bg-panel/95 p-2 pl-5 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.8)] backdrop-blur transition focus-within:border-white/20"
      >
        <textarea
          ref={taRef}
          rows={1}
          value={text}
          autoFocus
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          className="max-h-[220px] min-h-[40px] flex-1 resize-none bg-transparent py-2 text-[15.5px] leading-6 text-fg outline-none placeholder:text-subtle disabled:opacity-50"
        />
        {busy ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="หยุด"
            title="หยุดการตอบ"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-black transition hover:bg-white/85"
          >
            <IconStop size={16} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSend}
            aria-label="ส่ง"
            title="ส่ง (Enter)"
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
