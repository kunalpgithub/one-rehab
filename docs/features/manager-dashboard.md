---
status: ready
depends_on: []
blocks: []
created: 2025-02-11
---

# Manager dashboard

## Goal

When a manager logs in, show a dashboard with all patients and all visitors working under that manager. Manager sees organization-wide (or team) view, not scoped to a single visitor.

## Scope

Auth (manager role), dashboard UI showing all patients and all visitors under the manager, and ability to see visit/attendance data across the team.

## Acceptance

- Manager user can log in (or be identified as manager).
- Dashboard shows all patients and all visitors that report to (or belong to) that manager.
- Manager sees visit schedules and attendance across their team (e.g. all visitors’ visits, all patients).
- Stats (active visits, completed visits, pending invoices) are aggregated for the manager’s scope, not a single visitor.

## Out of scope

- Editing visit/attendance (unless explicitly in scope); focus is visibility and reporting.
- Patient dashboard (see [Patient dashboard](patient-dashboard.md)).

## Notes

- Requires a notion of “manager” and “reports to” (e.g. visitor has manager_id, or firm/org hierarchy). Visitor dashboard is scoped to one visitor; this is the manager’s cross-visitor view.
