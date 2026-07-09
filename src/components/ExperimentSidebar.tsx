'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { experimentsByUnit } from '@/content/experiments/meta';

const unitTitles: Record<1 | 2 | 3 | 4, string> = {
  1: 'Unit 1 — 8086',
  2: 'Unit 2 — 8051',
  3: 'Unit 3 — Interfacing',
  4: 'Unit 4 — ARM',
};

function SidebarList() {
  const pathname = usePathname();

  return (
    <nav aria-label="Experiments">
      {([1, 2, 3, 4] as const).map((unit) => {
        const list = experimentsByUnit(unit);
        if (list.length === 0) return null;
        return (
          <div key={unit} className="mb-6">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
              {unitTitles[unit]}
            </p>
            <ul className="space-y-0.5">
              {list.map((e) => {
                const href = `/experiments/${e.id}`;
                const isActive = pathname === href;
                const isLive = e.status === 'live';
                return (
                  <li key={e.id}>
                    {isLive ? (
                      <Link
                        href={href}
                        className={`block rounded-lab px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? 'bg-brand-700 font-semibold text-white'
                            : 'text-text hover:bg-surface-2'
                        }`}
                      >
                        {e.title}
                      </Link>
                    ) : (
                      <span className="block cursor-not-allowed rounded-lab px-3 py-2 text-sm text-text-muted opacity-60">
                        {e.title}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export default function ExperimentSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop: sticky sidebar */}
      <aside className="hidden shrink-0 lg:block lg:w-64">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto py-6 pr-2">
          <SidebarList />
        </div>
      </aside>

      {/* Mobile: drawer toggle */}
      <div className="mb-4 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="experiment-drawer"
          className="flex w-full items-center justify-between rounded-lab border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text"
        >
          Browse experiments
          <span aria-hidden="true">{open ? '▴' : '▾'}</span>
        </button>
        {open && (
          <div id="experiment-drawer" className="mt-2 max-h-[70vh] overflow-y-auto rounded-lab border border-border bg-bg p-3">
            <SidebarList />
          </div>
        )}
      </div>
    </>
  );
}
