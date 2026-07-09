'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const links = [
  { href: '/', label: 'Home' },
  { href: '/#overview', label: 'Overview' },
  { href: '/#curriculum', label: 'Curriculum' },
  { href: '/#experiments', label: 'Experiments' },
  { href: '/#faculty', label: 'Faculty' },
  { href: '/#references', label: 'References' },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-bg/95 backdrop-blur transition-shadow ${
        scrolled ? 'border-border shadow-(--shadow)' : 'border-transparent'
      }`}
    >
      <div
        className={`mx-auto flex max-w-(--container-lab) items-center justify-between gap-4 px-4 transition-[padding] sm:px-6 ${
          scrolled ? 'py-2' : 'py-3'
        }`}
      >
        <Link href="/" className="flex items-center gap-3">
          {/* TODO: replace with the official SRM Institute + BME department logo image files
              (see docs/12_REDESIGN_BRIEF.md §4) — none were available to source automatically. */}
          <span className="flex h-9 w-9 items-center justify-center rounded-lab bg-brand-700 text-sm font-bold text-white">
            SRM
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="text-sm font-semibold text-brand-900">21BMC302J Virtual Lab</span>
            <span className="text-xs text-text-muted">Dept. of Biomedical Engineering</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-6 text-sm font-medium">
            {links.map((l) => (
              <li key={l.href}>
                <Link className="text-text transition-colors hover:text-accent-text" href={l.href}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lab border border-border p-2 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="sr-only">Toggle menu</span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Primary mobile" className="border-t border-border md:hidden">
          <ul className="flex flex-col gap-1 px-4 py-3 text-sm font-medium">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  className="block rounded-lab px-2 py-2 hover:bg-surface"
                  href={l.href}
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
