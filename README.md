# Aetheris

แชทบอท AI ธีมดำ สไตล์ ChatGPT — สร้างด้วย **Next.js 16**, **Tailwind CSS 4**, **Neon Postgres** และ **DeepSeek Chat API**

## ฟีเจอร์

- ตอบแบบ streaming แบบเรียลไทม์ พร้อมปุ่มหยุด
- Markdown, ตาราง, โค้ดไฮไลต์ พร้อมปุ่มคัดลอก
- ประวัติแชท (จัดกลุ่ม วันนี้ / เมื่อวาน / 7 วัน …), ค้นหา, เปลี่ยนชื่อ, ลบ
- ตั้งชื่อแชทอัตโนมัติด้วย AI
- แก้ไขข้อความที่ส่งไปแล้ว, สร้างคำตอบใหม่, คัดลอกข้อความ
- URL ต่อแชท (`/c/<id>`), ปุ่มลัด `Ctrl + Shift + O` เปิดแชทใหม่
- รองรับมือถือ (แถบด้านข้างแบบ drawer)
- ยังไม่มีระบบเข้าสู่ระบบ — มีคอลัมน์ `user_id` เตรียมไว้แล้ว

## เริ่มใช้งาน

```bash
npm install
cp .env.example .env.local   # แล้วใส่ค่า DATABASE_URL และ DEEPSEEK_API_KEY
npm run dev                  # http://localhost:3000
```

| ตัวแปร | คำอธิบาย |
|---|---|
| `DATABASE_URL` | Connection string จาก [Neon](https://console.neon.tech) — ถ้าเว้นว่าง จะเก็บข้อมูลไว้ในหน่วยความจำชั่วคราว |
| `DEEPSEEK_API_KEY` | API key จาก [DeepSeek](https://platform.deepseek.com) |
| `DEEPSEEK_MODEL` | (ไม่บังคับ) ค่าเริ่มต้น `deepseek-chat` |

ตารางในฐานข้อมูลจะถูกสร้างอัตโนมัติเมื่อมีการใช้งานครั้งแรก หรือรันเองได้ด้วย `npm run db:init` (schema อยู่ที่ [`db/schema.sql`](db/schema.sql))

ตรวจสถานะระบบได้ที่ `GET /api/health`

## โครงสร้าง

```
app/
  api/chat/               POST  – ส่งข้อความ (stream คำตอบ)
  api/conversations/      GET / DELETE
  api/conversations/[id]/ GET / PATCH / DELETE
  api/health/             GET   – สถานะ DB + AI
  c/[id]/                 หน้าแชท
components/               UI (ChatApp, Sidebar, Composer, ChatMessage, Markdown)
lib/                      db (Neon), store, deepseek
db/schema.sql
```

## Deploy (Vercel)

Import repo เข้า Vercel แล้วตั้ง Environment Variables `DATABASE_URL` และ `DEEPSEEK_API_KEY` — ไม่ต้องตั้งค่าอื่นเพิ่ม
