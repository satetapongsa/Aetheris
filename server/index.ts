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

// Health Check Endpoint
app.get('/api/health', (_req, res) => {
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
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/sessions', sessionsRoutes);

// Start server
app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🚀 Aetheris AI Backend Server running on port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🗄️  Neon Database: ${isNeonConfigured ? 'CONNECTED' : 'STANDBY (Memory Mode)'}`);
  console.log(`🧠 AI Engine:     ${isDeepSeekConfigured ? 'CONNECTED' : 'STANDBY (Local Mode)'}`);
  console.log(`=======================================================`);

  // Run migrations if Neon connection string is provided
  if (isNeonConfigured) {
    await initDbSchema();
  }
});

export default app;
