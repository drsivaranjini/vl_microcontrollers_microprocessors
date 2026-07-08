# Credits

This virtual lab reuses two open-source emulator engines, self-hosted under `public/emu/`. Each keeps
its own license file and a `PATCHES.md` describing exactly what was changed and why.

- **8086-emulator-web** by [YJDoc2](https://github.com/YJDoc2) —
  [YJDoc2/8086-emulator-web](https://github.com/YJDoc2/8086-emulator-web), dual-licensed
  Apache-2.0 / MIT. Core instruction set from
  [YJDoc2/8086-Emulator](https://github.com/YJDoc2/8086-Emulator). See
  `public/emu/8086/LICENSE_APACHE`, `LICENSE_MIT`, and `PATCHES.md`.
- **i8051emu** by [Paul Lloyd](https://github.com/estarq) —
  [estarq/i8051emu](https://github.com/estarq/i8051emu), MIT license. See
  `public/emu/8051/LICENSE` and `PATCHES.md`.
- **CPUlator** — free-for-education ARMv7/Nios II/MIPS/RISC-V simulator, author-hosted at
  [cpulator.01xz.net](https://cpulator.01xz.net/). Linked out to (not embedded/vendored) — see
  `docs/01_DECISION_LOG.md`.

Course content (experiment descriptions, sample programs, expected outputs) is transcribed from the
21BMC302J lab manual (SRM Institute of Science and Technology) — see `docs/reference/`.
