// TODO: replace with the actual course coordinator's details (name, designation, photo, email,
// faculty-profile link) — see docs/12_REDESIGN_BRIEF.md §2.4. Placeholder shape only, mirroring the
// department's existing DLMS-style faculty card.
const faculty = {
  name: 'Course Coordinator Name',
  designation: 'Assistant Professor',
  department: 'Department of Biomedical Engineering, SRM IST',
  email: 'coordinator@srmist.edu.in',
  profileUrl: 'https://www.srmist.edu.in/',
};

export default function Faculty() {
  return (
    <section id="faculty" className="scroll-mt-20 bg-surface py-16 sm:py-20">
      <div className="mx-auto max-w-(--container-lab) px-4 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Faculty</p>
        <h2 className="mt-1 text-2xl font-bold text-brand-900 sm:text-3xl">Course Coordinator</h2>

        <div className="mt-8 flex max-w-md flex-col gap-4 rounded-lab border border-border bg-bg p-6 shadow-(--shadow) sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-brand-100 text-2xl font-semibold text-brand-700">
            {faculty.name
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)}
          </div>
          <div>
            <p className="font-semibold text-text">{faculty.name}</p>
            <p className="text-sm text-text-muted">{faculty.designation}</p>
            <p className="text-sm text-text-muted">{faculty.department}</p>
            <a href={`mailto:${faculty.email}`} className="mt-1 inline-block text-sm text-accent hover:underline">
              {faculty.email}
            </a>
            <div className="mt-3">
              <a
                href={faculty.profileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-brand-700 hover:underline"
              >
                View Faculty Profile ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
