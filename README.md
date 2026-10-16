# Aetheris AI — Flagship Intelligence Workspace Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?style=flat&logo=react)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-6.5.0-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Neon Database](https://img.shields.io/badge/Neon-Serverless_Postgres-00E599?style=flat&logo=postgresql)](https://neon.tech/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Design System](https://img.shields.io/badge/Design_System-Luminescent_Slate-c2c3ee?style=flat)](https://github.com/satetapongsa/Zyntra)

> **Aetheris AI** (v2.5 Pro Neural) เป็นแพลตฟอร์ม AI Workspace ยุคใหม่ระดับองค์กร ออกแบบโฉมใหม่ทั้งหมดโดยอิงตามแนวทางดีไซน์ **Luminescent Slate** เน้นความหรูหรา โมเดิร์น ประสิทธิภาพสูง พร้อมระบบคิดแบบ Deep Reasoning, การวิเคราะห์เอกสารแนบ, คลังเทมเพลตมาตรฐาน และการประมวลผลคำสั่งแบบเรียลไทม์

---

## 🎨 การปรับโฉมครั้งใหญ่ (Major Redesign to Aetheris AI)

ระบบได้รับการล้างภาพลักษณ์เดิมทั้งหมดและแปลงโฉมเป็น **Aetheris AI**:
1. **อัตลักษณ์และตราสัญลักษณ์ (Brand & Logo Glyph):**
   - ออกแบบ Vector SVG Geometric Intelligence Node Logo ประจำ Aetheris AI (`public/aetheris-logo.svg`)
   - ปรับชื่อระบบ หัวเรื่อง และ Metadata เป็น **Aetheris AI - Flagship Intelligence**
   - เปลี่ยนชื่อ Engine หลักและการระบุตัวตน AI เป็น `Aetheris AI v2.5 Pro Neural`
2. **ระบบสีและธีม (Luminescent Slate Color Palette):**
   - ใช้โทน Void Dark Slates: พื้นหลังหลัก `#0e0e12`, พื้นผิวยกระดับ `#131319`, `#191920`, `#1f1f27`, `#25252e`
   - แสงสะท้อนและเส้นขอบกระจก Hairline Glass Borders (`rgba(255, 255, 255, 0.08)`)
   - สีคู่ไฮไลต์โทนม่วงสลレートและโพลาร์บลู `#c2c3ee` และ `#4d4f74`
   - เอฟเฟกต์แสงบรรยากาศ Radial Ambient Glow และการไล่ระดับแสงที่นุ่มนวล
3. **ระบบฟอนต์ระดับพรีเมียม (Typography System):**
   - **Plus Jakarta Sans:** ใช้สำหรับหัวข้อหลัก, Display Title และชื่อแบรนด์
   - **Inter & Noto Sans Thai:** ใช้งานสำหรับเนื้อหาบทสนทนาและคำอธิบายภาษาไทย/อังกฤษ เพื่อการอ่านที่สบายตา
   - **JetBrains Mono:** แสดงผลบล็อกโค้ด, Badge, ตัวนับโทเคน และค่าทางเทคนิค
4. **ส่วนประกอบหน้าจอ (Redesigned Components):**
   - **Workspace Sidebar:** โลโก้ใหม่พร้อมแถบสถานะ v2.5, ปุ่ม New Chat (`⌘N`), กล่องค้นหา (`⌘K`), แท่งหลอดโควตาสีขาวเรืองแสง และการ์ดข้อมูลผู้ใช้สไตล์โปร่งแสง
   - **Top Navigation Bar:** บริดจ์สถานะ Aetheris 2.5 Pro Neural, ตัวชี้วัดสถานะเครือข่าย (Thinking Mode, 128k Context, Latency Telemetry), ปุ่มคลังเทมเพลต และส่งออกบทสนทนา
   - **Message Feed & Reasoning:** แถบ Accordion สำหรับดูกระบวนการคิด (Deep Reasoning Process) พร้อมการไฮไลต์โค้ดสไตล์ VS Code Dark Modern
   - **Floating Command Prompt Deck:** แท่นสั่งการลอยตัวแบบ Glassmorphism ด้านล่าง พร้อมปุ่มแนบไฟล์, Deep Reasoning mode, ตัวนับโทเคน และปุ่มส่งไล่เฉดสี
   - **Authentication Portal (/login, /register):** กล่องกระจก Blur Card พร้อมไฟ Ambient Orbs และความปลอดภัยระดับ SOC-2
   - **Admin Management Console (/admin):** แดชบอร์ดตรวจสอบประสิทธิภาพ ระบบจัดการบัญชีผู้ใช้ และสถิติโควตาโทเคน

---

## ⚡ การติดตั้งและเริ่มใช้งาน (Quick Start)

### 1. ความต้องการของระบบ
- Node.js 20+
- PostgreSQL (หรือ Serverless [Neon Database](https://neon.tech/))
- npm / pnpm / yarn

### 2. ติดตั้งแพ็กเกจ
```bash
# ติดตั้ง dependencies
npm install

# กำหนดค่า environment variables
cp .env.example .env

# ซิงก์ Schema เข้ากับฐานข้อมูล
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

### 3. รันเซิร์ฟเวอร์สำหรับพัฒนา
```bash
npm run dev
```
เปิดบราวเซอร์ที่ [http://localhost:3000](http://localhost:3000)

---

## 🚀 ฟีเจอร์หลัก (Key Features)

- **🧠 Collapsible Thinking Process:** แยกแท็ก `<think>...</think>` สำหรับโมเดล Reasoning โดยอัตโนมัติ พร้อมสวิตช์เปิด/ปิดขั้นตอนการคิด
- **📎 Ingest & Analyze Attachments:** รองรับการแนบไฟล์โค้ดและเอกสาร (`.pdf`, `.txt`, `.md`, `.json`, `.csv`, `.js`, `.ts`, `.tsx`, `.py`, `.sql`) สูงสุด 5MB
- **📚 Enterprise Prompt Library:** คลังพร้อมต์แม่แบบสำหรับงานระดับองค์กร เช่น การสรุปรายงานผู้บริหาร, Code Review, การตอบอีเมลทางการ
- **📥 Session Markdown Export:** บันทึกและดาวน์โหลดประวัติการสนทนาทั้งหมดเป็นไฟล์ `.md` ได้ในคลิกเดียว
- **⚡ Adaptive Streaming Engine:** ถ่ายทอดข้อความผ่าน Server-Sent Events (SSE) แบบเรียลไทม์ ปลอดภัยและลื่นไหล
- **🛡️ Enterprise Security & SOC-2 Compliance:** ระบบจำกัดสิทธิ์ (RBAC), ถอดรหัส JWT ปลอดภัย และการป้องกันความลับระดับ Server-side

---

## ⚙️ ตัวแปรสภาพแวดล้อม (Environment Variables)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | Neon / PostgreSQL connection string | `postgresql://user:pass@host/neondb?sslmode=require` |
| `JWT_SECRET` | Secret key สำหรับ Sign JWT ($\ge 32$ chars) | `your-secret-key-at-least-32-characters` |
| `AI_PROVIDER` | ผู้ให้บริการ AI (`deepseek`, `openai`, `gemini`, `claude`) | `deepseek` |
| `DEEPSEEK_API_KEY` | DeepSeek API Key | `sk-...` |
| `OPENAI_API_KEY` | OpenAI API Key | `sk-...` |
| `GEMINI_API_KEY` | Google Gemini API Key | `AIza...` |
| `CLAUDE_API_KEY` | Anthropic Claude API Key | `sk-ant-...` |
| `AI_MODEL` | รหัสโมเดลที่ต้องการเจาะจง | `deepseek-chat` |

---

## 📄 License
Distributed under the [MIT License](LICENSE). Built for enterprise teams requiring autonomous, elegant control over generative AI workspaces.
