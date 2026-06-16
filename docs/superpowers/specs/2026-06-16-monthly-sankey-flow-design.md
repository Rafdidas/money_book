# Monthly Sankey Flow Design

## Purpose

Add a real-data SVG Sankey-style cash flow chart to the monthly analysis page.
The chart should help users understand how money entered and left during the
selected month, while keeping the dashboard focused on quick status checks.

## Scope

- Add the main flow chart to `src/app/app/analysis/page.tsx`.
- Use selected-month `MoneyBookEntry[]` data.
- Render the chart as custom SVG without adding a Sankey layout dependency.
- Keep the current monthly bar chart and category analysis unless implementation
  reveals a layout conflict.
- Add a mobile-specific compact chart that avoids dense labels and category
  ribbons.

## Data Model

The chart derives nodes and links from `MoneyBookEntry` records for the selected
month.

Entry classification:

- `type === "income"`: income
- `type === "saving"`: savings
- `type === "investment"`: investment principal
- `type === "expense"` and `source` is `fixed_expense_payment` or
  `legacy_fixed_expense`: fixed expense
- `type === "expense"` and all other sources: variable expense
- remaining money: income minus fixed expenses, variable expenses, savings, and
  investment principal

Desktop flow:

```text
Income categories
-> Income
-> Fixed expense / Variable expense / Savings / Investment principal / Remaining money
-> Detail categories
```

Mobile compact flow:

```text
Income
-> Fixed expense / Variable expense / Savings / Investment principal / Remaining money
```

Zero-value links and nodes are omitted. Remaining money is omitted when it is
zero. If remaining money is negative, the chart should show an overspend node
instead of pretending there is a positive balance.

## Components

Create a focused chart component under `src/components/chart/`, tentatively:

- `MonthlySankeyFlowChart.tsx`

The component owns:

- transforming entries into flow nodes and links
- desktop and mobile SVG layout variants
- labels, amounts, empty state, and reduced data fallback

The analysis page owns:

- selected year and month state
- loading state
- passing `selectedMonthItems` to the chart

## Layout

Desktop uses a fixed four-column SVG layout:

1. income categories
2. income aggregate
3. allocation groups
4. detail categories

Mobile uses a fixed two-column SVG layout:

1. income aggregate
2. allocation groups

The chart should sit in its own card between the month selector and the current
monthly comparison chart, because it explains the selected month before the
user reads yearly comparisons.

## Visual Encoding

- Income: cool blue or teal family
- Expenses: red or coral family
- Savings: green family
- Investment principal: blue or neutral-indigo family
- Remaining money: neutral dark or positive green
- Overspend: red

Amounts should be visible in labels where space allows. The mobile chart should
prioritize readable group names and totals over category detail.

## Empty And Edge States

Show an empty state when the selected month cannot produce a meaningful flow,
for example when there is no income and no outflow.

If there are outflows but no income, show the outflow groups from a neutral
"recorded outflow" source instead of dividing by zero or rendering blank.

## Accessibility

- The SVG wrapper should expose a concise Korean `aria-label`.
- Essential values must appear as text, not hover-only tooltips.
- Color should not be the only encoding; labels and amounts must identify each
  group.
- Respect reduced motion if entry animations are added later.

## Testing And Verification

- Run `npm run lint`.
- Run `npm run build`.
- Verify the monthly analysis page in demo mode.
- Check desktop and mobile widths:
  - desktop shows category-level Sankey
  - mobile shows compact allocation Sankey
  - labels do not overlap in common demo data
  - empty months do not crash

## Out Of Scope

- Lottie animation generation
- Adding `d3-sankey`
- Full drag, zoom, or interactive node expansion
- Dashboard placement beyond a possible future summary CTA
