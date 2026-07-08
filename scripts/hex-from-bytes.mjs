#!/usr/bin/env node
// Builds an Intel HEX file from a base address + a flat byte list, computing checksums
// programmatically instead of by hand. Used for the manual's Unit 2/3 8051 programs: the manual's
// own OPCODE/OPERAND columns already give the assembled bytes (this is a from-scratch course lab
// manual, not a disassembly of a real device, so those bytes ARE the source of truth) — this script
// just formats them as Intel HEX so i8051emu (which loads HEX, not assembly) can run them, without
// needing SDCC/ASEM-51 installed. See docs/02_BUILD_GUIDE.md §8.
//
// Usage: node scripts/hex-from-bytes.mjs <baseAddressHex> <out.hex> <byte> <byte> ...
// Example: node scripts/hex-from-bytes.mjs 4100 public/hex/lab7-sawtooth.hex 90 FF C8 74 00 F0 04 80 FC

function checksum(bytes) {
  const sum = bytes.reduce((a, b) => a + b, 0);
  return (0x100 - (sum & 0xff)) & 0xff;
}

function toHexByte(n) {
  return n.toString(16).toUpperCase().padStart(2, '0');
}

function buildIntelHex(baseAddr, data, recordLen = 16) {
  const lines = [];
  for (let offset = 0; offset < data.length; offset += recordLen) {
    const chunk = data.slice(offset, offset + recordLen);
    const addr = baseAddr + offset;
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

const [, , baseAddrArg, outPath, ...byteArgs] = process.argv;
if (!baseAddrArg || !outPath || byteArgs.length === 0) {
  console.error('Usage: node scripts/hex-from-bytes.mjs <baseAddressHex> <out.hex> <byte> <byte> ...');
  process.exit(1);
}

const baseAddr = parseInt(baseAddrArg, 16);
const data = byteArgs.map((b) => {
  const v = parseInt(b, 16);
  if (Number.isNaN(v) || v < 0 || v > 0xff) {
    throw new Error(`Invalid byte: ${b}`);
  }
  return v;
});

const hex = buildIntelHex(baseAddr, data);
const fs = await import('node:fs');
fs.writeFileSync(outPath, hex);
console.log(`Wrote ${outPath} (${data.length} bytes at 0x${baseAddrArg.toUpperCase()})`);
