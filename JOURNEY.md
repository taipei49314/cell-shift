# Frozen public journey

This checkout is a **subject** of the
[Nelson audit spine](https://github.com/taipei49314/nelson-stack).
It is not the flagship. The chamber does not judge the chamber.

> A receipt from this repo is chamber geometry. A walkaround receipt is
> admission, not verification. `CHARTER_SPLIT` is not claimed: the same
> working tree wrote this journey and will sit the host-side commands.

## Must

Machine-readable copy: [`journey/must.json`](journey/must.json).

| id | Host command | What it locks |
|---|---|---|
| `npm-test` | `npm test` | Seeded determinism, protocol locks, T2 fail-closed tables |
| `tsc-b` | `npx tsc -b` | Typecheck |
| `vite-build` | `npx vite build` | Production bundle exists |
| `npm-audit-pack` | `npm run audit` | Replayable audit pack under `artifacts/audit/` |

Order is the public CI job in [`.github/workflows/ci.yml`](.github/workflows/ci.yml).
Do not drop a failing seed to make a row green. Do not rewrite
[`CLAIMS.md`](CLAIMS.md) Not-claimed rows.

## Walkaround contract

Frozen bytes: [`journey/contract.json`](journey/contract.json).

```bash
python -m walkaround init --root %CD%
python -m walkaround contract --root %CD% --goal "Public reproducibility journey holds on a clean checkout: npm test, npx tsc -b, npx vite build, npm run audit. Chamber stays maintenance-only. CLAIMS Not-claimed rows stay Not-claimed." --allow "src/**" --allow "scripts/**" --allow "docs/**" --allow "artifacts/**" --allow "journey/**" --allow ".github/workflows/**" --allow "README.md" --allow "JOURNEY.md" --allow "repo-passport.yml" --allow "package.json" --forbid "CLAIMS.md"
```

Prefer copying `journey/contract.json` onto `.walkaround/contract.json`
after `init` so the digest matches the committed freeze.

`required_organs` is empty on purpose. The shipped walkaround adapters
(`greenwash`, `phaseledger`, `trust-meter --help`) do not run this
journey. Missing a required organ would be `INCOMPLETE`; inventing a
passing organ would be a lie.

`.walkaround/` is session state. It is gitignored. Export any receipt
to `artifacts/spine/`.

## RepoPassport declaration

[`repo-passport.yml`](repo-passport.yml) is the declared scenario
`public-ci`. Validate and inspect from a RepoPassport checkout:

```bash
go run ./cmd/repopass validate -- %CD%\cell-shift\repo-passport.yml
go run ./cmd/repopass inspect %CD%\cell-shift --output json
```

Live `verify` is **not claimed** on this host:

- RepoPassport alpha executes Linux `amd64` sandboxes only.
- The subject is a Node workspace with npm dependencies, not the
  dependency-free CLI path the alpha supports.
- `npm ci` needs network or a vendored `node_modules`; the declared
  capabilities keep network denied.

`inspect` / `validate` succeeding is not `verify` succeeding.

Measured on 2026-08-17 (see [`artifacts/spine/MEASURE.md`](artifacts/spine/MEASURE.md)):
`validate` is `VALID`. `inspect` is `SOURCE_PATH_TRAVERSAL` on
`開始艙室.bat`. That filename stays. Renaming it to greening inspect
would hide the finding.

## External score

`trust-meter` builtin-static-v1 is a Python AST scorer. This subject is
TypeScript. Run it anyway; do not add dummy Python to raise the number.

```bash
python -m trust_meter.cli . --json-v1 --no-config
```

Attach the JSON beside the audit pack under `artifacts/spine/`.
`authority_effect` stays `none`. A high or low score is not a biology
claim and is not a substitute for `npm test`.

Measured on 2026-08-17: `overall_score` 100.0 because every metric
reported “No Python files to scan”. That is a **vacuous** advisory
score, not a pass of this TypeScript chamber.

## Charter

No signed charter is published for this journey.
`independence_claim` is `not_claimed`. Same-key write-and-sit would be
`CHARTER_COLLAPSED` if a charter were bound.

## What this file is not

- Not a medical claim
- Not T3, not more cell biology, not a marketing site
- Not a statement that the audit spine is finished
