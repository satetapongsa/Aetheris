import React, { useState } from 'react';
import { copyToClipboard } from '../utils/clipboard';

/* ------------------------------------------------------------------ */
/* Syntax highlighting (lightweight tokenizer, no external deps)       */
/* ------------------------------------------------------------------ */

const KEYWORDS = [
  'import', 'export', 'from', 'default', 'function', 'const', 'let', 'var', 'return', 'type', 'interface',
  'class', 'extends', 'implements', 'async', 'await', 'if', 'else', 'elif', 'for', 'while', 'do', 'switch',
  'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'new', 'def', 'lambda', 'public',
  'private', 'protected', 'static', 'readonly', 'enum', 'in', 'of', 'as', 'with', 'yield', 'pass', 'raise',
  'except', 'not', 'and', 'or', 'is', 'func', 'package', 'struct', 'fn', 'pub', 'use', 'mod', 'impl',
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE',
  'JOIN', 'LEFT', 'RIGHT', 'INNER', 'ON', 'GROUP', 'BY', 'ORDER', 'LIMIT', 'AND', 'OR', 'NOT', 'NULL', 'INDEX'
];
const LITERALS = ['true', 'false', 'null', 'undefined', 'None', 'True', 'False', 'this', 'self', 'nil'];
const TYPES = [
  'string', 'number', 'boolean', 'void', 'any', 'unknown', 'never', 'Promise', 'Array', 'Record', 'Map', 'Set',
  'int', 'float', 'str', 'bool', 'dict', 'list', 'tuple', 'char', 'double', 'long', 'String', 'Object'
];
const HASH_COMMENT_LANGS = new Set([
  'python', 'py', 'bash', 'sh', 'shell', 'zsh', 'yaml', 'yml', 'ruby', 'rb', 'toml', 'dockerfile', 'r', 'perl', 'powershell', 'ps1', 'env', 'ini', 'conf'
]);

function buildTokenRegex(lang: string): RegExp {
  const comment = HASH_COMMENT_LANGS.has(lang)
    ? String.raw`#.*$`
    : String.raw`\/\/.*$|\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->|--\s.*$`;
  const str = String.raw`"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|\`(?:\\.|[^\`\\])*\``;
  const num = String.raw`\b\d+(?:\.\d+)?\b`;
  const kw = String.raw`\b(?:${KEYWORDS.join('|')})\b`;
  const lit = String.raw`\b(?:${LITERALS.join('|')})\b`;
  const ty = String.raw`\b(?:${TYPES.join('|')})\b`;
  const fnCall = String.raw`\b[A-Za-z_$][\w$]*(?=\s*\()`;
  return new RegExp(`(${comment})|(${str})|(${kw})|(${lit})|(${ty})|(${num})|(${fnCall})`, 'gm');
}

const TOKEN_CLASSES = ['tok-comment', 'tok-string', 'tok-keyword', 'tok-literal', 'tok-type', 'tok-number', 'tok-fn'];

function highlight(code: string, lang: string): React.ReactNode[] {
  const re = buildTokenRegex(lang.toLowerCase());
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(code)) !== null) {
    if (m[0].length === 0) {
      re.lastIndex++;
      continue;
    }
    if (m.index > last) out.push(code.slice(last, m.index));
    const groupIdx = m.slice(1).findIndex(g => g !== undefined);
    out.push(
      <span key={i++} className={TOKEN_CLASSES[groupIdx] || ''}>
        {m[0]}
      </span>
    );
    last = m.index + m[0].length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

/* ------------------------------------------------------------------ */
/* Code block                                                          */
/* ------------------------------------------------------------------ */

export const CodeBlock: React.FC<{ code: string; lang?: string }> = ({ code, lang = '' }) => {
  const [copied, setCopied] = useState(false);
  const label = lang || 'code';

  const handleCopy = async () => {
    if (await copyToClipboard(code)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className="code-block">
      <div className="code-block-head">
        <span className="code-block-lang">{label}</span>
        <button type="button" className="code-block-copy" onClick={handleCopy}>
          <span className="material-symbols-outlined">{copied ? 'check' : 'content_copy'}</span>
          <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอกโค้ด'}</span>
        </button>
      </div>
      <pre className="code-block-pre">
        <code>{highlight(code, label)}</code>
      </pre>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Inline markdown                                                     */
/* ------------------------------------------------------------------ */

const INLINE_RE = /(`[^`\n]+`)|(\*\*[^*\n]+\*\*|__[^_\n]+__)|(\*[^*\s][^*\n]*\*)|(\[[^\]\n]+\]\((?:https?:\/\/|mailto:)[^)\s]+\))|(https?:\/\/[^\s<)]+)/g;

function renderInline(text: string, keyPrefix = 'i'): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  const re = new RegExp(INLINE_RE.source, 'g');
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = `${keyPrefix}-${i++}`;
    const tok = m[0];
    if (m[1]) {
      out.push(<code key={key} className="md-inline-code">{tok.slice(1, -1)}</code>);
    } else if (m[2]) {
      out.push(<strong key={key}>{renderInline(tok.slice(2, -2), key)}</strong>);
    } else if (m[3]) {
      out.push(<em key={key}>{renderInline(tok.slice(1, -1), key)}</em>);
    } else if (m[4]) {
      const close = tok.indexOf('](');
      const label = tok.slice(1, close);
      const href = tok.slice(close + 2, -1);
      out.push(<a key={key} href={href} target="_blank" rel="noopener noreferrer">{label}</a>);
    } else if (m[5]) {
      out.push(<a key={key} href={tok} target="_blank" rel="noopener noreferrer">{tok}</a>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function withLineBreaks(lines: string[], keyPrefix: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  lines.forEach((line, idx) => {
    if (idx > 0) out.push(<br key={`${keyPrefix}-br-${idx}`} />);
    out.push(...renderInline(line, `${keyPrefix}-${idx}`));
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* Block markdown                                                      */
/* ------------------------------------------------------------------ */

type Segment = { kind: 'code'; lang: string; code: string } | { kind: 'text'; lines: string[] };

function splitFences(src: string): Segment[] {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const segs: Segment[] = [];
  let text: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const open = lines[i].match(/^\s*```\s*([\w+#.-]*)\s*$/);
    if (open) {
      if (text.length) segs.push({ kind: 'text', lines: text });
      text = [];
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) {
        body.push(lines[i]);
        i++;
      }
      i++; // skip closing fence (or run past the end if unterminated)
      segs.push({ kind: 'code', lang: open[1] || '', code: body.join('\n').replace(/\s+$/, '') });
      continue;
    }
    text.push(lines[i]);
    i++;
  }
  if (text.length) segs.push({ kind: 'text', lines: text });
  return segs;
}

const isTableSep = (l: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l);
const splitRow = (l: string) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());

function renderTextBlocks(lines: string[], keyPrefix: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let i = 0;
  let k = 0;
  const key = () => `${keyPrefix}-${k++}`;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    const heading = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = Math.min(heading[1].length + 1, 6);
      const Tag = `h${level}` as 'h2';
      out.push(<Tag key={key()} className="md-heading">{renderInline(heading[2].replace(/#+\s*$/, ''))}</Tag>);
      i++;
      continue;
    }

    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      out.push(<hr key={key()} className="md-hr" />);
      i++;
      continue;
    }

    if (line.trim().startsWith('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const header = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      const tk = key();
      out.push(
        <div key={tk} className="md-table-wrap">
          <table className="md-table">
            <thead>
              <tr>{header.map((h, hi) => <th key={hi}>{renderInline(h, `${tk}-h${hi}`)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>{r.map((c, ci) => <td key={ci}>{renderInline(c, `${tk}-${ri}-${ci}`)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (/^\s*>/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) {
        quote.push(lines[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      const qk = key();
      out.push(<blockquote key={qk} className="md-quote">{withLineBreaks(quote, qk)}</blockquote>);
      continue;
    }

    const ulRe = /^\s*[-*+•]\s+(.*)$/;
    const olRe = /^\s*(\d+)[.)]\s+(.*)$/;
    if (ulRe.test(line) || olRe.test(line)) {
      const ordered = olRe.test(line) && !ulRe.test(line);
      const start = ordered ? parseInt(line.match(olRe)![1], 10) : 1;
      const items: string[][] = [];
      while (i < lines.length) {
        const cur = lines[i];
        const mm = ordered ? cur.match(olRe) : cur.match(ulRe);
        if (mm) {
          items.push([ordered ? mm[2] : mm[1]]);
          i++;
        } else if (cur.trim() && /^\s{2,}\S/.test(cur) && items.length) {
          // indented continuation / nested line -> attach to previous item
          items[items.length - 1].push(cur.trim().replace(/^[-*+•]\s+/, '• '));
          i++;
        } else {
          break;
        }
      }
      const lk = key();
      const children = items.map((it, ii) => <li key={ii}>{withLineBreaks(it, `${lk}-${ii}`)}</li>);
      out.push(
        ordered
          ? <ol key={lk} className="md-list" start={start}>{children}</ol>
          : <ul key={lk} className="md-list">{children}</ul>
      );
      continue;
    }

    // Paragraph: consume until blank line or another block starter
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^\s*(#{1,6})\s+/.test(lines[i]) &&
      !/^\s*>/.test(lines[i]) &&
      !ulRe.test(lines[i]) &&
      !olRe.test(lines[i]) &&
      !(lines[i].trim().startsWith('|') && i + 1 < lines.length && isTableSep(lines[i + 1]))
    ) {
      para.push(lines[i]);
      i++;
    }
    if (para.length === 0) {
      // Safety: guarantee progress
      para.push(lines[i]);
      i++;
    }
    const pk = key();
    out.push(<p key={pk} className="md-p">{withLineBreaks(para, pk)}</p>);
  }

  return out;
}

export const Markdown: React.FC<{ text: string }> = ({ text }) => {
  const segs = splitFences(text || '');
  return (
    <div className="md">
      {segs.map((s, idx) =>
        s.kind === 'code'
          ? <CodeBlock key={`c-${idx}`} code={s.code} lang={s.lang} />
          : <React.Fragment key={`t-${idx}`}>{renderTextBlocks(s.lines, `t${idx}`)}</React.Fragment>
      )}
    </div>
  );
};

export default Markdown;
