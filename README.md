# Aetheris — Next-Gen Autonomous AI Platform ⚡

<p align="center">
  <img src="./public/aetheris-logo.png" alt="Aetheris Logo" width="100" style="border-radius: 20px; box-shadow: 0 0 25px rgba(0, 242, 170, 0.4);" />
</p>

<p align="center">
  <strong>แพลตฟอร์ม AI ผู้ช่วยอัจฉริยะระดับสูง ออกแบบสถาปัตยกรรมระดับพรีเมียม ตอบคำถามและโค้ดดิ่งแม่นยำ พร้อมระบบฐานข้อมูล Neon Serverless PostgreSQL แยกประวัติแชทรายบุคคล</strong>
</p>

---

## 🌟 ฟีเจอร์หลัก (Key Features)

- **🎨 Premium Dark Tech UI/UX**: ดีไซน์หน้าต่างแชทสไตล์ Cybernetic Obsidian และ Neon Emerald สบายตา เรียบหรู ไม่รกตา ใช้งานง่ายระดับมืออาชีพ
- **📱 100% Fully Responsive**: ใช้งานลื่นไหลบนทุกขนาดหน้าจอ ทั้ง Desktop, Tablet และ Mobile (Sidebar พับเก็บได้อัตโนมัติ)
- **⚡ Smart Non-Intrusive Auto-Scroll**: 
  - จอจะเลื่อนลงล่างอัตโนมัติขณะที่ AI กำลังพิมพ์
  - ปลดล็อกให้ผู้ใช้เลื่อนขึ้นไปอ่านข้อความเก่าได้อิสระโดยไม่โดนดึงจอกลับ
  - มีปุ่ม **"ล่าสุด" (Fast Scroll-to-Bottom)** ให้กดพุ่งลงมายังข้อความล่าสุดได้ทันที
- **💻 Advanced Code Block & Syntax Highlighting**:
  - รองรับการแสดงผลบล็อกโค้ดหลากหลายภาษา (TypeScript, JavaScript, Python, HTML, CSS, SQL ฯลฯ)
  - มีหมายเลขบรรทัด (Line Numbers)
  - ปุ่มคลิกเดียวคัดลอกโค้ด (**Copy Code**) พร้อมแจ้งเตือน
- **🚫 Zero Input Dock Overlap**: เพิ่มพื้นที่ว่างด้านล่าง (Bottom clearance) ถึง 200px ป้องกันช่องพิมพ์คำถามบังข้อความหรือโค้ด 100%
- **🧠 Live DeepSeek API Integration**: ขับเคลื่อนด้วยโมเดล DeepSeek อย่างเป็นทางการ ตอบกระชับ ตรงประเด็น ประหยัดโทเคน (ไม่เกิน 300 คำ)
- **🔒 Direct Neon PostgreSQL Database**:
  - ระบบสมัครสมาชิก (Register) และเข้าสู่ระบบ (Login) ตรวจสอบกับฐานข้อมูลโดยตรง ปลอดภัยด้วยการเข้ารหัส `bcrypt`
  - บันทึกเซสชันการสนทนาและประวัติแชทแยกอิสระเป็นของผู้ใช้แต่ละคน (User-Isolated History)

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Vanilla CSS (Tailored Design System, Custom Glassmorphism, Micro-animations)
- **Backend API**: Node.js, Express, tsx
- **Database**: Neon Serverless PostgreSQL (`@neondatabase/serverless`)
- **AI Engine**: DeepSeek API (`deepseek-chat` / `deepseek-reasoner`)
- **Security**: JWT (JSON Web Tokens), bcryptjs

---

## 🚀 การติดตั้งและเริ่มใช้งาน (Getting Started)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. ตั้งค่าตัวแปรสภาพแวดล้อม (`.env`)
สร้างไฟล์ `.env` ที่โฟลเดอร์ root ของโปรเจกต์:
```env
PORT=3001
DATABASE_URL=postgresql://neondb_owner:...@ep-...neon.tech/neondb?sslmode=require
DEEPSEEK_API_KEY=sk-...
JWT_SECRET=aetheris_super_secret_jwt_key_2026_neural_mesh
```

### 3. รันระบบ Local Development
```bash
npm run dev
```
- **Web App (Client)**: `http://localhost:3000`
- **Backend Server (API)**: `http://localhost:3001`
- **Health Check**: `http://localhost:3001/api/health`

### 4. สั่งบิลด์สำหรับ Production
```bash
npm run build
```

---

## 📝 บันทึกการเปลี่ยนแปลง (Changelog & What Was Done)

1. **โคลนและปรับปรุงโปรเจกต์**: เชื่อมโยง Git repository และติดตั้งสภาพแวดล้อมการทำงานครบถ้วน
2. **ตัดข้อความ Boilerplate เดิมทิ้ง**: นำข้อความแจ้งเตือนยาวๆ เรื่องเชื่อมต่อ backend ออกไป และปรับให้ AI ตอบเนื้อหาจริงที่กระชับ ตรงประเด็น ไม่ไร้สาระ
3. **จำกัดความยาวเพื่อประหยัดโทเคน**: ตั้งค่าคำสั่งระบบและเพดาน Token ให้อยู่ในกรอบ 300 คำโดยไม่ต้องขึ้นข้อความบอกผู้ใช้
4. **ออกแบบ UI/UX ใหม่หมดจด**:
   - ดีไซน์ Dark Tech ธีมมืดระดับลึก
   - ออกแบบหน้าตา Empty State เป็น Aetheris Tech Platform พร้อม Quick Action Cards
   - จัดการ Layout, Header, Sidebar และ Console Input Dock ให้เป็นมาตรฐานเดียวกัน
5. **แก้บัคระบบเลื่อนจอ (Smart Scrolling)**:
   - เพิ่มการตรวจจับ User Scroll อิสระ
   - เพิ่มปุ่มลูกศรชี้ลงลอยสำหรับพุ่งลงล่างสุด
   - เพิ่ม Padding ป้องกันช่องพิมพ์บังคำตอบ
6. **ยกเครื่องระบบฐานข้อมูล Neon PostgreSQL ใหม่หมดจด**:
   - ล้างตารางฐานข้อมูลเก่าทั้งหมด (Drop table cascade)
   - สร้างสคีมาใหม่รองรับ Users, Sessions, และ Messages
   - ยืนยันชื่อผู้ใช้และรหัสผ่านผ่านการสมัคร/เข้าสู่ระบบจริง ตรวจสอบกับฐานข้อมูลโดยตรง
   - ดึงและบันทึกประวัติแชทแยกตามบัญชีผู้ใช้แต่ละคนแบบ Real-time
7. **เชื่อมต่อ DeepSeek API ตัวจริง**: อัปเดตและทดสอบการยิง API สดผ่านคีย์จริง ประมวลผลถูกต้อง รวดเร็ว และแม่นยำ

---

© 2026 **Aetheris Platform** — Designed & Developed by satetapongsa
