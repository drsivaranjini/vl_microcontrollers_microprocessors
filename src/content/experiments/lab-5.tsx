import Editor8051 from '@/components/Editor8051';
import VivaAccordion from '@/components/VivaAccordion';
import { P, RegistersTable, OutputTable } from '@/components/md';

const sample = `ORG 4100H
MOV DPTR, #6500H  ; point at the input byte
MOVX A, @DPTR      ; read it
CPL A              ; A = 1's complement
INC DPTR
MOVX @DPTR, A      ; write the 1's complement
INC A              ; A = 2's complement
INC DPTR
MOVX @DPTR, A      ; write the 2's complement
RET
END
`;

export default function Content() {
  return (
    <>
      <section>
        <h2>Theory</h2>
        <P>
          {
            "The 1's complement of a binary number flips every bit (`CPL A` does exactly this to the accumulator). The 2's complement is the 1's complement plus 1 (`INC A`) — the standard way to represent a negative number so that addition naturally handles subtraction. The program reads one input byte via `MOVX A,@DPTR`, complements it, writes the 1's complement out, increments the accumulator for the 2's complement, and writes that out too."
          }
        </P>
        <blockquote>
          <strong>Note on this listing:</strong> the manual&apos;s mnemonic table advances{' '}
          <code>DPTR</code> with <code>INC DPTR</code> before each <code>MOVX @DPTR,A</code> write, so
          tracing the program shows the 1&apos;s complement lands one byte after the input address, and
          the 2&apos;s complement one byte after that — e.g. input at <code>6500H</code> → 1&apos;s
          complement at <code>6501H</code> → 2&apos;s complement at <code>6502H</code>. (The
          manual&apos;s own printed output table labels these <code>6500H</code>/<code>6501H</code>,
          which would only be true if the writes happened before the <code>INC DPTR</code>s — a
          labelling slip against its own listing.) Load your input byte at <code>6500H</code> before
          running, then check <code>6501H</code>/<code>6502H</code> for the results.
        </blockquote>
      </section>

      <section>
        <h2>Registers / Instructions Used</h2>
        <RegistersTable
          rows={[
            { m: 'MOV DPTR,#6500H', d: 'Point the data pointer at the input byte.' },
            { m: 'MOVX A,@DPTR', d: 'Read the input byte into the accumulator.' },
            { m: 'CPL A', d: "Complement every bit of the accumulator (1's complement)." },
            { m: 'INC DPTR', d: 'Advance the pointer to the next output slot.' },
            { m: 'MOVX @DPTR,A', d: "Write the 1's complement." },
            { m: 'INC A', d: "Add 1 to the accumulator (1's complement → 2's complement)." },
            { m: 'INC DPTR', d: 'Advance the pointer to the next output slot.' },
            { m: 'MOVX @DPTR,A', d: "Write the 2's complement." },
            { m: 'RET', d: 'Return to the caller.' },
          ]}
        />
      </section>

      <section>
        <h2>▶ Write, Assemble &amp; Run</h2>
        <p className="mb-2 text-sm text-text-muted">
          The input byte (<code>03H</code>) is preloaded at external address <code>6500H</code>{' '}
          automatically — see the External Memory panel below. Assemble &amp; load, then run.
        </p>
        <Editor8051
          initialSource={sample}
          resultHint="results land in external memory (MOVX) — see the External Memory panel below (or switch the emulator's own Memory dropdown from RAM to XRAM)."
          peripherals={[{ kind: 'xmem', watch: [0x6500, 0x6501, 0x6502], preset: [{ addr: 0x6500, value: 0x03 }] }]}
        />
      </section>

      <section>
        <h2>Expected Output / Observation</h2>
        <OutputTable
          headers={['Address', 'Value', 'Meaning']}
          rows={[
            { cells: ['`6500H`', '`03H`', 'Input (unchanged)'] },
            { cells: ['`6501H`', '`FCH`', "1's complement of 03H"] },
            { cells: ['`6502H`', '`FDH`', "2's complement of 03H"] },
          ]}
        />
      </section>

      <section>
        <h2>Viva Questions</h2>
        <VivaAccordion
          items={[
            {
              q: "What is the 1's complement, in one sentence?",
              a: 'The bitwise NOT of every bit in the number — 03H (0000 0011) becomes FCH (1111 1100).',
            },
            {
              q: "Why is the 2's complement just the 1's complement plus one?",
              a: "That is its definition for binary numbers, and it is exactly what makes two's-complement subtraction work as ordinary addition — adding a number to its two's complement always yields zero (mod 2^n).",
            },
            {
              q: 'Is the accumulator in the 8051 bit-addressable?',
              a: 'Yes — the accumulator (address E0H in SFR space) is one of the bit-addressable special function registers, so individual bits of A can be tested/set with bit instructions, not just whole-byte ones.',
            },
          ]}
        />
      </section>
    </>
  );
}
