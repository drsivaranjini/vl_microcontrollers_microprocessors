'use client';

import { useState } from 'react';

interface QA {
  q: string;
  a: string;
}

export default function VivaAccordion({ items }: { items: QA[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="viva-accordion divide-y divide-border rounded-lab border border-border">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i}>
            <h3>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left font-medium hover:bg-surface"
                aria-expanded={isOpen}
                aria-controls={`viva-panel-${i}`}
                onClick={() => setOpenIndex(isOpen ? null : i)}
              >
                <span>{item.q}</span>
                <span className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true">
                  ▾
                </span>
              </button>
            </h3>
            {isOpen && (
              <div id={`viva-panel-${i}`} role="region" className="px-4 pb-4 text-text-muted">
                <p>{item.a}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
