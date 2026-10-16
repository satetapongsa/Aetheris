import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import sessionsRoutes from './routes/sessions';
import { initDbSchema, isNeonConfigured } from './db';
import { isDeepSeekConfigured } from './deepseek';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Middleware to normalize URL in Vercel serverless rewrites
app.use((req, _res, next) => {
  const matchedPath = req.headers['x-matched-path'];
  if (typeof matchedPath === 'string' && matchedPath.startsWith('/api') && req.url === '/api') {
    req.url = matchedPath;
  }
  next();
});

// Health Check Endpoint (support both /api/health and /health)
const healthHandler: express.RequestHandler = (_req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    services: {
      neonDatabase: {
        configured: isNeonConfigured,
        type: isNeonConfigured ? 'Neon Serverless PostgreSQL' : 'In-Memory Store (Awaiting DATABASE_URL in .env)'
      },
      aiEngine: {
        configured: isDeepSeekConfigured,
        status: isDeepSeekConfigured ? 'Active (Live DeepSeek API)' : 'Ready (Awaiting DEEPSEEK_API_KEY in .env)'
      }
    }
  });
};

app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// API Routes (Dual registration for /api/* and /* to handle direct and rewritten requests)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/chat', chatRoutes);
app.use('/chat', chatRoutes);

app.use('/api/sessions', sessionsRoutes);
app.use('/sessions', sessionsRoutes);

// Catch-all 404 for API so it never returns HTML
app.use((_req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Global error handler so it always returns JSON, never HTML
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[API Error]:', err);
  res.status(500).json({ error: err?.message || 'Internal Server Error' });
});

// Start server locally (on Vercel, it is exported as a serverless handler)
if (!process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`=======================================================`);
    console.log(`🚀 Aetheris AI Backend Server running on port ${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🗄️  Neon Database: ${isNeonConfigured ? 'CONNECTED' : 'STANDBY (Memory Mode)'}`);
    console.log(`🧠 AI Engine:     ${isDeepSeekConfigured ? 'CONNECTED' : 'STANDBY (Local Mode)'}`);
    console.log(`=======================================================`);

    if (isNeonConfigured) {
      await initDbSchema();
    }
  });
}

export default app;
