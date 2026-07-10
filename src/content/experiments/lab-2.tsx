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
            "This program sums the first `n` natural numbers. `BL` counts up from 1 while `CL` (initialised to `n`) counts down; each pass adds the current count (`BL`) into a running total (`AL`), increments `BL`, decrements `CL`, and loops via `JNZ` until `CL` reaches 0."
          }
        </P>
        <blockquote>
          <strong>Note on this listing:</strong> the manual&apos;s kit version reads `n` from memory at
          <code>2000H</code> and stores the result at <code>2002H</code>. The embedded browser emulator
          doesn&apos;t support <code>[address]</code> memory operands at all (confirmed by testing), so
          this listing sets `n` as an immediate (<code>MOV CL,0x05</code>) instead of reading it from
          memory and leaves the sum in `AL` instead of writing it out — the loop itself (`ADD`/`INC`/`DEC`/
          `JNZ`) is exactly the manual&apos;s. To try a different `n`, edit that one immediate and re-run.
        </blockquote>
      </section>

      <section>
        <h2>Registers / Instructions Used</h2>
        <RegistersTable
          rows={[
            { m: 'MOV CL,0x05', d: 'Set the loop counter to `n` (5, here).' },
            { m: 'MOV AL,0x00', d: 'Initialise the running sum to 0.' },
            { m: 'MOV BL,0x01', d: 'Initialise the counting value to 1.' },
            { m: 'ADD AL,BL', d: 'Add the current counting value into the running sum.' },
            { m: 'INC BL', d: 'Advance the counting value to the next number.' },
            { m: 'DEC CL', d: 'Decrement the remaining-iteration counter.' },
            { m: 'JNZ Back', d: 'Loop back while `CL != 0`.' },
            { m: 'HLT', d: 'Halt — end of program.' },
          ]}
        />
      </section>

      <section>
        <h2>▶ Embedded Simulator</h2>
        <SimulatorFrame
          title="8086 Emulator"
          src={emuSrc}
          hint="Paste the program below into the assembler pane, click Compile, then Run and inspect AL in the Reg panel (Run animates one instruction at a time — give it a few seconds to finish the loop)."
        />
      </section>

      <section>
        <h2>Sample Program</h2>
        <CodeBlock
          lang="asm"
          code={`start:
MOV CL, 0x05   ; n
MOV AL, 0x00   ; running sum = 0
MOV BL, 0x01   ; first number to add
Back:
ADD AL,BL      ; sum += BL
INC BL         ; next number
DEC CL         ; one fewer iteration remaining
JNZ Back       ; loop while CL != 0
HLT            ; inspect AL`}
        />
      </section>

      <section>
        <h2>Expected Output / Observation</h2>
        <OutputTable
          headers={['n (CL immediate)', 'Sum 1+2+...+n (AL)']}
          rows={[
            { cells: ['`0x05`', '`0FH` (1+2+3+4+5 = 15)'] },
            { cells: ['`0x04`', '`0AH` (1+2+3+4 = 10)'] },
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
              q: 'In the manual’s kit version, why is n read from memory rather than hardcoded as an immediate value?',
              a: 'Reading n from memory (2000H) lets the same assembled program sum a different count of numbers just by changing the input data, without reassembling the code — the embedded browser emulator used here has no memory-operand addressing at all, so this listing hardcodes n as an immediate instead.',
            },
          ]}
        />
      </section>
    </>
  );
}
