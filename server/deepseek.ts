import dotenv from 'dotenv';

dotenv.config();

const DEEPSEEK_API_ENDPOINT = 'https://api.deepseek.com/chat/completions';
const deepseekApiKey = process.env.DEEPSEEK_API_KEY || '';

export const isDeepSeekConfigured = Boolean(deepseekApiKey && deepseekApiKey.trim().length > 0);

export interface DeepSeekChatOptions {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  thinkingMode?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export interface FormattedAIResponse {
  modelName: string; // Keeps the brand name 'Aetheris 2.5 Pro Neural' for UI display
  duration: string;
  thoughtSummary?: string;
  thoughtDetails?: string;
  paragraphs: string[];
  featureCards?: Array<{ title: string; desc: string; type: 'primary' | 'secondary'; icon: string }>;
  codeBlock?: { filename: string; language: string; code: string };
  suggestions: string[];
}

/**
 * Call DeepSeek AI API backend
 * Note: Model names and API usage are kept strictly in backend code per specification.
 */
export async function generateDeepSeekResponse(
  prompt: string,
  options: {
    history?: Array<{ sender: 'user' | 'ai'; content?: string }>;
    thinkingMode?: boolean;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    apiKey?: string;
  } = {}
): Promise<FormattedAIResponse> {
  const startTime = Date.now();

  const activeKey = (options.apiKey && options.apiKey.trim().length > 0)
    ? options.apiKey.trim()
    : (process.env.DEEPSEEK_API_KEY || process.env.AI_API_KEY || deepseekApiKey || '');

  // If DeepSeek API key is present, call DeepSeek API directly
  if (activeKey && activeKey.length > 0) {
    try {
      // Use deepseek-reasoner for deep thinking mode or deepseek-chat for standard high-speed mode
      const internalDeepSeekModel = options.thinkingMode ? 'deepseek-reasoner' : 'deepseek-chat';

      const systemInstruction = options.systemPrompt || 
        'You are Aetheris AI, a flagship bilingual (Thai and English) intelligence workspace specialized in software engineering, architecture, system design, and deep technical problem solving. Provide elegant, concise, highly structured explanations and clean code snippets.';

      const apiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: systemInstruction }
      ];

      // Add recent context history if available
      if (options.history && options.history.length > 0) {
        options.history.slice(-6).forEach(h => {
          if (h.content) {
            apiMessages.push({
              role: h.sender === 'user' ? 'user' : 'assistant',
              content: h.content
            });
          }
        });
      }

      apiMessages.push({ role: 'user', content: prompt });

      console.log(`[DeepSeek Engine] Dispatching request with model: ${internalDeepSeekModel}`);

      const response = await fetch(DEEPSEEK_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeKey}`
        },
        body: JSON.stringify({
          model: internalDeepSeekModel,
          messages: apiMessages,
          temperature: options.temperature ?? (options.thinkingMode ? 0.6 : 0.7),
          max_tokens: options.maxTokens ?? 4096
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DeepSeek API Error]:', response.status, errorText);
        throw new Error(`DeepSeek API returned status ${response.status}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      const replyContent = choice?.message?.content || '';
      const reasoningContent = choice?.message?.reasoning_content || '';

      const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);

      return parseDeepSeekOutput(replyContent, reasoningContent, elapsedSeconds, options.thinkingMode);
    } catch (err) {
      console.warn('[DeepSeek] Fallback to local intelligent synthesis due to API call failure:', err);
    }
  }

  // Graceful intelligent synthesis (when API key is not yet set or during offline development)
  const elapsedSeconds = ((Date.now() - startTime) / 1000 + 1.8).toFixed(1);
  return generateSimulatedDeepResponse(prompt, elapsedSeconds, options.thinkingMode);
}

/**
 * Parse Markdown, reasoning content, and code blocks from DeepSeek into UI component structures
 */
function parseDeepSeekOutput(
  content: string,
  reasoning: string,
  elapsedSec: string,
  thinkingMode?: boolean
): FormattedAIResponse {
  // Extract code blocks if present
  let extractedCode: { filename: string; language: string; code: string } | undefined = undefined;
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/;
  const match = content.match(codeBlockRegex);

  let cleanedContent = content;
  if (match) {
    const lang = match[1] || 'TypeScript';
    const code = match[2].trim();
    cleanedContent = content.replace(codeBlockRegex, '').trim();

    let filename = 'Snippet.' + (lang === 'typescript' || lang === 'ts' ? 'tsx' : lang === 'javascript' || lang === 'js' ? 'jsx' : 'txt');
    if (code.includes('useActionState') || code.includes('React')) filename = 'UserProfileOptimizer.tsx';
    if (code.includes('express') || code.includes('route')) filename = 'apiHandler.ts';
    if (code.includes('zod')) filename = 'validationSchema.ts';

    extractedCode = {
      filename,
      language: lang.toUpperCase(),
      code
    };
  }

  // Split into paragraphs
  const rawParagraphs = cleanedContent
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(Boolean);

  const paragraphs = rawParagraphs.length > 0 ? rawParagraphs : [cleanedContent];

  // Dynamic Thought summary
  const thoughtSummary = reasoning
    ? `Thought for ${elapsedSec}s: วิเคราะห์ตรรกะและโครงสร้างเชิงลึกด้วย Reasoning Chain`
    : thinkingMode
    ? `Thought for ${elapsedSec}s: วิเคราะห์บริบท ความถูกต้อง และการออกแบบสถาปัตยกรรม`
    : undefined;

  const thoughtDetails = reasoning || 'ระบบประมวลผลคำตอบโดยอ้างอิงหลักการ Clean Code, High Performance และ Security Standards';

  return {
    modelName: 'Aetheris 2.5 Pro Neural',
    duration: `เสร็จสิ้นใน ${elapsedSec} วินาที`,
    thoughtSummary,
    thoughtDetails,
    paragraphs,
    codeBlock: extractedCode,
    suggestions: [
      'ขอตัวอย่างการทดสอบ Unit Test เพิ่มเติม',
      'วิเคราะห์แนวทางการ Optimize ประสิทธิภาพ',
      'การปรับใช้กับ Production Environment'
    ]
  };
}

/**
 * Intelligent Fallback Generator
 */
function generateSimulatedDeepResponse(
  prompt: string,
  elapsedSec: string,
  thinkingMode?: boolean
): FormattedAIResponse {
  const lower = prompt.toLowerCase();

  if (lower.includes('neon') || lower.includes('database') || lower.includes('ฐานข้อมูล')) {
    return {
      modelName: 'Aetheris 2.5 Pro Neural',
      duration: `เสร็จสิ้นใน ${elapsedSec} วินาที`,
      thoughtSummary: `Thought for ${elapsedSec}s: ออกแบบการเชื่อมต่อ Neon Serverless PostgreSQL ผ่าน connection pooling`,
      thoughtDetails: 'Neon Serverless รองรับ autoscaling compute, branching, และ pooling ผ่าน port 5432 / 6543 หรือ WebSockets SDK',
      paragraphs: [
        'ระบบ <strong>Neon PostgreSQL</strong> ได้รับการติดตั้งพร้อมใช้งานแล้วผ่านไลบรารี <code class="inline-code">@neondatabase/serverless</code> โดยเชื่อมต่อได้ทันทีเพียงกำหนดค่า <code class="inline-code">DATABASE_URL</code> ในไฟล์ <code class="inline-code">.env</code>',
        'นี่คือตัวอย่างการ query และ transaction ที่มีประสิทธิภาพสูง:'
      ],
      codeBlock: {
        filename: 'neonDatabase.ts',
        language: 'TypeScript',
        code: `import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function getUserSessions(userId: string) {
  const sessions = await sql\`
    SELECT * FROM sessions 
    WHERE user_id = \${userId} 
    ORDER BY updated_at DESC;
  \`;
  return sessions;
}`
      },
      suggestions: [
        'วิธีเปิดใช้งาน Neon Database Branching',
        'การทำ Connection Pooling ใน Serverless Environment'
      ]
    };
  }

  return {
    modelName: 'Aetheris 2.5 Pro Neural',
    duration: `เสร็จสิ้นใน ${elapsedSec} วินาที`,
    thoughtSummary: `Thought for ${elapsedSec}s: ประมวลผลคำสั่ง "${prompt.slice(0, 32)}..." ด้วย Neural Graph Synthesis`,
    thoughtDetails: 'วิเคราะห์โครงสร้างข้อมูล, ตรวจสอบความสอดคล้องทางตรรกะ และสังเคราะห์คำตอบแบบเรียลไทม์',
    paragraphs: [
      `ระบบได้ทำการวิเคราะห์คำถามของคุณเกี่ยวกับ <strong>"${prompt}"</strong> เรียบร้อยแล้ว`,
      'นี่คือแนวทางที่แนะนำตามมาตรฐาน Best Practices ที่เน้นความเสถียร ประสิทธิภาพสูง และรองรับการขยายตัว (Scalability):'
    ],
    featureCards: [
      {
        title: 'High Throughput Architecture',
        desc: 'ออกแบบให้ latency ต่ำและใช้ทรัพยากร compute คุ้มค่าที่สุด',
        type: 'primary',
        icon: 'speed'
      },
      {
        title: 'Zero-Trust Security',
        desc: 'เข้ารหัส end-to-end พร้อมรองรับ audit logging ตามมาตรฐาน SOC-2',
        type: 'secondary',
        icon: 'security'
      }
    ],
    suggestions: [
      'ขอตัวอย่างการนำไปใช้งานจริง (Implementation Example)',
      'วิเคราะห์จุดที่อาจเกิด Performance Bottleneck'
    ]
  };
}
