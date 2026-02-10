# Front-end subagent — reference

## Handoff rules

| User intent | Action |
|-------------|--------|
| "Add a button that saves the visit" | UI only: button + existing mutation/hook; no new API or schema. |
| "Create an API to export visits as CSV" | Out of scope for front-end; suggest backend/API task or ask if they want both. |
| "Fix the dashboard layout on mobile" | In scope: Tailwind, layout, components. |
| "Add a new Supabase table for X" | Defer: use supabase-nextjs skill or hand off. |
| "This query is slow" | Defer: use database-query-optimization skill. |

## Key paths (this repo)

- Pages (UI): `pages/*.tsx`, `pages/**/index.tsx`, `pages/**/add.tsx` (exclude `pages/api/`)
- UI components: `components/`, `components/ui/`, `components/animations/`
- Hooks used by UI: `hooks/usePatientsQuery.ts`, `hooks/useVisitsQuery.ts`, `hooks/useInvoicesQuery.ts`, `hooks/useAttendanceQuery.ts`
- Styling: `styles/globals.css`, `lib/utils.ts` (`cn`), `lib/animations.ts`
- Types used by UI: `types/index.ts`

## Do not modify as part of "front-end" work

- `pages/api/**`
- `supabase/migrations/**`, Supabase config
- `lib/supabase/**` (server client, auth internals) unless asked
- `services/**` (backend service layer)
