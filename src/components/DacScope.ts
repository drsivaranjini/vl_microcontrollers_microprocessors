// Canvas oscilloscope. Plots bytes written to an external-memory address (default DAC2 = 0xFFC8)
// as a scrolling voltage-vs-time trace. See docs/04_INTERFACING_WIDGETS_SPEC.md §2.
import type { EmuWrite } from './emubus';

export interface DacScopeOptions {
  addr: number;
  vmin: number;
  vmax: number;
  windowMs: number;
}

export class DacScope {
  private ctx: CanvasRenderingContext2D;
  private buf: { t: number; v: number }[] = [];
  private addr: number;
  private vmin: number;
  private vmax: number;
  private windowMs: number;
  private raf = 0;

  constructor(private canvas: HTMLCanvasElement, opts: Partial<DacScopeOptions> = {}) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('DacScope: canvas 2D context unavailable');
    this.ctx = ctx;
    this.addr = opts.addr ?? 0xffc8;
    this.vmin = opts.vmin ?? 0;
    this.vmax = opts.vmax ?? 5;
    this.windowMs = opts.windowMs ?? 40;

    document.addEventListener('emu-write', this.onWrite as EventListener);
    this.loop();
  }

  private onWrite = (e: CustomEvent<EmuWrite>) => {
    const d = e.detail;
    if (d.bus !== 'xmem' || d.addr !== this.addr) return;
    const v = this.vmin + (d.value / 255) * (this.vmax - this.vmin);
    this.buf.push({ t: d.tMs, v });
    const cutoff = d.tMs - this.windowMs * 3;
    while (this.buf.length && this.buf[0].t < cutoff) this.buf.shift();
  };

  private loop = () => {
    this.draw();
    this.raf = requestAnimationFrame(this.loop);
  };

  private draw() {
    const { ctx, canvas } = this;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth * dpr;
    const H = canvas.clientHeight * dpr;
    if (canvas.width !== W) canvas.width = W;
    if (canvas.height !== H) canvas.height = H;

    const css = getComputedStyle(canvas);
    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = css.getPropertyValue('--scope-grid') || '#1f2a44';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = (W / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let i = 0; i <= 8; i++) {
      const y = (H / 8) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    if (this.buf.length < 2) return;
    const tEnd = this.buf[this.buf.length - 1].t;
    const tStart = tEnd - this.windowMs;
    const xOf = (t: number) => ((t - tStart) / this.windowMs) * W;
    const yOf = (v: number) => H - ((v - this.vmin) / (this.vmax - this.vmin)) * H;

    ctx.strokeStyle = css.getPropertyValue('--scope-trace') || '#37e6a0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    let started = false;
    for (const p of this.buf) {
      if (p.t < tStart) continue;
      const x = xOf(p.t);
      const y = yOf(p.v);
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  clear() {
    this.buf = [];
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    document.removeEventListener('emu-write', this.onWrite as EventListener);
  }
}
