// Build-time feature flags (docs/17_PERIPHERAL_SUBSYSTEM_IMPLEMENTATION.md §7). Static site ->
// flipping a flag means changing the Vercel env var and redeploying, not editing content.
// Default OFF so a missing/typo'd env var can never accidentally reveal a hidden unit.
export const FEATURES = {
  unit3: process.env.NEXT_PUBLIC_FEATURE_UNIT3 === 'true', // Interfacing: DAC waveforms (Lab 7/8), stepper (Lab 9)
  unit4: process.env.NEXT_PUBLIC_FEATURE_UNIT4 === 'true', // ARM (Lab 10-12)
} as const;

export function isUnitReleased(unit: number): boolean {
  if (unit === 3) return FEATURES.unit3;
  if (unit === 4) return FEATURES.unit4;
  return true; // Units 1 & 2 are always live
}
