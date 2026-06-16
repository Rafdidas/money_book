# Monthly Sankey Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real-data SVG Sankey-style monthly cash flow chart on the 월별 분석 page.

**Architecture:** Split the feature into a pure data builder and a focused client SVG component. The analysis page continues to own selected month state and passes the selected month's `MoneyBookEntry[]` into the chart.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Sass, custom SVG, existing `MoneyBookEntry` API types.

---

## File Structure

- Create: `src/components/chart/monthlySankeyFlow.ts`
  - Pure data transformation for entries, totals, desktop groups, and mobile groups.
- Create: `src/components/chart/MonthlySankeyFlowChart.tsx`
  - Client component that renders empty state, desktop SVG, and mobile SVG.
- Modify: `src/app/app/analysis/page.tsx`
  - Import the new component and insert it after the month selector.
- Modify: `src/app/analysis/analysis.scss`
  - Add card, SVG, node, link, label, and mobile compact styles.
- Modify: `HANDOFF.md`
  - Record the implementation plan and next task.

## Task 1: Read Required Next.js Docs

**Files:**
- Read: `node_modules/next/dist/docs/`

- [ ] **Step 1: Locate relevant docs**

Run:

```powershell
rg --files node_modules\next\dist\docs
```

Expected: a list of Next.js documentation files.

- [ ] **Step 2: Read App Router client component docs**

Run a focused search for client component guidance:

```powershell
rg -n "use client|Client Component|client component" node_modules\next\dist\docs
```

Expected: matching docs that explain client component boundaries.

- [ ] **Step 3: Read the most relevant matched doc**

Use `Get-Content -LiteralPath <matched-doc-path>` on the relevant file. Confirm that adding a client chart component under `src/components/chart/` and importing it into `src/app/app/analysis/page.tsx` is compatible with the current app's client boundary. The page already starts with `"use client"`, so the chart can be a client component.

## Task 2: Build Pure Sankey Flow Data

**Files:**
- Create: `src/components/chart/monthlySankeyFlow.ts`

- [ ] **Step 1: Create the data builder file**

Add this file:

```ts
import type { MoneyBookEntry } from "@/lib/api/moneyBookEntries";

export type SankeyKind =
  | "income"
  | "fixed"
  | "variable"
  | "saving"
  | "investment"
  | "remaining"
  | "overspend"
  | "outflow";

export type SankeyNode = {
  id: string;
  label: string;
  amount: number;
  kind: SankeyKind;
  column: number;
};

export type SankeyLink = {
  id: string;
  source: string;
  target: string;
  amount: number;
  kind: SankeyKind;
};

export type MonthlySankeyFlow = {
  desktopNodes: SankeyNode[];
  desktopLinks: SankeyLink[];
  mobileNodes: SankeyNode[];
  mobileLinks: SankeyLink[];
  incomeTotal: number;
  outflowTotal: number;
  remaining: number;
  hasFlow: boolean;
};

const fixedExpenseSources = new Set([
  "fixed_expense_payment",
  "legacy_fixed_expense",
]);

const stripEmoji = (value: string) =>
  value.replace(/\p{Extended_Pictographic}/gu, "").trim() || value.trim();

const addAmount = (map: Map<string, number>, key: string, amount: number) => {
  map.set(key, (map.get(key) ?? 0) + amount);
};

const toPositiveEntries = (entries: MoneyBookEntry[]) =>
  entries.filter((entry) => Number.isFinite(entry.amount) && entry.amount > 0);

const mapToNodes = (
  map: Map<string, number>,
  column: number,
  kind: SankeyKind,
  idPrefix: string,
) =>
  [...map.entries()]
    .filter(([, amount]) => amount > 0)
    .sort(([, left], [, right]) => right - left)
    .map(([label, amount]) => ({
      id: `${idPrefix}:${label}`,
      label: stripEmoji(label),
      amount,
      kind,
      column,
    }));

export const buildMonthlySankeyFlow = (
  entries: MoneyBookEntry[],
): MonthlySankeyFlow => {
  const incomeByCategory = new Map<string, number>();
  const fixedByCategory = new Map<string, number>();
  const variableByCategory = new Map<string, number>();
  const savingByCategory = new Map<string, number>();
  const investmentByCategory = new Map<string, number>();

  for (const entry of toPositiveEntries(entries)) {
    if (entry.type === "income") {
      addAmount(incomeByCategory, entry.category || "수입", entry.amount);
      continue;
    }

    if (entry.type === "saving") {
      addAmount(savingByCategory, entry.category || "저축", entry.amount);
      continue;
    }

    if (entry.type === "investment") {
      addAmount(investmentByCategory, entry.category || "투자원금", entry.amount);
      continue;
    }

    if (entry.type === "expense" && fixedExpenseSources.has(entry.source)) {
      addAmount(fixedByCategory, entry.category || "고정지출", entry.amount);
      continue;
    }

    if (entry.type === "expense") {
      addAmount(variableByCategory, entry.category || "변동지출", entry.amount);
    }
  }

  const incomeTotal = [...incomeByCategory.values()].reduce((sum, value) => sum + value, 0);
  const fixedTotal = [...fixedByCategory.values()].reduce((sum, value) => sum + value, 0);
  const variableTotal = [...variableByCategory.values()].reduce((sum, value) => sum + value, 0);
  const savingTotal = [...savingByCategory.values()].reduce((sum, value) => sum + value, 0);
  const investmentTotal = [...investmentByCategory.values()].reduce((sum, value) => sum + value, 0);
  const outflowTotal = fixedTotal + variableTotal + savingTotal + investmentTotal;
  const remaining = incomeTotal - outflowTotal;
  const hasFlow = incomeTotal > 0 || outflowTotal > 0;

  const sourceNode: SankeyNode =
    incomeTotal > 0
      ? { id: "income", label: "수입", amount: incomeTotal, kind: "income", column: 1 }
      : { id: "recorded-outflow", label: "기록된 지출", amount: outflowTotal, kind: "outflow", column: 1 };

  const allocationNodes: SankeyNode[] = [
    fixedTotal > 0 ? { id: "fixed", label: "고정지출", amount: fixedTotal, kind: "fixed", column: 2 } : null,
    variableTotal > 0 ? { id: "variable", label: "변동지출", amount: variableTotal, kind: "variable", column: 2 } : null,
    savingTotal > 0 ? { id: "saving", label: "저축", amount: savingTotal, kind: "saving", column: 2 } : null,
    investmentTotal > 0 ? { id: "investment", label: "투자원금", amount: investmentTotal, kind: "investment", column: 2 } : null,
    remaining > 0 ? { id: "remaining", label: "남은 돈", amount: remaining, kind: "remaining", column: 2 } : null,
    remaining < 0 ? { id: "overspend", label: "초과 지출", amount: Math.abs(remaining), kind: "overspend", column: 2 } : null,
  ].filter(Boolean) as SankeyNode[];

  const incomeCategoryNodes = mapToNodes(incomeByCategory, 0, "income", "income-category");
  const fixedDetailNodes = mapToNodes(fixedByCategory, 3, "fixed", "fixed-detail");
  const variableDetailNodes = mapToNodes(variableByCategory, 3, "variable", "variable-detail");
  const savingDetailNodes = mapToNodes(savingByCategory, 3, "saving", "saving-detail");
  const investmentDetailNodes = mapToNodes(investmentByCategory, 3, "investment", "investment-detail");

  const desktopNodes = [
    ...incomeCategoryNodes,
    sourceNode,
    ...allocationNodes,
    ...fixedDetailNodes,
    ...variableDetailNodes,
    ...savingDetailNodes,
    ...investmentDetailNodes,
  ];

  const sourceId = sourceNode.id;
  const desktopLinks: SankeyLink[] = [
    ...incomeCategoryNodes.map((node) => ({
      id: `${node.id}->income`,
      source: node.id,
      target: "income",
      amount: node.amount,
      kind: "income" as const,
    })),
    ...allocationNodes
      .filter((node) => node.id !== "overspend")
      .map((node) => ({
        id: `${sourceId}->${node.id}`,
        source: sourceId,
        target: node.id,
        amount: node.amount,
        kind: node.kind,
      })),
    ...fixedDetailNodes.map((node) => ({
      id: `fixed->${node.id}`,
      source: "fixed",
      target: node.id,
      amount: node.amount,
      kind: "fixed" as const,
    })),
    ...variableDetailNodes.map((node) => ({
      id: `variable->${node.id}`,
      source: "variable",
      target: node.id,
      amount: node.amount,
      kind: "variable" as const,
    })),
    ...savingDetailNodes.map((node) => ({
      id: `saving->${node.id}`,
      source: "saving",
      target: node.id,
      amount: node.amount,
      kind: "saving" as const,
    })),
    ...investmentDetailNodes.map((node) => ({
      id: `investment->${node.id}`,
      source: "investment",
      target: node.id,
      amount: node.amount,
      kind: "investment" as const,
    })),
  ];

  const mobileSource = { ...sourceNode, column: 0 };
  const mobileNodes = [
    mobileSource,
    ...allocationNodes.map((node) => ({ ...node, column: 1 })),
  ];
  const mobileLinks = allocationNodes
    .filter((node) => node.id !== "overspend")
    .map((node) => ({
      id: `mobile:${mobileSource.id}->${node.id}`,
      source: mobileSource.id,
      target: node.id,
      amount: node.amount,
      kind: node.kind,
    }));

  return {
    desktopNodes,
    desktopLinks,
    mobileNodes,
    mobileLinks,
    incomeTotal,
    outflowTotal,
    remaining,
    hasFlow,
  };
};
```

- [ ] **Step 2: Run lint after the data builder**

Run:

```powershell
npm run lint
```

Expected: PASS or only pre-existing warnings unrelated to the new file.

- [ ] **Step 3: Commit the data builder**

Run:

```powershell
git add src/components/chart/monthlySankeyFlow.ts
git commit -m "feat: add monthly sankey flow data builder"
```

Expected: commit succeeds.

## Task 3: Create The SVG Chart Component

**Files:**
- Create: `src/components/chart/MonthlySankeyFlowChart.tsx`

- [ ] **Step 1: Add the chart component**

Add this file:

```tsx
"use client";

import { useMemo } from "react";
import type { MoneyBookEntry } from "@/lib/api/moneyBookEntries";
import {
  buildMonthlySankeyFlow,
  type MonthlySankeyFlow,
  type SankeyKind,
  type SankeyLink,
  type SankeyNode,
} from "@/components/chart/monthlySankeyFlow";

type Props = {
  entries: MoneyBookEntry[];
  monthLabel: string;
};

type PositionedNode = SankeyNode & {
  x: number;
  y: number;
  width: number;
  height: number;
};

const desktopWidth = 920;
const desktopHeight = 420;
const mobileWidth = 390;
const mobileHeight = 300;
const nodeWidth = 18;

const formatCurrency = (value: number) => `₩ ${Math.round(value).toLocaleString()}`;

const kindClass = (kind: SankeyKind) => `monthly-sankey--${kind}`;

const getColumnX = (column: number, width: number, columns: number) => {
  if (columns <= 1) return 24;
  const padding = width <= 420 ? 28 : 42;
  return padding + ((width - padding * 2 - nodeWidth) / (columns - 1)) * column;
};

const layoutNodes = (
  nodes: SankeyNode[],
  width: number,
  height: number,
  columns: number,
): PositionedNode[] => {
  const grouped = new Map<number, SankeyNode[]>();
  for (const node of nodes) {
    const group = grouped.get(node.column) ?? [];
    group.push(node);
    grouped.set(node.column, group);
  }

  const maxAmount = Math.max(...nodes.map((node) => node.amount), 1);
  const positioned: PositionedNode[] = [];

  for (const [column, columnNodes] of grouped.entries()) {
    const sorted = [...columnNodes].sort((left, right) => right.amount - left.amount);
    const gap = width <= 420 ? 12 : 16;
    const availableHeight = height - 64 - gap * Math.max(sorted.length - 1, 0);
    const minHeight = width <= 420 ? 22 : 24;
    const maxHeight = width <= 420 ? 96 : 150;
    const rawHeights = sorted.map((node) =>
      Math.max(minHeight, Math.min(maxHeight, (node.amount / maxAmount) * availableHeight)),
    );
    const totalHeight = rawHeights.reduce((sum, value) => sum + value, 0) + gap * Math.max(sorted.length - 1, 0);
    let cursorY = Math.max(28, (height - totalHeight) / 2);

    sorted.forEach((node, index) => {
      const itemHeight = rawHeights[index];
      positioned.push({
        ...node,
        x: getColumnX(column, width, columns),
        y: cursorY,
        width: nodeWidth,
        height: itemHeight,
      });
      cursorY += itemHeight + gap;
    });
  }

  return positioned;
};

const makePath = (source: PositionedNode, target: PositionedNode) => {
  const startX = source.x + source.width;
  const startY = source.y + source.height / 2;
  const endX = target.x;
  const endY = target.y + target.height / 2;
  const curve = Math.max(42, (endX - startX) * 0.5);
  return `M ${startX} ${startY} C ${startX + curve} ${startY}, ${endX - curve} ${endY}, ${endX} ${endY}`;
};

const FlowSvg = ({
  ariaLabel,
  links,
  nodes,
  width,
  height,
  columns,
}: {
  ariaLabel: string;
  links: SankeyLink[];
  nodes: SankeyNode[];
  width: number;
  height: number;
  columns: number;
}) => {
  const positionedNodes = layoutNodes(nodes, width, height, columns);
  const nodeMap = new Map(positionedNodes.map((node) => [node.id, node]));
  const maxLinkAmount = Math.max(...links.map((link) => link.amount), 1);

  return (
    <svg
      className="monthly-sankey--svg"
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <g className="monthly-sankey--links">
        {links.map((link) => {
          const source = nodeMap.get(link.source);
          const target = nodeMap.get(link.target);
          if (!source || !target || link.amount <= 0) return null;

          return (
            <path
              key={link.id}
              className={`monthly-sankey--link ${kindClass(link.kind)}`}
              d={makePath(source, target)}
              strokeWidth={Math.max(3, Math.min(46, (link.amount / maxLinkAmount) * 46))}
            />
          );
        })}
      </g>
      <g className="monthly-sankey--nodes">
        {positionedNodes.map((node) => {
          const isRightSide = node.column >= Math.max(1, columns - 2);
          const labelX = isRightSide ? node.x - 10 : node.x + node.width + 10;
          const anchor = isRightSide ? "end" : "start";

          return (
            <g key={node.id} className="monthly-sankey--node-group">
              <rect
                className={`monthly-sankey--node ${kindClass(node.kind)}`}
                x={node.x}
                y={node.y}
                width={node.width}
                height={node.height}
                rx={4}
              />
              <text
                className="monthly-sankey--label"
                x={labelX}
                y={node.y + node.height / 2 - 3}
                textAnchor={anchor}
              >
                {node.label}
              </text>
              <text
                className="monthly-sankey--amount"
                x={labelX}
                y={node.y + node.height / 2 + 15}
                textAnchor={anchor}
              >
                {formatCurrency(node.amount)}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
};

const Summary = ({ flow }: { flow: MonthlySankeyFlow }) => (
  <div className="monthly-sankey--summary">
    <span>수입 {formatCurrency(flow.incomeTotal)}</span>
    <span>유출 {formatCurrency(flow.outflowTotal)}</span>
    <span>{flow.remaining >= 0 ? "남은 돈" : "초과 지출"} {formatCurrency(Math.abs(flow.remaining))}</span>
  </div>
);

export default function MonthlySankeyFlowChart({ entries, monthLabel }: Props) {
  const flow = useMemo(() => buildMonthlySankeyFlow(entries), [entries]);

  if (!flow.hasFlow) {
    return (
      <div className="monthly-sankey monthly-sankey--empty">
        <p className="analysis-empty label--md">
          선택한 달의 흐름을 만들 데이터가 부족합니다.
        </p>
      </div>
    );
  }

  return (
    <div className="monthly-sankey">
      <Summary flow={flow} />
      <div className="monthly-sankey--desktop" aria-hidden={false}>
        <FlowSvg
          ariaLabel={`${monthLabel} 수입과 지출 흐름 상세 그래프`}
          links={flow.desktopLinks}
          nodes={flow.desktopNodes}
          width={desktopWidth}
          height={desktopHeight}
          columns={4}
        />
      </div>
      <div className="monthly-sankey--mobile" aria-hidden={false}>
        <FlowSvg
          ariaLabel={`${monthLabel} 수입과 지출 흐름 요약 그래프`}
          links={flow.mobileLinks}
          nodes={flow.mobileNodes}
          width={mobileWidth}
          height={mobileHeight}
          columns={2}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run lint after the component**

Run:

```powershell
npm run lint
```

Expected: PASS. If TypeScript or ESLint reports line-length or formatting concerns, adjust the component without changing behavior.

- [ ] **Step 3: Commit the component**

Run:

```powershell
git add src/components/chart/MonthlySankeyFlowChart.tsx
git commit -m "feat: add monthly sankey svg chart"
```

Expected: commit succeeds.

## Task 4: Insert The Chart Into Monthly Analysis

**Files:**
- Modify: `src/app/app/analysis/page.tsx`

- [ ] **Step 1: Import the chart**

Add this import near the other chart imports:

```tsx
import MonthlySankeyFlowChart from "@/components/chart/MonthlySankeyFlowChart";
```

- [ ] **Step 2: Insert the flow card after the month selector panel**

Place this section immediately after the `analysis-month-panel` section and before the existing `analysis-chart-panel`:

```tsx
<section className="card analysis-flow-panel column-group column-group--gap-16">
  <div className="main-overview--section-header row-group row-group--center row-group--between">
    <div>
      <h4 className="main-overview--title title--sm">
        {monthNames[selectedMonth]} 수입/지출 흐름
      </h4>
      <p className="analysis-section--meta label--md">
        수입이 고정지출, 변동지출, 저축, 투자원금, 남은 돈으로 나뉘는 흐름입니다.
      </p>
    </div>
  </div>
  <MonthlySankeyFlowChart
    entries={selectedMonthItems}
    monthLabel={monthNames[selectedMonth]}
  />
</section>
```

- [ ] **Step 3: Run lint after page integration**

Run:

```powershell
npm run lint
```

Expected: PASS.

- [ ] **Step 4: Commit page integration**

Run:

```powershell
git add src/app/app/analysis/page.tsx
git commit -m "feat: show sankey flow on monthly analysis"
```

Expected: commit succeeds.

## Task 5: Add Sankey Styles

**Files:**
- Modify: `src/app/analysis/analysis.scss`

- [ ] **Step 1: Add the new panel to the existing panel selector**

Change:

```scss
.analysis-month-panel,
.analysis-chart-panel,
.analysis-year-panel,
.analysis-category-panel {
  min-width: 0;
}
```

To:

```scss
.analysis-month-panel,
.analysis-flow-panel,
.analysis-chart-panel,
.analysis-year-panel,
.analysis-category-panel {
  min-width: 0;
}
```

- [ ] **Step 2: Add Sankey styles before `.analysis-year-grid`**

Insert:

```scss
.monthly-sankey {
  min-width: 0;
}

.monthly-sankey--summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;

  span {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 10px;
    border: 1px solid var(--outline-lower);
    border-radius: 6px;
    background: var(--surface-lowest);
    color: var(--on-surface);
    font-size: 12px;
    font-weight: 700;
  }
}

.monthly-sankey--desktop,
.monthly-sankey--mobile {
  min-width: 0;
}

.monthly-sankey--mobile {
  display: none;
}

.monthly-sankey--svg {
  display: block;
  width: 100%;
  min-height: 320px;
  overflow: visible;
}

.monthly-sankey--link {
  fill: none;
  stroke-linecap: round;
  opacity: 0.48;
}

.monthly-sankey--node {
  stroke: color-mix(in srgb, var(--surface-lowest) 72%, transparent);
  stroke-width: 1;
}

.monthly-sankey--income {
  stroke: var(--teal-high);
  fill: var(--teal-high);
}

.monthly-sankey--fixed,
.monthly-sankey--variable,
.monthly-sankey--overspend {
  stroke: var(--red-high);
  fill: var(--red-high);
}

.monthly-sankey--saving,
.monthly-sankey--remaining {
  stroke: var(--green-mid);
  fill: var(--green-mid);
}

.monthly-sankey--investment {
  stroke: var(--blue-mid);
  fill: var(--blue-mid);
}

.monthly-sankey--outflow {
  stroke: var(--on-surface);
  fill: var(--on-surface);
}

.monthly-sankey--label {
  fill: var(--on-surface-ultra-high);
  font-size: 13px;
  font-weight: 800;
}

.monthly-sankey--amount {
  fill: var(--on-surface);
  font-size: 11px;
  font-weight: 700;
}

.monthly-sankey--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  border: 1px solid var(--outline-lower);
  border-radius: 8px;
  background: var(--surface-lowest);
}
```

- [ ] **Step 3: Add mobile panel padding selector**

Inside `@media (max-width: 720px)`, change:

```scss
.analysis-month-panel,
.analysis-chart-panel,
.analysis-year-panel,
.analysis-category-panel {
  padding: 14px;
}
```

To:

```scss
.analysis-month-panel,
.analysis-flow-panel,
.analysis-chart-panel,
.analysis-year-panel,
.analysis-category-panel {
  padding: 14px;
}
```

- [ ] **Step 4: Add mobile Sankey behavior**

Inside `@media (max-width: 720px)`, add:

```scss
.analysis-flow-panel {
  .main-overview--section-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }
}

.monthly-sankey--desktop {
  display: none;
}

.monthly-sankey--mobile {
  display: block;
}

.monthly-sankey--svg {
  min-height: 260px;
}

.monthly-sankey--label {
  font-size: 12px;
}

.monthly-sankey--amount {
  font-size: 10px;
}
```

- [ ] **Step 5: Run lint and build**

Run:

```powershell
npm run lint
npm run build
```

Expected: both commands pass.

- [ ] **Step 6: Commit styles**

Run:

```powershell
git add src/app/analysis/analysis.scss
git commit -m "style: add monthly sankey flow styles"
```

Expected: commit succeeds.

## Task 6: Browser Verification

**Files:**
- Verify only; no planned edits unless visual defects appear.

- [ ] **Step 1: Start the dev server**

Run:

```powershell
npm run dev -- -p 3001
```

Expected: Next dev server starts on `http://localhost:3001`.

- [ ] **Step 2: Open monthly analysis**

Open:

```text
http://localhost:3001/app/analysis
```

Expected: the monthly analysis page loads. If authentication redirects, use the app's demo mode entry path and navigate to 월별 분석.

- [ ] **Step 3: Verify desktop layout**

At a desktop viewport, confirm:

- the new card appears after 월 선택
- the desktop chart includes income categories, income, allocation groups, and detail categories
- labels and amounts are readable
- no React console errors appear

- [ ] **Step 4: Verify mobile layout**

At a mobile viewport around 390px wide, confirm:

- the compact chart appears
- detail category ribbons are hidden
- allocation groups remain readable
- text does not overlap enough to block reading

- [ ] **Step 5: Fix visual defects if found**

If labels overlap badly in demo data, adjust `desktopHeight`, `mobileHeight`, node gaps, or font sizes in the smallest possible edit. Then rerun:

```powershell
npm run lint
npm run build
```

Expected: both pass.

- [ ] **Step 6: Commit verification fixes if any**

If fixes were made:

```powershell
git add src/components/chart/MonthlySankeyFlowChart.tsx src/app/analysis/analysis.scss
git commit -m "fix: polish monthly sankey chart layout"
```

Expected: commit succeeds. Skip this step if no fixes were needed.

## Task 7: Update Handoff

**Files:**
- Modify: `HANDOFF.md`

- [ ] **Step 1: Add completion notes**

Append a short dated entry:

```md
## 2026-06-16 Update

- Added the monthly Sankey implementation plan:
  - `docs/superpowers/plans/2026-06-16-monthly-sankey-flow.md`
- Next step is executing the plan task by task.
```

- [ ] **Step 2: Commit the handoff update and plan**

Run:

```powershell
git add HANDOFF.md docs/superpowers/plans/2026-06-16-monthly-sankey-flow.md
git commit -m "docs: add monthly sankey implementation plan"
```

Expected: commit succeeds.

## Final Verification

- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] Desktop monthly analysis shows the full Sankey.
- [ ] Mobile monthly analysis shows the compact Sankey.
- [ ] `HANDOFF.md` records what changed and what remains.
