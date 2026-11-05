"use client";

import { IconChart, IconClock, IconCode, IconGlobe } from "./icons";

const SUGGESTIONS = [
  { icon: IconChart, title: "ราคาหุ้นเรียลไทม์", text: "ราคาหุ้น NVDA, AAPL, PTT.BK และ Bitcoin ตอนนี้เท่าไหร่ สรุปเป็นตาราง" },
  { icon: IconClock, title: "วันและเวลา", text: "ตอนนี้กี่โมงที่กรุงเทพ นิวยอร์ก และโตเกียว" },
  { icon: IconGlobe, title: "ข่าวล่าสุด", text: "สรุปข่าวเทคโนโลยีที่น่าสนใจวันนี้ พร้อมแหล่งอ้างอิง" },
  { icon: IconCode, title: "เขียนโค้ด", text: "เขียนฟังก์ชัน TypeScript ตรวจสอบรูปแบบอีเมล พร้อมอธิบายทีละขั้น" },
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
      <h1 className="text-[26px] font-semibold tracking-tight sm:text-[34px]">
        วันนี้ให้ <span className="text-gradient">Aetheris</span> ช่วยอะไรดี?
      </h1>

      <div className="mt-8 grid sm:mt-10 w-full grid-cols-1 gap-2.5 sm:grid-cols-2">
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
