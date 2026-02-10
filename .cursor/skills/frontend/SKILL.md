---
name: frontend
description: Handles front-end tasks only: pages, components, UI state, styling, layout, and client-side data binding. Use when the user asks for front-end work, UI changes, new components, page layout, Tailwind/Radix styling, forms, or accessibility. Do not use for API routes, Supabase schema, RLS, or backend services unless explicitly requested.
---

# Front-end subagent

This skill scopes work to **client-facing UI**. Apply it when doing front-end tasks so the agent stays in lane and uses the project stack consistently.

## Scope (in bounds)

- **Pages** (except `pages/api/*`): layout, structure, client-side behavior
- **Components**: `components/`, `components/ui/`, `components/animations/`
- **Styling**: Tailwind, Radix, `cn()`, cva, design tokens, `globals.css`
- **Client state**: zustand, React state, URL/query state
- **Data binding in UI**: hooks that call APIs (e.g. `usePatientsQuery`, `useVisitsQuery`), loading/error UIs, forms that submit via existing APIs
- **Accessibility**: focus, labels, ARIA, keyboard nav, reduced motion
- **Types**: only types used by pages/components (import from `@/types` or local)

## Out of scope (defer unless asked)

- **API routes**: `pages/api/**` — do not add or change unless user explicitly asks
- **Supabase**: schema, migrations, RLS, server-side Supabase client — use supabase-nextjs skill or ask
- **Backend services**: `services/`, server-only logic — do not refactor or add unless requested
- **Database/query optimization**: use database-query-optimization skill when needed

If the user says "fix the UI" or "add a button that does X", implement the UI and call **existing** APIs/hooks; do not create new API routes or change Supabase schema unless they ask.

## Stack (use these)

When building or editing UI in this project:

1. **Styling & components**  
   Use [tailwind-radix-ui](.cursor/skills/tailwind-radix-ui/SKILL.md): `cn()`, cva, design tokens, Radix primitives, `@/components/ui/*`, animations from `@/lib/animations` and `@/components/animations`.

2. **Data & client state**  
   Use [nextjs-react-query-stack](.cursor/skills/nextjs-react-query-stack/SKILL.md): React Query for server state, zustand for UI state, existing hooks in `hooks/` (e.g. `usePatientsQuery`, `useVisitsQuery`, `useInvoicesQuery`).

3. **Routing & pages**  
   Next.js Pages Router: `pages/`, `router` from `next/router`, `Link` from `next/link`.

4. **Auth in UI**  
   Use `AuthContext` / auth hooks for "current user" and redirects; do not implement auth logic (tokens, RLS) unless asked.

## Conventions

- **New components**: Prefer under `components/` or `components/ui/`; use `cn()` and forward `className`; use cva for variants; use Radix when needed (Dialog, Select, Toast, Label).
- **New pages**: Use existing layout (e.g. dashboard shell), `PageTransition` from `@/components/animations/PageTransition` for route transitions where applicable.
- **Forms**: Use `components/ui` (Input, Label, Button, Select); wire to existing mutations/hooks; show loading and errors in the UI.
- **Lists/tables**: Use React Query hooks for data; show loading/empty/error states; use design tokens and spacing from the rest of the app.

## Quick checklist for front-end tasks

- [ ] Changes only in pages (non-API), components, hooks that feed UI, or styles
- [ ] Styling via Tailwind + `cn()` + design tokens (no ad-hoc hex colors for chrome)
- [ ] Data from existing React Query hooks or existing API calls; no new API routes unless requested
- [ ] Interactive elements have focus styles and labels/ARIA where needed
- [ ] No Supabase schema/RLS or backend service changes unless user asked for them

## When to pull in other skills

- **Supabase (auth, data from DB, RLS)** → [supabase-nextjs](.cursor/skills/supabase-nextjs/SKILL.md)
- **Complex SQL / slow queries / schema** → [database-query-optimization](.cursor/skills/database-query-optimization/SKILL.md)

For more detail on boundaries and when to hand off, see [reference.md](reference.md).
