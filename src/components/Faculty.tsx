import { assets } from '@/lib/assets';

// Real content confirmed in docs/14_QA_ROUND3_AND_DLMS_MATCH.md PART C.
const faculty = {
  name: 'Dr. Sivaranjini S',
  designation: 'Assistant Professor',
  department:
    'Department of Biomedical Engineering, Faculty of Engineering & Technology, SRM IST, Kattankulathur – Chennai',
  email: 'sivarans4@srmist.edu.in',
  specialisation: 'Biomedical Image Processing, Artificial Intelligence & Machine Learning',
  bio: 'Dr. S. Sivaranjini is an Assistant Professor in the Department of Biomedical Engineering at SRM Institute of Science and Technology. She holds a B.E. in Electronics and Communication Engineering, an M.E. in Medical Electronics, and a Ph.D. in Biomedical Image Processing. Her research focuses on neuroimaging and biomedical image analysis, with an emphasis on neurological pattern analysis and rehabilitation-oriented engineering solutions. Her interests include biomedical image processing, biomedical instrumentation, machine learning, computer vision, deep learning, and AI for healthcare.',
  coursesTaught: [
    'Microcontrollers and its Applications in Medicine',
    'Biomedical Devices',
    'Data Science',
    'AI & ML for Healthcare',
  ],
  links: [
    { label: 'Faculty Profile', href: 'https://www.srmist.edu.in/faculty/dr-sivaranjini-s/' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/sivaranjini-s-033273128' },
    { label: 'Google Scholar', href: 'https://scholar.google.co.in/citations?user=2COywiAAAAAJ&hl=en' },
    { label: 'ResearchGate', href: 'https://www.researchgate.net/profile/Sivaranjini-Sivapragasam-2' },
  ],
};

const initials = faculty.name
  .replace('Dr.', '')
  .trim()
  .split(' ')
  .map((w) => w[0])
  .join('')
  .slice(0, 2);

export default function Faculty() {
  const photo = assets.facultyPhoto;

  return (
    <section id="faculty" className="scroll-mt-20 bg-surface py-16 sm:py-20">
      <div className="mx-auto max-w-(--container-lab) px-4 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent-text">Faculty</p>
        <h2 className="mt-1 text-2xl font-bold text-brand-900 sm:text-3xl">Course Coordinator</h2>

        <div className="mt-8 flex flex-col gap-6 rounded-lab border border-border bg-bg p-6 shadow-(--shadow) sm:flex-row sm:p-8">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt={faculty.name}
              className="h-28 w-28 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-brand-100 text-3xl font-semibold text-brand-700">
              {initials}
            </div>
          )}

          <div>
            <p className="text-lg font-semibold text-text">{faculty.name}</p>
            <p className="text-sm text-text-muted">{faculty.designation}</p>
            <p className="mt-1 text-sm text-text-muted">{faculty.department}</p>
            <a href={`mailto:${faculty.email}`} className="mt-1 inline-block text-sm text-accent-text hover:underline">
              {faculty.email}
            </a>

            <p className="mt-3 text-sm">
              <span className="font-semibold text-text">Specialisation: </span>
              <span className="text-text-muted">{faculty.specialisation}</span>
            </p>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">{faculty.bio}</p>

            <p className="mt-3 text-sm">
              <span className="font-semibold text-text">Courses taught: </span>
              <span className="text-text-muted">{faculty.coursesTaught.join(', ')}</span>
            </p>

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
              {faculty.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-brand-700 hover:underline"
                >
                  {link.label} ↗
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
