import { Router, Request, Response } from 'express';
import { dbSessions, dbMessages } from '../db';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'aetheris_super_secret_jwt_key_2026';

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

// GET /api/sessions
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromToken(req);
    const sessions = await dbSessions.listByUserId(userId);
    return res.json({ sessions });
  } catch (err) {
    console.error('[Sessions List Error]:', err);
    return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลเซสชันได้' });
  }
});

// GET /api/sessions/:id/messages
router.get('/:id/messages', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rawMessages = await dbMessages.listBySessionId(id);

    const messages = rawMessages.map(m => ({
      sender: m.sender,
      time: m.created_at ? new Date(m.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.' : undefined,
      content: m.content,
      modelName: m.model_name,
      duration: m.duration,
      thoughtSummary: m.thought_summary,
      thoughtDetails: m.thought_details,
      paragraphs: typeof m.paragraphs === 'string' ? JSON.parse(m.paragraphs) : m.paragraphs,
      featureCards: typeof m.feature_cards === 'string' ? JSON.parse(m.feature_cards) : m.feature_cards,
      codeBlock: typeof m.code_block === 'string' ? JSON.parse(m.code_block) : m.code_block,
      suggestions: typeof m.suggestions === 'string' ? JSON.parse(m.suggestions) : m.suggestions
    }));

    return res.json({ messages });
  } catch (err) {
    console.error('[Session Messages Error]:', err);
    return res.status(500).json({ error: 'ไม่สามารถดึงข้อความได้' });
  }
});

// POST /api/sessions
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromToken(req);
    const { title = 'การสนทนาใหม่', topic = 'บทสนทนาใหม่กับ Aetheris AI', category = 'today', icon = 'chat_bubble' } = req.body;
    const id = 'sess-' + Date.now();

    const newSession = await dbSessions.create({
      id,
      user_id: userId,
      title,
      topic,
      category,
      icon,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return res.status(201).json({ session: newSession });
  } catch (err) {
    console.error('[Session Create Error]:', err);
    return res.status(500).json({ error: 'ไม่สามารถสร้างเซสชันได้' });
  }
});

// DELETE /api/sessions/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await dbSessions.delete(id);
    return res.json({ success: true });
  } catch (err) {
    console.error('[Session Delete Error]:', err);
    return res.status(500).json({ error: 'ไม่สามารถลบเซสชันได้' });
  }
});

export default router;
