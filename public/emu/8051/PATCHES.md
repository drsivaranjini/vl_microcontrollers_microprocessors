# Patches — i8051emu (vendored)

Source: https://github.com/estarq/i8051emu (MIT, see `LICENSE`), commit at time of vendoring:
built from a fresh clone on 2026-07-08.

This engine is **not** a compiled/bundled Brython app — `index.html` loads `app.py` directly with
`<script type="text/python" src="app.py"></script>`, and Brython fetches `mcu.py` / `disassembler.py`
over HTTP at runtime (`import mcu`, `import disassembler`). So the interpreter core here is **plain,
unbundled Python source**, edited directly — no Rust/WASM-style rebuild needed for it. Only the
React/JSX UI shell (`lib/bundle.min.js`) is a build artifact, produced by the repo's own
`npm run prebuild && npm run build` (babel → browserify → terser).

## Honesty-log item resolved
`01_DECISION_LOG.md` open item #2: *"i8051emu MOVX/external-write hook — confirm where external-memory
writes surface; add the event emit there."* Resolved — see below.

## Patch 1 — `mcu.py`: add an external-memory (MOVX) write hook

`Microcontroller.__init__` gains `self.xmem_write_hook = None` and a new helper:

```python
def _xmem_write(self, addr, value):
    self.xmem[addr] = value
    if self.xmem_write_hook is not None:
        self.xmem_write_hook(int(addr), int(value))
```

The three opcode handlers that execute `MOVX @DPTR,A` / `MOVX @R0,A` / `MOVX @R1,A`
(`_exec_240`, `_exec_242`, `_exec_243`) were changed from writing `self.xmem[...]` directly to calling
`self._xmem_write(addr, self.mem.a)`. Reads (`_exec_224/226/227`, `MOVX A,@...`) are untouched — only
writes are observable side effects we need to stream out.

Verified with a standalone smoke test (no pytest available in the build environment):
instantiating `Microcontroller()`, setting `xmem_write_hook` to a list-appending lambda, setting
`mem.dptr = 0xFFC8` and `mem.a = 0x7F`, then calling `_exec_240()` directly — confirms `xmem[0xFFC8]`
is updated **and** the hook fires with `(0xFFC8, 0x7F)`.

## Patch 2 — `app.py`: wire the hook to `postMessage`

Right before the module-level `m = mcu.Microcontroller()` bootstrap, added:

```python
def _emit_xmem_write(addr, value):
    window.parent.postMessage(
        {
            'kind': 'emu-write',
            'bus': 'xmem',
            'addr': addr,
            'value': value & 0xFF,
            'tMs': window.performance.now(),
        },
        window.location.origin,
    )

m = mcu.Microcontroller()
m.xmem_write_hook = _emit_xmem_write
```

`browser.window` is already imported at the top of `app.py` (used elsewhere for e.g.
`window.currentAddr = ...`), so this needed no new imports. `window.location.origin` is used as the
explicit target origin (not `'*'`) since the emulator is self-hosted under the same GitHub Pages
origin as the parent page — see `emubus.ts`'s strict origin check.

`mcu_reset_rom` / `mcu_reset_ram` reset `self.mem` / `self.xmem` / `self._pc` on the *same* `m`
instance — they don't recreate `m` — so `xmem_write_hook` survives a student clicking Reset.

## Patch 3 — `mcu.py`: fix a pre-existing crash in `MOV DPTR,#data16` (opcode 0x90 / 144)

Unrelated to the MOVX hook, found while end-to-end verifying that a real manual program actually runs:
`next_cycle()` always dispatches `self._exec_{opcode}(*op.args)`, where `op.args` is the instruction's
trailing bytes **as separate, uncombined integers** straight from ROM (see `next_cycle`'s
`op.args = self.rom[pc+1 : pc+len(op)]`). Every other 3-byte opcode with a single 16-bit operand
follows that convention correctly — e.g. `_exec_2` (`LJMP`) and `_exec_18` (`LCALL`) both take
`(self, high_order_byte, low_order_byte)` and combine them manually. `_exec_144` (`MOV DPTR,#data16`)
was the sole exception: it took a single `immed` parameter, so `next_cycle` calling it with two
arguments raised `TypeError: _exec_144() takes 2 positional arguments but 3 were given` — a crash on
the very first `MOV DPTR,#...` instruction any program executes. Confirmed this is the *only* such
mismatch by cross-checking every opcode in `Operation._opcodes` against its `_exec_N` signature's
parameter count.

Since `MOV DPTR,#data16` is how every MOVX-based program (i.e. every Unit 3 DAC experiment) sets up
its external-memory pointer, this bug made the DAC experiments completely non-runnable, independent of
the MOVX hook itself being correctly wired. Fixed by matching the established convention:

```python
def _exec_144(self, high_order_byte, low_order_byte):
    self.mem.dptr = high_order_byte * 16 ** 2 + low_order_byte
```

**Verified end-to-end**, not just at the single-opcode level: transcribed the manual's Lab 7A sawtooth
program (`manual_extracted.txt` L1143–1155: `MOV DPTR,#FFC8 / MOV A,#00 / LOOP: MOVX @DPTR,A / INC A /
SJMP LOOP`) into Intel HEX via `scripts/hex-from-bytes.mjs` (`public/hex/lab7-sawtooth.hex`), loaded it
into a fresh `Microcontroller()`, set `pc = 0x4100`, and stepped `next_cycle()` 20 times. Before this
fix: `TypeError` on the first cycle. After: the `xmem_write_hook` fires `(0xFFC8, 0), (0xFFC8, 1),
(0xFFC8, 2), ...` — DAC2 ramping exactly as the manual describes, with no other manual edits.
(This upstream test suite's own `test_exec_144` — not shipped here — calls `_exec_144(30)` with one
argument; it would need updating to match if anyone runs it against this patched source.)

## Build

```
npm install --legacy-peer-deps   # mui-virtualized-table's peer range predates MUI v4.12
npx babel src -d lib
npx browserify lib/main.js -g [ envify --NODE_ENV production ] -g uglifyify | npx terser --compress --mangle > lib/bundle.min.js
```

`--legacy-peer-deps` is required because of a pre-existing peer-dependency mismatch between
`mui-virtualized-table@2.2.3` (wants `@material-ui/core@^3`) and the repo's pinned
`@material-ui/core@^4.12.3` — unrelated to our patch, present in the upstream repo as-is.

## Vendored files

`index.html`, `manifest.json`, `assets/`, `app.py` (patched), `mcu.py` (patched), `disassembler.py`
(unpatched), `lib/bundle.min.js` (built), `vendor/brython/{brython.min.js,brython_stdlib.js}` (moved
out of the original `node_modules/brython/` path — that name is blanket-excluded by
`virtual-lab/.gitignore`'s `node_modules/` rule, which would have silently dropped these two files from
version control; `index.html`'s `<script src>` tags were updated to match),
`LICENSE`.

## Known limitation (per `01_DECISION_LOG.md`)
i8051emu targets Chromium — show the "best in Chrome/Edge" notice on all 8051 pages
(`SimulatorFrame`'s `chromiumNotice` prop).
