'use client';

import { useRef, useState } from 'react';

interface SimulatorFrameProps {
  title: string;
  /** iframe src for a self-hosted emulator. Omit for link-out engines (CPUlator). */
  src?: string;
  /** One-line "how to run" hint shown above the frame. */
  hint?: string;
  /** Show the "best in Chrome/Edge" banner. */
  chromiumNotice?: boolean;
  /** Link-out CTA (used instead of an iframe) — e.g. CPUlator. */
  linkOutUrl?: string;
  linkOutLabel?: string;
  toolbar?: React.ReactNode;
  children?: React.ReactNode;
}

export default function SimulatorFrame({
  title,
  src,
  hint,
  chromiumNotice = false,
  linkOutUrl,
  linkOutLabel = 'Open simulator ↗',
  toolbar,
  children,
}: SimulatorFrameProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
    <div className="simulator-frame rounded-lab border border-border bg-surface shadow-(--shadow)">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        {/* Not a heading: this panel always sits inside a section that already has its own h2
            ("▶ Embedded Simulator" etc.) — this is just a small label for the toolbar. */}
        <p className="text-sm font-semibold uppercase tracking-wide text-text-muted">{title}</p>
        <div className="flex items-center gap-2">
          {toolbar}
          {src && (
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lab border border-border px-2 py-1 text-xs font-medium text-text-muted hover:bg-brand-900/5 hover:text-text"
            >
              ↗ Open in new tab
            </a>
          )}
          {(src || !linkOutUrl) && (
            <button
              type="button"
              onClick={toggleFullscreen}
              className="rounded-lab border border-border px-2 py-1 text-xs font-medium text-text-muted hover:bg-brand-900/5 hover:text-text"
            >
              {isFullscreen ? '⛶ Exit fullscreen' : '⛶ Fullscreen'}
            </button>
          )}
        </div>
      </div>

      {hint && <p className="border-b border-border bg-brand-900/5 px-4 py-2 text-sm text-text-muted">{hint}</p>}

      {chromiumNotice && (
        <p className="border-b border-border bg-warn/10 px-4 py-2 text-sm text-text">
          For the best experience, run this simulator on a desktop using Chrome or Edge.
        </p>
      )}

      <div
        ref={bodyRef}
        className="simulator-frame-body flex flex-col gap-4 bg-surface p-4 [&:fullscreen]:h-screen [&:fullscreen]:overflow-auto"
      >
        {src && (
          // R4-4: this emulator's own layout (editor + Reg/Segments/Pointers + Memory panels side
          // by side) needs ~1100px+ to render without its panels overlapping/clipping. On narrower
          // viewports, forcing the iframe to width:100% just squeezes that fixed layout instead of
          // reflowing it -- so instead the iframe keeps its natural min-width and this wrapper
          // scrolls horizontally, matching the "Open in new tab" escape hatch above as a fallback.
          <div className="overflow-x-auto rounded-lab border border-border [.simulator-frame-body:fullscreen_&]:h-full">
            <iframe
              src={src}
              title={title}
              loading="lazy"
              className="h-[min(80vh,860px)] min-h-[520px] w-full min-w-[1100px] [.simulator-frame-body:fullscreen_&]:h-full"
            />
          </div>
        )}
        {linkOutUrl && (
          <div className="flex min-h-[160px] flex-col items-center justify-center gap-4 rounded-lab border border-dashed border-border p-8 text-center">
            <p className="max-w-md text-sm text-text-muted">
              This simulator runs on an external, author-hosted tool and opens in a new tab.
            </p>
            <a
              href={linkOutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lab bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-900"
            >
              {linkOutLabel}
            </a>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
