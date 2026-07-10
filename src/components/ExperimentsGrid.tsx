import { experimentsByUnit } from '@/content/experiments/meta';
import { isUnitReleased } from '@/lib/features';
import ExperimentCard from './ExperimentCard';

const unitTitles: Record<1 | 2 | 3 | 4, string> = {
  1: 'Unit 1 — 8086 Microprocessor',
  2: 'Unit 2 — 8051 Microcontroller',
  3: 'Unit 3 — Interfacing Devices',
  4: 'Unit 4 — ARM Microcontroller',
};

export default function ExperimentsGrid() {
  return (
    <section id="experiments" className="scroll-mt-20 bg-bg py-16 sm:py-20">
      <div className="mx-auto max-w-(--container-lab) px-4 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent-text">Virtual Experiments</p>
        <h2 className="mt-1 text-2xl font-bold text-brand-900 sm:text-3xl">Run an experiment</h2>
        <p className="mt-2 max-w-2xl text-text-muted">
          Read the theory, run the program, and observe the result directly in your browser.
        </p>

        {([1, 2, 3, 4] as const).map((unit) => {
          // Pilot shows only released units (docs/14_QA_ROUND3_AND_DLMS_MATCH.md A5, docs/17 §7) —
          // no greyed/"coming soon" cards, Units 3-4 simply don't appear until released.
          if (!isUnitReleased(unit)) return null;
          const list = experimentsByUnit(unit);
          if (list.length === 0) return null;
          return (
            <div key={unit} className="mt-10">
              <h3 className="mb-4 text-lg font-semibold text-brand-700">{unitTitles[unit]}</h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((e) => (
                  <ExperimentCard key={e.id} experiment={e} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
