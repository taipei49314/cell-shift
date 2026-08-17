# Host-side measure — 2026-08-17

Subject checkout before this journey commit: `854c8e8`.
Host: Windows amd64. These commands were run on the dirty tree that adds
the frozen journey files.

| Tool | Tree / version | Command | Result |
|---|---|---|---|
| walkaround | `0ecf7b2` | `python -m walkaround --root <subject> … close` | `ADMITTED` / unsigned receipt `d1162094…` |
| trust-meter | CLI `0.2.1`, `--json-v1 --no-config` | `python -m trust_meter.cli . --json-v1 --no-config` | `overall_score` 100.0, **vacuous**: every metric is “No Python files” |
| RepoPassport | `f8f5432` | `go run ./cmd/repopass validate repo-passport.yml` | `VALID` digest `sha256:2e9f4ea8154f4323a93e1f92e602bec032f99ab049d5c6fd6f14f4c24c9ca085` |
| RepoPassport | `f8f5432` | `go run ./cmd/repopass inspect <subject> --output json` | `SOURCE_PATH_TRAVERSAL` on `開始艙室.bat` |
| RepoPassport `verify` | — | not run | `NOT_RUN` — Linux amd64 sandbox; npm dependencies; this host is Windows |

## How to read this

- walkaround `ADMITTED` means this session entered the frozen contract,
  observed, wrote allowed paths, and closed. `required_organs` is empty.
  It does **not** mean `npm test` ran.
- trust-meter `100.0` is an empty-scope advisory score on a TypeScript
  subject. `authority_effect` is `none`. Do not advance a phaseledger
  phase on it. Do not quote it as “the repo scored 100.”
- RepoPassport `VALID` is schema. `inspect` failed closed on a
  non-ASCII Windows launcher name. The file was **not** renamed to make
  inspect green.
- Live `verify` is not claimed.

The public CI job remains the host lock for `npm test` / `tsc` / `vite`
/ `audit`. That job is still the chamber judging the chamber. This folder
is the first spine measurement of that chamber.
