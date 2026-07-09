import Link from 'next/link';
import { getAdjacentExperiments } from '@/content/experiments/meta';

export default function ExperimentPrevNext({ currentId }: { currentId: string }) {
  const { prev, next } = getAdjacentExperiments(currentId);
  if (!prev && !next) return null;

  return (
    <nav aria-label="Experiment navigation" className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-6">
      {prev ? (
        <Link
          href={`/experiments/${prev.id}`}
          className="min-w-0 rounded-lab border border-border bg-bg px-4 py-3 text-left transition hover:bg-surface"
        >
          <span className="block text-xs text-text-muted">← Previous</span>
          <span className="block truncate text-sm font-semibold text-text">{prev.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={`/experiments/${next.id}`}
          className="min-w-0 rounded-lab border border-border bg-bg px-4 py-3 text-right transition hover:bg-surface"
        >
          <span className="block text-xs text-text-muted">Next →</span>
          <span className="block truncate text-sm font-semibold text-text">{next.title}</span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
