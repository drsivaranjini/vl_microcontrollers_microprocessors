import Link from 'next/link';
import type { ExperimentMeta } from '@/content/experiments/types';

// Badge colors are deliberately solid (not translucent tints on an unpredictable background) —
// QA round 2 C5 found the previous 8051 badge was near-invisible dark-on-dark. Solid brand-900/
// white pairs guarantee WCAG AA contrast (~12:1) regardless of what section a card ends up in.
export default function ExperimentCard({ experiment }: { experiment: ExperimentMeta }) {
  const isLive = experiment.status === 'live';

  const badges = (
    <div className="mb-2 flex items-center gap-2">
      <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-900">
        Unit {experiment.unit}
      </span>
      <span className="rounded-full bg-brand-900 px-2.5 py-0.5 text-xs font-semibold text-white">
        {experiment.device}
      </span>
    </div>
  );

  if (!isLive) {
    return (
      <div
        aria-disabled="true"
        className="flex cursor-not-allowed flex-col justify-between rounded-lab border border-dashed border-border bg-surface/60 p-5 opacity-70"
      >
        <div>
          {badges}
          <h3 className="text-lg font-semibold text-text-muted">{experiment.title}</h3>
          <p className="mt-1 text-sm text-text-muted">{experiment.aim}</p>
        </div>
        <span className="mt-4 inline-flex w-fit items-center gap-1 rounded-lab bg-border px-4 py-2 text-sm font-semibold text-text-muted">
          Coming soon
        </span>
      </div>
    );
  }

  return (
    <article className="flex flex-col justify-between rounded-lab border border-border bg-bg p-5 shadow-(--shadow) transition hover:-translate-y-0.5 hover:shadow-lg">
      <div>
        {badges}
        <h3 className="text-lg font-semibold text-text">{experiment.title}</h3>
        <p className="mt-1 text-sm text-text-muted">{experiment.aim}</p>
      </div>
      <Link
        href={`/experiments/${experiment.id}`}
        className="mt-4 inline-flex w-fit items-center gap-1 rounded-lab bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-900"
      >
        Launch →
      </Link>
    </article>
  );
}
