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
            'The purpose of this experiment is to learn about the registers, instruction set, data-transfer operations, and control operations of the 8086. Two 16-bit numbers are stored in memory starting at `1500H`. The program loads each word into `AX` in turn (auto-incrementing the source pointer via `LODSW`), adds them, and stores the 16-bit sum at `1520H`. The **with-carry** variant also stores whatever carried out of the addition — `0000H` or `0001H` — at `1530H`.'
          }
        </P>
      </section>

      <section>
        <h2>Registers / Instructions Used</h2>
        <RegistersTable
          rows={[
            { m: 'MOV SI,1500H', d: 'Set source index register to the base address of the operands.' },
            { m: 'XOR CX,CX', d: 'Clear `CX`, used here to hold the carry (0 or 1).' },
            { m: 'LODSW', d: 'Load the word at `DS:SI` into `AX`; auto-increment `SI` by 2.' },
            { m: 'MOV BX,AX', d: 'Move the first operand from `AX` into `BX`.' },
            { m: 'ADD BX,AX', d: 'Add `AX` to `BX`; result and carry flag land in `BX`/flags.' },
            { m: 'JNC Forward', d: 'Jump to `Forward` if the addition did **not** produce a carry.' },
            { m: 'INC CX', d: 'Increment `CX` (records a carry occurred).' },
            { m: 'MOV DI,1520H', d: 'Set destination index to where the sum is stored.' },
            { m: 'MOV [DI],AX', d: "Store the accumulator's value at the destination address." },
            { m: 'HLT', d: 'Halt the processor — end of program.' },
          ]}
        />
      </section>

      <section>
        <h2>▶ Embedded Simulator</h2>
        <SimulatorFrame
          title="8086 Emulator"
          src={emuSrc}
          hint="Paste the program below into the assembler pane, assemble, then Run/Step and inspect BX (sum), CX (carry), and memory at 1520H/1530H."
        />
      </section>

      <section>
        <h2>Sample Program</h2>

        <h3>With carry</h3>
        <CodeBlock
          lang="asm"
          code={`MOV SI,1500H   ; Set source index as 1500H
XOR CX,CX      ; Clear CX register (will hold carry)
LODSW          ; Load data from source memory into AX & auto-increment SI
MOV BX,AX      ; Move data from AX to BX
LODSW          ; Load next word into AX & auto-increment SI
ADD BX,AX      ; Add AX to BX; sum + carry flag in BX/flags
JNC Forward    ; Jump if no carry
INC CX         ; Increment CX (carry occurred)
Forward:
MOV DI,1520H   ; Set destination index as 1520H
MOV [DI],BX    ; Move the result into 1520H
MOV DI,1530H   ; Set destination index as 1530H
MOV [DI],CX    ; Move the carry into 1530H
HLT            ; End of program`}
        />

        <h3>Without carry (practice)</h3>
        <CodeBlock
          lang="asm"
          code={`MOV SI,1500H   ; Set source index as 1500H
LODSW          ; Load data from source memory into AX & auto-increment SI
MOV BX,AX      ; Move data from AX to BX
LODSW          ; Load next word into AX & auto-increment SI
ADD BX,AX      ; Add AX to BX; sum in BX
MOV DI,1520H   ; Set destination index as 1520H
MOV [DI],BX    ; Move the result into 1520H
HLT            ; End of program`}
        />
      </section>

      <section>
        <h2>Expected Output / Observation</h2>
        <OutputTable
          headers={['Operand 1', 'Operand 2', 'Sum (1520H)', 'Carry (1530H)']}
          rows={[
            { cells: ['`0230H`', '`0305H`', '`0508H`', '`0000H`'] },
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
