<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Money Book Project Rules

## Product Shape

Money Book is a Korean personal finance web app. Keep dashboard surfaces focused
on quick status checks, and put heavier interpretation features in analysis
screens.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Sass
- Supabase
- Chart.js / react-chartjs-2 for existing standard charts
- Custom SVG is acceptable for bespoke finance visualizations

## Code Style

- Follow existing file placement under `src/app`, `src/components`, `src/lib`,
  `src/styles`, and `src/types`.
- Keep reusable chart data transformation logic separate from React rendering
  when it is non-trivial.
- Prefer existing API types such as `MoneyBookEntry` over duplicating data
  shapes.
- Use Korean UI copy for user-facing text.
- Do not introduce new visualization dependencies unless the feature genuinely
  needs a layout engine or renderer.

## UX Guidelines

- Dashboard: quick monthly totals, recent entries, progress, and concise CTAs.
- Monthly analysis: richer interpretation such as category analysis, year/month
  comparisons, and cash-flow explanations.
- Mobile is a primary target. Avoid dense desktop charts on mobile when a
  compact interpretation is clearer.
- Essential values must be readable without hover.

## Verification

- Run `npm run lint` after meaningful code changes.
- Run `npm run build` before calling implementation complete.
- For visual changes, verify both desktop and mobile widths.
- Update `HANDOFF.md` after each meaningful work step with what changed, what
  was verified, and what remains.
