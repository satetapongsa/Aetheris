"use client";

import { memo, useRef, useState, type ComponentProps } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { IconCheck, IconCopy } from "./icons";

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

function Markdown({ content }: { content: string }) {
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true }]]}
        components={{
          pre: CodeBlock,
          a: ({ node: _n, ...p }) => <a {...p} target="_blank" rel="noopener noreferrer" />,
          table: ({ node: _n, ...p }) => (
            <div className="table-wrap">
              <table {...p} />
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default memo(Markdown);
