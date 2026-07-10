export type Unit = 1 | 2 | 3 | 4;
export type Device = '8086' | '8051' | 'ARM';
export type ExperimentStatus = 'live' | 'coming-soon';

export interface ExperimentMeta {
  id: string; // URL slug, e.g. "lab-1a"
  unit: Unit;
  order: number;
  title: string;
  device: Device;
  status: ExperimentStatus;
  aim: string;
}

/**
 * Declarative peripheral config for an 8051 experiment (docs/17_PERIPHERAL_SUBSYSTEM_IMPLEMENTATION.md).
 * Editor8051 renders a PeripheralBench below the emulator for whichever of these an experiment
 * declares -- adding a new output type is adding a widget + a variant here, no core changes.
 */
export type Peripheral =
  | { kind: 'xmem'; watch: number[]; preset?: { addr: number; value: number }[] }
  | { kind: 'dac-scope'; addr?: number; vmin?: number; vmax?: number };
