import Editor8051 from '@/components/Editor8051';
import VivaAccordion from '@/components/VivaAccordion';
import { P, RegistersTable, OutputTable } from '@/components/md';

const sample = `ORG 4100H
MOV R0,#0AH    ; 10 more terms to generate
MOV R1,#20H    ; series starts at internal RAM 20H
MOV @R1,#00H   ; term[0] = 0
INC R1
MOV @R1,#01H   ; term[1] = 1
BACK:
MOV A,@R1      ; A = most recent term
DEC R1
ADD A,@R1      ; A += term before that
INC R1
INC R1
MOV @R1,A      ; store the new term
DJNZ R0,BACK   ; loop for the remaining terms
HERE:
SJMP HERE      ; halt
END
`;

export default function Content() {
  return (
    <>
      <section>
        <h2>Theory</h2>
        <P>
          {
            "The first two terms (`0`, `1`) are written directly to internal RAM starting at `20H`, addressed indirectly through `R1` (`@R1`). Each loop iteration reads the *previous* term (`R1` stepped back by one) into the accumulator, adds the term before that, and stores the new term two slots ahead of where it started — walking `R1` forward by the same two-step pattern each pass. `R0` counts down the number of additional terms to generate, and `DJNZ R0,BACK` repeats until it reaches zero."
          }
        </P>
        <blockquote>
          <strong>Note:</strong> the manual&apos;s own opcode column prints <code>7A</code> for{' '}
          <code>MOV R1,#20H</code> — that is actually the encoding for <code>MOV R2,#20H</code>{' '}
          (register R2, not R1). Every other instruction in this same listing (<code>INC R1</code>,{' '}
          <code>MOV A,@R1</code>, <code>DEC R1</code>, <code>MOV @R1,A</code>) is unambiguously
          R1-based and matches the manual&apos;s own prose exactly, so this looks like an isolated
          transcription slip in the manual&apos;s opcode table — this listing assembles the correct{' '}
          <code>MOV R1,#20H</code> encoding.
        </blockquote>
      </section>

      <section>
        <h2>Registers / Instructions Used</h2>
        <RegistersTable
          rows={[
            { m: 'MOV R0,#0AH', d: 'Number of additional terms to generate (10, here).' },
            { m: 'MOV R1,#20H', d: 'Point `R1` at the start of the series in internal RAM.' },
            { m: 'MOV @R1,#00H', d: 'Seed the first term (`0`) at `20H`.' },
            { m: 'INC R1', d: 'Advance to the next slot.' },
            { m: 'MOV @R1,#01H', d: 'Seed the second term (`1`) at `21H`.' },
            { m: 'MOV A,@R1', d: 'Read the most recent term (indirect via `R1`).' },
            { m: 'DEC R1', d: 'Step back to the term before that.' },
            { m: 'ADD A,@R1', d: '`A` now holds the new term.' },
            { m: 'INC R1 (×2)', d: 'Step forward two slots to the next unused term.' },
            { m: 'MOV @R1,A', d: 'Store the new term.' },
            { m: 'DJNZ R0,BACK', d: 'Decrement `R0`; loop while more terms remain.' },
            { m: 'SJMP HERE', d: 'Infinite self-loop — halt.' },
          ]}
        />
      </section>

      <section>
        <h2>▶ Write, Assemble &amp; Run</h2>
        <Editor8051 initialSource={sample} />
      </section>

      <section>
        <h2>Expected Output / Observation</h2>
        <OutputTable
          headers={['Address', 'Value']}
          rows={[
            { cells: ['`20H`', '`00H`'] },
            { cells: ['`21H`', '`01H`'] },
            { cells: ['`22H`', '`01H`'] },
            { cells: ['`23H`', '`02H`'] },
            { cells: ['`24H`', '`03H`'] },
            { cells: ['`25H`', '`05H`'] },
            { cells: ['`26H`', '`08H`'] },
            { cells: ['`27H`', '`0DH`'] },
            { cells: ['`28H`', '`15H`'] },
            { cells: ['`29H`', '`22H`'] },
          ]}
        />
      </section>

      <section>
        <h2>Viva Questions</h2>
        <VivaAccordion
          items={[
            {
              q: 'Why does R1 move backward (DEC R1) before the ADD, then forward twice?',
              a: 'DEC R1 reaches the term before the most-recently-read one, so ADD A,@R1 sums the two previous terms; INC R1 twice then lands two slots past where the "most recent" read started — exactly the next unused slot.',
            },
            {
              q: 'What does DJNZ stand for, and what does it do here?',
              a: '"Decrement and Jump if Not Zero" — it decrements R0 and, if the result is not zero, jumps to BACK to generate another term; once R0 reaches zero it falls through and the loop ends.',
            },
            {
              q: 'Why does the series eventually stop being useful past a certain number of terms?',
              a: 'Each term is stored in a single byte, so once a Fibonacci number exceeds 255 (FFH) it silently wraps around (8-bit overflow) rather than growing further — this program does not detect or handle that.',
            },
          ]}
        />
      </section>
    </>
  );
}
