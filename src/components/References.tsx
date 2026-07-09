const references = [
  {
    text: 'A.K. Ray, K.M. Bhurchandi, Advanced Microprocessor and Peripherals, Tata McGraw Hill, 3rd ed., 2013.',
  },
  {
    text: 'Douglas V. Hall, Microprocessor and Interfacing: Programming and Hardware, Glencoe, 2nd ed., 2006.',
  },
  {
    text: "Andrew N. Sloss, Dominic Symes, Chris Wright, ARM System Developer's Guide, Elsevier, 1st ed., 2007.",
  },
  {
    text: 'Muhammad Ali Mazidi, Janice Gillispie Mazidi, The 8051 Microcontroller and Embedded Systems, Pearson.',
  },
];

export default function References() {
  return (
    <section id="references" className="scroll-mt-20 bg-bg py-16 sm:py-20">
      <div className="mx-auto max-w-(--container-lab) px-4 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">References</p>
        <h2 className="mt-1 text-2xl font-bold text-brand-900 sm:text-3xl">Textbooks</h2>
        <ol className="mt-6 max-w-3xl list-decimal space-y-3 pl-5 text-text">
          {references.map((r, i) => (
            <li key={i} className="pl-1">
              {r.text}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
