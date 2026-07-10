from browser import window

import disassembler
import mcu


def disassemble_to_window_assRows(file_content):
    window.assRows = [
        {
            'addr': addr,
            'bytes': bytes_,
            'opcode': opcode,
            'arg1': args[0] if args else '-',
            'arg2': args[1] if len(args) == 2 else '-',
            'mnemonic': mnemonic
        }
        for addr, bytes_, opcode, args, mnemonic
        in disassembler.disassemble(file_content)
    ]


def mcu_load_hex_file(file_content):
    m.load_hex_file(file_content)


def mcu_next_cycle():
    m.next_cycle()


def mcu_reset_rom():
    m.reset_rom()
    # virtual-lab patch: reset_rom()/reset_ram() rebuild m.mem as a fresh InternalDataMemory(),
    # which drops any hook attached to the old instance -- re-attach so the port-write hook
    # (Patch 6) survives Reset the same way xmem_write_hook already does (that one lives on `m`
    # itself, which reset_rom/reset_ram never replace, so it never needed this). No-op before
    # `_emit_port_write` exists (first call is always after module load finishes).
    m.mem.port_write_hook = _emit_port_write


def mcu_reset_ram():
    m.reset_ram()
    m.mem.port_write_hook = _emit_port_write


def mcu_set_seqKeyPressed():
    m.mem.p3[2] = 1


def mcu_clr_seqKeyPressed():
    m.mem.p3[2] = 0


def mcu_set_CSKB0_bit(bit_number):
    m.xmem.cskb0[bit_number] = 1


def mcu_set_CSKB1_bit(bit_number):
    m.xmem.cskb1[bit_number] = 1


def mcu_clr_CSKB0_bit(bit_number):
    m.xmem.cskb0[bit_number] = 0


def mcu_clr_CSKB1_bit(bit_number):
    m.xmem.cskb1[bit_number] = 0


def mcu_update_window_currentAddr():
    window.currentAddr = int(m.pc)


def mcu_update_window_memCells():
    if window.memType == 'ROM':
        window.memCells = [
            {'addr': addr, 'value': value} for addr, value in enumerate(m.rom)
        ]
    elif window.memType == 'RAM':
        window.memCells = [
            {'addr': addr, 'value': int(m.mem[addr])} for addr in range(128)
        ]
    elif window.memType == 'SFR':
        window.memCells = [
            {'addr': addr, 'value': int(m.mem[addr])} for addr in range(128, 256)
        ]
    elif window.memType == 'XRAM':
        window.memCells = [
            {'addr': addr, 'value': int(value)} for addr, value in enumerate(m.xmem)
        ]


def mcu_update_window_keyRegs():
    window.keyRegs = [
        {'name': 'A', 'value': int(m.mem.a)},
        {'name': 'B', 'value': int(m.mem.b)},
        {'name': 'SP', 'value': int(m.mem.sp)},
        {'name': 'PC', 'value': int(m.pc)},
        {'name': 'DPTR', 'value': int(m.mem.dptr)},
        {'name': 'TH0', 'value': int(m.mem.th0)},
        {'name': 'TL0', 'value': int(m.mem.tl0)},
        {'name': 'TH1', 'value': int(m.mem.th1)},
        {'name': 'TL1', 'value': int(m.mem.tl1)},
        {'name': 'R0', 'value': int(m.mem.r0)},
        {'name': 'R1', 'value': int(m.mem.r1)},
        {'name': 'R2', 'value': int(m.mem.r2)},
        {'name': 'R3', 'value': int(m.mem.r3)},
        {'name': 'R4', 'value': int(m.mem.r4)},
        {'name': 'R5', 'value': int(m.mem.r5)},
        {'name': 'R6', 'value': int(m.mem.r6)},
        {'name': 'R7', 'value': int(m.mem.r7)},
    ]


def mcu_update_window_flags():
    window.flags = {
        'ea': m.mem.ea,
        'es': m.mem.es,
        'et1': m.mem.et1,
        'ex1': m.mem.ex1,
        'et0': m.mem.et0,
        'ex0': m.mem.ex0,
        'ps': m.mem.ps,
        'pt1': m.mem.pt1,
        'px1': m.mem.px1,
        'pt0': m.mem.pt0,
        'px0': m.mem.px0,
        'c': m.mem.c,
        'ac': m.mem.ac,
        'f0': m.mem.f0,
        'rs1': m.mem.rs1,
        'rs0': m.mem.rs0,
        'ov': m.mem.ov,
        'f1': m.mem.f1,
        'p': m.mem.p,
        'tf1': m.mem.tf1,
        'tr1': m.mem.tr1,
        'tf0': m.mem.tf0,
        'tr0': m.mem.tr0,
        'ie1': m.mem.ie1,
        'it1': m.mem.it1,
        'ie0': m.mem.ie0,
        'it0': m.mem.it0,
        't1_gate': m.mem.t1_gate,
        't1_ct': m.mem.t1_ct,
        't1_m1': m.mem.t1_m1,
        't1_m0': m.mem.t1_m0,
        't0_gate': m.mem.t0_gate,
        't0_ct': m.mem.t0_ct,
        't0_m1': m.mem.t0_m1,
        't0_m0': m.mem.t0_m0,
    }


def mcu_update_window_ports():
    window.ports = [
        {'name': 'P0', 'bits': list(m.mem.p0.bits)},
        {'name': 'P1', 'bits': list(m.mem.p1.bits)},
        {'name': 'P2', 'bits': list(m.mem.p2.bits)},
        {'name': 'P3', 'bits': list(m.mem.p3.bits)},
    ]


def mcu_update_window_extDevsRegs():
    window.extDevsRegs = [
        {'name': 'CSDS', 'bits': list(m.xmem.csds.bits)},
        {'name': 'CSDB', 'bits': list(m.xmem.csdb.bits)},
        {'name': 'CSKB0', 'bits': list(m.xmem.cskb0.bits)},
        {'name': 'CSKB1', 'bits': list(m.xmem.cskb1.bits)},
    ]


def mcu_update_window_csds():
    window.csds = list(m.xmem.csds.bits)


def mcu_update_window_segments():
    window.segments = {
        name: bool(m.xmem.csdb[idx])
        for idx, name in enumerate(['dp', 'g', 'f', 'e', 'd', 'c', 'b', 'a'])
    }


def mcu_update_window_displayEnabled():
    window.displayEnabled = not m.mem.p1[1]


def mcu_update_window_buzzerEnabled():
    window.buzzerEnabled = not m.mem.p1[2]


def mcu_update_window_LEDEnabled():
    window.LEDEnabled = not m.mem.p1[0]


def mcu_update_window_all():
    mcu_update_window_currentAddr()
    mcu_update_window_memCells()
    mcu_update_window_keyRegs()
    mcu_update_window_flags()
    mcu_update_window_ports()
    mcu_update_window_extDevsRegs()
    mcu_update_window_csds()
    mcu_update_window_segments()
    mcu_update_window_displayEnabled()
    mcu_update_window_buzzerEnabled()
    mcu_update_window_LEDEnabled()


window.disassemble_to_window_assRows = disassemble_to_window_assRows
window.mcu_load_hex_file = mcu_load_hex_file
window.mcu_next_cycle = mcu_next_cycle
window.mcu_reset_rom = mcu_reset_rom
window.mcu_reset_ram = mcu_reset_ram
window.mcu_set_seqKeyPressed = mcu_set_seqKeyPressed
window.mcu_clr_seqKeyPressed = mcu_clr_seqKeyPressed
window.mcu_set_CSKB0_bit = mcu_set_CSKB0_bit
window.mcu_set_CSKB1_bit = mcu_set_CSKB1_bit
window.mcu_clr_CSKB0_bit = mcu_clr_CSKB0_bit
window.mcu_clr_CSKB1_bit = mcu_clr_CSKB1_bit
window.mcu_update_window_memCells = mcu_update_window_memCells
window.mcu_update_window_all = mcu_update_window_all

print8051hex = (":03000000020100FA\n"
                ":1001000075307F75313F75326D75330678307A04FE\n"
                ":100110007B01D2967930EBF323FB7938E6F308C202\n"
                ":0501200096DAEF80E714\n"
                ":00000001FF\n")

# virtual-lab patch: stream every MOVX external-memory write to the parent
# page as a same-origin postMessage, so widgets (e.g. the DAC oscilloscope)
# can subscribe without any i8051emu-specific coupling. See PATCHES.md.
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


# virtual-lab patch: stream every whole-byte write to P0-P3 to the parent page the same way, for
# port-driven peripheral widgets (LEDs, 7-seg, stepper). See PATCHES.md, Patch 6.
def _emit_port_write(port_index, value):
    window.parent.postMessage(
        {
            'kind': 'emu-write',
            'bus': 'io',
            'addr': port_index,
            'value': value & 0xFF,
            'tMs': window.performance.now(),
        },
        window.location.origin,
    )


m = mcu.Microcontroller()
m.xmem_write_hook = _emit_xmem_write
m.mem.port_write_hook = _emit_port_write
m.load_hex_file(print8051hex)
disassemble_to_window_assRows(print8051hex)
mcu_update_window_all()
window.render()

# virtual-lab patch: accept an assembled Intel HEX string from the parent page via postMessage,
# so the in-browser 8051 editor+assembler (Next.js redesign, docs/11_QA_ROUND2_FIXES.md C3) can
# load a freshly-assembled program without reaching into this app's internals directly. Mirrors
# exactly what TopBar.jsx's own file-upload handler does (mcu_reset_rom -> mcu_load_hex_file ->
# disassemble_to_window_assRows -> memType -> mcu_update_window_all -> render), just triggered by
# a message instead of a file input.
def _on_message(event):
    if event.origin != window.location.origin:
        return
    data = event.data
    try:
        kind = data.kind
    except Exception:
        return

    if kind == 'ping':
        # virtual-lab patch: re-announce readiness on demand. The one-shot emu-ready broadcast
        # below can still lose the race against the *parent's own* hydration -- if Next.js/React/
        # CodeMirror take longer to load+hydrate than Brython takes to boot (very possible: the
        # iframe's src starts loading immediately from the static SSR'd HTML, in parallel with,
        # not after, the parent bundle), Editor8051.tsx's listener may not exist yet when this
        # file finishes and posts its one-shot emu-ready. Confirmed live: emu-ready fires and is
        # never missed by a *pre-attached* listener, but the real React effect (registered only
        # after hydration) can still miss it. Fix: the parent retries a 'ping' every ~300ms until
        # it sees emu-ready, and this fires straight back whenever asked, so the eventual retry
        # always lands regardless of which side finished booting first. See PATCHES.md, Patch 8.
        window.parent.postMessage({'kind': 'emu-ready'}, window.location.origin)
        return

    if kind == 'load-hex':
        hex_content = data.hex
        # Ack back to the parent so it can tell "loaded" from "message never arrived" (e.g. this
        # iframe hadn't finished loading/booting Brython yet when the parent posted) instead of
        # silently declaring success while the emulator keeps running its previous program.
        try:
            mcu_reset_rom()
            m.load_hex_file(hex_content)
            disassemble_to_window_assRows(hex_content)
            window.memType = 'RAM'
            mcu_update_window_all()
            window.render()
        except Exception as exc:
            window.parent.postMessage({'kind': 'hex-load-failed', 'message': str(exc)}, window.location.origin)
            return
        window.parent.postMessage({'kind': 'hex-loaded'}, window.location.origin)
        return

    if kind == 'set-xmem':
        # virtual-lab patch: seed a byte of external memory before Run, for experiments whose
        # manual listing reads an input from a fixed XRAM address with no kit monitor to load it
        # (e.g. Lab 5 reads the number to complement from 6500H). See PATCHES.md, Patch 7. This is
        # an input seed, not a program-driven write, so it bypasses xmem_write_hook deliberately
        # (a preset shouldn't be indistinguishable from something the running program itself
        # wrote), then refreshes whichever panel is currently shown so a visible XRAM view updates
        # immediately instead of only on the next step.
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
        return


window.addEventListener('message', _on_message)

# Tell the parent the message listener is actually live. The iframe's own `load` event fires once
# its HTML/JS resources are fetched, but Brython still has to parse and run this file after that —
# the parent posting a load-hex message before this fires is exactly the race that let programs
# assemble successfully (asm8051.ts has no bug) yet never visibly load, with zero feedback.
window.parent.postMessage({'kind': 'emu-ready'}, window.location.origin)
