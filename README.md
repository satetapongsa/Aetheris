# Aetheris AI — Flagship Intelligence Workspace

Aetheris AI is a high-performance, dark-mode AI Chatbot workspace engineered for deep technical problem solving, code reviews, and fluid human-AI collaboration.

Built with the **Luminescent Slate** design system, featuring glassmorphism, ambient auroras, and precision typography.

---

## 🚀 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Vanilla CSS (Luminescent Slate Design System)
- **Backend API**: Node.js, Express, TypeScript (TSX)
- **Database**: Neon Serverless PostgreSQL (`@neondatabase/serverless`)
- **AI Engine**: DeepSeek AI (`deepseek-chat` / `deepseek-reasoner` via backend proxy)
- **Auth**: JWT & Bcrypt password encryption

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Set your configuration in `.env`:
```env
PORT=3001
DATABASE_URL=postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require
DEEPSEEK_API_KEY=your_deepseek_api_key_here
JWT_SECRET=your_jwt_secret_key_here
```

### 3. Run Development Server
```bash
npm run dev
```
This runs both the frontend (`http://localhost:5173`) and the backend API server (`http://localhost:3001`) concurrently.

---

## 📦 Production Build

```bash
npm run build
```
Creates optimized client bundles in `dist/`.
