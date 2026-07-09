// A small, real two-pass MCS-51 (8051) assembler, written for this lab since no ready-made
// JS/WASM 8051 assembler exists to vendor (checked; see docs/11_QA_ROUND2_FIXES.md C3 and
// docs/12_REDESIGN_BRIEF.md §8). Covers the instruction set + addressing modes used across the
// 21BMC302J manual and typical first-course 8051 programs — not a claim of 100% ISA coverage
// (no bit-addressable named-SFR-bit syntax like `P1.0`, no MOVC). Assembles to a flat byte array
// (with an ORG-relative base address) and to Intel HEX.
//
// Verified against known-correct output: assembling the manual's own Lab 4A/4B/5/6 programs with
// this module produces byte-for-byte the same output as the hand-derived, mcu.py-execution-
// verified hex from the previous (Astro) build — see the assembler's own test invocation.

const KNOWN_MNEMONICS = new Set([
  'ORG', 'END', 'EQU',
  'NOP', 'RET', 'RETI',
  'RL', 'RR', 'RLC', 'RRC', 'SWAP', 'DA', 'MUL', 'DIV',
  'CPL', 'CLR', 'SETB',
  'INC', 'DEC', 'PUSH', 'POP', 'XCH',
  'MOV', 'MOVX',
  'ADD', 'ADDC', 'SUBB',
  'ANL', 'ORL', 'XRL',
  'SJMP', 'LJMP', 'AJMP', 'ACALL', 'LCALL',
  'JZ', 'JNZ', 'JC', 'JNC', 'JB', 'JNB', 'JBC',
  'CJNE', 'DJNZ',
]);

export interface AssembleError {
  line: number;
  message: string;
}

export interface AssembleResult {
  ok: boolean;
  bytes: Uint8Array; // bytes from the lowest to highest address written (see baseAddress)
  baseAddress: number;
  hex: string; // Intel HEX, empty string if !ok
  errors: AssembleError[];
  listing: { line: number; address: number | null; bytes: number[]; text: string }[];
}

const REG_NAMES = ['R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'];

function parseNumber(tok: string): number | null {
  const t = tok.trim();
  const hex = /^0X([0-9A-F]+)$/i.exec(t) ?? /^([0-9A-F]+)H$/i.exec(t);
  if (hex) return parseInt(hex[1], 16);
  const bin = /^([01]+)B$/i.exec(t);
  if (bin) return parseInt(bin[1], 2);
  const dec = /^(\d+)D?$/i.exec(t);
  if (dec) return parseInt(dec[1], 10);
  return null;
}

interface Operand {
  raw: string;
  kind: 'A' | 'C' | 'AB' | 'DPTR' | 'Rn' | 'atRi' | 'atDPTR' | 'immediate' | 'direct' | 'label';
  n?: number; // register number for Rn / atRi
  value?: number; // resolved numeric value (immediate or direct address), if known
  label?: string; // symbolic name, for direct/immediate operands that are labels/EQU-like or jump targets
}

function classifyOperand(raw: string, symbols: Map<string, number>): Operand {
  const t = raw.trim();
  const upper = t.toUpperCase();
  if (upper === 'A') return { raw: t, kind: 'A' };
  if (upper === 'C') return { raw: t, kind: 'C' };
  if (upper === 'AB') return { raw: t, kind: 'AB' };
  if (upper === 'DPTR') return { raw: t, kind: 'DPTR' };
  if (upper === '@DPTR') return { raw: t, kind: 'atDPTR' };
  const rn = REG_NAMES.indexOf(upper);
  if (rn >= 0) return { raw: t, kind: 'Rn', n: rn };
  const atRi = /^@R([01])$/i.exec(upper);
  if (atRi) return { raw: t, kind: 'atRi', n: Number(atRi[1]) };
  if (t.startsWith('#')) {
    const body = t.slice(1);
    const num = parseNumber(body);
    if (num !== null) return { raw: t, kind: 'immediate', value: num };
    return { raw: t, kind: 'immediate', label: body };
  }
  const num = parseNumber(t);
  if (num !== null) return { raw: t, kind: 'direct', value: num };
  if (symbols.has(upper)) return { raw: t, kind: 'direct', value: symbols.get(upper), label: upper };
  return { raw: t, kind: 'label', label: upper };
}

function splitOperands(s: string): string[] {
  const trimmed = s.trim();
  if (!trimmed) return [];
  return trimmed.split(',').map((x) => x.trim());
}

interface ParsedLine {
  lineNo: number;
  label: string | null;
  mnemonic: string | null;
  operandsRaw: string[];
  text: string;
}

function parseLine(text: string, lineNo: number): ParsedLine {
  let s = text.split(';')[0];
  s = s.replace(/\t/g, ' ').trimEnd();
  const trimmedStart = s.trimStart();
  if (!trimmedStart) return { lineNo, label: null, mnemonic: null, operandsRaw: [], text };

  let label: string | null = null;
  let rest = s;

  const labelMatch = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:/.exec(s);
  if (labelMatch) {
    label = labelMatch[1].toUpperCase();
    rest = s.slice(labelMatch[0].length);
  } else {
    // Manual-style listings sometimes write "Label  MNEMONIC ..." with no colon, at column 0,
    // followed by an indented continuation. Only treat a leading bare word as a label if it isn't
    // itself a recognized mnemonic/directive — otherwise every unindented instruction line would
    // misparse as "instruction-name treated as a label".
    const bareLabel = /^([A-Za-z_][A-Za-z0-9_]*)\s+(.*)$/.exec(s);
    if (bareLabel && text === trimmedStart && !KNOWN_MNEMONICS.has(bareLabel[1].toUpperCase())) {
      label = bareLabel[1].toUpperCase();
      rest = bareLabel[2];
    }
  }

  const restTrimmed = rest.trim();
  if (!restTrimmed) return { lineNo, label, mnemonic: null, operandsRaw: [], text };

  const mnemonicMatch = /^(\S+)\s*(.*)$/.exec(restTrimmed);
  if (!mnemonicMatch) return { lineNo, label, mnemonic: null, operandsRaw: [], text };
  const mnemonic = mnemonicMatch[1].toUpperCase();
  const operandsRaw = splitOperands(mnemonicMatch[2]);
  return { lineNo, label, mnemonic, operandsRaw, text };
}

// --- Instruction encoding -------------------------------------------------

interface EncodeCtx {
  address: number; // address of this instruction (for relative branch calc)
  symbols: Map<string, number>;
  lineNo: number;
}

interface EncodeOutcome {
  bytes: number[]; // opcode + operand bytes (may contain placeholder 0 for unresolved labels on pass 1)
  unresolved?: string; // label name still unresolved (pass 1 only) — caller re-encodes on pass 2
}

function rel8(target: number, nextAddr: number, lineNo: number, errors: AssembleError[]): number {
  const offset = target - nextAddr;
  if (offset < -128 || offset > 127) {
    errors.push({ line: lineNo, message: `Branch target out of range (${offset} bytes) for a relative jump.` });
  }
  return offset & 0xff;
}

function hi(n: number) {
  return (n >> 8) & 0xff;
}
function lo(n: number) {
  return n & 0xff;
}

function encode(mnemonic: string, ops: Operand[], ctx: EncodeCtx, errors: AssembleError[]): EncodeOutcome | null {
  const [a, b, c] = ops;
  const err = (msg: string) => errors.push({ line: ctx.lineNo, message: msg });
  const resolveDirectOrLabel = (op: Operand): number => {
    if (op.value !== undefined) return op.value;
    if (op.label && ctx.symbols.has(op.label)) return ctx.symbols.get(op.label)!;
    err(`Undefined symbol '${op.raw}'.`);
    return 0;
  };

  switch (mnemonic) {
    case 'NOP':
      return { bytes: [0x00] };
    case 'RET':
      return { bytes: [0x22] };
    case 'RETI':
      return { bytes: [0x32] };
    case 'RL':
      if (a?.kind === 'A') return { bytes: [0x23] };
      break;
    case 'RR':
      if (a?.kind === 'A') return { bytes: [0x03] };
      break;
    case 'RLC':
      if (a?.kind === 'A') return { bytes: [0x33] };
      break;
    case 'RRC':
      if (a?.kind === 'A') return { bytes: [0x13] };
      break;
    case 'SWAP':
      if (a?.kind === 'A') return { bytes: [0xc4] };
      break;
    case 'DA':
      if (a?.kind === 'A') return { bytes: [0xd4] };
      break;
    case 'MUL':
      if (a?.kind === 'AB') return { bytes: [0xa4] };
      break;
    case 'DIV':
      if (a?.kind === 'AB') return { bytes: [0x84] };
      break;
    case 'CPL':
      if (a?.kind === 'A') return { bytes: [0xf4] };
      if (a?.kind === 'C') return { bytes: [0xb3] };
      if (a?.kind === 'direct') return { bytes: [0xb2, resolveDirectOrLabel(a)] };
      break;
    case 'CLR':
      if (a?.kind === 'A') return { bytes: [0xe4] };
      if (a?.kind === 'C') return { bytes: [0xc3] };
      if (a?.kind === 'direct') return { bytes: [0xc2, resolveDirectOrLabel(a)] };
      break;
    case 'SETB':
      if (a?.kind === 'C') return { bytes: [0xd3] };
      if (a?.kind === 'direct') return { bytes: [0xd2, resolveDirectOrLabel(a)] };
      break;
    case 'INC':
      if (a?.kind === 'A') return { bytes: [0x04] };
      if (a?.kind === 'Rn') return { bytes: [0x08 + a.n!] };
      if (a?.kind === 'atRi') return { bytes: [0x06 + a.n!] };
      if (a?.kind === 'DPTR') return { bytes: [0xa3] };
      if (a?.kind === 'direct') return { bytes: [0x05, resolveDirectOrLabel(a)] };
      break;
    case 'DEC':
      if (a?.kind === 'A') return { bytes: [0x14] };
      if (a?.kind === 'Rn') return { bytes: [0x18 + a.n!] };
      if (a?.kind === 'atRi') return { bytes: [0x16 + a.n!] };
      if (a?.kind === 'direct') return { bytes: [0x15, resolveDirectOrLabel(a)] };
      break;
    case 'PUSH':
      if (a?.kind === 'direct') return { bytes: [0xc0, resolveDirectOrLabel(a)] };
      break;
    case 'POP':
      if (a?.kind === 'direct') return { bytes: [0xd0, resolveDirectOrLabel(a)] };
      break;
    case 'MOVX': {
      if (a?.kind === 'A' && b?.kind === 'atDPTR') return { bytes: [0xe0] };
      if (a?.kind === 'atDPTR' && b?.kind === 'A') return { bytes: [0xf0] };
      if (a?.kind === 'A' && b?.kind === 'atRi') return { bytes: [0xe2 + b.n!] };
      if (a?.kind === 'atRi' && b?.kind === 'A') return { bytes: [0xf2 + a.n!] };
      break;
    }
    case 'MOV': {
      if (a?.kind === 'A' && b?.kind === 'immediate') return { bytes: [0x74, resolveDirectOrLabel(b)] };
      if (a?.kind === 'A' && b?.kind === 'Rn') return { bytes: [0xe8 + b.n!] };
      if (a?.kind === 'A' && b?.kind === 'direct') return { bytes: [0xe5, resolveDirectOrLabel(b)] };
      if (a?.kind === 'A' && b?.kind === 'atRi') return { bytes: [0xe6 + b.n!] };
      if (a?.kind === 'Rn' && b?.kind === 'immediate') return { bytes: [0x78 + a.n!, resolveDirectOrLabel(b)] };
      if (a?.kind === 'Rn' && b?.kind === 'A') return { bytes: [0xf8 + a.n!] };
      if (a?.kind === 'Rn' && b?.kind === 'direct') return { bytes: [0xa8 + a.n!, resolveDirectOrLabel(b)] };
      if (a?.kind === 'direct' && b?.kind === 'immediate')
        return { bytes: [0x75, resolveDirectOrLabel(a), resolveDirectOrLabel(b)] };
      if (a?.kind === 'direct' && b?.kind === 'A') return { bytes: [0xf5, resolveDirectOrLabel(a)] };
      if (a?.kind === 'direct' && b?.kind === 'Rn') return { bytes: [0x88 + b.n!, resolveDirectOrLabel(a)] };
      // 8051 quirk: "MOV direct,direct" encodes as [0x85, SRC, DEST] — operand order in the
      // machine code is reversed from the assembly syntax's dest,src order.
      if (a?.kind === 'direct' && b?.kind === 'direct')
        return { bytes: [0x85, resolveDirectOrLabel(b), resolveDirectOrLabel(a)] };
      if (a?.kind === 'direct' && b?.kind === 'atRi') return { bytes: [0x86 + b.n!, resolveDirectOrLabel(a)] };
      if (a?.kind === 'atRi' && b?.kind === 'immediate') return { bytes: [0x76 + a.n!, resolveDirectOrLabel(b)] };
      if (a?.kind === 'atRi' && b?.kind === 'A') return { bytes: [0xf6 + a.n!] };
      if (a?.kind === 'atRi' && b?.kind === 'direct') return { bytes: [0xa6 + a.n!, resolveDirectOrLabel(b)] };
      if (a?.kind === 'DPTR' && b?.kind === 'immediate') {
        const v = resolveDirectOrLabel(b);
        return { bytes: [0x90, hi(v), lo(v)] };
      }
      if (a?.kind === 'C' && b?.kind === 'direct') return { bytes: [0xa2, resolveDirectOrLabel(b)] };
      if (a?.kind === 'direct' && b?.kind === 'C') return { bytes: [0x92, resolveDirectOrLabel(a)] };
      break;
    }
    case 'XCH': {
      if (a?.kind === 'A' && b?.kind === 'Rn') return { bytes: [0xc8 + b.n!] };
      if (a?.kind === 'A' && b?.kind === 'direct') return { bytes: [0xc5, resolveDirectOrLabel(b)] };
      if (a?.kind === 'A' && b?.kind === 'atRi') return { bytes: [0xc6 + b.n!] };
      break;
    }
    case 'ADD':
    case 'ADDC':
    case 'SUBB': {
      const base: Record<string, number> = { ADD: 0x28, ADDC: 0x38, SUBB: 0x98 };
      const baseDirect: Record<string, number> = { ADD: 0x25, ADDC: 0x35, SUBB: 0x95 };
      const baseAtRi: Record<string, number> = { ADD: 0x26, ADDC: 0x36, SUBB: 0x96 };
      const baseImm: Record<string, number> = { ADD: 0x24, ADDC: 0x34, SUBB: 0x94 };
      if (a?.kind === 'A' && b?.kind === 'Rn') return { bytes: [base[mnemonic] + b.n!] };
      if (a?.kind === 'A' && b?.kind === 'direct') return { bytes: [baseDirect[mnemonic], resolveDirectOrLabel(b)] };
      if (a?.kind === 'A' && b?.kind === 'atRi') return { bytes: [baseAtRi[mnemonic] + b.n!] };
      if (a?.kind === 'A' && b?.kind === 'immediate') return { bytes: [baseImm[mnemonic], resolveDirectOrLabel(b)] };
      break;
    }
    case 'ANL':
    case 'ORL':
    case 'XRL': {
      const baseRn: Record<string, number> = { ANL: 0x58, ORL: 0x48, XRL: 0x68 };
      const baseDirect: Record<string, number> = { ANL: 0x55, ORL: 0x45, XRL: 0x65 };
      const baseAtRi: Record<string, number> = { ANL: 0x56, ORL: 0x46, XRL: 0x66 };
      const baseImm: Record<string, number> = { ANL: 0x54, ORL: 0x44, XRL: 0x64 };
      const baseToDirect: Record<string, number> = { ANL: 0x52, ORL: 0x42, XRL: 0x62 };
      const baseToDirectImm: Record<string, number> = { ANL: 0x53, ORL: 0x43, XRL: 0x63 };
      if (a?.kind === 'A' && b?.kind === 'Rn') return { bytes: [baseRn[mnemonic] + b.n!] };
      if (a?.kind === 'A' && b?.kind === 'direct') return { bytes: [baseDirect[mnemonic], resolveDirectOrLabel(b)] };
      if (a?.kind === 'A' && b?.kind === 'atRi') return { bytes: [baseAtRi[mnemonic] + b.n!] };
      if (a?.kind === 'A' && b?.kind === 'immediate') return { bytes: [baseImm[mnemonic], resolveDirectOrLabel(b)] };
      if (a?.kind === 'direct' && b?.kind === 'A') return { bytes: [baseToDirect[mnemonic], resolveDirectOrLabel(a)] };
      if (a?.kind === 'direct' && b?.kind === 'immediate')
        return { bytes: [baseToDirectImm[mnemonic], resolveDirectOrLabel(a), resolveDirectOrLabel(b)] };
      break;
    }
    case 'SJMP': {
      if (a?.kind === 'label' || a?.kind === 'direct') {
        const target = a.value !== undefined ? a.value : ctx.symbols.get(a.label!);
        if (target === undefined) return { bytes: [0x80, 0], unresolved: a.label };
        return { bytes: [0x80, rel8(target, ctx.address + 2, ctx.lineNo, errors)] };
      }
      break;
    }
    case 'LJMP': {
      if (a?.kind === 'label' || a?.kind === 'direct') {
        const target = a.value !== undefined ? a.value : ctx.symbols.get(a.label!);
        if (target === undefined) return { bytes: [0x02, 0, 0], unresolved: a.label };
        return { bytes: [0x02, hi(target), lo(target)] };
      }
      break;
    }
    case 'LCALL': {
      if (a?.kind === 'label' || a?.kind === 'direct') {
        const target = a.value !== undefined ? a.value : ctx.symbols.get(a.label!);
        if (target === undefined) return { bytes: [0x12, 0, 0], unresolved: a.label };
        return { bytes: [0x12, hi(target), lo(target)] };
      }
      break;
    }
    case 'AJMP':
    case 'ACALL': {
      if (a?.kind === 'label' || a?.kind === 'direct') {
        const target = a.value !== undefined ? a.value : ctx.symbols.get(a.label!);
        if (target === undefined) return { bytes: [mnemonic === 'AJMP' ? 0x01 : 0x11, 0], unresolved: a.label };
        const page = (ctx.address + 2) & 0xf800;
        if ((target & 0xf800) !== page) {
          err(`${a.raw} is outside the 2KB AJMP/ACALL page for this instruction.`);
        }
        const opBase = mnemonic === 'AJMP' ? 0x01 : 0x11;
        const a10_8 = (target >> 8) & 0x07;
        return { bytes: [opBase | (a10_8 << 5), lo(target)] };
      }
      break;
    }
    case 'JZ':
    case 'JNZ':
    case 'JC':
    case 'JNC': {
      const opc: Record<string, number> = { JZ: 0x60, JNZ: 0x70, JC: 0x40, JNC: 0x50 };
      if (a?.kind === 'label' || a?.kind === 'direct') {
        const target = a.value !== undefined ? a.value : ctx.symbols.get(a.label!);
        if (target === undefined) return { bytes: [opc[mnemonic], 0], unresolved: a.label };
        return { bytes: [opc[mnemonic], rel8(target, ctx.address + 2, ctx.lineNo, errors)] };
      }
      break;
    }
    case 'JB':
    case 'JNB':
    case 'JBC': {
      const opc: Record<string, number> = { JB: 0x20, JNB: 0x30, JBC: 0x10 };
      if (b && (b.kind === 'label' || b.kind === 'direct')) {
        const bitAddr = resolveDirectOrLabel(a);
        const target = b.value !== undefined ? b.value : ctx.symbols.get(b.label!);
        if (target === undefined) return { bytes: [opc[mnemonic], bitAddr, 0], unresolved: b.label };
        return { bytes: [opc[mnemonic], bitAddr, rel8(target, ctx.address + 3, ctx.lineNo, errors)] };
      }
      break;
    }
    case 'CJNE': {
      if (a?.kind === 'A' && b?.kind === 'immediate' && c) {
        const target = c.value !== undefined ? c.value : ctx.symbols.get(c.label!);
        if (target === undefined) return { bytes: [0xb4, resolveDirectOrLabel(b), 0], unresolved: c.label };
        return { bytes: [0xb4, resolveDirectOrLabel(b), rel8(target, ctx.address + 3, ctx.lineNo, errors)] };
      }
      if (a?.kind === 'A' && b?.kind === 'direct' && c) {
        const target = c.value !== undefined ? c.value : ctx.symbols.get(c.label!);
        if (target === undefined) return { bytes: [0xb5, resolveDirectOrLabel(b), 0], unresolved: c.label };
        return { bytes: [0xb5, resolveDirectOrLabel(b), rel8(target, ctx.address + 3, ctx.lineNo, errors)] };
      }
      if (a?.kind === 'Rn' && b?.kind === 'immediate' && c) {
        const target = c.value !== undefined ? c.value : ctx.symbols.get(c.label!);
        if (target === undefined) return { bytes: [0xb8 + a.n!, resolveDirectOrLabel(b), 0], unresolved: c.label };
        return { bytes: [0xb8 + a.n!, resolveDirectOrLabel(b), rel8(target, ctx.address + 3, ctx.lineNo, errors)] };
      }
      if (a?.kind === 'atRi' && b?.kind === 'immediate' && c) {
        const target = c.value !== undefined ? c.value : ctx.symbols.get(c.label!);
        if (target === undefined) return { bytes: [0xb6 + a.n!, resolveDirectOrLabel(b), 0], unresolved: c.label };
        return { bytes: [0xb6 + a.n!, resolveDirectOrLabel(b), rel8(target, ctx.address + 3, ctx.lineNo, errors)] };
      }
      break;
    }
    case 'DJNZ': {
      if (a?.kind === 'Rn' && b) {
        const target = b.value !== undefined ? b.value : ctx.symbols.get(b.label!);
        if (target === undefined) return { bytes: [0xd8 + a.n!, 0], unresolved: b.label };
        return { bytes: [0xd8 + a.n!, rel8(target, ctx.address + 2, ctx.lineNo, errors)] };
      }
      if (a?.kind === 'direct' && b) {
        const target = b.value !== undefined ? b.value : ctx.symbols.get(b.label!);
        const directAddr = resolveDirectOrLabel(a);
        if (target === undefined) return { bytes: [0xd5, directAddr, 0], unresolved: b.label };
        return { bytes: [0xd5, directAddr, rel8(target, ctx.address + 3, ctx.lineNo, errors)] };
      }
      break;
    }
  }
  return null;
}

// --- Two-pass driver -------------------------------------------------------

export function assemble8051(source: string): AssembleResult {
  const rawLines = source.split(/\r\n|\n/);
  const parsed = rawLines.map((l, i) => parseLine(l, i + 1));
  const errors: AssembleError[] = [];
  const symbols = new Map<string, number>();

  // Pass 1: compute addresses & symbol table. Instruction lengths are syntactic (depend on
  // addressing-mode operand *kinds*, not resolved label values), so we can size every
  // instruction without knowing forward-referenced label addresses yet.
  let address = 0;
  const sizes: (number | null)[] = [];
  for (const line of parsed) {
    if (line.label) {
      if (symbols.has(line.label)) {
        errors.push({ line: line.lineNo, message: `Duplicate label '${line.label}'.` });
      }
      symbols.set(line.label, address);
    }
    if (!line.mnemonic) {
      sizes.push(null);
      continue;
    }
    if (line.mnemonic === 'ORG') {
      const v = parseNumber(line.operandsRaw[0] ?? '');
      if (v === null) errors.push({ line: line.lineNo, message: `ORG needs a numeric address.` });
      else address = v;
      sizes.push(null);
      continue;
    }
    if (line.mnemonic === 'END') {
      sizes.push(null);
      break;
    }
    if (line.mnemonic === 'EQU') {
      sizes.push(null);
      continue;
    }
    const ops = line.operandsRaw.map((o) => classifyOperand(o, symbols));
    const dummyCtx: EncodeCtx = { address, symbols, lineNo: line.lineNo };
    const dummyErrors: AssembleError[] = [];
    const outcome = encode(line.mnemonic, ops, dummyCtx, dummyErrors);
    if (!outcome) {
      sizes.push(null);
      errors.push({
        line: line.lineNo,
        message: `Unrecognized instruction or operand combination: '${line.text.trim()}'.`,
      });
      continue;
    }
    sizes.push(outcome.bytes.length);
    address += outcome.bytes.length;
  }

  // Pass 2: encode with the now-complete symbol table.
  let baseAddress: number | null = null;
  let cursor = 0;
  const out: number[] = [];
  const listing: AssembleResult['listing'] = [];
  address = 0;

  for (let i = 0; i < parsed.length; i++) {
    const line = parsed[i];
    if (line.mnemonic === 'ORG') {
      const v = parseNumber(line.operandsRaw[0] ?? '');
      if (v !== null) {
        address = v;
        if (baseAddress === null) baseAddress = v;
        cursor = v - (baseAddress ?? v);
      }
      listing.push({ line: line.lineNo, address: null, bytes: [], text: line.text });
      continue;
    }
    if (line.mnemonic === 'END') {
      listing.push({ line: line.lineNo, address: null, bytes: [], text: line.text });
      break;
    }
    if (!line.mnemonic) {
      listing.push({ line: line.lineNo, address: null, bytes: [], text: line.text });
      continue;
    }
    if (line.mnemonic === 'EQU') {
      listing.push({ line: line.lineNo, address: null, bytes: [], text: line.text });
      continue;
    }
    if (baseAddress === null) baseAddress = address;

    const ops = line.operandsRaw.map((o) => classifyOperand(o, symbols));
    const ctx: EncodeCtx = { address, symbols, lineNo: line.lineNo };
    const outcome = encode(line.mnemonic, ops, ctx, errors);
    if (!outcome) {
      listing.push({ line: line.lineNo, address, bytes: [], text: line.text });
      continue;
    }
    listing.push({ line: line.lineNo, address, bytes: outcome.bytes, text: line.text });
    for (const b of outcome.bytes) {
      out[cursor] = b & 0xff;
      cursor++;
    }
    address += outcome.bytes.length;
  }

  const ok = errors.length === 0;
  const bytes = new Uint8Array(out.length);
  for (let i = 0; i < out.length; i++) bytes[i] = out[i] ?? 0;

  return {
    ok,
    bytes,
    baseAddress: baseAddress ?? 0,
    hex: ok ? bytesToIntelHex(bytes, baseAddress ?? 0) : '',
    errors,
    listing,
  };
}

export function bytesToIntelHex(bytes: Uint8Array, baseAddress: number, recordLen = 16): string {
  const lines: string[] = [];
  const toHexByte = (n: number) => n.toString(16).toUpperCase().padStart(2, '0');
  const checksum = (b: number[]) => (0x100 - (b.reduce((a, x) => a + x, 0) & 0xff)) & 0xff;

  for (let offset = 0; offset < bytes.length; offset += recordLen) {
    const chunk = Array.from(bytes.slice(offset, offset + recordLen));
    const addr = baseAddress + offset;
    const addrHi = (addr >> 8) & 0xff;
    const addrLo = addr & 0xff;
    const recordBytes = [chunk.length, addrHi, addrLo, 0x00, ...chunk];
    const cs = checksum(recordBytes);
    lines.push(
      `:${toHexByte(chunk.length)}${toHexByte(addrHi)}${toHexByte(addrLo)}00${chunk.map(toHexByte).join('')}${toHexByte(cs)}`,
    );
  }
  lines.push(':00000001FF');
  return lines.join('\n') + '\n';
}
