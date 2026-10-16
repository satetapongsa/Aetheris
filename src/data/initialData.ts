import type { ChatSession, User } from '../types';

export const INITIAL_USER: User = {
  name: 'Alex Mercer',
  email: 'alex.mercer@neural.io',
  initials: 'AM',
  tier: 'PRO',
  isLoggedIn: true
};

export const INITIAL_SESSIONS: ChatSession[] = [
  {
    id: 'sess-react19',
    title: 'Current Analysis',
    topic: 'โค้ดรีวิว & React 19 State Architecture',
    category: 'today',
    icon: 'chat_bubble',
    messages: [
      {
        sender: 'user',
        time: '14:32 น.',
        content: 'ช่วยรีวิวโค้ด TypeScript ด้านล่างและแนะนำวิธี optimize state management ใน React 19 ให้คลีนขึ้นหน่อยครับ พร้อมตัวอย่างโค้ดสั้นๆ สำหรับ asynchronous form actions'
      },
      {
        sender: 'ai',
        modelName: 'Aetheris 2.5 Pro Neural',
        duration: 'เสร็จสิ้นใน 2.8 วินาที',
        thoughtSummary: 'Thought for 2.8s: วิเคราะห์โครงสร้าง React 19 Actions, useActionState, optimistic mutations และ state re-rendering overhead',
        thoughtDetails: 'ตรวจพบการใช้งาน Client Component ใน Next.js 15 App Router ร่วมกับ React 19 Canary features โดยแนวทางที่ดีที่สุดคือการย้าย side effects เข้าสู่ Server Actions และใช้ native useActionState Hook เพื่อลด boilerplate ของ isLoading และ error states',
        paragraphs: [
          'ใน <strong>React 19</strong> การจัดการ asynchronous state ได้รับการยกระดับอย่างมากโดยการนำ <strong>Actions</strong> และ Hook มาตรฐานอย่าง <code class="inline-code">useActionState</code> และ <code class="inline-code">useOptimistic</code> มาใช้แทนการผูก <code class="inline-code">useState + useEffect</code> แบบเดิม',
          'นี่คือตัวอย่างการ Refactor โค้ดให้เป็น React 19 idiomatic pattern ที่มีความกระชับและ Type-safe ครบถ้วน:'
        ],
        featureCards: [
          {
            title: 'Native Pending State',
            desc: 'Hook จะคืนค่า isPending ให้โดยอัตโนมัติ ไม่จำเป็นต้องตั้งตัวแปร loading เพิ่มเติม',
            type: 'primary',
            icon: 'bolt'
          },
          {
            title: 'Automatic Error Handling',
            desc: 'จัดการส่งต่อ error กลับจาก Server Action ไปยัง UI ทันทีโดยไม่ต้อง wrap ด้วย try-catch ซ้ำซ้อน',
            type: 'secondary',
            icon: 'verified'
          }
        ],
        codeBlock: {
          filename: 'UserProfileOptimizer.tsx',
          language: 'TypeScript',
          code: `"use client";

import { useActionState, useOptimistic } from "react";
import { updateProfileState } from "@/actions/user";

type ProfileState = { name: string; status: string; error?: string };

export function UserProfile({ initialProfile }: { initialProfile: ProfileState }) {
  // React 19: Form action state handles error & pending natively
  const [state, formAction, isPending] = useActionState(updateProfileState, initialProfile);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input 
        name="username" 
        defaultValue={state.name} 
        disabled={isPending}
        className="rounded-lg bg-surface border px-3 py-2" 
      />
      <button type="submit" disabled={isPending}>
        {isPending ? "กำลังอัปเดตข้อมูล..." : "บันทึกการตั้งค่า"}
      </button>
    </form>
  );
}`
        },
        suggestions: [
          'แสดงตัวอย่าง useOptimistic เพิ่มเติม',
          'วิธีจัดการ Server Action Validation ด้วย Zod'
        ]
      }
    ]
  },
  {
    id: 'sess-quantum',
    title: 'Quantum Refactor',
    topic: 'Quantum Circuit Simulator in WebAssembly',
    category: 'today',
    icon: 'terminal',
    messages: [
      {
        sender: 'user',
        time: '11:15 น.',
        content: 'ขอแนวทางการเชื่อมต่อ Quantum Circuit Sim (Rust Wasm) เข้ากับ Next.js Web Worker หน่อยครับ'
      },
      {
        sender: 'ai',
        modelName: 'Aetheris 2.5 Pro Neural',
        duration: 'เสร็จสิ้นใน 1.9 วินาที',
        thoughtSummary: 'Thought for 1.9s: WebAssembly SIMD execution, SharedArrayBuffer and Worker isolation',
        thoughtDetails: 'พิจารณา Cross-Origin-Opener-Policy (COOP) และ Cross-Origin-Embedder-Policy (COEP) headers เพื่อเปิดใช้ SharedArrayBuffer สำหรับ high-throughput quantum state vectors',
        paragraphs: [
          'การรันการคำนวณ Quantum Matrix Simulation บนเบราว์เซอร์อย่างมีประสิทธิภาพสูงสุด ควรใช้ <strong>Dedicated Web Worker</strong> ที่โหลดโมดูล WebAssembly (Rust wasm-bindgen) เพื่อไม่ให้กระทบ Main Thread UI 60fps'
        ],
        codeBlock: {
          filename: 'quantumWorker.ts',
          language: 'TypeScript',
          code: `import init, { simulate_bell_state } from "quantum_sim_wasm";

self.onmessage = async (e: MessageEvent) => {
  await init();
  const result = simulate_bell_state(e.data.qubits);
  self.postMessage({ result });
};`
        },
        suggestions: [
          'วิธี configure Cross-Origin Isolation headers',
          'ตัวอย่าง State Vector Visualizer ด้วย Three.js'
        ]
      }
    ]
  },
  {
    id: 'sess-api',
    title: 'API Integration Thread',
    topic: 'OAuth 2.1 PKCE with Fastify & Redis Session Store',
    category: 'today',
    icon: 'data_object',
    messages: [
      {
        sender: 'user',
        time: '09:40 น.',
        content: 'ขอตัวอย่าง Best Practice การทำ OAuth 2.1 authorization code grant with PKCE ใน Node.js'
      },
      {
        sender: 'ai',
        modelName: 'Aetheris 2.5 Pro Neural',
        duration: 'เสร็จสิ้นใน 2.1 วินาที',
        thoughtSummary: 'Thought for 2.1s: RFC 7636 PKCE spec, cryptographic code_challenge and replay prevention',
        thoughtDetails: 'ตรวจทาน security requirement สำหรับ modern SPAs และ mobile clients ที่ไม่มี client_secret',
        paragraphs: [
          'OAuth 2.1 กำหนดให้ <strong>PKCE (Proof Key for Code Exchange)</strong> เป็นข้อบังคับสำหรับ clients ทุกประเภท เพื่อป้องกันการดักจับ authorization code จาก redirect URI'
        ],
        suggestions: [
          'วิธีคำนวณ code_challenge แบบ S256',
          'การเก็บ Refresh Token Rotation ใน Redis'
        ]
      }
    ]
  },
  {
    id: 'sess-arch',
    title: 'Architecture Review',
    topic: 'Event-Driven Microservices with Kafka & Debezium CDC',
    category: 'week',
    icon: 'schema',
    messages: [
      {
        sender: 'user',
        time: 'เมื่อวาน 16:20 น.',
        content: 'สรุปข้อดีข้อเสียระหว่าง Outbox Pattern กับ Two-Phase Commit สำหรับ Distributed Transactions'
      },
      {
        sender: 'ai',
        modelName: 'Aetheris 2.5 Pro Neural',
        duration: 'เสร็จสิ้นใน 2.3 วินาที',
        thoughtSummary: 'Thought for 2.3s: Dual-write problem, Transactional Outbox vs 2PC scalability',
        thoughtDetails: 'Transactional Outbox ร่วมกับ CDC (Change Data Capture) เป็น pattern ที่ให้ scalability และ resilience สูงกว่า 2PC อย่างมากในระบบ cloud-native',
        paragraphs: [
          'ในงานสถาปัตยกรรมระดับ High-concurrency แนะนำให้ใช้ <strong>Transactional Outbox Pattern</strong> ร่วมกับ Debezium CDC ไปยัง Kafka แทน 2PC เพื่อหลีกเลี่ยง table locks และ coordinator single point of failure'
        ],
        suggestions: [
          'ตัวอย่าง Debezium PostgreSQL CDC Setup',
          'วิธีทำ Idempotent Consumer ใน Microservice'
        ]
      }
    ]
  },
  {
    id: 'sess-archive',
    title: 'Older Archives',
    topic: 'Vector Database Benchmarking (Pinecone vs pgvector)',
    category: 'week',
    icon: 'history',
    messages: [
      {
        sender: 'user',
        time: '3 วันที่แล้ว',
        content: 'เปรียบเทียบ latency และ cost ระหว่าง pgvector กับ Pinecone สำหรับ 1 ล้าน vectors 1536-dim'
      },
      {
        sender: 'ai',
        modelName: 'Aetheris 2.5 Pro Neural',
        duration: 'เสร็จสิ้นใน 1.8 วินาที',
        thoughtSummary: 'Thought for 1.8s: HNSW indexing cost, memory footprint and filtering efficiency',
        thoughtDetails: 'สำหรับชุดข้อมูล 1M vectors, pgvector ร่วมกับ HNSW index ให้ latency ต่ำกว่า 15ms บน memory 8GB',
        paragraphs: [
          'สำหรับขนาด 1M vectors <strong>pgvector (HNSW index)</strong> บน PostgreSQL คุ้มค่าด้านต้นทุนและบริหารจัดการง่ายกว่ามาก หากคุณมี PostgreSQL database อยู่แล้ว'
        ],
        suggestions: [
          'การปรับ m และ ef_search ใน pgvector',
          'ตัวอย่าง Hybrid Search: Full-text + Vector Similarity'
        ]
      }
    ]
  },
  {
    id: 'sess-finance',
    title: 'Financial Agent Pipeline',
    topic: 'Autonomous Market Sentiment & SEC 10-K RAG System',
    category: 'older',
    icon: 'memory',
    messages: [
      {
        sender: 'user',
        time: '2 สัปดาห์ก่อน',
        content: 'ออกแบบ pipeline สำหรับดึงข้อมูลรายงาน 10-K ของ SEC มาทำ Chunking และ Knowledge Graph'
      },
      {
        sender: 'ai',
        modelName: 'Aetheris 2.5 Pro Neural',
        duration: 'เสร็จสิ้นใน 2.5 วินาที',
        thoughtSummary: 'Thought for 2.5s: SEC EDGAR API rate limiting, financial tabular parsing and graph entity linking',
        thoughtDetails: 'รายงานการเงินต้องใช้ Table Extraction ร่วมกับ Semantic Markdown conversion เพื่อรักษาบริบทของงบดุล',
        paragraphs: [
          'สำหรับการวิเคราะห์งบการเงิน 10-K แนะนำให้ทำ <strong>Hierarchical Table-aware Chunking</strong> เพื่อไม่ให้ตารางตัวเลขถูกตัดตอนจนสูญเสียความหมาย'
        ],
        suggestions: [
          'สถาปัตยกรรม SEC EDGAR Web Scraper แบบเคารพ Rate Limit',
          'GraphRAG Pipeline ด้วย Neo4j และ LlamaIndex'
        ]
      }
    ]
  }
];
