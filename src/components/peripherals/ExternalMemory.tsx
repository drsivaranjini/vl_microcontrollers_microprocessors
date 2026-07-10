'use client';

import { useEffect, useState, useCallback } from 'react';
import { useEmuWrites, setXmem } from '@/lib/emubus';

export interface ExternalMemoryProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  /** True once the emulator iframe has confirmed its message listener is live (Editor8051's emuReady). */
  emuReady: boolean;
  /** Bytes to seed into XRAM before Run (e.g. Lab 5's input at 6500H). Sent once emuReady flips true. */
  preset?: { addr: number; value: number }[];
  /** Addresses this experiment's manual listing actually writes -- highlighted and always shown. */
  watch: number[];
}

function hex(n: number, digits = 4) {
  return '0x' + n.toString(16).toUpperCase().padStart(digits, '0');
}

/**
 * Bidirectional external-memory viewer -- the centerpiece of the peripheral subsystem
 * (docs/17_PERIPHERAL_SUBSYSTEM_IMPLEMENTATION.md). Most of the manual's 8051 results land in
 * XRAM, which i8051emu's own UI can only show via a RAM/XRAM dropdown a student has to know to
 * switch (see the "How to look" hint in Editor8051.tsx) -- this widget makes those exact
 * addresses visible without that extra step, and (via `preset`) seeds inputs the manual assumes
 * a hardware kit monitor would have preloaded.
 */
export default function ExternalMemory({ iframeRef, emuReady, preset, watch }: ExternalMemoryProps) {
  const [values, setValues] = useState<Map<number, number>>(() => {
    const initial = new Map<number, number>();
    for (const p of preset ?? []) initial.set(p.addr, p.value);
    return initial;
  });
  const [seeded, setSeeded] = useState(false);
  const [everWritten, setEverWritten] = useState(false);

  useEffect(() => {
    if (!emuReady || seeded || !preset || preset.length === 0) return;
    for (const p of preset) setXmem(iframeRef, p.addr, p.value);
    setSeeded(true);
  }, [emuReady, seeded, preset, iframeRef]);

  const onWrite = useCallback((w: { bus: 'io' | 'xmem'; addr: number; value: number }) => {
    if (w.bus !== 'xmem') return;
    setEverWritten(true);
    setValues((prev) => {
      const next = new Map(prev);
      next.set(w.addr, w.value);
      return next;
    });
  }, []);
  useEmuWrites(iframeRef, onWrite);

  const rows = [...new Set([...watch, ...values.keys()])].sort((a, b) => a - b);

  return (
    <div className="rounded-lab border border-border bg-bg">
      <div className="border-b border-border px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">External Memory (XRAM)</span>
      </div>
      {rows.length === 0 ? (
        <p className="px-3 py-4 text-sm text-text-muted">Run a program to see output.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-muted">
              <th className="px-3 py-1.5 font-semibold">Address</th>
              <th className="px-3 py-1.5 font-semibold">Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((addr) => {
              const isWatched = watch.includes(addr);
              const value = values.get(addr);
              return (
                <tr key={addr} className={isWatched ? 'bg-accent/10' : undefined}>
                  <td className="px-3 py-1.5 font-mono">{hex(addr)}</td>
                  <td className="px-3 py-1.5 font-mono font-semibold text-text">
                    {value === undefined ? '—' : hex(value, 2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <p className="border-t border-border px-3 py-1.5 text-xs text-text-muted">
        {everWritten ? 'Updated live as the program writes to external memory.' : 'Waiting for the program to run…'}
      </p>
    </div>
  );
}
