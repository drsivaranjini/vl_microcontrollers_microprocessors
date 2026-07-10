'use client';

import { useEffect, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { assemble8051, type AssembleError } from '@/lib/asm8051';

const emuSrc = '/emu/8051/index.html';
const LOAD_ACK_TIMEOUT_MS = 5000;

interface Editor8051Props {
  initialSource: string;
  /** Where this program's result ends up, shown as a run hint below the toolbar (QA round 4, R4-3). */
  resultHint?: string;
}

type Status = 'idle' | 'loading' | 'assembled' | 'assemble-error' | 'load-timeout' | 'load-failed';

export default function Editor8051({ initialSource, resultHint }: Editor8051Props) {
  const [source, setSource] = useState(initialSource);
  const [errors, setErrors] = useState<AssembleError[] | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [loadFailMessage, setLoadFailMessage] = useState<string | null>(null);
  const [emuReady, setEmuReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const ackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The iframe's own `load` event fires once its HTML/JS are fetched, but Brython still has to
  // parse and run app.py after that — posting a load-hex message before it's actually listening
  // would previously vanish with zero feedback (assemble8051 itself was never the bug; this race
  // was — see docs/14_QA_ROUND3_AND_DLMS_MATCH.md A1). So we wait for an explicit ack handshake
  // instead of assuming the postMessage was received.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      if (data.kind === 'emu-ready') {
        setEmuReady(true);
      } else if (data.kind === 'hex-loaded') {
        if (ackTimerRef.current) clearTimeout(ackTimerRef.current);
        setStatus('assembled');
      } else if (data.kind === 'hex-load-failed') {
        if (ackTimerRef.current) clearTimeout(ackTimerRef.current);
        setLoadFailMessage(typeof data.message === 'string' ? data.message : 'Unknown error.');
        setStatus('load-failed');
      }
    };
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      if (ackTimerRef.current) clearTimeout(ackTimerRef.current);
    };
  }, []);

  const onAssembleAndLoad = () => {
    const result = assemble8051(source);
    if (!result.ok) {
      setErrors(result.errors);
      setStatus('assemble-error');
      return;
    }
    setErrors(null);
    setLoadFailMessage(null);
    setStatus('loading');
    iframeRef.current?.contentWindow?.postMessage({ kind: 'load-hex', hex: result.hex }, window.location.origin);
    if (ackTimerRef.current) clearTimeout(ackTimerRef.current);
    ackTimerRef.current = setTimeout(() => {
      setStatus((s) => (s === 'loading' ? 'load-timeout' : s));
    }, LOAD_ACK_TIMEOUT_MS);
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
        <p className="text-sm font-semibold uppercase tracking-wide text-text-muted">i8051emu</p>
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
                onClick={() => {
                  setSource(initialSource);
                  setStatus('idle');
                }}
                className="rounded-lab border border-border px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface"
              >
                Reset to sample
              </button>
              <button
                type="button"
                onClick={onAssembleAndLoad}
                disabled={!emuReady || status === 'loading'}
                className="rounded-lab bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === 'loading' ? 'Loading…' : '▶ Assemble & Load'}
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
          {!emuReady && (
            <p className="border-t border-border bg-surface px-3 py-2 text-xs text-text-muted">
              Starting the simulator…
            </p>
          )}
          {status === 'assembled' && (
            <p className="border-t border-border bg-ok/10 px-3 py-2 text-xs text-ok-text">
              Assembled and loaded into the emulator below — click <strong>Run</strong> or step through it.
            </p>
          )}
          {status === 'assemble-error' && errors && (
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
          {status === 'load-failed' && (
            <p className="border-t border-border bg-warn/10 px-3 py-2 text-xs text-text">
              The emulator rejected the assembled program: {loadFailMessage}
            </p>
          )}
          {status === 'load-timeout' && (
            <p className="border-t border-border bg-warn/10 px-3 py-2 text-xs text-text">
              The simulator didn&apos;t confirm the program loaded — it may still be starting up. Try{' '}
              <strong>Assemble &amp; Load</strong> again.
            </p>
          )}
        </div>

        <div className="rounded-lab border border-border bg-brand-100/40 px-3 py-2 text-xs text-text">
          <strong>How to run:</strong> click a row in the emulator&apos;s instruction list below, then
          press the <strong>▶|</strong> icon to step, or hold it to run continuously.
          {resultHint ? (
            <>
              {' '}
              <strong>Where to look:</strong> {resultHint}
            </>
          ) : null}
        </div>

        <iframe
          ref={iframeRef}
          src={emuSrc}
          title="i8051emu"
          className="h-[min(70vh,720px)] min-h-[420px] w-full rounded-lab border border-border"
        />
      </div>
    </div>
  );
}
