---
status: ready
depends_on: []
blocks: []
created: 2025-02-11
---

# Patient dashboard

## Goal

When a patient logs in, show them a dedicated dashboard with all their visits (by any visitor/therapist). This is a separate experience from the visitor dashboard: one patient, all visits assigned to them.

## Scope

Auth (patient role or patient-linked user), dashboard UI scoped to current patient, and visit list/calendar for that patient. May require patient login flow and role or profile type.

## Acceptance

- Patient user can log in (or be identified as patient).
- Dashboard shows only that patient’s data: their visits (all visitors), relevant stats (e.g. upcoming visits, completed).
- Patient sees visit list (and optionally calendar) for their own visits only.
- No access to other patients’ data or to visitor/manager views.

## Out of scope

- Manager dashboard (see [Manager dashboard](manager-dashboard.md)).
- Editing visits or marking attendance (patient view is read-only unless otherwise specified).

## Notes

- Depends on user type/role (patient vs visitor vs manager). Visitor dashboard is already scoped to logged-in visitor; this is the patient-facing counterpart.
