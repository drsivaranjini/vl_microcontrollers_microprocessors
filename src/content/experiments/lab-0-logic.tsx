import SimulatorFrame from '@/components/SimulatorFrame';
import CodeBlock from '@/components/CodeBlock';
import VivaAccordion from '@/components/VivaAccordion';
import { P, RegistersTable, OutputTable } from '@/components/md';

// QA round 2 C1: deep-link straight to the 8086 emulator's editor route (HashRouter #/compile),
// not its landing page.
const emuSrc = '/emu/8086/index.html#/compile';

export default function Content() {
  return (
    <>
      <section>
        <h2>Theory</h2>
        <P>
          {
            "**0-A — Logical operations.** The logical `AND` instruction is used for masking off bits: bits to be cleared are ANDed with 0, bits to stay high are ANDed with 1 — masking with `0F0F` keeps only the low nibble of each byte in a word. The logical `OR` sets bits selectively: ORing a bit with 1 always sets it, regardless of its previous value."
          }
        </P>
        <P>
          {
            "**0-B — Arithmetic operations.** `ADD`/`SUB` require one operand in a register (here `AX`), with the other operand in a register or immediate. `MUL` performs unsigned multiplication: an 8-bit multiply produces a 16-bit result in `AX`; a 16-bit multiply produces a 32-bit result split across `DX:AX` (high word in `DX`, low word in `AX`). `DIV` divides `DX:AX` by the operand, leaving the quotient in `AX` and the remainder in `DX`."
          }
        </P>
        <blockquote>
          <strong>Note on this listing:</strong> the manual&apos;s version loads operands from and stores
          results to fixed memory addresses (<code>1100H</code>/<code>1200H</code>) via <code>MOV AX,[1100]</code>
          -style bracket addressing. The embedded browser emulator&apos;s assembler doesn&apos;t support{' '}
          <code>[address]</code> memory operands at all (confirmed by testing — every bracket form, including
          register-indirect and <code>WORD PTR</code>, is rejected as a syntax error), only registers and
          immediates. The programs below carry the same operands and instructions but keep them in registers
          throughout, so they actually run here; check the result in the <strong>Reg</strong> panel instead of a
          memory address.
        </blockquote>
      </section>

      <section>
        <h2>Registers / Instructions Used</h2>
        <RegistersTable
          rows={[
            { m: 'MOV AX,0xAA55', d: 'Load the first operand as an immediate into `AX`.' },
            { m: 'AND AX,0x0F0F', d: 'Bitwise AND `AX` with the immediate mask `0F0FH`.' },
            { m: 'OR AX,0x0F0F', d: 'Bitwise OR `AX` with the immediate `0F0FH`.' },
            { m: 'ADD AX,BX', d: '16-bit addition; result in AX, carry/overflow reflected in flags.' },
            { m: 'SUB AX,BX', d: '16-bit subtraction; result in AX.' },
            { m: 'MUL BX', d: 'Unsigned multiply AX × BX; 32-bit result in `DX:AX`.' },
            { m: 'DIV BX', d: 'Unsigned divide `DX:AX` ÷ BX; quotient in AX, remainder in DX.' },
            { m: 'HLT', d: 'Halt — end of program.' },
          ]}
        />
      </section>

      <section>
        <h2>▶ Embedded Simulator</h2>
        <SimulatorFrame
          title="8086 Emulator"
          src={emuSrc}
          hint="Paste any of the programs below into the assembler pane, click Compile, then Run and watch AX/BX/DX in the Reg panel (Run animates one instruction at a time — give it a few seconds)."
        />
      </section>

      <section>
        <h2>Sample Programs</h2>

        <h3>Logical AND (masking)</h3>
        <CodeBlock
          lang="asm"
          code={`start:
MOV AX, 0xAA55  ; operand
AND AX, 0x0F0F  ; mask: keep only the low nibble of each byte
HLT             ; inspect AX`}
        />

        <h3>Logical OR (bit setting)</h3>
        <CodeBlock
          lang="asm"
          code={`start:
MOV AX, 0x0000  ; start from 0
OR AX, 0x0F0F   ; set the low nibble of each byte
HLT             ; inspect AX`}
        />

        <h3>Addition (without carry)</h3>
        <CodeBlock
          lang="asm"
          code={`start:
MOV AX, 0x0230
MOV BX, 0x0305
ADD AX, BX
HLT             ; inspect AX`}
        />

        <h3>Subtraction (without borrow)</h3>
        <CodeBlock
          lang="asm"
          code={`start:
MOV AX, 0x0500
MOV BX, 0x0230
SUB AX, BX
HLT             ; inspect AX`}
        />

        <h3>Multiplication</h3>
        <CodeBlock
          lang="asm"
          code={`start:
MOV AX, 0x0002
MOV BX, 0x0003
MUL BX          ; DX:AX = AX * BX
HLT             ; inspect DX (high) and AX (low)`}
        />

        <h3>Division</h3>
        <CodeBlock
          lang="asm"
          code={`start:
MOV DX, 0x0000  ; clear the dividend's high word first
MOV AX, 0x0006
MOV BX, 0x0002
DIV BX          ; AX = quotient, DX = remainder
HLT`}
        />
      </section>

      <section>
        <h2>Expected Output / Observation</h2>
        <OutputTable
          headers={['Program', 'Result (Reg panel)']}
          rows={[
            { cells: ['AND (`0xAA55 & 0x0F0F`)', 'AX = `0A05H`'] },
            { cells: ['OR (`0x0000 | 0x0F0F`)', 'AX = `0F0FH`'] },
            { cells: ['ADD (`0230H + 0305H`)', 'AX = `0535H`'] },
            { cells: ['SUB (`0500H − 0230H`)', 'AX = `02D0H`'] },
            { cells: ['MUL (`2 × 3`)', 'DX:AX = `0000:0006H`'] },
            { cells: ['DIV (`6 ÷ 2`)', 'AX = `0003H` (quotient), DX = `0000H` (remainder)'] },
          ]}
        />
      </section>

      <section>
        <h2>Viva Questions</h2>
        <VivaAccordion
          items={[
            {
              q: 'Why does ANDing with 0F0F mask off the high nibble of each byte?',
              a: 'AND only keeps a bit where both operand bits are 1. Since 0F0F has 0-bits in the high nibble positions of each byte, ANDing forces those bits to 0 regardless of the source data, while the low-nibble bits pass through unchanged wherever the source bit is 1.',
            },
            {
              q: 'Why does the multiplication result need two memory words (1200H and 1202H)?',
              a: 'A 16-bit × 16-bit unsigned multiply can produce up to a 32-bit result, split across DX (high word) and AX (low word) — one 16-bit memory word cannot hold the full product in general.',
            },
            {
              q: 'What is left in DX after DIV BX, and why does it matter?',
              a: 'DX holds the remainder of the division. It matters because 8086 integer division discards fractional results — the remainder is the only way to recover what did not divide evenly.',
            },
            {
              q: 'What is the difference between MOV AX,[1100] and MOV [1200],AX?',
              a: 'The first reads memory into a register (address in brackets is the source); the second writes a register to memory (address in brackets is the destination) — the bracket denotes "memory at this address" on whichever side it appears.',
            },
          ]}
        />
      </section>
    </>
  );
}
