// Reads 4-bit patterns written to a port (default C0h) and animates an SVG rotor.
// Direction is inferred from the pattern sequence, so it works for both the forward table
// (09 05 06 0A) and the reverse table (0A 06 05 09) without hardcoding either.
// See docs/04_INTERFACING_WIDGETS_SPEC.md §3.
import type { EmuWrite } from './emubus';

const CYCLE = [0x09, 0x05, 0x06, 0x0a];

export interface StepperMotorOptions {
  addr: number;
  degPerStep: number;
}

export class StepperMotor {
  private angle = 0;
  private prevIdx = -1;
  private steps = 0;
  private dir = 0;
  private stamps: number[] = [];
  private degPerStep: number;
  private addr: number;
  private reducedMotion: boolean;

  constructor(
    private root: SVGSVGElement,
    opts: Partial<StepperMotorOptions> = {},
  ) {
    this.addr = opts.addr ?? 0xc0;
    this.degPerStep = opts.degPerStep ?? 45;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.addEventListener('emu-write', this.onWrite as EventListener);
    this.render(0);
  }

  private onWrite = (e: CustomEvent<EmuWrite>) => {
    const d = e.detail;
    if (d.bus !== 'io' || d.addr !== this.addr) return;
    const idx = CYCLE.indexOf(d.value & 0x0f);
    if (idx < 0) return; // not a step pattern
    if (this.prevIdx >= 0) {
      const delta = (idx - this.prevIdx + 4) % 4;
      if (delta === 1) this.stepBy(+1, d.tMs);
      else if (delta === 3) this.stepBy(-1, d.tMs);
      else if (delta === 2) {
        const dir = this.dir || 1;
        this.stepBy(dir, d.tMs);
        this.stepBy(dir, d.tMs);
      }
    }
    this.prevIdx = idx;
    this.render(d.value & 0x0f);
  };

  private stepBy(dir: number, t: number) {
    this.dir = dir;
    this.steps++;
    this.angle += dir * this.degPerStep;
    this.stamps.push(t);
    const cut = t - 1000;
    while (this.stamps.length && this.stamps[0] < cut) this.stamps.shift();
  }

  private rpm() {
    if (this.stamps.length < 2) return 0;
    const dtMs = this.stamps[this.stamps.length - 1] - this.stamps[0];
    const revs = ((this.stamps.length - 1) * this.degPerStep) / 360;
    return dtMs > 0 ? Math.round((revs / (dtMs / 1000)) * 60) : 0;
  }

  private render(pattern: number) {
    const rotor = this.root.querySelector<SVGGElement>('.rotor');
    if (rotor) {
      if (this.reducedMotion) {
        rotor.style.transition = 'none';
      }
      rotor.setAttribute('transform', `rotate(${this.angle} 100 100)`);
    }
    for (let i = 0; i < 4; i++) {
      const coil = this.root.querySelector<SVGElement>(`.coil-${i}`);
      coil?.classList.toggle('energised', ((pattern >> i) & 1) === 1);
    }
    this.setText('.rd-dir', this.dir > 0 ? 'CW' : this.dir < 0 ? 'CCW' : '—');
    this.setText('.rd-steps', String(this.steps));
    this.setText('.rd-rpm', String(this.rpm()));
  }

  private setText(sel: string, v: string) {
    const n = this.root.querySelector(sel);
    if (n) n.textContent = v;
  }

  destroy() {
    document.removeEventListener('emu-write', this.onWrite as EventListener);
  }
}
