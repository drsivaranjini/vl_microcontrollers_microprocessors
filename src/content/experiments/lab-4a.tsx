import Editor8051 from '@/components/Editor8051';
import VivaAccordion from '@/components/VivaAccordion';
import { P, RegistersTable, OutputTable } from '@/components/md';

const sample = `ORG 8000H
MOV A, #23H       ; first operand
MOV R1, #11H      ; second operand
MOV R2, #00H      ; carry = 0
ADD A, R1         ; A = A + R1
JNC Ahead         ; skip if no carry
INC R2            ; record the carry
Ahead:
MOV DPTR, #9200H  ; point at the result location
MOVX @DPTR, A     ; write the sum
INC DPTR
MOV A, R2         ; move carry into A
MOVX @DPTR, A     ; write the carry
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
            'Two 8-bit operands (`23H` and `11H`) are loaded into the accumulator and `R1`. `ADD A,R1` sums them, setting the carry flag if the result overflowed 8 bits. `JNC` skips the carry-increment when there was no overflow. The sum is written to external memory at `9200H` via the data pointer, and the carry (`0` or `1`) is written right after it at `9201H`.'
          }
        </P>
      </section>

      <section>
        <h2>Registers / Instructions Used</h2>
        <RegistersTable
          rows={[
            { m: 'MOV A,#23H', d: 'Load the first operand into the accumulator.' },
            { m: 'MOV R1,#11H', d: 'Load the second operand into `R1`.' },
            { m: 'MOV R2,#00H', d: 'Initialise the carry counter to 0.' },
            { m: 'ADD A,R1', d: 'Add `R1` into the accumulator; sets the carry flag on overflow.' },
            { m: 'JNC Ahead', d: 'Skip the carry increment if there was no overflow.' },
            { m: 'INC R2', d: 'Record that a carry occurred.' },
            { m: 'MOV DPTR,#9200H', d: 'Point the data pointer at the result location.' },
            { m: 'MOVX @DPTR,A', d: 'Write the accumulator (sum) to external memory.' },
            { m: 'INC DPTR', d: 'Advance the pointer to the next byte.' },
            { m: 'MOV A,R2', d: 'Move the carry value into the accumulator to write it out.' },
            { m: 'MOVX @DPTR,A', d: 'Write the carry to external memory.' },
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
            { cells: ['`9200H`', '`34H`', 'Sum (23H + 11H)'] },
            { cells: ['`9201H`', '`00H`', 'Carry (none)'] },
          ]}
        />
      </section>

      <section>
        <h2>Viva Questions</h2>
        <VivaAccordion
          items={[
            {
              q: 'Why is the carry stored as a separate byte rather than combined into a 16-bit sum?',
              a: 'The accumulator is only 8 bits wide, so ADD A,R1 can only ever produce an 8-bit result plus a 1-bit carry flag — the carry has to be captured and stored separately if it needs to be preserved.',
            },
            {
              q: 'What does LCALL 00BBH do?',
              a: 'It calls a fixed monitor-ROM routine (built into this address on the physical 8051 trainer kit) that stops program execution — the equivalent of a HLT on the 8086 side, but implemented as a subroutine call rather than a dedicated halt instruction, since 8051 has no HLT.',
            },
            {
              q: 'Why use INC DPTR between the two MOVX writes instead of loading a new address with MOV DPTR?',
              a: 'The destination for the carry (9201H) is exactly one byte past the sum (9200H); incrementing DPTR is shorter and faster than reloading a full 16-bit immediate for an adjacent address.',
            },
          ]}
        />
      </section>
    </>
  );
}
