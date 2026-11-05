"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Conversation } from "@/lib/types";
import {
  IconCompose,
  IconDatabase,
  IconDots,
  IconPencil,
  IconSearch,
  IconSidebar,
  IconTrash,
  IconUser,
  IconX,
} from "./icons";

export type Health = { database: "connected" | "memory" | "error"; ai: "configured" | "missing_key" } | null;

type Props = {
  open: boolean;
  mobileOpen: boolean;
  conversations: Conversation[];
  loading: boolean;
  activeId: string | null;
  health: Health;
  onClose: () => void;
  onCollapse: () => void;
  onNew: () => void;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (c: Conversation) => void;
};

function groupLabel(dateIso: string) {
  const d = new Date(dateIso);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const diff = (start.getTime() - new Date(d).setHours(0, 0, 0, 0)) / 86_400_000;
  if (diff <= 0) return "วันนี้";
  if (diff === 1) return "เมื่อวาน";
  if (diff <= 7) return "7 วันที่ผ่านมา";
  if (diff <= 30) return "30 วันที่ผ่านมา";
  return d.toLocaleDateString("th-TH", { month: "long", year: "numeric" });
}

function Item({
  c,
  active,
  onSelect,
  onRename,
  onDelete,
}: {
  c: Conversation;
  active: boolean;
  onSelect: () => void;
  onRename: (t: string) => void;
  onDelete: () => void;
}) {
  const [menu, setMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(c.title);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);

  const commit = () => {
    setEditing(false);
    const t = title.trim();
    if (t && t !== c.title) onRename(t);
    else setTitle(c.title);
  };

  if (editing) {
    return (
      <div className="px-2">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setTitle(c.title);
              setEditing(false);
            }
          }}
          className="w-full rounded-lg border border-accent/50 bg-elevated px-2.5 py-2 text-sm outline-none"
        />
      </div>
    );
  }

  return (
    <div className="group relative px-2" ref={menuRef}>
      <button
        onClick={onSelect}
        className={`flex w-full items-center rounded-lg px-2.5 py-2 pr-8 text-left text-sm transition ${
          active ? "bg-hover text-fg" : "text-muted hover:bg-white/[0.04] hover:text-fg"
        }`}
      >
        <span className="truncate">{c.title}</span>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setMenu((m) => !m);
        }}
        aria-label="ตัวเลือก"
        className={`absolute top-1/2 right-3.5 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted transition hover:text-fg ${
          menu || active ? "opacity-100" : "opacity-0 group-hover:opacity-100 max-md:opacity-100"
        }`}
      >
        <IconDots size={16} />
      </button>
      {menu && (
        <div className="absolute top-full right-2 z-30 mt-1 w-40 animate-pop rounded-xl border border-line-strong bg-elevated p-1 shadow-2xl">
          <button
            onClick={() => {
              setMenu(false);
              setTitle(c.title);
              setEditing(true);
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-fg transition hover:bg-white/[0.06]"
          >
            <IconPencil size={15} /> เปลี่ยนชื่อ
          </button>
          <button
            onClick={() => {
              setMenu(false);
              onDelete();
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
          >
            <IconTrash size={15} /> ลบ
          </button>
        </div>
      )}
    </div>
  );
}

export default function Sidebar(props: Props) {
  const { open, mobileOpen, conversations, loading, activeId, health } = props;
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? conversations.filter((c) => c.title.toLowerCase().includes(q)) : conversations;
    const map = new Map<string, Conversation[]>();
    for (const c of list) {
      const k = groupLabel(c.updatedAt);
      map.set(k, [...(map.get(k) ?? []), c]);
    }
    return [...map.entries()];
  }, [conversations, query]);

  const dbLabel =
    health?.database === "connected" ? "Neon Database" : health?.database === "error" ? "ฐานข้อมูลผิดพลาด" : "หน่วยความจำชั่วคราว";
  const dbColor =
    health?.database === "connected" ? "bg-emerald-400" : health?.database === "error" ? "bg-red-400" : "bg-amber-400";

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={props.onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity md:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-line bg-panel transition-transform duration-300 ease-out md:static md:z-auto md:translate-x-0 md:transition-[margin] ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${open ? "md:ml-0" : "md:-ml-[280px]"}`}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between px-3">
          <button onClick={props.onNew} className="flex items-center gap-2.5 rounded-lg px-1.5 py-1 transition hover:opacity-90">
            <img src="/aetheris-logo.png" alt="Aetheris" className="size-7 rounded-lg" />
            <span className="text-[17px] font-semibold tracking-tight">Aetheris</span>
          </button>
          <button
            onClick={() => (mobileOpen ? props.onClose() : props.onCollapse())}
            aria-label="ปิดแถบด้านข้าง"
            className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-white/[0.06] hover:text-fg"
          >
            <span className="md:hidden">
              <IconX />
            </span>
            <span className="max-md:hidden">
              <IconSidebar />
            </span>
          </button>
        </div>

        {/* Actions */}
        <div className="space-y-1 px-2 pb-2">
          <button
            onClick={props.onNew}
            className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-fg transition hover:bg-white/[0.05]"
          >
            <IconCompose size={17} />
            <span className="flex-1 text-left">แชทใหม่</span>
            <kbd className="hidden font-sans text-[11px] text-subtle md:inline">Ctrl ⇧ O</kbd>
          </button>
          <label className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-muted transition focus-within:bg-white/[0.05] hover:bg-white/[0.05]">
            <IconSearch size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาแชท"
              className="w-full bg-transparent text-fg outline-none placeholder:text-muted"
            />
          </label>
        </div>

        {/* History */}
        <nav className="flex-1 overflow-y-auto pb-4">
          {loading && conversations.length === 0 ? (
            <div className="space-y-2 px-4 pt-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-7 animate-pulse rounded-lg bg-white/[0.04]" style={{ width: `${90 - i * 8}%` }} />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <p className="px-5 pt-6 text-center text-sm text-subtle">
              {query ? "ไม่พบแชทที่ค้นหา" : "ยังไม่มีประวัติการแชท"}
            </p>
          ) : (
            groups.map(([label, items]) => (
              <div key={label} className="pt-4">
                <h3 className="px-5 pb-1.5 text-xs font-medium text-subtle">{label}</h3>
                <div className="space-y-px">
                  {items.map((c) => (
                    <Item
                      key={c.id}
                      c={c}
                      active={c.id === activeId}
                      onSelect={() => props.onSelect(c.id)}
                      onRename={(t) => props.onRename(c.id, t)}
                      onDelete={() => props.onDelete(c)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-line p-2">
          <div className="flex items-center gap-3 rounded-lg px-2.5 py-2">
            <div className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-white">
              <IconUser size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">ผู้ใช้ทั่วไป</p>
              <p className="flex items-center gap-1.5 truncate text-xs text-subtle" title="สถานะการจัดเก็บข้อมูล">
                <span className={`size-1.5 rounded-full ${health ? dbColor : "bg-zinc-600"}`} />
                <IconDatabase size={11} />
                {health ? dbLabel : "กำลังตรวจสอบ..."}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
