import type { ComponentType } from 'react';
import Lab0Logic from './lab-0-logic';
import Lab1a from './lab-1a';
import Lab1b from './lab-1b';
import Lab2 from './lab-2';
import Lab3 from './lab-3';
import Lab4a from './lab-4a';
import Lab4b from './lab-4b';
import Lab5 from './lab-5';
import Lab6 from './lab-6';

// Only experiments with status: 'live' (see meta.ts) need an entry here — Units 3/4 are
// intentionally not registered yet (pilot release, docs/12_REDESIGN_BRIEF.md).
export const experimentContent: Record<string, ComponentType> = {
  'lab-0-logic': Lab0Logic,
  'lab-1a': Lab1a,
  'lab-1b': Lab1b,
  'lab-2': Lab2,
  'lab-3': Lab3,
  'lab-4a': Lab4a,
  'lab-4b': Lab4b,
  'lab-5': Lab5,
  'lab-6': Lab6,
};
