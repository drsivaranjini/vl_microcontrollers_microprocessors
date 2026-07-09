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

## Patch 4 (Next.js redesign) — `app.py`: accept assembled HEX via `postMessage`

`docs/11_QA_ROUND2_FIXES.md` C3: Unit 2 needed genuine write-assemble-run, but i8051emu only ever
loads HEX via its own file-upload button — there is no way for the *parent page* to hand it a
freshly-assembled program without either (a) faking a `File` object and a synthetic upload event, or
(b) reaching into the iframe's internal globals directly and hoping the call sequence matches what the
React shell's own `TopBar.jsx onFileUploaded` handler does. Chose a third option, consistent with the
existing same-origin `postMessage` architecture (`emubus.ts`, patch 1/2 above): added a listener,
mirroring `onFileUploaded`'s own sequence exactly (`mcu_reset_rom` → `m.load_hex_file` →
`disassemble_to_window_assRows` → `window.memType = 'RAM'` → `mcu_update_window_all` → `window.render()`):

```python
def _on_message(event):
    if event.origin != window.location.origin:
        return
    data = event.data
    try:
        kind = data.kind
    except Exception:
        return
    if kind != 'load-hex':
        return
    hex_content = data.hex
    mcu_reset_rom()
    m.load_hex_file(hex_content)
    disassemble_to_window_assRows(hex_content)
    window.memType = 'RAM'
    mcu_update_window_all()
    window.render()

window.addEventListener('message', _on_message)
```

The parent page (`Editor8051.tsx`) posts `{kind: 'load-hex', hex: '<intel hex string>'}` to the iframe's
`contentWindow` after assembling with `src/lib/asm8051.ts`. `window.render` is already relied upon by
this file's own initial-boot code a few lines above (`window.render()` after the first `load_hex_file`
call), confirming it's a stable, already-exposed global — this patch doesn't introduce any new
assumption about the app's internals, it just reuses the same one entry point a second time.
`mcu_reset_rom()` resets `self.mem`/`self.xmem`/`self.rom` on the *same* `m` instance (confirmed in
patch 1's writeup) so `xmem_write_hook` survives — the DAC scope keeps working after loading a
freshly-assembled program this way too.

## Patch 5 (QA round 3, A1) — `app.py`: ready/ack handshake for patch 4's `load-hex` message

`docs/14_QA_ROUND3_AND_DLMS_MATCH.md` A1 reported the Unit 2 assembler "failing silently" on `lab-5`
specifically. Root cause turned out to be **not** the assembler (`scripts/verify-assembler.ts` already
proved `asm8051.ts` assembles `lab-5`'s exact program, `CPL A` included, byte-for-byte correctly) — it
was a **race condition** in patch 4's `postMessage` bridge: the parent page had no way to know whether
this iframe had actually finished booting Brython and registering its `message` listener before it
posted `load-hex`, and `postMessage` has no delivery confirmation — a message posted too early just
vanishes, leaving the emulator silently running its previous program with zero feedback to the user.
(The React side's iframe also had `loading="lazy"`, which could delay the iframe starting to load at
all until it scrolled into view — removed.)

Fixed with an explicit three-message handshake, all still same-origin `postMessage`s:
- On boot, right after `window.addEventListener('message', _on_message)` runs (i.e. the listener is
  now actually live), `app.py` posts `{kind: 'emu-ready'}` to the parent. The parent (`Editor8051.tsx`)
  disables its "Assemble & Load" button until this arrives, so there is no way to post `load-hex`
  before this iframe can receive it.
- `_on_message`'s `load-hex` handler now wraps the actual load sequence in `try/except` and posts back
  either `{kind: 'hex-loaded'}` on success or `{kind: 'hex-load-failed', message: str(exc)}` on error,
  instead of assuming success silently.
- The parent starts a 5s timeout when it posts `load-hex`; if neither ack arrives in time, it shows a
  "the simulator didn't confirm — try again" banner rather than either a false-positive green banner or
  no banner at all.

This makes the three possible outcomes (assembled+loaded / assembly error / load didn't confirm) each
produce a distinct, visible banner — "never fail silently" now holds structurally, not just for the
error cases the code happens to anticipate.
