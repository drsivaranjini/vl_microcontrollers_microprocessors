# Patches — 8086-emulator-web (vendored)

Source: https://github.com/YJDoc2/8086-emulator-web (dual-licensed Apache-2.0 / MIT — both license
files copied here as `LICENSE_APACHE` / `LICENSE_MIT`). Core instruction set from a separate crate,
`emulator_8086` (git: https://github.com/YJDoc2/8086-Emulator), pulled in via Cargo.

**This is now a from-source build** (rebuilt via `wasm-pack build` + `npm run build`), not the prebuilt
`deploy` branch a previous pass here used — the prebuilt had a routing bug (see "Patch 1" below) that
required editing the app's own source, so a from-source rebuild became unavoidable.

## Patch 1 — the actual root cause of the blank-editor bug: hardcoded router paths

**Symptom** (reported after deploying the earlier prebuilt-based vendoring): the embedded 8086 emulator
showed only its header/footer — the code editor pane never rendered, on `lab-1a` and standalone.

**Root cause, confirmed by reading the source**: `webapp/src/components/router.js` hardcodes every
React Router path to the original author's own GitHub Pages deploy path:
```js
<Route exact path="/8086-emulator-web/" component={Home} />
<Route exact path="/8086-emulator-web/compile" component={() => <Compiler wasm={wasm} />} />
<Route exact path="/8086-emulator-web/help" component={InstructionSet} />
<Route component={invalidRoute} />  // invalidRoute redirects to "/8086-emulator-web/"
```
`navbar.js` and `home.js` have matching hardcoded `Link`/`history.push` targets. Served under our own
site's path (`/vl_microcontrollers_microprocessors/emu/8086/`, or any other sub-path), **none of these
routes ever match** — `<Switch>` falls through to `invalidRoute`, which redirects to a path that also
doesn't exist here, and only the static `Navbar`/`Footer` (which don't depend on routing) end up
rendering. This is a different, more specific bug than a generic CRA `homepage`/asset-path issue — an
earlier pass here fixed only the *asset* paths (see the git history of this file), which was necessary
but not sufficient.

**Fix**: in `router.js`, swapped `BrowserRouter` for `HashRouter` (routing becomes independent of
whatever sub-path the app is deployed under — the most robust option for an app embedded at an unknown
path) and simplified every route to `/`, `/compile`, `/help`. Updated the matching `Link`/`history.push`
targets in `navbar.js`/`home.js` the same way (longest-prefix-first string replace:
`/8086-emulator-web/help` → `/help`, `/8086-emulator-web/compile` → `/compile`, then remaining
`/8086-emulator-web/` → `/`).

## Patch 2 — path rewrite (asset paths only, prior pass — now folded into a full rebuild)

The previous vendoring (of the prebuilt `deploy` branch) rewrote every hardcoded `/8086-emulator-web/`
asset reference to `./` (relative). That fix is still necessary and is re-applied to this from-source
build's own output the same way — CRA's `homepage` field (`https://yjdoc2.github.io/8086-emulator-web/`
in the upstream `webapp/package.json`) bakes an absolute asset public-path into the build regardless of
routing, so `index.html`, `asset-manifest.json`, `sitemap.xml`, `robots.txt`, and the runtime chunk that
holds webpack's public-path variable all got the same `/8086-emulator-web/` → `./` treatment. Verified
zero remaining occurrences after the rewrite.

## Patch 3 — removed a stray third-party script

The upstream `webapp/public/index.html` (and thus every build from it) includes
`<script src="https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.js?v=1"></script>` — a
Google Dialogflow chat-widget loader from the original author's own site, unrelated to this project.
Removed from the build output.

## Rebuilding from source: the toolchain-generation saga

Getting a 2022-era Rust + React app to build with a 2026 Rust toolchain and a ~2020-era webpack/
`react-scripts@4` toolchain in the *same* pipeline surfaced five independent, unrelated
toolchain-version mismatches. Each is real and each has a specific, narrow fix — recorded here in the
order encountered so a future rebuild doesn't have to rediscover them:

**1. Node's OpenSSL default breaks old webpack.** `react-scripts@4`'s bundled webpack 4 calls
`crypto.createHash('md4')`, which Node 17+'s default OpenSSL 3 rejects
(`error:0308010C:digital envelope routines::unsupported`). Fix: `NODE_OPTIONS=--openssl-legacy-provider`
when running `npm run build` (or `npm start`) in `webapp/`.

**2. `wasm-bindgen` version floor vs. yanked versions vs. rustc's own minimum.** With no `Cargo.lock`
committed upstream and `wasm-bindgen = "0.2.63"` as an open-ended floor in `Cargo.toml`, a fresh `cargo`
resolves to whatever is newest today (`0.2.126` at the time of this rebuild) — modern wasm-bindgen's
codegen isn't readable by the `@webassemblyjs/wasm-parser@1.9.0` bundled inside `react-scripts@4`
(`Module parse failed: Internal failure: parseVec could not cast the value`). Pinning an old version
hits a *different* wall: current stable `rustc` refuses anything below `0.2.88`
(`error: older versions of the wasm-bindgen crate are incompatible with current versions of Rust`), and
`0.2.88` itself is yanked from crates.io. Fix: pinned `wasm-bindgen = "=0.2.92"` in `Cargo.toml` (oldest
version that's both rustc-1.9x-compatible and not yanked).

**3. Modern Rust emits a WASM "datacount" section even with bulk-memory disabled at the target-feature
level.** Section id `0x0c` (datacount, part of the bulk-memory proposal, spec'd to sit between the
`element` and `code` sections) is unknown to the 2020-era parser
(`Module parse failed: Unexpected section: 0xc`). Adding
`-C target-feature=-bulk-memory,-reference-types,-multivalue,-sign-ext` to `.cargo/config`'s `rustflags`,
and even `wasm-opt --mvp-features` on top, did **not** remove it — the section is emitted at codegen time
for encoding data-segment layout, not as a "bulk-memory instructions used" signal, and disabling the
target feature doesn't make LLVM re-encode the segments as active instead of passive. **This one was
fixed by patching the vendored parser** (see "Local build-tool patches" below), not by a compiler flag —
flag-tuning was a dead end here.

**4. `0xFC`-prefixed instructions appear regardless of target-feature flags, most likely from the
prebuilt `core`/`alloc` standard library.** Even after also disabling `-nontrapping-fptoint`,
`-extended-const`, and `-simd128`, a `0xFC`-prefixed instruction still surfaced
(`Unexpected instruction: 0xfc`) — from a memcpy/memset-style bulk-memory intrinsic baked into the
rustup-distributed prebuilt `wasm32-unknown-unknown` sysroot, which per-crate `rustflags` cannot
override (that would need nightly `-Z build-std`, a much bigger change not attempted here). **Also fixed
by a parser patch**, not a flag — see below. (In hindsight, patches 3 and 4 together suggest per-crate
rustflags were never going to fully solve this class of problem for a project this old; the local
parser patches turned out to be the right level to fix it at.)

**5. An unrelated, much slower dead end tried first: old cargo's resolver against today's package
index.** Before landing on pinning `wasm-bindgen` (fix #2), an attempt was made to build entirely with
an old (1.65.0, circa Nov 2022) `rustc`/`cargo` toolchain via `rustup install 1.65.0` +
`rustup override set`, reasoning that period-appropriate tooling would avoid all of the above. `cargo
metadata`/`generate-lockfile` with that cargo hung for 5+ minutes and climbing — cargo 1.65 predates the
sparse-registry protocol (stabilized in 1.68) and always falls back to cloning/walking the legacy
git-based crates.io index, which by 2026 is enormous. Generating a lockfile with modern `cargo` first
and downgrading its `version = 4` header to `3` didn't help either — modern and old cargo encode the
registry *source* differently in the lockfile, so old cargo still needed to re-fetch. **Abandoned**; not
needed once fix #2 (pinning wasm-bindgen precisely) let the *current* stable toolchain build a
parser-compatible-enough artifact on its own.

## Local build-tool patches (do not ship, not committed — see caveat below)

Two small patches were applied directly to `webapp/node_modules/@webassemblyjs/wasm-parser/lib/decoder.js`
to work around toolchain-mismatch items #3 and #4 above:

1. **Recognize section 12 (`datacount`) without breaking section ordering.** Added a `case 12:` in the
   section-dispatch switch that skips the section's bytes (same pattern as how unrecognized `custom`
   sections are already skipped). This alone wasn't sufficient — the parser also enforces a monotonic
   section-ID ordering check *before* reaching that switch, and treating `datacount`(12) as a normal
   section bumped the "next allowed minimum ID" to 13, which then rejected the legitimate `code`(10)
   section that's spec'd to follow it. Also patched that ordering check to exempt section 12, mirroring
   how `custom`(0) sections are already exempted from it.
2. **No second patch needed for issue #4** — that turned out to be already covered by webpack's own
   `ignoreCodeSection: true` / `ignoreDataSection: true` options (already passed by
   `webpack/lib/wasm/WebAssemblyParser.js` and `WebAssemblyGenerator.js`), which skip instruction-level
   decoding of function bodies entirely. The `0xFC` error only reproduced in an ad hoc standalone test
   script that called `decode()` without those options — with them (i.e. under real webpack usage), it
   parses cleanly. Lesson: reproduce build-tool errors using the *exact* invocation the real build uses,
   not a simplified stand-in, before concluding a deeper patch is needed.

**These two patches were applied with the user's explicit sign-off** (the harness's own safety layer
flagged patching third-party `node_modules` and required asking first). They live only in
`webapp/node_modules/`, which is `.gitignore`d and rebuilt fresh by `npm install` — **they are not part
of this repository and are not shipped**. If `webapp/` is ever rebuilt from scratch (fresh
`npm install`), these two `decoder.js` edits will need to be reapplied before `npm run build` will
succeed, using the description above. This is a real, if narrow, maintenance burden for anyone
rebuilding this specific vendored app in the future with a similarly modern Rust + old
webpack/react-scripts combination — worth revisiting if `react-scripts` itself is ever upgraded (a
current webpack 5 + current `@webassemblyjs/wasm-parser` wouldn't have any of these problems, since
`datacount`/bulk-memory instructions have been standard, unremarkable WASM features for years now).

## Honesty-log item — `OUT`/`IN` (decision log open item #1): still absent, still not patched

Unrelated to the above — see the decision log and `01_DECISION_LOG.md` for the full writeup, unchanged
by this rebuild. `OUT`/`IN` are confirmed absent from the `emulator_8086` crate's instruction grammar.
**Decision, unchanged**: do not add them to the Rust core (out of scope for a routing bugfix pass); Lab
9A/9B continue to use the bespoke TypeScript stepper-program runner
(`src/components/stepperSim.ts`/`StepperSimControls.astro`) instead of this iframe. Every other 8086
experiment (Labs 0–3, 1a, 1b, 2) uses this emulator via iframe as normal, and none of them need `OUT`.

## Build (for reference — see the toolchain saga above for full context)

```bash
# One-time environment setup:
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
source "$HOME/.cargo/env"
rustup target add wasm32-unknown-unknown
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# In the repo root (after applying Patch 1 to webapp/src/components/{router,navbar}.js, webapp/src/pages/home.js,
# and pinning wasm-bindgen = "=0.2.92" in Cargo.toml):
wasm-pack build --frozen   # produces pkg/ ; --frozen once Cargo.lock exists, to skip re-resolution
cd webapp
npm install --legacy-peer-deps   # pre-existing upstream peer-dep mismatch, unrelated to this project
# (apply the two decoder.js patches described above to node_modules/@webassemblyjs/wasm-parser/lib/decoder.js)
NODE_OPTIONS=--openssl-legacy-provider npm run build
# Then: rewrite /8086-emulator-web/ -> ./ in build/{index.html,asset-manifest.json,sitemap.xml,
# robots.txt,static/js/runtime-main.*.js}; strip the Dialogflow <script> tag from build/index.html;
# copy build/* into public/emu/8086/ (keep LICENSE_APACHE/LICENSE_MIT/PATCHES.md).
```

## Verifying MIME types (upstream README caveat, unchanged from before)

The upstream README warns that a naive static server can serve `.wasm` with the wrong `Content-Type`,
which breaks `WebAssembly.instantiateStreaming` (falls back to a slower path, still works). Astro's
dev/build/preview servers and GitHub Pages both set `application/wasm` correctly — verified via
`astro dev` + `curl -D -` on the vendored `.module.wasm` file. No action needed.
