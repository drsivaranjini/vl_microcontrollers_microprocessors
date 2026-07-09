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
            "Rather than a predefined array, this program sums the first `n` natural numbers, where `n` itself is read from memory at `2000H`. `BL` counts up from 1 while `CL` (initialised from `n`) counts down; each pass adds the current count (`BL`) into a running total (`AL`), increments `BL`, decrements `CL`, and loops via `JNZ` until `CL` reaches 0. The final sum is stored at `2002H`."
          }
        </P>
      </section>

      <section>
        <h2>Registers / Instructions Used</h2>
        <RegistersTable
          rows={[
            { m: 'MOV SI,2000H', d: 'Point at the memory location holding `n`.' },
            { m: 'MOV CL,[SI]', d: 'Load `n` into `CL` as the loop counter.' },
            { m: 'MOV AL,00H', d: 'Initialise the running sum to 0.' },
            { m: 'MOV BL,01H', d: 'Initialise the counting value to 1.' },
            { m: 'ADD AL,BL', d: 'Add the current counting value into the running sum.' },
            { m: 'INC BL', d: 'Advance the counting value to the next number.' },
            { m: 'DEC CL', d: 'Decrement the remaining-iteration counter.' },
            { m: 'JNZ Back', d: 'Loop back while `CL != 0`.' },
            { m: 'MOV DI,2002H', d: 'Point at where the result is stored.' },
            { m: 'MOV [DI],AX', d: 'Store the final sum.' },
            { m: 'HLT', d: 'Halt — end of program.' },
          ]}
        />
      </section>

      <section>
        <h2>▶ Embedded Simulator</h2>
        <SimulatorFrame
          title="8086 Emulator"
          src={emuSrc}
          hint="Paste the program below, load n at 2000H (e.g. 05H), assemble, then Run/Step and inspect memory at 2002H."
        />
      </section>

      <section>
        <h2>Sample Program</h2>
        <CodeBlock
          lang="asm"
          code={`MOV SI,2000H   ; point at n
MOV CL,[SI]    ; CL = n
MOV AL,00H     ; running sum = 0
MOV BL,01H     ; first number to add
Back:
ADD AL,BL      ; sum += BL
INC BL         ; next number
DEC CL         ; one fewer iteration remaining
JNZ Back       ; loop while CL != 0
MOV DI,2002H   ; destination for result
MOV [DI],AX    ; store the sum
HLT            ; end of program`}
        />
      </section>

      <section>
        <h2>Expected Output / Observation</h2>
        <OutputTable
          headers={['n (at 2000H)', 'Sum 1+2+...+n (at 2002H)']}
          rows={[
            { cells: ['`05H`', '`0FH` (1+2+3+4+5 = 15)'] },
            { cells: ['`04H`', '`0AH` (1+2+3+4 = 10)'] },
          ]}
        />
      </section>

      <section>
        <h2>Viva Questions</h2>
        <VivaAccordion
          items={[
            {
              q: 'Why is BL used to hold the "current number" rather than reusing CL?',
              a: 'CL is being consumed as the countdown loop control (decremented each pass), so a separate register (BL) is needed to count up the actual numbers being summed at the same time.',
            },
            {
              q: 'What is the largest n this program can correctly handle, and why?',
              a: 'AL is 8-bit, so the sum can overflow past FFH (255) for large enough n (n=23 already sums to 276); the program does not check for or handle overflow.',
            },
            {
              q: 'Why is n read from memory rather than hardcoded as an immediate value?',
              a: 'Reading n from memory (2000H) lets the same assembled program sum a different count of numbers just by changing the input data, without reassembling the code.',
            },
          ]}
        />
      </section>
    </>
  );
}
