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
