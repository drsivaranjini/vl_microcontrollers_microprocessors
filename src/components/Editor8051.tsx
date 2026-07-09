'use client';

import { useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { assemble8051, type AssembleError } from '@/lib/asm8051';

const emuSrc = '/emu/8051/index.html';

interface Editor8051Props {
  initialSource: string;
}

export default function Editor8051({ initialSource }: Editor8051Props) {
  const [source, setSource] = useState(initialSource);
  const [errors, setErrors] = useState<AssembleError[] | null>(null);
  const [status, setStatus] = useState<'idle' | 'assembled' | 'error'>('idle');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const onAssembleAndLoad = () => {
    const result = assemble8051(source);
    if (!result.ok) {
      setErrors(result.errors);
      setStatus('error');
      return;
    }
    setErrors(null);
    setStatus('assembled');
    iframeRef.current?.contentWindow?.postMessage({ kind: 'load-hex', hex: result.hex }, window.location.origin);
  };

  const toggleFullscreen = async () => {
    if (!bodyRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      await bodyRef.current.requestFullscreen();
      setIsFullscreen(true);
    }
  };

  return (
    <div className="rounded-lab border border-border bg-surface shadow-(--shadow)">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">i8051emu</h2>
        <div className="flex items-center gap-2">
          <a
            href={emuSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lab border border-border px-2 py-1 text-xs font-medium text-text-muted hover:bg-brand-900/5 hover:text-text"
          >
            ↗ Open in new tab
          </a>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="rounded-lab border border-border px-2 py-1 text-xs font-medium text-text-muted hover:bg-brand-900/5 hover:text-text"
          >
            {isFullscreen ? '⛶ Exit fullscreen' : '⛶ Fullscreen'}
          </button>
        </div>
      </div>

      <p className="border-b border-border bg-warn/10 px-4 py-2 text-sm text-text">
        For the best experience, run this simulator on a desktop using Chrome or Edge.
      </p>

      <div
        ref={bodyRef}
        className="flex flex-col gap-4 bg-surface p-4 [&:fullscreen]:h-screen [&:fullscreen]:overflow-auto"
      >
        <div className="rounded-lab border border-border bg-bg">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Editor — 8051 assembly
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSource(initialSource)}
                className="rounded-lab border border-border px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface"
              >
                Reset to sample
              </button>
              <button
                type="button"
                onClick={onAssembleAndLoad}
                className="rounded-lab bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-900"
              >
                ▶ Assemble &amp; Load
              </button>
            </div>
          </div>
          <CodeMirror
            value={source}
            height="260px"
            basicSetup={{ lineNumbers: true, foldGutter: false }}
            onChange={(value) => setSource(value)}
            className="text-sm"
          />
          {status === 'assembled' && (
            <p className="border-t border-border bg-ok/10 px-3 py-2 text-xs text-ok-text">
              Assembled and loaded into the emulator below — click <strong>Run</strong> or step through it.
            </p>
          )}
          {status === 'error' && errors && (
            <div className="border-t border-border bg-warn/10 px-3 py-2 text-xs text-text">
              <p className="font-semibold">Assembly errors:</p>
              <ul className="mt-1 list-inside list-disc">
                {errors.map((e, i) => (
                  <li key={i}>
                    Line {e.line}: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <iframe
          ref={iframeRef}
          src={emuSrc}
          title="i8051emu"
          loading="lazy"
          className="h-[min(70vh,720px)] min-h-[420px] w-full rounded-lab border border-border"
        />
      </div>
    </div>
  );
}
