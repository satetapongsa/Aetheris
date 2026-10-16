import { Router, Request, Response } from 'express';
import { generateDeepSeekResponse } from '../deepseek';
import { dbMessages, dbSessions } from '../db';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'aetheris_super_secret_jwt_key_2026';

// Helper to extract optional user from bearer token
function getUserIdFromToken(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as { userId: string };
      return decoded.userId;
    } catch {
      // Ignored
    }
  }
  return 'usr-default';
}

// POST /api/chat
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      sessionId = 'sess-default',
      thinkingMode = false,
      temperature,
      maxTokens,
      systemPrompt,
      sessionTitle,
      sessionTopic,
      apiKey
    } = req.body;

    const clientApiKey = (req.headers['x-api-key'] as string) || (typeof apiKey === 'string' ? apiKey.trim() : '');

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'กรุณาระบุข้อความคำถาม (Prompt)' });
    }

    const userId = getUserIdFromToken(req);

    // Ensure session exists or create if new
    try {
      await dbSessions.create({
        id: sessionId,
        user_id: userId,
        title: sessionTitle || prompt.slice(0, 30),
        topic: sessionTopic || prompt.slice(0, 50),
        category: 'today',
        icon: 'chat_bubble',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } catch {
      // Session may already exist
    }

    // Save user message to Neon DB
    await dbMessages.create({
      session_id: sessionId,
      sender: 'user',
      content: prompt.trim()
    });

    // Fetch previous messages for context history
    const existingMessages = await dbMessages.listBySessionId(sessionId);

    // Generate intelligent response via DeepSeek engine
    const aiResponse = await generateDeepSeekResponse(prompt, {
      history: existingMessages.map(m => ({ sender: m.sender, content: m.content })),
      thinkingMode,
      temperature,
      maxTokens,
      systemPrompt,
      apiKey: clientApiKey
    });

    // Save assistant message to Neon DB
    await dbMessages.create({
      session_id: sessionId,
      sender: 'ai',
      model_name: aiResponse.modelName,
      duration: aiResponse.duration,
      thought_summary: aiResponse.thoughtSummary,
      thought_details: aiResponse.thoughtDetails,
      paragraphs: aiResponse.paragraphs,
      feature_cards: aiResponse.featureCards,
      code_block: aiResponse.codeBlock,
      suggestions: aiResponse.suggestions
    });

    return res.json({
      success: true,
      message: aiResponse
    });
  } catch (err) {
    console.error('[Chat API Error]:', err);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการประมวลผลคำตอบ' });
  }
});

export default router;
