export default function Overview() {
  return (
    <section id="overview" className="scroll-mt-20 bg-bg py-16 sm:py-20">
      <div className="mx-auto max-w-(--container-lab) px-4 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent-text">Course Overview</p>
        <h2 className="mt-1 text-2xl font-bold text-brand-900 sm:text-3xl">About this course</h2>
        <div className="mt-6 grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4 text-text">
            <p>
              <strong>21BMC302J — Microcontrollers and its Application in Medicine</strong> is a Professional
              Core course (L-T-P-C 3-0-2-4, Regulation 2021) offered by the Department of Biomedical
              Engineering, SRM Institute of Science and Technology. It builds the foundations of the{' '}
              <strong>8086 microprocessor</strong> and <strong>8051 microcontroller</strong>, their instruction
              sets and interfacing, and progresses to the <strong>ARM</strong> architecture and its use in
              biomedical instrumentation.
            </p>
            <p>
              This virtual lab lets students run the practical experiments — assembly programming,
              arithmetic/logic, and interfacing — directly in the browser, as open practice alongside the
              physical lab.
            </p>
          </div>
          <div className="rounded-lab border border-border bg-surface p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
              Course Learning Rationale
            </h3>
            <p className="mt-2 text-sm text-text-muted">
              Fundamentals of 8086; concepts of 8051; interfacing devices; microcontroller instruction set;
              ARM in biomedical applications.
            </p>
            <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide text-text-muted">
              Course Outcomes
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-text-muted">
              <li>
                <strong className="text-text">CO1</strong> — Describe 8086 fundamentals
              </li>
              <li>
                <strong className="text-text">CO2</strong> — Implement 8051 concepts
              </li>
              <li>
                <strong className="text-text">CO3</strong> — Analyse interfacing devices
              </li>
              <li>
                <strong className="text-text">CO4</strong> — Apply RISC/ARM programming
              </li>
              <li>
                <strong className="text-text">CO5</strong> — Implement ARM for biomedical applications
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
