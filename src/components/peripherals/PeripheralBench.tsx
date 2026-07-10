'use client';

import type { Peripheral } from '@/content/experiments/types';
import ExternalMemory from './ExternalMemory';
import DacScope from './DacScope';

export interface PeripheralBenchProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  emuReady: boolean;
  peripherals: Peripheral[];
}

/**
 * Renders the configured peripherals for an experiment in a responsive grid below the emulator
 * (docs/17_PERIPHERAL_SUBSYSTEM_IMPLEMENTATION.md §3-4). Each peripheral is a subscriber to the
 * same emu-write stream (src/lib/emubus.ts) -- adding a new output type is adding a case here.
 */
export default function PeripheralBench({ iframeRef, emuReady, peripherals }: PeripheralBenchProps) {
  if (peripherals.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {peripherals.map((p, i) => {
        if (p.kind === 'xmem') {
          return <ExternalMemory key={i} iframeRef={iframeRef} emuReady={emuReady} watch={p.watch} preset={p.preset} />;
        }
        if (p.kind === 'dac-scope') {
          return <DacScope key={i} iframeRef={iframeRef} addr={p.addr} vmin={p.vmin} vmax={p.vmax} />;
        }
        return null;
      })}
    </div>
  );
}
