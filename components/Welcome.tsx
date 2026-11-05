"use client";

import { IconBulb, IconCode, IconGlobe, IconPen } from "./icons";

const SUGGESTIONS = [
  { icon: IconPen, title: "ช่วยเขียน", text: "ช่วยเขียนอีเมลขอบคุณลูกค้าแบบสุภาพและเป็นมืออาชีพ" },
  { icon: IconCode, title: "เขียนโค้ด", text: "เขียนฟังก์ชัน JavaScript สำหรับตรวจสอบรูปแบบอีเมล พร้อมอธิบาย" },
  { icon: IconBulb, title: "ระดมไอเดีย", text: "เสนอไอเดียธุรกิจออนไลน์ที่เริ่มต้นได้ด้วยงบไม่เกิน 10,000 บาท" },
  { icon: IconGlobe, title: "อธิบายให้เข้าใจ", text: "อธิบายว่า AI ทำงานอย่างไรแบบที่เด็กมัธยมเข้าใจได้" },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "อรุณสวัสดิ์";
  if (h < 17) return "สวัสดีตอนบ่าย";
  return "สวัสดีตอนเย็น";
}

export default function Welcome({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex animate-fade-in flex-col items-center text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 -z-10 scale-150 rounded-full bg-accent/20 blur-3xl" />
        <img src="/aetheris-logo.png" alt="Aetheris" className="logo-glow size-16 rounded-2xl" />
      </div>
      <p className="mb-1 text-sm font-medium text-muted" suppressHydrationWarning>
        {greeting()}
      </p>
      <h1 className="text-[28px] font-semibold tracking-tight sm:text-[34px]">
        วันนี้ให้ <span className="text-gradient">Aetheris</span> ช่วยอะไรดี?
      </h1>

      <div className="mt-10 grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2">
        {SUGGESTIONS.map(({ icon: Icon, title, text }) => (
          <button
            key={title}
            onClick={() => onPick(text)}
            className="group flex items-start gap-3 rounded-2xl border border-line bg-white/[0.015] p-4 text-left transition hover:border-line-strong hover:bg-white/[0.04]"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-muted transition group-hover:text-accent">
              <Icon size={16} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-fg">{title}</span>
              <span className="mt-0.5 line-clamp-2 block text-[13px] leading-snug text-subtle">{text}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
