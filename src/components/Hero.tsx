import Link from 'next/link';
import { liveExperiments } from '@/content/experiments/meta';
import { assets } from '@/lib/assets';
import Logos from './Logos';
import WaveDivider from './WaveDivider';

export default function Hero() {
  const liveUnits = new Set(liveExperiments.map((e) => e.unit)).size;

  // Credits/Semester dropped from hero stats — docs/14_QA_ROUND3_AND_DLMS_MATCH.md A3 (course
  // code/credits still live in the Overview section, just not the hero).
  const stats = [
    { label: 'Experiments released', value: String(liveExperiments.length) },
    { label: 'Units live', value: String(liveUnits) },
  ];

  return (
    <section className="hero-starfield relative overflow-hidden text-text-on-dark">
      <div className="relative mx-auto max-w-(--container-lab) px-4 py-16 sm:px-6 sm:py-20">
        <Logos srmLogo={assets.srmLogo} bmeLogo={assets.bmeLogo} onDark size={40} />

        <p className="mt-6 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted-on-dark backdrop-blur">
          B.Tech Biomedical Engineering · Semester V · 21BMC302J
        </p>

        <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
          <span className="block text-text-on-dark">21BMC302J Virtual Lab</span>
          <span className="block text-accent">Microcontrollers &amp; its Application in Medicine</span>
        </h1>

        <p className="mt-4 max-w-2xl text-base text-text-muted-on-dark sm:text-lg">
          Run the manual&apos;s practical experiments — 8086 assembly, 8051 microcontroller programming, and
          more — directly in your browser, as open practice alongside the physical lab.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/#experiments"
            className="rounded-lab bg-accent px-6 py-3 font-semibold text-brand-900 shadow-(--shadow) transition hover:bg-accent-600"
          >
            Start Experiments
          </Link>
          <Link
            href="/#overview"
            className="rounded-lab border border-white/30 px-6 py-3 font-semibold text-text-on-dark transition hover:bg-white/10"
          >
            Course Overview
          </Link>
          <Link
            href="/#curriculum"
            className="rounded-lab border border-white/30 px-6 py-3 font-semibold text-text-on-dark transition hover:bg-white/10"
          >
            Curriculum
          </Link>
        </div>

        <dl className="mt-10 flex flex-wrap gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-lab border border-white/15 bg-white/5 px-5 py-3 backdrop-blur"
            >
              <dt className="text-sm text-text-muted-on-dark">{s.label}</dt>
              <dd className="text-2xl font-semibold text-accent">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <WaveDivider />
    </section>
  );
}
