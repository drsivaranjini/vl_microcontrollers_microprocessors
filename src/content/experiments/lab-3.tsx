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
            "A number is even if its least-significant bit (LSB) is 0, odd if it's 1. `ROR AL,CL` rotates `AL` right by `CL` bits, which — with `CL = 1` — moves the LSB into the carry flag while leaving `AL`'s value otherwise unchanged (a subsequent `ROL AL,CL` rotates it right back). Testing the carry flag with `JC`/`JNC` after the rotate therefore classifies the byte without altering it. The array is scanned twice: once collecting bytes where carry **was** set (odd, `JC` skips the even-collector) into one destination block, once collecting bytes where carry was **not** set (even) into another."
          }
        </P>
      </section>

      <section>
        <h2>Registers / Instructions Used</h2>
        <RegistersTable
          rows={[
            { m: 'MOV CL,01H', d: 'Rotate count — test one bit (the LSB) at a time.' },
            { m: 'MOV CH,06H', d: 'Number of elements in the array (6, here).' },
            { m: 'LODSB', d: 'Load the next byte from `[SI]` into `AL`; auto-increment `SI`.' },
            { m: 'ROR AL,CL', d: 'Rotate `AL` right by `CL` bits; the LSB lands in the carry flag.' },
            { m: 'JC Back', d: 'If carry is set (LSB was 1, i.e. odd), skip storing this pass.' },
            { m: 'JNC Loop1', d: 'If carry is clear (LSB was 0, i.e. even), skip storing this pass.' },
            { m: 'ROL AL,CL', d: "Rotate `AL` back left by `CL` bits, restoring its original value." },
            { m: 'MOV [DI],AL', d: 'Store the classified byte at the current destination pointer.' },
            { m: 'INC DI', d: 'Advance the destination pointer.' },
            { m: 'DEC CH', d: 'Decrement the remaining-element counter.' },
            { m: 'JNZ Back', d: 'Loop back while elements remain.' },
            { m: 'HLT', d: 'Halt — end of program.' },
          ]}
        />
        <blockquote>
          <strong>Note on this listing:</strong> the manual&apos;s own mnemonic table has <code>JC Back</code>{' '}
          / <code>JNC Loop1</code> jump straight back to the byte-loading label itself on a mismatch, which
          skips <code>DEC CH</code> on that pass — tracing it through shows that then scans past the
          intended 6-element array (<code>CH</code> ends up counting <em>matching</em> elements found, not
          elements scanned, despite being initialised to the total count). The reference listing above
          instead jumps to a label placed just before <code>DEC CH</code>/<code>JNZ</code>, so every pass
          decrements the counter exactly once regardless of odd/even — this matches the manual&apos;s own
          stated Input/Output table (3 evens + 3 odds from a clean 6-element array) exactly, which the
          literal <code>JC Back</code>/<code>JNC Loop1</code> reading does not.
        </blockquote>
        <blockquote>
          <strong>Note on running this in the embedded emulator:</strong> the manual&apos;s kit version scans
          a 6-byte array in memory (`2000H`) and writes to two memory blocks (`2200H`/`2500H`). Testing the
          embedded browser emulator directly found its assembler has{' '}
          <strong>no <code>[address]</code>-style memory-operand addressing at all</strong> — every bracket
          form is rejected as a syntax error — so a real array can&apos;t be scanned here. The runnable
          listing below applies the identical classify-by-LSB technique (`ROR AL,CL` → test carry →{' '}
          `ROL AL,CL` to restore) to two individual byte values instead of looping over an array, storing
          the even result in `BX` and the odd result in `DX` so you can see the branch actually pick the
          right destination. The manual&apos;s array-scanning listing is kept above as the reference version.
        </blockquote>
      </section>

      <section>
        <h2>▶ Embedded Simulator</h2>
        <SimulatorFrame
          title="8086 Emulator"
          src={emuSrc}
          hint="Paste the runnable listing below into the assembler pane, click Compile, then Run and inspect BX (even result) and DX (odd result) in the Reg panel."
        />
      </section>

      <section>
        <h2>Sample Program</h2>

        <h3>Manual&apos;s array-scanning listing (reference — needs memory-operand support)</h3>
        <CodeBlock
          lang="asm"
          code={`MOV CL,01H     ; rotate/test one bit at a time
MOV CH,06H     ; 6 elements in the array
MOV DL,CH      ; keep a copy of the count for the second pass
MOV SI,2000H   ; source array
MOV DI,2200H   ; even-numbers destination
Back:
LODSB          ; AL = next array byte, auto-increment SI
ROR AL,CL      ; LSB -> carry flag
JC Back2       ; odd -> skip storing here (handled in the second pass)
ROL AL,CL      ; restore AL
MOV [DI],AL    ; store even value
INC DI
Back2:
DEC CH
JNZ Back       ; loop until all elements scanned

MOV CH,DL      ; reset counter for the second pass
MOV SI,2000H   ; rescan the same array
MOV DI,2500H   ; odd-numbers destination
Loop1:
LODSB
ROR AL,CL
JNC Loop1b     ; even -> skip storing here (already stored above)
ROL AL,CL      ; restore AL
MOV [DI],AL    ; store odd value
INC DI
Loop1b:
DEC CH
JNZ Loop1      ; loop until all elements scanned
HLT            ; end of program`}
        />

        <h3>Runnable in this emulator (register-only, same classify technique)</h3>
        <CodeBlock
          lang="asm"
          code={`start:
MOV CL, 0x01    ; rotate/test one bit at a time

MOV AL, 0x04    ; value 1 (even)
ROR AL,CL       ; LSB -> carry
JNC even1       ; carry clear -> even
ROL AL,CL       ; restore AL
MOV DX, AX      ; odd result register
JMP val2
even1:
ROL AL,CL       ; restore AL
MOV BX, AX      ; even result register
val2:

MOV AL, 0x07    ; value 2 (odd)
ROR AL,CL
JNC even2
ROL AL,CL
MOV DX, AX
JMP done
even2:
ROL AL,CL
MOV BX, AX
done:
HLT             ; inspect BX (even) and DX (odd)`}
        />
      </section>

      <section>
        <h2>Expected Output / Observation</h2>
        <P>{'On the physical kit, with the array `00,01,02,03,04,05` loaded at `2000H`:'}</P>
        <OutputTable
          headers={['Block', 'Address', 'Contents']}
          rows={[
            { cells: ['Even numbers', '`2200H`', '`00, 02, 04`'] },
            { cells: ['Odd numbers', '`2500H`', '`01, 03, 05`'] },
          ]}
        />
        <P>
          {'Running the register-only listing in the embedded emulator instead: '}
        </P>
        <OutputTable
          headers={['Register', 'Value', 'Meaning']}
          rows={[
            { cells: ['`BX`', '`0004H`', 'Value 1 (`04H`), correctly classified even'] },
            { cells: ['`DX`', '`0007H`', 'Value 2 (`07H`), correctly classified odd'] },
          ]}
        />
      </section>

      <section>
        <h2>Viva Questions</h2>
        <VivaAccordion
          items={[
            {
              q: 'Why is the array scanned twice instead of once?',
              a: 'Each pass writes to a different destination block (even vs. odd); scanning twice with opposite branch conditions (JC vs JNC) keeps the logic for each classification simple, at the cost of reading the source array twice.',
            },
            {
              q: 'Why does the program restore AL with ROL after testing with ROR?',
              a: "ROR AL,CL shifted the LSB out into carry, changing AL's bit pattern; ROL AL,CL by the same count rotates it back to the original value so the correct byte (not the rotated one) gets stored.",
            },
            {
              q: 'What would go wrong if MOV CL,01H were omitted?',
              a: "CL's value would be whatever it held from before (undefined at program start), so ROR/ROL AL,CL would rotate by the wrong number of bits, testing the wrong bit position instead of the LSB.",
            },
          ]}
        />
      </section>
    </>
  );
}
