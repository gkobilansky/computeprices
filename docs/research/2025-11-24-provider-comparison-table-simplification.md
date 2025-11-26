---
date: 2025-11-24T14:26:14-05:00
researcher: Codex
git_commit: 1fbf51b88cc7bcf3cc519dfebb59bd1a7228bad3
branch: main
repository: computeprices
topic: "Simplify provider comparison table (GPU Pricing Comparison)"
tags: [research, codebase, comparison-table, pricing]
status: complete
last_updated: 2025-11-24
last_updated_by: Codex
last_updated_note: "Added follow-up answers and decisions from product guidance"
---

# Research: Simplify provider comparison table (GPU Pricing Comparison)

**Date**: 2025-11-24T14:26:14-05:00  
**Researcher**: Codex  
**Git Commit**: 1fbf51b88cc7bcf3cc519dfebb59bd1a7228bad3  
**Branch**: main  
**Repository**: computeprices

## Research Question
How can we simplify the implementation and design of the provider comparison table shown under the "GPU Pricing Comparison" header?

## Summary
- The comparison table is a client component with its own fetch cycle and duplicated state (sorting, filtering, selection), even though the page already fetches comparison data server-side. Passing initial data and trimming state would simplify flow and avoid duplicate requests.
- UI structure is layered: `ComparisonFullSection` renders a section title, and the table adds another header with stats, resulting in double headings and nested padding. Streamlining to a single header/summary block would reduce visual noise.
- Filters are hidden behind a toggle and spread across multiple controls; some logic is redundant (e.g., `showBestPricesOnly` accepts rows with only one provider). Consolidating filters and clarifying their behavior would shrink code and UI.
- Row rendering is split between desktop rows and a mobile card that reuses `PriceComparisonCell`, leading to duplicated markup/styling and state (`selectedGPU`) used only for highlighting. A single responsive card/table layout could remove duplication.
- Data prep mixes concerns: `fetchProviderComparison` synthesizes slugs from names instead of using canonical slugs, and `useTableSort` requires callers to pass unused data parameters. Cleaning these helpers would simplify table code.

## Detailed Findings

### Data flow and fetching
- `fetchProviderComparison` aggregates two provider price lists via Supabase RPC calls, merges GPU rows, computes `price_difference`, `best_price`, and availability, and returns metadata counts (`totalGPUs`, `bothAvailable`, etc.). Slugs are derived from provider names (`toLowerCase().replace(/\s+/g, '-')`) rather than using canonical slugs, which risks mismatches with stored logos/routes ([lib/utils/fetchGPUData.js#L116](https://github.com/gkobilansky/computeprices/blob/1fbf51b88cc7bcf3cc519dfebb59bd1a7228bad3/lib/utils/fetchGPUData.js#L116)).
- `ComparePage` fetches `comparisonPayload` on the server for SEO/stats but does not pass it into `ComparisonPricingTable`, so the client table refetches the same data on mount. This duplicate work could be removed by passing `initialData` ([app/compare/[...providers]/page.tsx#L229](https://github.com/gkobilansky/computeprices/blob/1fbf51b88cc7bcf3cc519dfebb59bd1a7228bad3/app/compare/%5B...providers%5D/page.tsx#L229)).
- `ComparisonPricingTable` initializes `comparisonData` from optional `initialData` and triggers a client fetch when missing; loading/error/empty states are handled locally ([components/comparison/ComparisonPricingTable.jsx#L18](https://github.com/gkobilansky/computeprices/blob/1fbf51b88cc7bcf3cc519dfebb59bd1a7228bad3/components/comparison/ComparisonPricingTable.jsx#L18)).

### UI composition and headings
- The table lives inside `ComparisonFullSection`, which already renders a title and padded container; the table adds its own header block with "GPU Pricing Comparison" and stats, producing stacked headers and repeated padding ([components/comparison/ComparisonLayout.jsx#L88](https://github.com/gkobilansky/computeprices/blob/1fbf51b88cc7bcf3cc519dfebb59bd1a7228bad3/components/comparison/ComparisonLayout.jsx#L88), [components/comparison/ComparisonPricingTable.jsx#L183](https://github.com/gkobilansky/computeprices/blob/1fbf51b88cc7bcf3cc519dfebb59bd1a7228bad3/components/comparison/ComparisonPricingTable.jsx#L183)).
- Summary stats show counts and last-updated timestamp from metadata, but this duplicates info presented earlier in `ComparisonHeader`, contributing to cognitive load ([components/comparison/ComparisonHeader.jsx#L125](https://github.com/gkobilansky/computeprices/blob/1fbf51b88cc7bcf3cc519dfebb59bd1a7228bad3/components/comparison/ComparisonHeader.jsx#L125)).

### Filtering, sorting, and state
- Table manages multiple local filters (`showBothAvailable`, `showBestPricesOnly`, price range, manufacturer) plus `selectedGPU` highlighting and a "show all" toggle ([components/comparison/ComparisonPricingTable.jsx#L21](https://github.com/gkobilansky/computeprices/blob/1fbf51b88cc7bcf3cc519dfebb59bd1a7228bad3/components/comparison/ComparisonPricingTable.jsx#L21)).
- `ComparisonTableFilters` is a collapsible panel with checkboxes, two selects, explanatory text, and tips. It tracks its own expand state and clears filters manually, adding UI chrome and code branching ([components/comparison/ComparisonTableFilters.jsx#L18](https://github.com/gkobilansky/computeprices/blob/1fbf51b88cc7bcf3cc519dfebb59bd1a7228bad3/components/comparison/ComparisonTableFilters.jsx#L18)).
- `showBestPricesOnly` filters rows where `best_price !== null`, which includes single-provider rows because `best_price` defaults to whichever provider exists. That blurs the filter’s intent and keeps rows without true comparisons ([lib/utils/fetchGPUData.js#L180](https://github.com/gkobilansky/computeprices/blob/1fbf51b88cc7bcf3cc519dfebb59bd1a7228bad3/lib/utils/fetchGPUData.js#L180), [components/comparison/ComparisonPricingTable.jsx#L90](https://github.com/gkobilansky/computeprices/blob/1fbf51b88cc7bcf3cc519dfebb59bd1a7228bad3/components/comparison/ComparisonPricingTable.jsx#L90)).
- Sorting uses `useTableSort`, which expects data to be passed to `handleSort` even though the parameter is unused; sort state lives in the hook and is applied via `getSortedData` on `processedData` ([lib/hooks/useTableSort.js#L4](https://github.com/gkobilansky/computeprices/blob/1fbf51b88cc7bcf3cc519dfebb59bd1a7228bad3/lib/hooks/useTableSort.js#L4), [components/comparison/ComparisonPricingTable.jsx#L136](https://github.com/gkobilansky/computeprices/blob/1fbf51b88cc7bcf3cc519dfebb59bd1a7228bad3/components/comparison/ComparisonPricingTable.jsx#L136)).

### Row rendering and responsiveness
- `DualProviderTableRow` renders both a desktop `<tr>` with five columns and a separate mobile card row; both attach click handlers and availability chips. This doubles markup and styling effort ([components/comparison/DualProviderTableRow.jsx#L52](https://github.com/gkobilansky/computeprices/blob/1fbf51b88cc7bcf3cc519dfebb59bd1a7228bad3/components/comparison/DualProviderTableRow.jsx#L52)).
- Price blocks repeat structure for each provider, including logos, price formatting, and "best" badges; `PriceComparisonCell` reimplements similar UI for mobile with another grid layout ([components/comparison/DualProviderTableRow.jsx#L82](https://github.com/gkobilansky/computeprices/blob/1fbf51b88cc7bcf3cc519dfebb59bd1a7228bad3/components/comparison/DualProviderTableRow.jsx#L82), [components/comparison/PriceComparisonCell.jsx#L35](https://github.com/gkobilansky/computeprices/blob/1fbf51b88cc7bcf3cc519dfebb59bd1a7228bad3/components/comparison/PriceComparisonCell.jsx#L35)).
- `selectedGPU` state only drives row highlight and PriceComparisonCell styling; it is not exposed upward, so its utility is limited relative to its complexity ([components/comparison/ComparisonPricingTable.jsx#L21](https://github.com/gkobilansky/computeprices/blob/1fbf51b88cc7bcf3cc519dfebb59bd1a7228bad3/components/comparison/ComparisonPricingTable.jsx#L21), [components/comparison/ComparisonPricingTable.jsx#L263](https://github.com/gkobilansky/computeprices/blob/1fbf51b88cc7bcf3cc519dfebb59bd1a7228bad3/components/comparison/ComparisonPricingTable.jsx#L263)).

### Layout and supporting components
- `ComparisonLayout` wraps all sections with a view-mode toggle (side-by-side/stacked/table) and a legend, adding persistent UI chrome unrelated to the pricing table itself ([components/comparison/ComparisonLayout.jsx#L20](https://github.com/gkobilansky/computeprices/blob/1fbf51b88cc7bcf3cc519dfebb59bd1a7228bad3/components/comparison/ComparisonLayout.jsx#L20)).
- `ComparisonHeader` already surfaces counts of GPUs per provider and direct comparisons, overlapping with the table’s metadata summary ([components/comparison/ComparisonHeader.jsx#L125](https://github.com/gkobilansky/computeprices/blob/1fbf51b88cc7bcf3cc519dfebb59bd1a7228bad3/components/comparison/ComparisonHeader.jsx#L125)).

## Code References
- [components/comparison/ComparisonPricingTable.jsx#L18](https://github.com/gkobilansky/computeprices/blob/1fbf51b88cc7bcf3cc519dfebb59bd1a7228bad3/components/comparison/ComparisonPricingTable.jsx#L18) – Client-side table state, fetch, filters, rendering, and headers.
- [components/comparison/ComparisonTableFilters.jsx#L18](https://github.com/gkobilansky/computeprices/blob/1fbf51b88cc7bcf3cc519dfebb59bd1a7228bad3/components/comparison/ComparisonTableFilters.jsx#L18) – Collapsible filters UI and clear/reset logic.
- [components/comparison/DualProviderTableRow.jsx#L52](https://github.com/gkobilansky/computeprices/blob/1fbf51b88cc7bcf3cc519dfebb59bd1a7228bad3/components/comparison/DualProviderTableRow.jsx#L52) – Dual rendering (desktop row + mobile card) with price blocks and source links.
- [components/comparison/PriceComparisonCell.jsx#L35](https://github.com/gkobilansky/computeprices/blob/1fbf51b88cc7bcf3cc519dfebb59bd1a7228bad3/components/comparison/PriceComparisonCell.jsx#L35) – Mobile price comparison layout and difference badge logic.
- [lib/utils/fetchGPUData.js#L116](https://github.com/gkobilansky/computeprices/blob/1fbf51b88cc7bcf3cc519dfebb59bd1a7228bad3/lib/utils/fetchGPUData.js#L116) – Comparison data assembly, metadata, and slug derivation from names.
- [app/compare/[...providers]/page.tsx#L229](https://github.com/gkobilansky/computeprices/blob/1fbf51b88cc7bcf3cc519dfebb59bd1a7228bad3/app/compare/%5B...providers%5D/page.tsx#L229) – Server fetch of comparison data that is not passed to the client table.
- [lib/hooks/useTableSort.js#L4](https://github.com/gkobilansky/computeprices/blob/1fbf51b88cc7bcf3cc519dfebb59bd1a7228bad3/lib/hooks/useTableSort.js#L4) – Sort state hook; `handleSort` data parameter unused.
- [components/comparison/ComparisonLayout.jsx#L88](https://github.com/gkobilansky/computeprices/blob/1fbf51b88cc7bcf3cc519dfebb59bd1a7228bad3/components/comparison/ComparisonLayout.jsx#L88) – Section wrapper adds titles/padding; may duplicate table header.

## Architecture Insights
- Client-only fetching for the table repeats work already done server-side; passing `comparisonPayload` into `ComparisonPricingTable` would simplify state, remove a spinner path, and enable SSR for the table data.
- Slug generation from provider names in `fetchProviderComparison` risks logo/route mismatches; using canonical `provider.slug` would reduce defensive UI code and align assets.
- Filter semantics and UI could be trimmed: fewer toggles with clearer defaults (e.g., default to both-available) would shrink code and better match the comparison intent.
- Consolidating desktop/mobile rendering into a single responsive component (or reusing `PriceComparisonCell` for both) would remove duplicated markup and reduce styling drift.
- Titles/metadata are repeated across `ComparisonHeader`, `ComparisonFullSection`, and the table header; a single cohesive header/summary would simplify layout and visual hierarchy.

## Historical Context (from thoughts/)
No `thoughts/` directory found; no historical research notes available.

## Related Research
None found in the repository.

## Open Questions
- Should the table accept server-fetched comparison data to avoid client refetching and enable SSR? If so, what fallback is needed for client-only navigation?
- Which filters are essential for the comparison use case? Would defaulting to "both available" and removing the "best price only" toggle simplify the UX?
- Can we reuse one responsive component for both desktop and mobile instead of parallel row/card implementations?
- Should provider slugs from the database replace name-derived slugs in comparison data to align with existing assets?
- Is the double "GPU Pricing Comparison" header intentional, or should the section and table share a single title/summary?

## Follow-up Research 2025-11-24T21:26:21-05:00
- **SSR & fallback**: Yes—table should consume server-fetched comparison payload for SEO; client-only fallback can be a loading skeleton to cover client navigations.
- **Filters & view toggle**: Remove comparison filters section/logic entirely; remove the view mode toggle in `ComparisonLayout` (side-by-side/stacked/table) since it is unnecessary and unreliable.
- **Responsive component reuse**: No change required; current dual layout is acceptable for now.
- **Slug handling**: Use provider slugs from the database in `fetchProviderComparison`; delete the name-based slug generation.
- **Header duplication**: Collapse to a single title/summary; rely on the section/header once instead of the table adding its own header block.
