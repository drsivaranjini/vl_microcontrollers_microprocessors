import type { ExperimentMeta } from './types';
import { isUnitReleased } from '@/lib/features';

// Units 1–2 are always released; Units 3–4 are built and listed here (docs/17_...  §7) but stay
// completely absent from every UI surface unless NEXT_PUBLIC_FEATURE_UNIT3/4 is set -- see
// `releasedExperiments` below, which every rendering surface must derive from instead of reading
// this array directly.
export const experiments: ExperimentMeta[] = [
  // Unit 1 — 8086
  {
    id: 'lab-0-logic',
    unit: 1,
    order: 1,
    title: 'Data Transfer, Logical & Arithmetic Operations (8086)',
    device: '8086',
    aim: 'To learn the registers, instruction set, and data-transfer/logical/arithmetic operations of the 8086 microprocessor using AND, OR, ADD, SUB, MUL and DIV on 16-bit numbers.',
  },
  {
    id: 'lab-1a',
    unit: 1,
    order: 2,
    title: '16-Bit Addition (With and Without Carry)',
    device: '8086',
    aim: 'To perform 16-bit addition using the 8086 microprocessor, with and without carry.',
  },
  {
    id: 'lab-1b',
    unit: 1,
    order: 3,
    title: 'Block Transfer of Data Bytes (8086)',
    device: '8086',
    aim: 'To perform block transfer of data bytes using the 8086 microprocessor.',
  },
  {
    id: 'lab-2',
    unit: 1,
    order: 4,
    title: 'Sum of N Numbers (8086)',
    device: '8086',
    aim: 'To find the sum of n numbers using the 8086 microprocessor.',
  },
  {
    id: 'lab-3',
    unit: 1,
    order: 5,
    title: 'Sorting Odd and Even Numbers in an Array (8086)',
    device: '8086',
    aim: 'To check for even and odd numbers in an array using the 8086 microprocessor.',
  },
  // Unit 2 — 8051
  {
    id: 'lab-4a',
    unit: 2,
    order: 1,
    title: '8-Bit Addition (8051)',
    device: '8051',
    aim: 'To perform 8-bit addition using the 8051 microcontroller.',
  },
  {
    id: 'lab-4b',
    unit: 2,
    order: 2,
    title: '8-Bit Subtraction (8051)',
    device: '8051',
    aim: 'To perform 8-bit subtraction using the 8051 microcontroller.',
  },
  {
    id: 'lab-5',
    unit: 2,
    order: 3,
    title: "One's and Two's Complement of a Number (8051)",
    device: '8051',
    aim: "To find the 1's and 2's complement of an 8-bit number using the 8051 microcontroller.",
  },
  {
    id: 'lab-6',
    unit: 2,
    order: 4,
    title: 'Fibonacci Series (8051)',
    device: '8051',
    aim: 'To generate a Fibonacci series using the 8051 microcontroller.',
  },
  // Unit 3 — Interfacing (held from pilot)
  {
    id: 'lab-7-sawtooth',
    unit: 3,
    order: 1,
    title: 'Generation of Sawtooth Waveform Using 8051',
    device: '8051',
    aim: 'To write an assembly language program to generate a sawtooth waveform using the 8051 microcontroller.',
  },
  {
    id: 'lab-7-triangular',
    unit: 3,
    order: 2,
    title: 'Generation of Triangular Waveform Using 8051',
    device: '8051',
    aim: 'To write an assembly language program to generate a triangular waveform using the 8051 microcontroller.',
  },
  {
    id: 'lab-8-square',
    unit: 3,
    order: 3,
    title: 'Generation of Square Waveform Using 8051',
    device: '8051',
    aim: 'To write an assembly language program to generate a square waveform using the 8051 microcontroller.',
  },
  {
    id: 'lab-9a',
    unit: 3,
    order: 4,
    title: 'Stepper Motor Interface with 8086 (Forward, Variable Speed)',
    device: '8086',
    aim: 'To write an assembly language program to interface a stepper motor with the 8086 microprocessor and run it forward at a variable speed.',
  },
  {
    id: 'lab-9b',
    unit: 3,
    order: 5,
    title: 'Stepper Motor Interface with 8086 (Forward and Reverse)',
    device: '8086',
    aim: 'To write an assembly language program to run a stepper motor forward then in reverse, with delay, using the 8086 microprocessor.',
  },
  // Unit 4 — ARM (held from pilot)
  {
    id: 'lab-10',
    unit: 4,
    order: 1,
    title: 'ALP to Perform Arithmetic Operations (ARM)',
    device: 'ARM',
    aim: 'To write ARM assembly language programs to perform addition, subtraction, multiplication, and division.',
  },
  {
    id: 'lab-11',
    unit: 4,
    order: 2,
    title: 'ALP to Find Factorial of a Number (ARM)',
    device: 'ARM',
    aim: 'To write an assembly language program to find the factorial of a number using the Keil µVision platform.',
  },
  {
    id: 'lab-12',
    unit: 4,
    order: 3,
    title: 'ALP to Find the Largest and Smallest of Numbers (ARM)',
    device: 'ARM',
    aim: 'To write an assembly language program to find the largest and smallest of an array of numbers using the Keil µVision platform.',
  },
];

export function getExperiment(id: string): ExperimentMeta | undefined {
  return experiments.find((e) => e.id === id);
}

export function experimentsByUnit(unit: 1 | 2 | 3 | 4): ExperimentMeta[] {
  return experiments.filter((e) => e.unit === unit).sort((a, b) => a.order - b.order);
}

// Every rendering surface (hero stats, experiments grid, browse dropdown, prev/next, static
// params) must derive from this, not from `experiments` directly -- that's what keeps a hidden
// unit's experiments from leaking into any UI surface (docs/17_... §7.1/7.2).
export const releasedExperiments = experiments.filter((e) => isUnitReleased(e.unit));
export const liveExperiments = releasedExperiments; // back-compat alias for existing imports

// For the Prev/Next buttons at the bottom of each experiment page (top-bar-only nav, no sidebar —
// docs/14_QA_ROUND3_AND_DLMS_MATCH.md A6). `experiments` is already declared unit-by-unit in lab
// order, so `releasedExperiments` is already the correct walk order.
export function getAdjacentExperiments(id: string): { prev: ExperimentMeta | null; next: ExperimentMeta | null } {
  const index = releasedExperiments.findIndex((e) => e.id === id);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? releasedExperiments[index - 1] : null,
    next: index < releasedExperiments.length - 1 ? releasedExperiments[index + 1] : null,
  };
}
