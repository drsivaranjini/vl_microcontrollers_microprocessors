import Link from 'next/link';
import { liveExperiments } from '@/content/experiments/meta';

export default function Hero() {
  const liveUnits = new Set(liveExperiments.map((e) => e.unit)).size;

  const stats = [
    { label: 'Experiments released', value: String(liveExperiments.length) },
    { label: 'Units live', value: String(liveUnits) },
    { label: 'Credits', value: '3-0-2-4' },
    { label: 'Semester', value: 'V' },
  ];

  return (
    <section className="bg-gradient-to-b from-brand-900 to-brand-700 text-text-on-dark">
      <div className="mx-auto max-w-(--container-lab) px-4 py-16 sm:px-6 sm:py-20">
        <p className="text-sm font-semibold uppercase tracking-wide text-text-muted-on-dark">
          Department of Biomedical Engineering · 21BMC302J
        </p>
        <h1 className="mt-2 max-w-3xl text-3xl font-bold sm:text-4xl lg:text-5xl">
          Microcontrollers &amp; its Application in Medicine — Virtual Lab
        </h1>
        <p className="mt-4 max-w-2xl text-base text-text-muted-on-dark sm:text-lg">
          Run the manual&apos;s practical experiments — 8086 assembly, 8051 microcontroller programming, and
          more — directly in your browser, as open practice alongside the physical lab.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/#experiments"
            className="rounded-lab bg-accent px-6 py-3 font-semibold text-brand-900 shadow-(--shadow) transition hover:brightness-95"
          >
            Start Experiments
          </Link>
          <Link
            href="/#overview"
            className="rounded-lab border border-white/30 px-6 py-3 font-semibold text-text-on-dark transition hover:bg-white/10"
          >
            Course Overview
          </Link>
        </div>
        <dl className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-8">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="text-sm text-text-muted-on-dark">{s.label}</dt>
              <dd className="text-2xl font-semibold">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
