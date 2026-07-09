import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ExperimentLayout from '@/components/ExperimentLayout';
import { getExperiment, liveExperiments } from '@/content/experiments/meta';
import { experimentContent } from '@/content/experiments/registry';

export function generateStaticParams() {
  return liveExperiments.map((e) => ({ slug: e.id }));
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

  if (!experiment || experiment.status !== 'live' || !Content) {
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
