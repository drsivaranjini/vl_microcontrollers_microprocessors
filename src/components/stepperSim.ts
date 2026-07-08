// Small, dependency-free stand-in for the manual's stepper program (Lab 9A/9B), used because the
// vendored 8086-emulator-web core does not implement OUT/IN (confirmed absent from its instruction
// grammar — see public/emu/8086/PATCHES.md). Per docs/02_BUILD_GUIDE.md §6's own fallback clause,
// this replaces patching/recompiling the Rust/WASM core for just these two interfacing experiments;
// every other 8086 experiment still runs on the real vendored emulator.
//
// This does not interpret the manual's assembly — it only reproduces the *observable behaviour* that
// matters to the widget: writing the 4-bit coil pattern to port 0xC0 at a controllable rate. The real
// listing (MOV/DEC/JNZ delay loop, etc.) is still shown verbatim as read-only CodeBlock content on the
// page; this is a simulation of its output, not an emulator.
import { emitEmuWrite } from './emubus';

export interface StepperProgramOptions {
  table: number[];
  addr?: number;
  stepIntervalMs?: number;
}

export class StepperProgramSim {
  private table: number[];
  private addr: number;
  private stepIntervalMs: number;
  private idx = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private running = false;

  constructor(opts: StepperProgramOptions) {
    this.table = opts.table;
    this.addr = opts.addr ?? 0xc0;
    this.stepIntervalMs = opts.stepIntervalMs ?? 300;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.tick();
  }

  stop(): void {
    this.running = false;
    if (this.timer !== undefined) clearTimeout(this.timer);
  }

  isRunning(): boolean {
    return this.running;
  }

  setIntervalMs(ms: number): void {
    this.stepIntervalMs = Math.max(20, ms);
  }

  private tick = (): void => {
    if (!this.running) return;
    const value = this.table[this.idx % this.table.length];
    emitEmuWrite({ kind: 'emu-write', bus: 'io', addr: this.addr, value, tMs: performance.now() });
    this.idx++;
    this.timer = setTimeout(this.tick, this.stepIntervalMs);
  };
}
