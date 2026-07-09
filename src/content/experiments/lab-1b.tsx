import SimulatorFrame from '@/components/SimulatorFrame';
import CodeBlock from '@/components/CodeBlock';
import VivaAccordion from '@/components/VivaAccordion';
import { P, RegistersTable } from '@/components/md';

const emuSrc = '/emu/8086/index.html#/compile';

export default function Content() {
  return (
    <>
      <section>
        <h2>Theory</h2>
        <P>
          {
            'Eight bytes starting at `1400H` are copied, one at a time, to a destination block starting at `1450H`. `CL` holds the count (8), `SI` walks the source block, `DI` walks the destination block. Each pass loads a byte via `LODSW` into `AL` (auto-incrementing `SI`), stores it at `[DI]`, advances `DI`, decrements the counter, and loops via `JNZ` while the counter is still nonzero.'
          }
        </P>
      </section>

      <section>
        <h2>Registers / Instructions Used</h2>
        <RegistersTable
          rows={[
            { m: 'MOV CL,08H', d: 'Set the loop counter to 8 (number of bytes to copy).' },
            { m: 'MOV SI,1400H', d: 'Point the source index at the start of the source block.' },
            { m: 'MOV DI,1450H', d: 'Point the destination index at the start of the destination block.' },
            { m: 'LODSW', d: 'Load from `[SI]` into `AX` (`AL` holds the byte here); auto-increment `SI`.' },
            { m: 'MOV [DI],AL', d: 'Store the low byte to the destination address.' },
            { m: 'INC DI', d: 'Advance the destination pointer by one byte.' },
            { m: 'DEC CL', d: 'Decrement the remaining-byte counter.' },
            { m: 'JNZ Back', d: "Loop back while the counter hasn't reached zero." },
            { m: 'HLT', d: 'Halt — end of program.' },
          ]}
        />
      </section>

      <section>
        <h2>▶ Embedded Simulator</h2>
        <SimulatorFrame
          title="8086 Emulator"
          src={emuSrc}
          hint="Paste the program below, load 8 bytes at 1400H, assemble, then Run/Step and inspect memory from 1450H onward."
        />
      </section>

      <section>
        <h2>Sample Program</h2>
        <CodeBlock
          lang="asm"
          code={`MOV CL,08H     ; 8 bytes to copy
MOV SI,1400H   ; source pointer
MOV DI,1450H   ; destination pointer
Back:
LODSW          ; load byte at [SI] into AL, auto-increment SI
MOV [DI],AL    ; store AL to destination
INC DI         ; advance destination pointer
DEC CL         ; one fewer byte remaining
JNZ Back       ; loop while CL != 0
HLT            ; end of program`}
        />
      </section>

      <section>
        <h2>Expected Output / Observation</h2>
        <P>
          {
            'After running, the 8 bytes at `1450H`–`1457H` should be an exact copy of the 8 bytes originally at `1400H`–`1407H`.'
          }
        </P>
      </section>

      <section>
        <h2>Viva Questions</h2>
        <VivaAccordion
          items={[
            {
              q: 'Why does the program use LODSW to move a single byte instead of LODSB?',
              a: 'The listing uses LODSW (loading a full word into AX) but only stores AL — functionally it behaves like a byte copy since only the low byte is written out, though LODSB would be the more natural choice for a byte-by-byte copy and auto-increments SI by 1 instead of 2.',
            },
            {
              q: 'What would happen if DEC CL executed before JNZ Back is reached the first time, with CL initially 0?',
              a: 'DEC CL would wrap CL to 0FFH (255), and the loop would run far more times than intended — this program relies on CL being correctly initialised to a nonzero count before the loop starts.',
            },
            {
              q: 'Why use two separate pointers (SI and DI) instead of one?',
              a: 'The source and destination blocks are different, non-overlapping memory regions; separate pointers let each walk independently at the same pace via INC DI / auto-incrementing SI.',
            },
          ]}
        />
      </section>
    </>
  );
}
