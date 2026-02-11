# One Rehab — product spec

## What it is

One Rehab is a practice management app for rehabilitation providers (physical therapy, occupational therapy, speech therapy). It covers patients, scheduled visits, visit attendance (check-in / completion), and invoicing based on visits and rates.

## Users

- **Admin**: Full access; manage users, settings, and all data.
- **Manager**: Schedule visits, manage patients, view reports, generate and view invoices.
- **Therapist**: Mark attendance, view assigned visits and patients.
- **Client**: (Future) Patient-facing portal to view visits and invoices.

Authenticated via Supabase Auth. Role model can be extended as needed.

## Tech boundaries

- **Stack**: Next.js (Pages Router), Supabase (Postgres + Auth), React Query for server state, zustand for client state, Tailwind + Radix UI.
- **Convention**: Use existing hooks (`hooks/`) and API routes (`pages/api/`). Do not add new API routes or Supabase schema unless a feature spec explicitly requires it.
- **Data**: Patients, users (staff/visitors), scheduled visits with generated dates, visit attendance (pending/completed/missed), invoices (patient, date range, rate, visit breakdown).

## Doc structure

- **Architecture and tech stack**: [docs/architecture.md](architecture.md)
- **Backlog** (ready to implement): [docs/backlog.md](backlog.md)
- **Ideas** (someday): [docs/ideas.md](ideas.md)
- **Feature specs** (one per feature): [docs/features/](features/) — each file has status and optional dependencies in frontmatter.
