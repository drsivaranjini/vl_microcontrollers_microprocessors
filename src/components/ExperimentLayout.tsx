import ExperimentSidebar from './ExperimentSidebar';
import type { Device } from '@/content/experiments/types';

interface ExperimentLayoutProps {
  title: string;
  unit: number;
  device: Device;
  aim: string;
  objectives?: string[];
  children: React.ReactNode;
}

export default function ExperimentLayout({
  title,
  unit,
  device,
  aim,
  objectives = [],
  children,
}: ExperimentLayoutProps) {
  return (
    <div className="mx-auto max-w-(--container-lab) px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-8 lg:flex-row">
        <ExperimentSidebar />

        <article className="min-w-0 flex-1">
          <header className="mb-8 border-b border-border pb-6">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-900">
                Unit {unit}
              </span>
              <span className="rounded-full bg-brand-900 px-2.5 py-0.5 text-xs font-semibold text-white">
                {device}
              </span>
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>

            <div className="mt-4 rounded-lab border border-border bg-surface p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Aim</h2>
              <p className="mt-1 text-text">{aim}</p>
              {objectives.length > 0 && (
                <ul className="mt-2 list-inside list-disc text-sm text-text-muted">
                  {objectives.map((o) => (
                    <li key={o}>{o}</li>
                  ))}
                </ul>
              )}
            </div>
          </header>

          <div className="experiment-prose max-w-none space-y-6">{children}</div>
        </article>
      </div>
    </div>
  );
}
