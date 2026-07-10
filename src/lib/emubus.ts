'use client';

import { useEffect, useRef } from 'react';

/** A write the 8051 core streamed out via postMessage (see public/emu/8051/PATCHES.md, patches 1/6). */
export interface EmuWrite {
  kind: 'emu-write';
  bus: 'io' | 'xmem';
  addr: number;
  value: number;
  tMs: number;
}

function isEmuWrite(data: unknown): data is EmuWrite {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return d.kind === 'emu-write' && (d.bus === 'io' || d.bus === 'xmem') && typeof d.addr === 'number' && typeof d.value === 'number';
}

/**
 * Subscribe to writes streamed out of a specific emulator iframe. Strict origin + source check,
 * same discipline Editor8051.tsx already uses for the load-hex/emu-ready handshake -- a widget
 * must never react to a postMessage from anywhere but the exact iframe it's rendering next to.
 */
export function useEmuWrites(iframeRef: React.RefObject<HTMLIFrameElement | null>, onWrite: (w: EmuWrite) => void) {
  const onWriteRef = useRef(onWrite);
  onWriteRef.current = onWrite;

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.source !== iframeRef.current?.contentWindow) return;
      if (!isEmuWrite(e.data)) return;
      onWriteRef.current(e.data);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [iframeRef]);
}

/** Seed a byte of external memory in the emulator before Run (public/emu/8051/PATCHES.md, patch 7). */
export function setXmem(iframeRef: React.RefObject<HTMLIFrameElement | null>, addr: number, value: number) {
  iframeRef.current?.contentWindow?.postMessage({ kind: 'set-xmem', addr, value }, window.location.origin);
}
