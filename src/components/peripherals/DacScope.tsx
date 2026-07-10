'use client';

import { useEffect, useRef, useState } from 'react';
import { useEmuWrites } from '@/lib/emubus';

export interface DacScopeProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  /** External-memory address the program writes DAC samples to (Lab 7/8: DAC2 @ 0xFFC8). */
  addr?: number;
  /** Voltage range the byte 0x00-0xFF maps to. 0..5V for Lab 7 (sawtooth/triangular), -5..5V for Lab 8 (square). */
  vmin?: number;
  vmax?: number;
  /** Visible time window in ms. */
  windowMs?: number;
}

interface Sample {
  t: number;
  v: number;
}

/**
 * Canvas oscilloscope for the DAC waveform experiments (Lab 7 sawtooth/triangular, Lab 8 square).
 * Reference implementation: docs/04_INTERFACING_WIDGETS_SPEC.md §2 -- adapted from that doc's
 * Astro-era `document.addEventListener('emu-write', ...)` CustomEvent design to this project's
 * actual transport (iframe postMessage via src/lib/emubus.ts's useEmuWrites), and from a plain
 * class to a React component. The plotted shape is entirely a function of what the manual's own
 * program writes to FFC8H -- this widget has no waveform logic of its own, it just plots samples.
 */
export default function DacScope({ iframeRef, addr = 0xffc8, vmin = 0, vmax = 5, windowMs = 40 }: DacScopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufRef = useRef<Sample[]>([]);
  const rafRef = useRef(0);
  const [hasSamples, setHasSamples] = useState(false);
  const [latestVoltage, setLatestVoltage] = useState<number | null>(null);

  useEmuWrites(iframeRef, (w) => {
    if (w.bus !== 'xmem' || w.addr !== addr) return;
    const v = vmin + (w.value / 255) * (vmax - vmin);
    bufRef.current.push({ t: w.tMs, v });
    const cutoff = w.tMs - windowMs * 3;
    while (bufRef.current.length && bufRef.current[0].t < cutoff) bufRef.current.shift();
    setHasSamples(true);
    setLatestVoltage(v);
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      ctx.strokeStyle = 'rgba(157, 184, 224, 0.25)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        const x = (W / 10) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let i = 0; i <= 8; i++) {
        const y = (H / 8) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      const buf = bufRef.current;
      if (buf.length < 2) return;
      const tEnd = buf[buf.length - 1].t;
      const tStart = tEnd - windowMs;
      const xOf = (t: number) => ((t - tStart) / windowMs) * W;
      const yOf = (v: number) => H - ((v - vmin) / (vmax - vmin)) * H;

      ctx.strokeStyle = '#f0b429';
      ctx.lineWidth = 2;
      ctx.beginPath();
      let started = false;
      for (const p of buf) {
        if (p.t < tStart) continue;
        const x = xOf(p.t);
        const y = yOf(p.v);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    };

    if (prefersReducedMotion) {
      // Redraw only when new samples arrive instead of a continuous rAF loop.
      const interval = window.setInterval(draw, 250);
      return () => window.clearInterval(interval);
    }

    const loop = () => {
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(rafRef.current);
  }, [vmin, vmax, windowMs]);

  return (
    <div className="rounded-lab border border-border bg-bg">
      <div className="border-b border-border px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">DAC Oscilloscope</span>
      </div>
      <canvas ref={canvasRef} width={640} height={220} className="w-full bg-brand-900" />
      <p className="border-t border-border px-3 py-1.5 text-xs text-text-muted">
        {hasSamples
          ? `Live -- latest sample ≈ ${latestVoltage?.toFixed(2)} V (range ${vmin}V to ${vmax}V)`
          : 'Run the program to see the waveform.'}
      </p>
    </div>
  );
}
