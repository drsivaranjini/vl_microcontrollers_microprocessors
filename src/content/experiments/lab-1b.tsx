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
        <blockquote>
          <strong>Note on this listing:</strong> the manual&apos;s kit version copies real memory — `[SI]` to
          `[DI]`, 8 bytes. Testing the embedded browser emulator directly found its assembler has{' '}
          <strong>no <code>[address]</code>-style memory-operand addressing at all</strong> (every bracket
          form — register-indirect, direct-absolute, label-based — is rejected as a syntax error), so a
          literal source/destination memory block can&apos;t be expressed here. The listing below keeps the
          exact same loop shape (`DEC CL` / `JNZ Back`, 8 iterations) and the exact same &quot;take a byte,
          transfer it&quot; step, just with the byte held in a register instead of memory — so you can still
          watch the counter/branch mechanics of the loop run to completion. The manual&apos;s own program is
          left above as the reference version (verify the actual memory copy on the physical kit, or with a
          tool that supports memory operands).
        </blockquote>
      </section>

      <section>
        <h2>Registers / Instructions Used</h2>
        <RegistersTable
          rows={[
            { m: 'MOV CL,0x08', d: 'Set the loop counter to 8 (number of transfers).' },
            { m: 'MOV AL,0x2A', d: 'The byte being "transferred" each pass.' },
            { m: 'MOV BL,AL', d: 'Stand-in for one byte moving from source to destination.' },
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
          hint="Paste the program below into the assembler pane, click Compile, then Run and inspect BL and CL in the Reg panel (Run animates one instruction at a time — give it several seconds for all 8 loop passes)."
        />
      </section>

      <section>
        <h2>Sample Program</h2>
        <CodeBlock
          lang="asm"
          code={`start:
MOV CL, 0x08   ; 8 bytes to "transfer"
MOV AL, 0x2A   ; the byte being transferred
Back:
MOV BL, AL     ; simulate one transfer step
DEC CL         ; one fewer byte remaining
JNZ Back       ; loop while CL != 0
HLT            ; inspect BL and CL`}
        />
      </section>

      <section>
        <h2>Expected Output / Observation</h2>
        <P>
          {
            'After running, `CL` reaches `00H` (all 8 loop passes completed) and `BL` holds `2AH` — the transferred byte. On the physical kit, running the manual\'s original listing copies the 8 bytes at `1400H`–`1407H` to `1450H`–`1457H` exactly.'
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
