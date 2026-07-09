import SimulatorFrame from '@/components/SimulatorFrame';
import CodeBlock from '@/components/CodeBlock';
import VivaAccordion from '@/components/VivaAccordion';
import { P, RegistersTable } from '@/components/md';

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
            "**0-B — Arithmetic operations.** `ADD`/`SUB` require one operand in a register (here `AX`), with the other operand in a register, memory, or immediate. `MUL` performs unsigned multiplication: an 8-bit multiply produces a 16-bit result in `AX`; a 16-bit multiply produces a 32-bit result split across `DX:AX` (high word in `DX`, low word in `AX`). `DIV` divides `DX:AX` by the operand, leaving the quotient in `AX` and the remainder in `DX`."
          }
        </P>
      </section>

      <section>
        <h2>Registers / Instructions Used</h2>
        <RegistersTable
          rows={[
            { m: 'MOV AX,[1100]', d: 'Load the 16-bit word at memory address `1100H` into `AX`.' },
            { m: 'AND AX,0F0F', d: 'Bitwise AND `AX` with the immediate mask `0F0FH`.' },
            { m: 'OR AX,0F0F', d: 'Bitwise OR `AX` with the immediate `0F0FH`.' },
            { m: 'MOV [1200],AX', d: 'Store `AX` to memory address `1200H`.' },
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
          hint="Paste any of the programs below into the assembler pane, assemble, then Run/Step and inspect AX/BX/DX and the destination memory address."
        />
      </section>

      <section>
        <h2>Sample Programs</h2>

        <h3>Logical AND (masking)</h3>
        <CodeBlock
          lang="asm"
          code={`MOV AX, [1100]  ; load operand
AND AX, 0F0F    ; mask: keep only the low nibble of each byte
MOV [1200], AX  ; store result
HLT`}
        />

        <h3>Logical OR (bit setting)</h3>
        <CodeBlock
          lang="asm"
          code={`MOV AX, 0000    ; start from 0
OR AX, 0F0F     ; set the low nibble of each byte
MOV [1200], AX  ; store result
HLT`}
        />

        <h3>Addition (without carry)</h3>
        <CodeBlock
          lang="asm"
          code={`MOV AX, [1100]
MOV BX, [1102]
ADD AX, BX
MOV [1200], AX
HLT`}
        />

        <h3>Subtraction (without borrow)</h3>
        <CodeBlock
          lang="asm"
          code={`MOV AX, [1100]
MOV BX, [1102]
SUB AX, BX
MOV [1200], AX
HLT`}
        />

        <h3>Multiplication</h3>
        <CodeBlock
          lang="asm"
          code={`MOV AX, [1100]
MOV BX, [1102]
MUL BX          ; DX:AX = AX * BX
MOV [1200], AX  ; low word
MOV [1202], DX  ; high word
HLT`}
        />

        <h3>Division</h3>
        <CodeBlock
          lang="asm"
          code={`MOV AX, [1100]
MOV BX, [1102]
DIV BX          ; AX = quotient, DX = remainder
MOV [1200], AX
MOV [1202], DX
HLT`}
        />
      </section>

      <section>
        <h2>Expected Output / Observation</h2>
        <P>
          {
            'For the logical operations, write down the truth table of AND/OR before running, then confirm the masked/set result at `1200H` matches it. For the arithmetic operations, load two 16-bit operands at `1100H`/`1102H` before running and confirm the result at `1200H` (and `1202H` for MUL/DIV\'s second word).'
          }
        </P>
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
