---
status: ready
depends_on: []
blocks: []
created: 2025-02-10
---

# Visit no-show

## Goal

Let staff mark a scheduled visit as no-show so attendance is accurate and we can optionally use it for reporting or follow-up. Today we have pending/completed/missed; no-show is a clear way to record "patient did not attend."

## Scope

UI and any minimal API/DB changes needed to persist no-show (e.g. reusing or extending visit-attendance status). No email/SMS in this feature.

## Acceptance

- Staff can mark a visit as no-show from the visit list (or attendance view).
- No-show is stored and displayed consistently (e.g. status or badge) in visit/attendance lists.
- Existing flows (completed, pending, missed) still work.

## Out of scope

- Sending notifications to the patient or staff about no-shows.
- Automatic rescheduling or reminders.

## Notes

- Check existing `VisitAttendance` status and API (e.g. `pages/api/visits/complete.ts`). May only need a new status value and a small UI change, or a dedicated "mark no-show" action.
