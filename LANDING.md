# CELL//SHIFT v1.0 — 落地規格

**一句話：** 本機打開艙室，改一條細胞規則，跑一局可重播的實驗，切開組織看結構，帶走一張圖和一張收據。不是任何一種癌症模型。

**北極星：** 你能用這一艙，獨立做完一題個人研究，並把證據掛上 GitHub。畫面服務那題研究，不代替量測。

對標的是開源儀器的 **可重現實驗 + 可讀 figure**，不是 PhysiCell 的引擎規模。標準見 [MathCancer/PhysiCell](https://github.com/MathCancer/PhysiCell)。本 repo 不 port、不共用參數、不重現他們的論文數字。

宣稱邊界永遠以 [CLAIMS.md](CLAIMS.md) 為準。本規格 **不得** 把任何一條 Not claimed 改成 Measured。

---

## 1. 落地後你能做的事

一局（session）只有這條路徑：

```
選協議 → 可選 SHIFT 一刀 → RUN → 讀形態 / 點細胞 / 追譜系
       → 剖切開核 → 匯出收據 → 同 hash 重播得同一塊組織
```

三類問題，不多也不少（[RESEARCH.md](RESEARCH.md)）：

| 題 | 你問 | 落地數字 |
| --- | --- | --- |
| 結構 | 氧氣有沒有往內掉？有沒有壞死核？ | core O₂、rim O₂、O₂(r)、necrotic fraction |
| 選擇 | 哪個 clone 佔空間？誰是誰的後代？ | dominant clone share、譜系高亮、clone 佔比隨時間 |
| 形變 | 同 seed 改黏著／運動，團塊更散還是更圓？ | r90，同 seed 對照 |

超出這三題的現象，v1.0 **不回答**。

---

## 2. 已落地（不得回退）

這些現在就有。最終版必須仍通過：

| 項 | 證據 |
| --- | --- |
| 決定性 seed → 同一組織 | `npm test` |
| 24³ 氧氣場；空艙 = 補給值；核心消耗 < 外緣 | `src/sim/field.test.ts` |
| 協議 Hypoxic spheroid · 4821 · 240 h：core O₂ < rim O₂，壞死 > 0 | `npm test` |
| 同 seed，低黏著 r90 > 高黏著 r90 | `npm test` |
| 實驗雜湊 = seed + env + rules | `experimentHash` |
| 點細胞、inspector、Trace lineage | UI |
| 協議 Intact / Hypoxic spheroid / Invasive | `PRESETS` |

回退任何一條，v1.0 不算過。

---

## 3. 最終版還要補的三塊

順序固定：**研究閉環 → 收據 → 畫面**。畫面不得先於前兩塊合併。

### L1 — 研究閉環（SHIFT + 時間）

讓「改規則」對得上名字，讓時間軸是研究工具。

- **Clone SHIFT：** 對選中 clone 下一刀（`cycle_rate` / `apoptosis_threshold` / `hypoxia_tolerance` / `adhesion` / `motility` / `uptake` 的有號 delta）。RESET 後寫進該 clone 及其同 clone 後代。新突變 clone 不繼承這刀。
- SHIFT 進入實驗雜湊。同 seed + 同 SHIFT = 同一組織。測試鎖。
- **時間軸快照：** 每 6 h 存壓縮幀（id、位置、state、clone、oxygen）。往回拖讀快照，禁止從 t=0 重跑 720 步。
- **clone 佔比隨時間：** 底部一條 stack 或折線，對應「選擇」題。
- 播放速度 `1x / 4x / 16x`。
- 協定對照：同一個 seed，只差 SHIFT 或只差 adhesion，並排數字（不必雙艙 3D）。

**L1 出口：** `npm test` 新增「C1 加速週期 → 該 clone 佔比上升」；時間軸 0↔720 不重跑全歷史。

### L2 — 收據（一局可帶走）

沒有收據就不算研究儀器。

匯出一個 JSON（本機下載，不上雲）：

```json
{
  "name": "CELL//SHIFT",
  "version": "1.0",
  "hash": "8 hex",
  "seed": 4821,
  "hours": 240,
  "env": {},
  "rules": {},
  "shift": null,
  "morphology": {},
  "profile": [],
  "cloneShares": []
}
```

- 導入同一張收據 → 重跑到 `hours` → 形態量在測試容差內重合（r90、core O₂、necrotic fraction）。
- 艙內顯示 `exp <hash>`，與檔案一致。
- README / CLAIMS 寫清楚：收據證明 **艙內可重播**，不證明生物學。

**L2 出口：** `npm test` 鎖「收據 round-trip」；UI 有 Export / Load。

### L3 — 畫面（figure，不是皮膚）

畫面只為了讓 L1 的三個數字能被指認。對標 PhysiCell hanging-drop 切片圖 + 瀏覽器即時，不對標醫學體積光產品。

必做：

- 著色：**Clone / State / Oxygen / Lineage**
- **剖切平面**（可拖）。切開必須能指「這是核、這是緣」
- 培養皿／標本井，細胞不浮在虛空
- Clone 圖例 + 佔比
- 選中光圈對得上 inspector
- README 主圖：Hypoxic spheroid · 4821 · 240 h · 剖切 + State 或 Oxygen

不做（v1.0 砍掉）：

- 氧氣 raymarch 體積光（L3 之後選配）
- SSAO / 電影燈光 / 後期堆疊
- 5 萬顆細胞、WASM、WebGPU 重寫

**L3 出口：** 陌生人看 README 主圖，能在不讀正文的情況下指出核與緣。協議圖由腳本出圖，不手 P。

---

## 4. 最終體驗（畫面契約）

佈局維持你訂的艙室，只把研究層嵌進去：

```
CELL//SHIFT     Intact │ Hypoxic │ Invasive     RUN PAUSE RESET   Seed 4821   exp a1b2c3d4
──────────────┬─────────────────────────────┬─────────────────
PROTOCOL      │                             │ CELL INSPECTOR
+ SHIFT C3    │                             │
              │      3D TISSUE              │ Cell #3481
ENVIRONMENT   │      Clone│State│O₂│Lin     │ Clone C3
CELL RULES    │      clip ══════            │ mutations…
O₂(r) profile │                             │ TRACE LINEAGE
──────────────┴─────────────────────────────┴─────────────────
0h ───────────●──────────────────────────── 720h    1x 4x 16x
r90  ·  necrotic  ·  O₂ core/rim  ·  clone share sparkline
EXPORT RECEIPT
```

點細胞、Trace lineage、SHIFT 一刀，行為與第一版構想相同；數字以量測器為準。

---

## 5. 明確不進 v1.0

| 不做 | 原因 |
| --- | --- |
| 癌種名稱、病人、藥物、預後 | 宣稱升級 |
| 免疫、血管、ECM、多底物 PDE | 範圍膨脹；PhysiCell 的戰場 |
| 對齊 PhysiCell / 濕實驗數字 | 假校準 |
| GPU / WASM / 五萬細胞 | 不是個人研究的阻塞點 |
| LLM 解讀艙內結果 | 用故事代替量測 |
| 雲端帳號、多人協作 | 本機儀器 |
| 雙艙即時 3D A/B | L1 數字對照已夠 |
| 完整譜系樹圖 | Trace lineage 高亮已夠 |

v1.0 之後若要做，另開規格，不偷渡進本文件。

---

## 6. 怎樣叫落地（驗收）

全部成立才標 `v1.0`：

1. `npm test` 全綠，且含：決定性、Hypoxic spheroid 結構、adhesion→r90、SHIFT→clone share、收據 round-trip。
2. `npm run check`（test + tsc + build）在乾淨 checkout 通過。
3. 載入 Hypoxic spheroid → RUN 到 240 h → 剖切後核 O₂ 低於緣；收據 hash 與畫面一致。
4. 同收據 Load → 形態在容差內重合。
5. README 主圖由倉庫腳本產生，不是手截且與協議 4821/240h 對得上。
6. CLAIMS.md 的 Not claimed 表與現在相同（可加 Measured 列，不可刪 Not claimed）。
7. 公開 repo [`taipei49314/cell-shift`](https://github.com/taipei49314/cell-shift) 打 `v1.0.0` tag。

未過第 6 條而先打 tag，視為規格違約。

---

## 7. 工程約束

- 模擬仍在本機瀏覽器、單一 TypeScript 引擎。不為 L3 另寫一套不可測的渲染邏輯。
- 量測函式（`measure`、`radialProfile`、`experimentHash`、`stepField`）保持無 DOM，測試只打這些。
- 時間倒帶用快照；決定性重播用 seed + spec。兩條路都要測。
- 預設協議參數改動必須改測試期望，禁止「為了好看」讓 Hypoxic 不再出核。

---

## 8. 現況對照

| 塊 | 狀態 |
| --- | --- |
| L0 艙室骨架 + 研究核（場、形態、協議、雜湊） | **已落地** |
| L1 SHIFT + 快照時間軸 + clone 時間序列 | **已落地** |
| L2 收據匯出／導入 | **已落地**（UI + `npm run chamber` + round-trip 測試） |
| L3 剖切、著色模式、培養皿、協議主圖 | 未做（刻意排後） |

L1 與 L2 已落地。畫面（L3）關閉，直到 [DEPTH.md](DEPTH.md) 的「深度做足」條件成立並有人下令。無人駐守只准走 DEPTH.md。
