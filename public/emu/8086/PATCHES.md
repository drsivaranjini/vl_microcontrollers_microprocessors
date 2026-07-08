# Patches — 8086-emulator-web (vendored)

Source: https://github.com/YJDoc2/8086-emulator-web (dual-licensed Apache-2.0 / MIT — both license
files copied here as `LICENSE_APACHE` / `LICENSE_MIT`). Core instruction set comes from a separate
crate, `emulator_8086` (git: https://github.com/YJDoc2/8086-Emulator), pulled in via Cargo.

## What's vendored here, and why it's a prebuilt, not a from-source build

`02_BUILD_GUIDE.md` §4 says to prefer the author's prebuilt web build over building the Rust/WASM
core from source. There's no `gh-pages` branch, but the repo's `webapp/package.json` has
`"deploy": "gh-pages -d build -b deploy"`, and that **`deploy` branch exists** on the remote — it's the
author's own CI/manually-pushed static build (a create-react-app `build/` output, WASM already
compiled). Fetched with:
```
git clone --depth 1 --branch deploy https://github.com/YJDoc2/8086-emulator-web.git
```
This avoids installing Rust + wasm-pack + lalrpop in the build environment, matching
`07_LOCAL_DEV_WSL.md`'s "usually NOT needed" guidance for the 8086 emulator specifically.

## Patch — rewrite baked-in absolute asset paths

The `deploy` branch was built with CRA's `homepage` set to
`https://yjdoc2.github.io/8086-emulator-web/`, so every asset reference (in `index.html`, `404.html`,
`asset-manifest.json`, `static/js/runtime-main.*.js`, `static/js/main.*.chunk.js`, `manifest.json`) is
an **absolute, root-relative path** hardcoded to `/8086-emulator-web/...` — including the webpack
public-path variable (`s.p = "/8086-emulator-web/"`) used to dynamically fetch the `.module.wasm` and
JS chunks at runtime. Served under our own site at `/emu/8086/` (or `<BASE_URL>emu/8086/` if the site
ever gets a repo-subpath `base`, see `05_HOSTING_GITHUB_PAGES.md`), those absolute paths would 404.

Fix applied: a global string replace, `/8086-emulator-web/` → `./`, across the 6 affected files. This
turns every reference into a same-directory-relative path, which resolves correctly against whatever
document URL the iframe is actually loaded from — independent of the parent site's base path. Verified
zero remaining occurrences of the old literal string after the rewrite. This is a **path rewrite only**;
no application logic, instruction semantics, or the compiled `.wasm` binary were touched.

## Honesty-log item — `OUT`/`IN` (decision log open item #1): CONFIRMED ABSENT, not patched here

Investigated the core `emulator_8086` crate's instruction grammar
(`src/lib/interpreter/interpreter.lalrpop`): every supported mnemonic is an explicit token in that
file. Listed all ~80 of them (mov, add/adc/sub/sbb/cmp, conditional jumps, loop/loope/loopne,
movs/lods/stos/cmps/scas, logical ops, shifts/rotates, push/pop, call/ret, hlt, flag ops, bcd ops,
cbw/cwd, ...). **`out` and `in` are not among them.** Cross-checked against the manual's actual stepper
programs (Lab 9A/9B, `manual_extracted.txt` L1420–1471): every other mnemonic they use (`MOV, DEC, JNZ,
INC, JMP, CALL, RET, LOOP`) **is** supported — `OUT` is the one missing piece, but since the parser
rejects the whole file on an unrecognized mnemonic, the entire stepper program currently fails to
assemble in this emulator, not just that one line.

**Decision: do not patch/recompile the Rust/WASM core for this.** It would require installing a full
Rust + `wasm-pack` + `lalrpop` toolchain (none of which exists in this build environment) to add a
grammar rule, an `Instruction` variant, execution semantics, and a `wasm-bindgen` callback out to JS —
real, non-surgical work for what `02_BUILD_GUIDE.md` §6 itself calls out as the heavy path. Per that
section's own fallback clause — *"If patching an engine proves heavy, the fallback is a small embedded
JS core for the two interfacing experiments only"* — **Lab 9A/9B use a small, bespoke, dependency-free
TypeScript stepper-program runner instead of this iframe** (see `src/components/` — implemented
separately from this vendored engine, drives `StepperMotor.ts` directly). This emulator is still used
as-is, via iframe, for every other 8086 experiment (Labs 0–3, 1a, 1b, 2), none of which need `OUT`.

## Verifying MIME types (upstream README caveat)

The upstream README warns that a naive static server (e.g. VS Code Live Server) can serve `.wasm` with
the wrong `Content-Type`, and browsers refuse `WebAssembly.instantiateStreaming` in that case (falls
back to the slower `arrayBuffer()` path in the webpack loader above, which still works, just slower to
boot). Astro's own dev/build/preview servers set correct MIME types; GitHub Pages does too. No action
needed, just don't serve this folder through an ad hoc static file server that doesn't map `.wasm`
correctly.
