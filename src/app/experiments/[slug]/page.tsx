import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ExperimentLayout from '@/components/ExperimentLayout';
import { getExperiment, releasedExperiments } from '@/content/experiments/meta';
import { experimentContent } from '@/content/experiments/registry';
import { isUnitReleased } from '@/lib/features';

// Any slug not returned by generateStaticParams below 404s statically -- a hidden unit's routes
// are never built, never served, and never leak via a direct URL hit (docs/17_... §7.3).
export const dynamicParams = false;

export function generateStaticParams() {
  return releasedExperiments.map((e) => ({ slug: e.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const experiment = getExperiment(slug);
  if (!experiment) return {};
  return { title: experiment.title, description: experiment.aim };
}

export default async function ExperimentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const experiment = getExperiment(slug);
  const Content = experimentContent[slug];

  // Defense in depth beyond generateStaticParams/dynamicParams=false (docs/17_... §7.3): even if
  // something ever called this with a hidden slug, it still refuses to render it.
  if (!experiment || !isUnitReleased(experiment.unit) || !Content) {
    notFound();
  }

  return (
    <ExperimentLayout
      id={experiment.id}
      title={experiment.title}
      unit={experiment.unit}
      device={experiment.device}
      aim={experiment.aim}
    >
      <Content />
    </ExperimentLayout>
  );
}
