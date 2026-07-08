// Bridges postMessage from a same-origin, self-hosted emulator iframe into a DOM CustomEvent
// that widgets can subscribe to without any emulator-specific coupling.
// See docs/04_INTERFACING_WIDGETS_SPEC.md §0.

export type EmuWrite = {
  kind: 'emu-write';
  bus: 'io' | 'xmem'; // 'io' = 8086 OUT/IN port; 'xmem' = 8051 external memory (MOVX)
  addr: number; // port number (io) or external address (xmem)
  value: number; // 0..255
  tMs: number; // emulator time in ms (for scope time-base / RPM)
};

let installed = false;

export function installEmuBus(): void {
  if (installed) return;
  installed = true;

  window.addEventListener('message', (e: MessageEvent) => {
    if (e.origin !== location.origin) return; // strict: self-hosted emulators only
    const d = e.data as Partial<EmuWrite> | null | undefined;
    if (!d || d.kind !== 'emu-write') return;
    if (typeof d.addr !== 'number' || typeof d.value !== 'number') return;
    document.dispatchEvent(new CustomEvent<EmuWrite>('emu-write', { detail: d as EmuWrite }));
  });
}

export function emitEmuWrite(detail: EmuWrite): void {
  document.dispatchEvent(new CustomEvent<EmuWrite>('emu-write', { detail }));
}
