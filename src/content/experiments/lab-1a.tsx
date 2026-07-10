import SimulatorFrame from '@/components/SimulatorFrame';
import CodeBlock from '@/components/CodeBlock';
import VivaAccordion from '@/components/VivaAccordion';
import { P, RegistersTable, OutputTable } from '@/components/md';

const emuSrc = '/emu/8086/index.html#/compile';

export default function Content() {
  return (
    <>
      <section>
        <h2>Theory</h2>
        <P>
          {
            'The purpose of this experiment is to learn about the registers, instruction set, data-transfer operations, and control operations of the 8086. Two 16-bit numbers are added, and the 16-bit sum is kept in `BX`. The **with-carry** variant also records whatever carried out of the addition — `0000H` or `0001H` — in `CX`.'
          }
        </P>
        <blockquote>
          <strong>Note on this listing:</strong> the manual&apos;s kit version stores the two operands in
          memory at <code>1500H</code>, loads them via <code>LODSW</code> (auto-incrementing `SI`), and
          writes the sum/carry back to <code>1520H</code>/<code>1530H</code>. Testing against the embedded
          browser emulator found it doesn&apos;t support <code>[address]</code>-style memory operands at
          all (only registers and immediates), and its own default example never uses{' '}
          <code>LODSW</code> either. The listing below keeps the same operands, the same `ADD`/`JNC`/`INC`
          carry logic, and the same registers (`BX` for the sum, `CX` for the carry) — it just loads the
          operands as immediates instead of from memory, so it actually runs here.
        </blockquote>
      </section>

      <section>
        <h2>Registers / Instructions Used</h2>
        <RegistersTable
          rows={[
            { m: 'MOV AX,0x0230', d: 'Load the first operand as an immediate into `AX`.' },
            { m: 'MOV BX,0x0305', d: 'Load the second operand as an immediate into `BX`.' },
            { m: 'XOR CX,CX', d: 'Clear `CX`, used here to hold the carry (0 or 1).' },
            { m: 'ADD BX,AX', d: 'Add `AX` to `BX`; result and carry flag land in `BX`/flags.' },
            { m: 'JNC done', d: 'Jump to `done` if the addition did **not** produce a carry.' },
            { m: 'INC CX', d: 'Increment `CX` (records a carry occurred).' },
            { m: 'HLT', d: 'Halt the processor — end of program.' },
          ]}
        />
      </section>

      <section>
        <h2>▶ Embedded Simulator</h2>
        <SimulatorFrame
          title="8086 Emulator"
          src={emuSrc}
          hint="Paste the program below into the assembler pane, click Compile, then Run and inspect BX (sum) and CX (carry) in the Reg panel (Run animates one instruction at a time — give it a few seconds to finish)."
        />
      </section>

      <section>
        <h2>Sample Program</h2>

        <h3>With carry</h3>
        <CodeBlock
          lang="asm"
          code={`start:
MOV AX, 0x0230  ; first operand
MOV BX, 0x0305  ; second operand
XOR CX, CX      ; CX will hold the carry
ADD BX, AX      ; BX = sum; carry flag set on overflow
JNC done        ; skip if no carry
INC CX          ; record the carry
done:
HLT             ; inspect BX (sum) and CX (carry)`}
        />

        <h3>Without carry (practice)</h3>
        <CodeBlock
          lang="asm"
          code={`start:
MOV AX, 0x0230
MOV BX, 0x0305
ADD BX, AX      ; BX = sum
HLT             ; inspect BX`}
        />
      </section>

      <section>
        <h2>Expected Output / Observation</h2>
        <OutputTable
          headers={['Operand 1', 'Operand 2', 'Sum (BX)', 'Carry (CX)']}
          rows={[
            { cells: ['`0230H`', '`0305H`', '`0535H`', '`0000H`'] },
            { cells: ['`A2A2H`', '`A2A2H`', '`4544H`', '`0001H`'] },
          ]}
        />
      </section>

      <section>
        <h2>Viva Questions</h2>
        <VivaAccordion
          items={[
            {
              q: 'Why is LODSW used instead of a plain MOV to fetch the operands?',
              a: 'LODSW loads the word at DS:SI into AX and automatically increments SI by 2, so the second LODSW reads the next operand without recomputing the address.',
            },
            {
              q: 'Which flag does ADD set that JNC checks?',
              a: 'The carry flag (CF). JNC ("jump if not carry") branches to Forward only when CF = 0, i.e. the 16-bit addition did not overflow.',
            },
            {
              q: 'Why clear CX with XOR CX,CX instead of MOV CX,0?',
              a: 'Functionally equivalent here; XOR reg,reg is a common 8086 idiom to zero a register in fewer bytes and without needing an immediate operand.',
            },
            {
              q: 'What would change if the operands were 8-bit instead of 16-bit?',
              a: 'You would use LODSB/AL and ADD AL,... instead of LODSW/AX, and the carry-out would be a single bit rather than a possible 1 in the high word.',
            },
          ]}
        />
      </section>
    </>
  );
}
