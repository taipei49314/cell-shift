# Spine measurements

External receipts for this checkout. Not chamber self-tests.

| File | Measurer | What it is | What it is not |
|---|---|---|---|
| `walkaround-receipt.json` | walkaround | `ADMITTED` (empty organ set, unsigned) | Not verified work; not `npm test` |
| `trust-meter-measure-v1.json` | trust-meter `--json-v1 --no-config` | Vacuous 100.0 — no Python files | Not a TypeScript suite; `authority_effect` is `none` |
| `repopass-validate.txt` | RepoPassport `validate` | `VALID` schema | Not live `verify` |
| `repopass-inspect.json` | RepoPassport `inspect` | `SOURCE_PATH_TRAVERSAL` on `開始艙室.bat` | Not a green inspect |
| `MEASURE.md` | this folder | Host commands and how to read them | Not a PASS |

Re-run from the subject root after the spine tools are on `PATH` / `PYTHONPATH` / a Go checkout. See [JOURNEY.md](../../JOURNEY.md).
