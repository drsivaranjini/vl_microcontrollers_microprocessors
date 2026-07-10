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

## Patch 6 (peripheral subsystem, `docs/17_...`) — `mcu.py`/`app.py`: port-write hook

Sibling to patch 1's xmem hook, for port-driven peripherals (LEDs, 7-seg, stepper). Doc 17 calls this
"Patch 4" — renumbered here to continue this file's own sequence rather than collide with patches 4/5
above, which already existed when that doc was written.

`InternalDataMemory.__setitem__` is the single choke point every whole-byte SFR write passes through
(`MOV P1,A`, `MOV P1,#imm`, `MOV P1,direct`, `ANL`/`ORL`/`XRL P1,A`, ...) — unlike the three MOVX opcode
handlers patch 1 modified individually, there's no small fixed set of port-write call sites to edit, so
the hook lives in `__setitem__` itself, gated by a lookup table of the four port SFR addresses:

```python
class InternalDataMemory:
    _PORT_SFR_ADDRS = {128: 0, 144: 1, 160: 2, 176: 3}  # 0x80/0x90/0xA0/0xB0 -> port index

    def __init__(self):
        ...
        self.port_write_hook = None  # callback(port_index:int, value:int)

    def __setitem__(self, addr, value):
        self[addr].value = value
        port_index = self._PORT_SFR_ADDRS.get(int(addr))
        if port_index is not None and self.port_write_hook is not None:
            self.port_write_hook(port_index, int(self[addr]))
```

**Known limitation:** this only observes whole-byte writes. Individual bit writes (`SETB P1.0`) go
through `Byte.__setitem__` on the `Byte` object itself, not `InternalDataMemory.__setitem__`, so they
don't fire this hook. No manual experiment in the current pilot needs bit-level port output; revisit if
one does.

`app.py` wires it the same way as the xmem hook, with `bus:'io'` and the port index as `addr`:

```python
def _emit_port_write(port_index, value):
    window.parent.postMessage(
        {'kind': 'emu-write', 'bus': 'io', 'addr': port_index, 'value': value & 0xFF,
         'tMs': window.performance.now()},
        window.location.origin,
    )

m.mem.port_write_hook = _emit_port_write
```

**Reset survival gotcha (found while writing this patch):** unlike `xmem_write_hook` (which lives on
`m` itself, and `reset_rom`/`reset_ram` never replace `m`), `port_write_hook` lives on `m.mem`
(`InternalDataMemory`) — and `reset_ram()` does `self.mem = InternalDataMemory()`, a **fresh instance**,
which silently drops the hook on every Reset click. Fixed by re-attaching it inside `app.py`'s own
`mcu_reset_rom`/`mcu_reset_ram` wrapper functions (the only call sites the UI and patch 4's `load-hex`
handler use), right after calling through to `m.reset_rom()`/`m.reset_ram()`.

Verified with a standalone smoke test (same style as patch 1): `m.mem[144] = 0xAB` fires the hook with
`(1, 0xAB)` (port index 1, not the raw SFR address); addresses 128/160/176 map to ports 0/2/3;
writing a non-port direct address (`0x30`) does not fire it; `reset_ram()` is confirmed to replace
`m.mem` (motivating the re-attach in `app.py` rather than trusting the hook to survive on its own).

## Patch 7 (peripheral subsystem, `docs/17_...`) — `app.py`: `set-xmem` preset handler

Doc 17 calls this "Patch 5" (see the renumbering note in patch 6). Some manual experiments read an
input from a fixed external-memory address with no kit monitor to preload it (Lab 5 reads the number to
complement from `6500H`). Added a `set-xmem` case to the existing `_on_message` listener (patch 4),
alongside `load-hex`, with the same origin check and the same never-fail-silently ack pattern:

```python
if kind == 'set-xmem':
    try:
        addr = int(data.addr)
        value = int(data.value) & 0xFF
        m.xmem[addr] = value
        mcu_update_window_all()
        window.render()
    except Exception as exc:
        window.parent.postMessage({'kind': 'xmem-set-failed', 'message': str(exc)}, window.location.origin)
        return
    window.parent.postMessage({'kind': 'xmem-set', 'addr': addr, 'value': value}, window.location.origin)
```

Writes via `m.xmem[addr] = value` directly (not `m._xmem_write`), deliberately bypassing
`xmem_write_hook` — this is an input being *seeded* before the program runs, not something the program
itself wrote, so it shouldn't be indistinguishable from a real `MOVX` write to any widget subscribed to
`bus:'xmem'` writes (e.g. the `ExternalMemory` widget seeds its own displayed preset value directly from
the `preset` prop it was given, rather than waiting to see its own seed echoed back as a write event).

## Patch 8 (peripheral subsystem work) — `app.py`/`Editor8051.tsx`: a second, previously-unverified
## `emu-ready` race — the parent page's own hydration can lose the race, not just the iframe's boot

While building and *actually verifying in a real headless browser* (Playwright + Chromium, no system
browser was available so its runtime libs were extracted from `apt-get download`'d `.deb`s with
`dpkg-deb -x` rather than installed system-wide — the first time any session in this project's history
has had real in-browser verification instead of static HTML/curl checks), found that the
`emu-ready`/handshake described in patch 5 can still fail end-to-end, in a way patch 5 itself didn't
anticipate: patch 5's fix only accounted for the *iframe* posting `load-hex` too early relative to its
*own* boot. It didn't account for the reverse — Brython finishing its boot and posting its one-shot
`emu-ready` **before the parent page itself has finished hydrating** enough for `Editor8051.tsx`'s
`useEffect` to have registered its listener yet. This is a real race, not a hypothetical one: the
iframe's `src` starts loading directly from the static SSR'd HTML the instant the browser parses that
tag, in parallel with (not after) the parent's own React/Next.js/CodeMirror bundle downloading and
hydrating — and there's no guarantee hydration finishes first. Confirmed by isolating the two
suspects independently: (1) the underlying postMessage mechanism and the exact origin/source
filtering `Editor8051.tsx` uses are both fine — a listener attached early enough (via
`page.addInitScript`, before any page script runs) receives `emu-ready` correctly, origin and source
matching; (2) the real component's effect-registered listener still never saw it across dozens of
seconds on a fully fresh dev server + browser cache, which only makes sense if the broadcast arrived
before that listener existed.

**Fix:** turn the one-shot announcement into a retryable one. `_on_message` gains a `'ping'` case that
immediately re-posts `{'kind': 'emu-ready'}` on demand:

```python
if kind == 'ping':
    window.parent.postMessage({'kind': 'emu-ready'}, window.location.origin)
    return
```

`Editor8051.tsx`'s effect starts a `setInterval` posting `{kind: 'ping'}` to the iframe every 300ms
from the moment it mounts, and clears it as soon as an `emu-ready` is received (whether that's the
retry's own response or the original one-shot broadcast, if timing happens to favor it). Whichever
side finishes booting second, the handshake still completes — the fix doesn't depend on winning a race,
it depends on eventually asking again.
