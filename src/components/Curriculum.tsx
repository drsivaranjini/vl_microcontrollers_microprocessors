'use client';

import { useState } from 'react';

interface UnitEntry {
  unit: number;
  title: string;
  hours: string;
  topics: string;
  lab: string;
  labStatus: 'live' | 'coming-soon' | 'theory-only';
}

const units: UnitEntry[] = [
  {
    unit: 1,
    title: '8086 Processor',
    hours: '15h',
    topics:
      'Evolution, signal description, architecture, addressing modes, min/max mode, instruction set (data transfer, arithmetic, logical, string, control transfer), 8086 interrupts.',
    lab: '16-bit addition; block transfer; sum of n; sort even/odd; data-transfer & logical ops.',
    labStatus: 'live',
  },
  {
    unit: 2,
    title: '8051 Microcontroller',
    hours: '15h',
    topics:
      'µP vs µC, signal description, architecture, addressing modes, register set, instruction set, SFRs, interrupts, memory interfacing.',
    lab: "8-bit addition; 8-bit subtraction; 1's & 2's complement; Fibonacci.",
    labStatus: 'live',
  },
  {
    unit: 3,
    title: 'Interfacing Devices',
    hours: '15h',
    topics: '8251, timers, I/O ports, ADC, stepper motor, keyboard, LCD.',
    lab: 'Waveform generation (DAC); stepper motor.',
    labStatus: 'coming-soon',
  },
  {
    unit: 4,
    title: 'ARM Microcontroller',
    hours: '15h',
    topics: 'RISC vs CISC, ARM design, core/data-flow, processor modes, registers, ARM & Thumb instruction sets, exceptions.',
    lab: 'Sum + factorial; factorial + parity; largest/smallest of two.',
    labStatus: 'coming-soon',
  },
  {
    unit: 5,
    title: 'Applications in Medicine',
    hours: '15h',
    topics:
      'Mobile bio-signal recording, pulse oximeter (ARM), EOG appliances (PIC), EEG analysis, heart-rate monitor (ARM).',
    lab: 'Theory only — hardware mini-project, not virtualised.',
    labStatus: 'theory-only',
  },
];

const statusLabel: Record<UnitEntry['labStatus'], string> = {
  live: 'Live',
  'coming-soon': 'Coming soon',
  'theory-only': 'Theory only',
};

const statusClass: Record<UnitEntry['labStatus'], string> = {
  // text-ok/text-warn on their own tint backgrounds fall short of WCAG AA for this small text
  // (~3.4:1/~2.7:1) — use the darker -text variants instead (QA round 2 C5).
  live: 'bg-ok/15 text-ok-text',
  'coming-soon': 'bg-warn/15 text-warn-text',
  'theory-only': 'bg-border text-text-muted',
};

export default function Curriculum() {
  const [openUnit, setOpenUnit] = useState<number | null>(1);

  return (
    <section id="curriculum" className="scroll-mt-20 bg-surface py-16 sm:py-20">
      <div className="mx-auto max-w-(--container-lab) px-4 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent-text">Curriculum</p>
        <h2 className="mt-1 text-2xl font-bold text-brand-900 sm:text-3xl">Units at a glance</h2>

        <div className="mt-8 divide-y divide-border rounded-lab border border-border bg-bg">
          {units.map((u) => {
            const isOpen = openUnit === u.unit;
            return (
              <div key={u.unit}>
                <h3>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-surface"
                    aria-expanded={isOpen}
                    aria-controls={`curriculum-panel-${u.unit}`}
                    onClick={() => setOpenUnit(isOpen ? null : u.unit)}
                  >
                    <span className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-900">
                        Unit {u.unit}
                      </span>
                      <span className="font-semibold text-text">{u.title}</span>
                      <span className="text-xs text-text-muted">{u.hours}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass[u.labStatus]}`}>
                        {statusLabel[u.labStatus]}
                      </span>
                    </span>
                    <span className={`shrink-0 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true">
                      ▾
                    </span>
                  </button>
                </h3>
                {isOpen && (
                  <div id={`curriculum-panel-${u.unit}`} className="px-5 pb-5 text-sm text-text-muted">
                    <p>{u.topics}</p>
                    <p className="mt-2">
                      <strong className="text-text">Lab:</strong> {u.lab}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
