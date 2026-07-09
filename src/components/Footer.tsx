import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-brand-900 text-text-on-dark">
      <div className="mx-auto grid max-w-(--container-lab) gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lab bg-white/10 text-sm font-bold">
              SRM
            </span>
            <div className="leading-tight">
              <p className="font-semibold">21BMC302J Virtual Lab</p>
              <p className="text-sm text-text-muted-on-dark">Dept. of Biomedical Engineering</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-text-muted-on-dark">
            SRM Institute of Science and Technology
            <br />
            SRM Nagar, Kattankulathur – 603203
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-text-muted-on-dark">Quick links</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link className="hover:text-accent" href="/#overview">
                Course Overview
              </Link>
            </li>
            <li>
              <Link className="hover:text-accent" href="/#curriculum">
                Curriculum
              </Link>
            </li>
            <li>
              <Link className="hover:text-accent" href="/#experiments">
                Experiments
              </Link>
            </li>
            <li>
              <Link className="hover:text-accent" href="/#references">
                References
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-text-muted-on-dark">Contact</p>
          <ul className="mt-3 space-y-2 text-sm text-text-muted-on-dark">
            <li>
              <a className="hover:text-accent" href="https://www.srmist.edu.in/" target="_blank" rel="noreferrer">
                srmist.edu.in ↗
              </a>
            </li>
            <li>Course coordinator: to be added — see Faculty section.</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-(--container-lab) px-4 py-4 text-xs text-text-muted-on-dark sm:px-6">
          &copy; {year} SRM Institute of Science and Technology — B.Tech Biomedical Engineering · 21BMC302J
        </div>
      </div>
    </footer>
  );
}
