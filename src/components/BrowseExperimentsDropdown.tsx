'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { experimentsByUnit } from '@/content/experiments/meta';
import { isUnitReleased } from '@/lib/features';

const unitTitles: Record<1 | 2 | 3 | 4, string> = {
  1: 'Unit 1 — 8086',
  2: 'Unit 2 — 8051',
  3: 'Unit 3 — Interfacing',
  4: 'Unit 4 — ARM',
};

// Top-bar-only navigation between experiments (docs/14_QA_ROUND3_AND_DLMS_MATCH.md A6 — no
// sidebar, match DLMS). Lives in Nav.tsx so it's reachable from any page, not just experiment ones.
export default function BrowseExperimentsDropdown() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-1 text-sm font-medium text-text transition-colors hover:text-accent-text"
      >
        Browse experiments
        <span aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-lab border border-border bg-bg p-3 shadow-(--shadow)">
          {([1, 2, 3, 4] as const).map((unit) => {
            if (!isUnitReleased(unit)) return null;
            const list = experimentsByUnit(unit);
            if (list.length === 0) return null;
            return (
              <div key={unit} className="mb-3 last:mb-0">
                <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  {unitTitles[unit]}
                </p>
                <ul className="space-y-0.5">
                  {list.map((e) => {
                    const href = `/experiments/${e.id}`;
                    const isActive = pathname === href;
                    return (
                      <li key={e.id}>
                        <Link
                          href={href}
                          onClick={() => setOpen(false)}
                          className={`block rounded-lab px-2 py-1.5 text-sm transition-colors ${
                            isActive ? 'bg-brand-700 font-semibold text-white' : 'text-text hover:bg-surface-2'
                          }`}
                        >
                          {e.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
