// Guard checks for the Unit 3/4 feature-flag system (docs/17_PERIPHERAL_SUBSYSTEM_IMPLEMENTATION.md
// §7.5): with the flags OFF (the default -- no env vars set), Units 3/4 must be completely absent
// from every derived list and route; with a flag ON, its unit's experiments must reappear.
//
// Each scenario runs in its own process (env vars are read once, at module-import time, by
// features.ts -- there's no supported way to bust Node's ESM import cache to re-read them
// in-process, so this script tests exactly one scenario per invocation and a shell driver runs it
// four times with different env vars). Run all scenarios with: npx tsx scripts/verify-feature-flags.ts
//
// This only exercises the *data layer* (features.ts, meta.ts's derived lists) since that's what
// every UI surface and the [slug] route derive from -- it doesn't render React components. Unit
// 3/4 experiment *content* isn't built yet (docs/17 explicitly allows shipping the hide/show
// mechanism ahead of full Unit 3/4 content), so this can't yet assert "the route renders the
// experiment" for those units -- only "the derived lists correctly include or exclude them".

import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

function check(name: string, pass: boolean, detail?: string): boolean {
  console.log(`${pass ? 'PASS' : 'FAIL'}: ${name}`);
  if (!pass && detail) console.log('  ' + detail);
  return pass;
}

async function runScenario() {
  const { isUnitReleased } = await import('../src/lib/features');
  const { releasedExperiments, experiments } = await import('../src/content/experiments/meta');

  const results: boolean[] = [];
  const scenario = process.env.SCENARIO;

  if (scenario === 'off') {
    results.push(check('unit 1 released by default', isUnitReleased(1)));
    results.push(check('unit 2 released by default', isUnitReleased(2)));
    results.push(check('unit 3 NOT released by default', !isUnitReleased(3)));
    results.push(check('unit 4 NOT released by default', !isUnitReleased(4)));

    const releasedUnits = new Set(releasedExperiments.map((e) => e.unit));
    results.push(
      check(
        'releasedExperiments contains only units 1-2',
        !releasedUnits.has(3) && !releasedUnits.has(4),
        `got units: ${[...releasedUnits].join(',')}`,
      ),
    );
    results.push(
      check(
        'experiments (full list) still has unit 3/4 entries -- built & tracked, just not released',
        experiments.some((e) => e.unit === 3) && experiments.some((e) => e.unit === 4),
      ),
    );
    const slugs = new Set(releasedExperiments.map((e) => e.id));
    results.push(check('no unit-3 slug in the released list (lab-7-sawtooth)', !slugs.has('lab-7-sawtooth')));
    results.push(check('no unit-4 slug in the released list (lab-10)', !slugs.has('lab-10')));
  } else if (scenario === 'garbage-env') {
    results.push(check('typo\'d env value ("yes") does not release unit 3', !isUnitReleased(3)));
    results.push(check('typo\'d env value ("1") does not release unit 4', !isUnitReleased(4)));
  } else if (scenario === 'on') {
    results.push(check('unit 3 released when NEXT_PUBLIC_FEATURE_UNIT3=true', isUnitReleased(3)));
    results.push(check('unit 4 released when NEXT_PUBLIC_FEATURE_UNIT4=true', isUnitReleased(4)));
    const releasedUnits = new Set(releasedExperiments.map((e) => e.unit));
    results.push(
      check('releasedExperiments includes units 3 and 4 when both flags are on', releasedUnits.has(3) && releasedUnits.has(4)),
    );
    const slugs = new Set(releasedExperiments.map((e) => e.id));
    results.push(check('lab-7-sawtooth appears in releasedExperiments with the flag on', slugs.has('lab-7-sawtooth')));
    results.push(check('lab-10 (ARM) appears in releasedExperiments with the flag on', slugs.has('lab-10')));
  } else if (scenario === 'unit3-only') {
    results.push(check('unit 3 on, unit 4 still off -- independent flags', isUnitReleased(3) && !isUnitReleased(4)));
  } else {
    console.error('Unknown or missing SCENARIO env var');
    process.exit(2);
  }

  process.exit(results.every(Boolean) ? 0 : 1);
}

// Driver mode (no SCENARIO set): spawn this same file once per scenario, each with the right env.
async function main() {
  if (process.env.SCENARIO) {
    await runScenario();
    return;
  }

  const self = fileURLToPath(import.meta.url);
  const scenarios: { name: string; env: Record<string, string> }[] = [
    { name: 'off', env: { SCENARIO: 'off' } },
    { name: 'garbage-env', env: { SCENARIO: 'garbage-env', NEXT_PUBLIC_FEATURE_UNIT3: 'yes', NEXT_PUBLIC_FEATURE_UNIT4: '1' } },
    { name: 'on', env: { SCENARIO: 'on', NEXT_PUBLIC_FEATURE_UNIT3: 'true', NEXT_PUBLIC_FEATURE_UNIT4: 'true' } },
    { name: 'unit3-only', env: { SCENARIO: 'unit3-only', NEXT_PUBLIC_FEATURE_UNIT3: 'true' } },
  ];

  let allOk = true;
  for (const s of scenarios) {
    console.log(`\n--- scenario: ${s.name} ---`);
    const result = spawnSync('npx', ['tsx', self], {
      env: { ...process.env, ...s.env },
      stdio: 'inherit',
    });
    if (result.status !== 0) allOk = false;
  }

  process.exit(allOk ? 0 : 1);
}

main();
