"use client";

import { memo, useRef, useState, type ComponentProps } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { IconCheck, IconCopy } from "./icons";
import { stripEmoji } from "@/lib/text";

function CodeBlock(props: ComponentProps<"pre">) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  // react-markdown passes the <code> element as the only child
  const child = props.children as { props?: { className?: string } } | undefined;
  const lang = /language-([\w+#-]+)/.exec(child?.props?.className ?? "")?.[1] ?? "text";

  const copy = async () => {
    await navigator.clipboard.writeText(ref.current?.innerText ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="group/code my-4 overflow-hidden rounded-xl border border-line bg-[#0d0d10]">
      <div className="flex items-center justify-between border-b border-line bg-white/[0.02] px-4 py-2 text-xs text-subtle">
        <span className="font-mono lowercase">{lang}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 transition hover:bg-white/5 hover:text-fg"
        >
          {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
          {copied ? "คัดลอกแล้ว" : "คัดลอก"}
        </button>
      </div>
      <pre ref={ref} className="overflow-x-auto px-4 py-3.5">
        {props.children}
      </pre>
    </div>
  );
}

// ── Streaming fade-in: wrap each word in a span that fades in on mount ─────
type HastNode = { type: string; value?: string; tagName?: string; children?: HastNode[]; properties?: object };

const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter(undefined, { granularity: "word" }) : null;

function splitWords(text: string): string[] {
  if (segmenter) return Array.from(segmenter.segment(text), (s) => s.segment);
  return text.split(/(\s+)/).filter(Boolean);
}

function rehypeFadeWords() {
  const walk = (node: HastNode) => {
    if (!node.children || node.tagName === "pre" || node.tagName === "code") return;
    node.children = node.children.flatMap((child): HastNode[] => {
      if (child.type === "text" && child.value && child.value.trim()) {
        return splitWords(child.value).map((w) =>
          /^\s+$/.test(w)
            ? { type: "text", value: w }
            : { type: "element", tagName: "span", properties: { className: ["fade-word"] }, children: [{ type: "text", value: w }] },
        );
      }
      walk(child);
      return [child];
    });
  };
  return (tree: HastNode) => walk(tree);
}

const COMPONENTS = {
  pre: CodeBlock,
  a: ({ node: _n, ...p }: ComponentProps<"a"> & { node?: unknown }) => (
    <a {...p} target="_blank" rel="noopener noreferrer" />
  ),
  table: ({ node: _n, ...p }: ComponentProps<"table"> & { node?: unknown }) => (
    <div className="table-wrap">
      <table {...p} />
    </div>
  ),
};

const REMARK = [remarkGfm];
const REHYPE_STATIC = [[rehypeHighlight, { detect: true }]] as const;
const REHYPE_STREAMING = [[rehypeHighlight, { detect: true }], rehypeFadeWords] as const;

function Markdown({ content, streaming = false }: { content: string; streaming?: boolean }) {
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={REMARK}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rehypePlugins={(streaming ? REHYPE_STREAMING : REHYPE_STATIC) as any}
        components={COMPONENTS}
      >
        {stripEmoji(content)}
      </ReactMarkdown>
    </div>
  );
}

export default memo(Markdown);
