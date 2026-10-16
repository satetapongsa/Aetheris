import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbUsers, DBUser } from '../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'aetheris_super_secret_jwt_key_2026';

export interface AuthRequest extends Request {
  user?: DBUser;
}

// Authentication Middleware
export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'ไม่พบ Token การยืนยันตัวตน' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    const user = await dbUsers.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'ผู้ใช้งานไม่มีอยู่ในระบบ' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token ไม่ถูกต้องหรือหมดอายุ' });
  }
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'กรุณาระบุอีเมลและรหัสผ่าน' });
    }

    const existing = await dbUsers.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'อีเมลนี้ถูกใช้งานในระบบแล้ว' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const id = 'usr-' + Date.now() + Math.random().toString(36).substring(2, 6);
    const displayName = name || email.split('@')[0];

    const newUser = await dbUsers.create({
      id,
      email,
      name: displayName,
      password_hash,
      tier: 'FREE'
    });

    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, {
      expiresIn: '7d'
    });

    return res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        tier: newUser.tier,
        initials: newUser.name.slice(0, 2).toUpperCase()
      }
    });
  } catch (err) {
    console.error('[Auth Register Error]:', err);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลงทะเบียน' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'กรุณาระบุอีเมลและรหัสผ่าน' });
    }

    const user = await dbUsers.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'ไม่พบบัญชีผู้ใช้งานนี้ในระบบ' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d'
    });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tier: user.tier,
        initials: user.name.slice(0, 2).toUpperCase()
      }
    });
  } catch (err) {
    console.error('[Auth Login Error]:', err);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      tier: user.tier,
      initials: user.name.slice(0, 2).toUpperCase()
    }
  });
});

export default router;
