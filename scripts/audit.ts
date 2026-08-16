/**
 * Build a replayable audit pack. Chamber geometry only. Not biology.
 *
 *   npm run audit
 */
import { execFileSync, execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { PRESETS } from "../src/sim/experiment";
import { issueReceipt, verifyReceipt } from "../src/sim/receipt";
import { replayTo } from "../src/sim/world";

const root = resolve(".");
const sha256 = (buf: Buffer | string) => createHash("sha256").update(buf).digest("hex");
const fileHash = (path: string) => sha256(readFileSync(path));

function git(args: string[]): string {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

const commit = git(["rev-parse", "HEAD"]);
const short = commit.slice(0, 7);
const describe = git(["describe", "--tags", "--always"]);
const dirty = git(["status", "--porcelain", "--", ".", ":!artifacts/audit"]);
const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
const packName = `cell-shift-audit-${short}`;
const outDir = resolve("artifacts/audit", packName);
mkdirSync(outDir, { recursive: true });

function run(command: string): { ok: boolean; log: string } {
  try {
    const log = execSync(command, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { ok: true, log };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; status?: number };
    return { ok: false, log: `${e.stdout ?? ""}${e.stderr ?? ""}\nstatus=${e.status ?? "?"}` };
  }
}

const test = run("npm test");
writeFileSync(join(outDir, "test-log.txt"), test.log);

const hypoxic = PRESETS.hypoxic;
const world = replayTo({ seed: hypoxic.seed, env: hypoxic.env, rules: hypoxic.rules }, 240);
const receipt = issueReceipt(world, hypoxic);
const receiptCheck = verifyReceipt(receipt);
writeFileSync(join(outDir, "receipt-hypoxic-240h.json"), JSON.stringify(receipt, null, 2) + "\n");

const copies: [string, string][] = [
  ["CLAIMS.md", "CLAIMS.md"],
  ["LANDING.md", "LANDING.md"],
  ["RESEARCH.md", "RESEARCH.md"],
  ["DEPTH.md", "DEPTH.md"],
  ["docs/figures/hypoxic-4821-240h-state.svg", "figure-hypoxic-4821-240h-state.svg"],
  ["artifacts/ledger/hypotheses.json", "ledger-hypotheses.json"],
];
for (const [from, to] of copies) copyFileSync(resolve(from), join(outDir, to));

mkdirSync(join(outDir, "t2"), { recursive: true });
try {
  for (const name of readdirSync(resolve("artifacts/t2"))) {
    if (name.endsWith(".json")) {
      copyFileSync(resolve("artifacts/t2", name), join(outDir, "t2", name));
    }
  }
} catch {
  /* T2 artifacts optional on older checkouts */
}

mkdirSync(join(outDir, "campaigns"), { recursive: true });
for (const name of readdirSync(resolve("artifacts/campaigns"))) {
  if (name.endsWith(".json")) {
    copyFileSync(resolve("artifacts/campaigns", name), join(outDir, "campaigns", name));
  }
}

const hashed = [
  "CLAIMS.md",
  "LANDING.md",
  "RESEARCH.md",
  "src/sim/world.ts",
  "src/sim/field.ts",
  "src/sim/morphology.ts",
  "src/sim/receipt.ts",
  "docs/figures/hypoxic-4821-240h-state.svg",
  "artifacts/receipts/hypoxic-240h-57aa53b3.json",
].map((rel) => ({ path: rel, sha256: fileHash(resolve(rel)) }));

hashed.push({ path: "audit/receipt-hypoxic-240h.json", sha256: sha256(JSON.stringify(receipt, null, 2) + "\n") });

const sums = hashed.map((h) => `${h.sha256}  ${h.path}`).join("\n") + "\n";
writeFileSync(join(outDir, "SHA256SUMS.txt"), sums);

const manifest = {
  name: "CELL//SHIFT",
  kind: "audit-pack",
  version: "1.0.0",
  commit,
  describe,
  dirty: dirty.length > 0,
  generated_at: new Date().toISOString(),
  claim: "Chamber geometry only. Not a biological model. Not a PhysiCell result.",
  not_claimed: [
    "named cancer",
    "patient / therapy / prognosis",
    "physiological parameter accuracy",
    "PhysiCell or wet-lab calibration",
  ],
  measured_this_run: {
    npm_test: test.ok ? "PASS" : "FAIL",
    hypoxic_240h_receipt_verify: receiptCheck.ok ? "PASS" : "FAIL",
    hypoxic_240h_hash: receipt.hash,
    hypoxic_core_lt_rim: world.cells.length > 0 && receipt.morphology.coreO2 < receipt.morphology.rimO2,
    hypoxic_necrotic: receipt.morphology.necroticFrac,
  },
  known_fails_kept: [
    { id: "adhesion-multiseed", seed: 99, note: "low r90 > high r90 fails; row kept" },
    { id: "shift-cycle-multiseed", seed: 99, note: "C1 share rise fails; row kept" },
    { id: "motility-multiseed", seed: 2026, note: "high r90 > low r90 fails; row kept" },
  ],
  replay: [
    "git checkout " + commit,
    "npm ci",
    "npm test",
    "npm run figure",
    "npm run chamber -- run hypoxic 240",
    "npm run audit",
  ],
  files: hashed,
};

writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

const auditMd = `# CELL//SHIFT 稽核包

**對象：** CELL//SHIFT 艙室（空間 agent + 24³ 氧氣場）  
**提交：** \`${commit}\`  
**描述：** ${describe}  
**工作樹：** ${dirty ? "DIRTY — 此包對應產生當下的工作樹，不是乾淨 tag" : "clean"}  
**產生：** ${manifest.generated_at}

這包證明的是**艙內幾何可重播**。它不證明癌症、病人、藥物、或 PhysiCell 數字。

## 本跑判決

| 項 | 結果 |
| --- | --- |
| \`npm test\` | **${test.ok ? "PASS" : "FAIL"}** |
| Hypoxic 4821 / 240 h 收據重播 | **${receiptCheck.ok ? "PASS" : "FAIL"}** hash \`${receipt.hash}\` |
| 核 O₂ < 緣 O₂ | **${manifest.measured_this_run.hypoxic_core_lt_rim ? "PASS" : "FAIL"}** (${receipt.morphology.coreO2.toFixed(3)} < ${receipt.morphology.rimO2.toFixed(3)}) |
| 壞死比例 | ${((receipt.morphology.necroticFrac ?? 0) * 100).toFixed(0)}% |

## 明確不宣稱

- 任何癌種、病人、治療、預後
- 參數有生理單位意義
- 與 PhysiCell / 濕實驗數字對齊

全文見本包 \`CLAIMS.md\`。Not-claimed 列不得因本包被刪。

## 已知失敗（保留，未丟 seed）

| 實驗 | seed | 失敗內容 |
| --- | --- | --- |
| adhesion 0.15 vs 1.1 · 160 h | **99** | 低黏著 r90 沒有大於高黏著 |
| C1 cycle_rate SHIFT vs C2 · 90 h | **99** | C1 佔比沒有上升 |
| motility 0.22 vs 0.03 · 160 h | **2026** | 高運動 r90 沒有大於低運動 |

氧氣掃描的 o2Drop **不是單調**；只鎖兩端壞死比例。16³ 場**解不出** Hypoxic 核緣差。

## 包內檔案

- \`manifest.json\` — 機器可讀判決
- \`SHA256SUMS.txt\` — 關鍵檔雜湊
- \`test-log.txt\` — 本跑 \`npm test\` 原文
- \`receipt-hypoxic-240h.json\` — 本跑新簽發的 240 h 收據
- \`figure-hypoxic-4821-240h-state.svg\` — 協議主圖（腳本產，非手截）
- \`campaigns/\` — 多 seed / 單因子掃描
- \`ledger-hypotheses.json\` — 預註冊三條假說
- \`CLAIMS.md\` \`LANDING.md\` \`RESEARCH.md\` \`DEPTH.md\`

## 複核指令

在乾淨 clone 上：

\`\`\`bash
git checkout ${commit}
npm ci
npm test
npm run figure
npm run chamber -- run hypoxic 240
npm run audit
\`\`\`

核對：新跑的 Hypoxic 240 h 收據，\`coreO2\` / \`rimO2\` / \`necroticFrac\` 須與 \`receipt-hypoxic-240h.json\` 在既有容差內重合；\`SHA256SUMS.txt\` 中的 CLAIMS / world.ts / figure 雜湊須一致。

## 稽核員注意

v1.0.0 tag 是 \`${describe.includes("v1.0.0") ? describe : "see describe"}\`。本包若 describe 帶 \`-N-g\`，表示 tag 之後還有提交（Living boot、RESET 保時、效能）。不要把本包誤標成「恰好等於 tag 樹」。
`;

writeFileSync(join(outDir, "AUDIT.md"), auditMd);

console.log(outDir);
console.log(JSON.stringify({ commit: short, test: test.ok, receipt: receiptCheck.ok, hash: receipt.hash }, null, 2));
if (!test.ok || !receiptCheck.ok) process.exit(2);
