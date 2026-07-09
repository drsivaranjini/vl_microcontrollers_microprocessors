'use client';

import { useState } from 'react';

export default function CodeBlock({ code, lang = 'asm' }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const lines = code.replace(/\n$/, '').split('\n');

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable — silently ignore, copy button just won't confirm
    }
  };

  return (
    <div className="code-block relative rounded-lab border border-border bg-[#0b1220] text-sm">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="font-mono text-xs uppercase tracking-wide text-white/50">{lang}</span>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-lab border border-white/20 px-2 py-1 text-xs font-medium text-white/80 hover:text-white"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="overflow-x-auto">
        <pre className="m-0 flex min-w-full py-3 pr-4 font-mono leading-6 text-white">
          <code className="flex-1">
            {lines.map((line, i) => (
              <span key={i} className="flex">
                <span className="line-num w-10 shrink-0 pl-4 pr-3 text-right text-white/30 select-none">
                  {i + 1}
                </span>
                <span className="whitespace-pre">{line}</span>
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
