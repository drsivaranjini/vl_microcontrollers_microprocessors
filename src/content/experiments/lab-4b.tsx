import Editor8051 from '@/components/Editor8051';
import VivaAccordion from '@/components/VivaAccordion';
import { P, RegistersTable, OutputTable } from '@/components/md';

const sample = `ORG 8000H
MOV A, #22H       ; minuend
MOV R1, #02H      ; subtrahend
MOV R2, #00H      ; borrow = 0
SUBB A, R1        ; A = A - R1 (- any incoming borrow)
JNC Ahead         ; skip if no borrow
INC R2            ; record the borrow
Ahead:
MOV DPTR, #9200H  ; point at the result location
MOVX @DPTR, A     ; write the difference
INC DPTR
MOV A, R2         ; move borrow into A
MOVX @DPTR, A     ; write the borrow
LCALL 00BBH       ; stop
END
`;

export default function Content() {
  return (
    <>
      <section>
        <h2>Theory</h2>
        <P>
          {
            "Mirrors the addition experiment: `22H` is loaded into the accumulator, `02H` into `R1`, and `SUBB A,R1` subtracts `R1` (plus any incoming borrow — `R2` is pre-cleared so there isn't one) from the accumulator. A borrow out of the subtraction clears the carry flag on the 8051's `SUBB`, so `JNC` here detects the *borrow-occurred* case, and the difference plus a borrow flag are written to external memory the same way as the addition experiment."
          }
        </P>
      </section>

      <section>
        <h2>Registers / Instructions Used</h2>
        <RegistersTable
          rows={[
            { m: 'MOV A,#22H', d: 'Load the minuend into the accumulator.' },
            { m: 'MOV R1,#02H', d: 'Load the subtrahend into `R1`.' },
            { m: 'MOV R2,#00H', d: 'Initialise the borrow counter to 0.' },
            { m: 'SUBB A,R1', d: 'Subtract `R1` (and any incoming borrow) from the accumulator.' },
            { m: 'JNC Ahead', d: 'Skip the borrow increment if there was no borrow.' },
            { m: 'INC R2', d: 'Record that a borrow occurred.' },
            { m: 'MOV DPTR,#9200H', d: 'Point the data pointer at the result location.' },
            { m: 'MOVX @DPTR,A', d: 'Write the accumulator (difference) to external memory.' },
            { m: 'INC DPTR', d: 'Advance the pointer to the next byte.' },
            { m: 'MOV A,R2', d: 'Move the borrow value into the accumulator to write it out.' },
            { m: 'MOVX @DPTR,A', d: 'Write the borrow to external memory.' },
            { m: 'LCALL 00BBH', d: "Call the monitor's stop routine to halt execution." },
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
          headers={['Address', 'Value', 'Meaning']}
          rows={[
            { cells: ['`9200H`', '`20H`', 'Difference (22H − 02H)'] },
            { cells: ['`9201H`', '`00H`', 'Borrow (none)'] },
          ]}
        />
      </section>

      <section>
        <h2>Viva Questions</h2>
        <VivaAccordion
          items={[
            {
              q: 'Why SUBB instead of a plain SUB?',
              a: "8051 has no plain 8-bit SUB instruction — SUBB (subtract with borrow) is the only subtract opcode, so a clean subtraction just needs the carry/borrow flag cleared beforehand (as R2/the flag state effectively is here) so no unwanted borrow-in is subtracted.",
            },
            {
              q: 'What would this program compute if R1 were larger than the initial accumulator value?',
              a: "The subtraction would underflow, setting the carry (borrow) flag, so R2 would be incremented to 1 and the accumulator would hold the two's-complement wraparound \"negative\" result as an unsigned byte.",
            },
            {
              q: "How does this program's structure compare to the 8-bit addition experiment?",
              a: 'Identical control flow (JNC/INC/MOVX×2/LCALL) — only the arithmetic instruction (SUBB vs ADD) and operand values differ, showing how the same result-plus-flag pattern generalises across 8051 arithmetic ops.',
            },
          ]}
        />
      </section>
    </>
  );
}
