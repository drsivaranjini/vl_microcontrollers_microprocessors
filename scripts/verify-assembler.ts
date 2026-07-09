// Regression check for src/lib/asm8051.ts: assembles the manual's own Lab 4A/4B/5/6 programs and
// diffs the output against the exact bytes previously hand-derived + execution-verified (by
// stepping the patched i8051emu core, see the old Astro build's public/emu/8051/PATCHES.md) for
// this course. Run with: npx tsx scripts/verify-assembler.ts
import { assemble8051 } from '../src/lib/asm8051';

function hexBytes(b: Uint8Array): string {
  return Array.from(b)
    .map((x) => x.toString(16).toUpperCase().padStart(2, '0'))
    .join(' ');
}

function check(name: string, src: string, expectedHex: string) {
  const r = assemble8051(src);
  const got = hexBytes(r.bytes);
  const pass = got === expectedHex;
  console.log(`${pass ? 'PASS' : 'FAIL'}: ${name}`);
  if (!pass) {
    console.log('  expected:', expectedHex);
    console.log('  got     :', got);
    console.log('  errors  :', JSON.stringify(r.errors));
  }
}

check(
  'lab-4a (8-bit addition)',
  `
ORG 8000H
MOV A, #23H
MOV R1, #11H
MOV R2, #00H
ADD A, R1
JNC Ahead
INC R2
Ahead:
MOV DPTR, #9200H
MOVX @DPTR, A
INC DPTR
MOV A, R2
MOVX @DPTR, A
LCALL 00BBH
`,
  '74 23 79 11 7A 00 29 50 01 0A 90 92 00 F0 A3 EA F0 12 00 BB',
);

check(
  'lab-4b (8-bit subtraction)',
  `
ORG 8000H
MOV A, #22H
MOV R1, #02H
MOV R2, #00H
SUBB A, R1
JNC Ahead
INC R2
Ahead:
MOV DPTR, #9200H
MOVX @DPTR, A
INC DPTR
MOV A, R2
MOVX @DPTR, A
LCALL 00BBH
`,
  '74 22 79 02 7A 00 99 50 01 0A 90 92 00 F0 A3 EA F0 12 00 BB',
);

check(
  'lab-5 (complement)',
  `
ORG 4100H
MOV DPTR, #6500H
MOVX A, @DPTR
CPL A
INC DPTR
MOVX @DPTR, A
INC A
INC DPTR
MOVX @DPTR, A
RET
`,
  '90 65 00 E0 F4 A3 F0 04 A3 F0 22',
);

check(
  'lab-6 (fibonacci)',
  `
ORG 4100H
MOV R0,#0AH
MOV R1,#20H
MOV @R1,#00H
INC R1
MOV @R1,#01H
BACK:
MOV A,@R1
DEC R1
ADD A,@R1
INC R1
INC R1
MOV @R1,A
DJNZ R0,BACK
HERE:
SJMP HERE
`,
  '78 0A 79 20 77 00 09 77 01 E7 19 27 09 09 F7 D8 F8 80 FE',
);
