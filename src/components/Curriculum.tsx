'use client';

import { useState } from 'react';

interface UnitEntry {
  unit: number;
  title: string;
  hours: string;
  topics: string;
  lab: string;
}

// Pilot shows only Units 1-2 (docs/14_QA_ROUND3_AND_DLMS_MATCH.md A5 / 12_REDESIGN_BRIEF.md §6) —
// Units 3-5 exist in the syllabus but are not displayed here at all until they release; no
// "coming soon" placeholders. Full text for those units is kept in the docs for when they do.
const units: UnitEntry[] = [
  {
    unit: 1,
    title: '8086 Processor',
    hours: '15h',
    topics:
      'Evolution, signal description, architecture, addressing modes, min/max mode, instruction set (data transfer, arithmetic, logical, string, control transfer), 8086 interrupts.',
    lab: '16-bit addition; block transfer; sum of n; sort even/odd; data-transfer & logical ops.',
  },
  {
    unit: 2,
    title: '8051 Microcontroller',
    hours: '15h',
    topics:
      'µP vs µC, signal description, architecture, addressing modes, register set, instruction set, SFRs, interrupts, memory interfacing.',
    lab: "8-bit addition; 8-bit subtraction; 1's & 2's complement; Fibonacci.",
  },
];

const courseOutcomes = [
  { code: 'CO1', text: 'Describe 8086 fundamentals.' },
  { code: 'CO2', text: 'Implement 8051 concepts.' },
  { code: 'CO3', text: 'Analyse interfacing devices.' },
  { code: 'CO4', text: 'Apply RISC/ARM programming.' },
  { code: 'CO5', text: 'Implement ARM for biomedical applications.' },
];

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
                      <span className="rounded-full bg-ok/15 px-2.5 py-0.5 text-xs font-semibold text-ok-text">
                        Live
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

        <div className="mt-8 rounded-lab border border-border bg-bg p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Course Outcomes</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {courseOutcomes.map((co) => (
              <li key={co.code} className="text-sm text-text">
                <strong className="text-brand-700">{co.code}</strong> — {co.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
