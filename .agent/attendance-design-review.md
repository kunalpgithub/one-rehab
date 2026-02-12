# Attendance & Visit Design Review

## Current behavior and where “duplicates” come from

### 1. Database

- **visit_schedules**: One row per (patient, visitor, recurrence). Has `generated_dates[]` (all scheduled date-times). No direct link from attendance back to schedule.
- **visit_attendance**: One row per (patient, visitor, scheduled_date, scheduled_time). No `schedule_id` FK.

**Migration unique constraint** (`migration_add_unique_constraint.sql`):

- `UNIQUE (patient_id, scheduled_date, scheduled_time)` — **does not include `visitor_id`**.
- So only one attendance row per patient per date+time is allowed. Same patient with two visitors at the same time cannot have two rows; the second insert would violate the constraint (or duplicates exist if the migration was never applied).

### 2. Where duplicates show up

- **Visits page**  
  - Uses `visit_attendance` for the selected date.  
  - Dedupes in UI by `(patient_id, scheduled_date, scheduled_time)` (lines 74–79 in `pages/visits/index.tsx`).  
  - If the DB has two rows for same (patient, date, time) — e.g. different `visitor_id` and no DB unique on that — both are returned and the client keeps one, so you can get inconsistent or “duplicate” behavior.  
  - If the DB unique is applied, you can’t store “same patient, same date/time, different visitors” at all.

- **Dashboard**  
  - Uses **visit_schedules** only (via `useVisitsQuery()`).  
  - **Active Visits** = number of schedules that have at least one future date.  
  - **Completed Visits** = sum of past dates across all schedules.  
  - So one patient with two schedules (e.g. two visitors) shows as **2** active visits. That can be perceived as “duplicate” if you expect one number per patient.

### 3. Create flow

- One “Add Visit” submission = one `createSchedule()` = one `visit_schedules` row and many `visit_attendance` rows (one per generated date/time).  
- Dedupe before insert is by (patient_id, scheduled_date, scheduled_time) in memory.  
- No `schedule_id` is stored on attendance, so you can’t tie an attendance row back to a schedule or “delete all attendance for this schedule” in one clean way.

---

## Design goal

- One patient can have **multiple visitors** and **multiple shifts** (multiple attendance rows per day, e.g. 9am with Visitor A, 2pm with Visitor B).  
- Queries should be efficient and easy to maintain (e.g. “all attendance for this schedule”, “attendance for a date”, “dashboard stats”).

---

## Recommended design (summary)

1. **Uniqueness**  
   - One attendance row per **assignment**: (patient, visitor, date, time).  
   - So: `UNIQUE (patient_id, visitor_id, scheduled_date, scheduled_time)` (or equivalent via `schedule_id` below).

2. **Link attendance to schedule**  
   - Add `schedule_id UUID REFERENCES visit_schedules(id) ON DELETE CASCADE` to `visit_attendance`.  
   - When creating a schedule, set `schedule_id` on every generated attendance row.  
   - Enforces “one schedule generates many attendances” and allows:  
     - Delete/cascade when a schedule is deleted.  
     - “Show/edit attendance for this schedule” and simpler reporting.

3. **Uniqueness again**  
   - Option A: Keep business unique as `(patient_id, visitor_id, scheduled_date, scheduled_time)` (no change to meaning; add `visitor_id` to the constraint and drop the old one).  
   - Option B: Use `UNIQUE (schedule_id, scheduled_date, scheduled_time)` so that within one schedule you can’t create two rows for the same date+time; different schedules can still create the same (patient, date, time) with different visitors.  
   - Recommended: **Option A** for clear “one slot per (patient, visitor, date, time)” and to avoid duplicate rows across schedules; optionally add Option B as a check per schedule.

4. **Indexes**  
   - Composite for “attendance by date” (main visits page):  
     `(scheduled_date, scheduled_time)` or `(scheduled_date, scheduled_time, status)`.  
   - For “attendance by schedule”: `(schedule_id)`.  
   - Existing indexes on `patient_id`, `scheduled_date`, `status` can stay; add the composite above if most queries filter by date (and optionally status).

5. **Dashboard**  
   - Decide what “Active Visits” means:  
     - **Current**: count of schedules with future dates (one patient, two schedules ⇒ 2).  
     - **Alternative**: “Patients with active visits” = count of distinct patients that have at least one schedule with future dates.  
   - Either is valid; recommend making the label explicit (e.g. “Active visit schedules” vs “Patients with active visits”) and, if you want “no duplicate patient count”, use the alternative.

---

## Implementation options

**Option 1 – Minimal fix (no new columns)**  
- Change unique constraint from `(patient_id, scheduled_date, scheduled_time)` to `(patient_id, visitor_id, scheduled_date, scheduled_time)`.  
- Clean existing duplicates (e.g. keep one per (patient_id, visitor_id, scheduled_date, scheduled_time)).  
- Result: Same patient can have multiple attendance rows per day (different visitors/times). No schema change to columns; only constraint + cleanup.

**Option 2 – Recommended (with schedule_id)**  
- Add `schedule_id` to `visit_attendance` and set it when creating attendance from a schedule.  
- Use unique `(patient_id, visitor_id, scheduled_date, scheduled_time)`.  
- Add index `(scheduled_date, scheduled_time)` (or composite with status).  
- When deleting a schedule, either:  
  - `ON DELETE CASCADE` on `schedule_id`, or  
  - Manually delete attendance where `schedule_id = ?` before deleting the schedule.  
- Result: Clear model, easy maintenance, no duplicates by (patient, visitor, date, time), and dashboard can be clarified as above.

**Option 3 – Normalized “slots” (larger change)**  
- Introduce a “visit_slots” or “scheduled_slots” table: (schedule_id, scheduled_date, scheduled_time), and keep attendance as “marking” of a slot (slot_id, status, marked_by, …).  
- More normalized, more tables and joins; only do this if you need slot-level lifecycle or reuse beyond current needs.

Recommendation: **Option 2** for the best balance of correctness, performance, and maintainability.

---

## Implemented (no migration)

- Not in production: schema is the source of truth; delete and recreate DB from `supabase/schema.sql` (no migration file).
- Visitor-scoped dashboard: when a visitor logs in, dashboard, visits list, patients list, and invoices list show only that visitor’s patients and visits (`useVisitsQuery(user?.id)`, `attendanceApi.getByDate(date, user?.id)`, and filtering patients/invoices by visitor’s patient IDs).
- Future: [Patient dashboard](docs/features/patient-dashboard.md) and [Manager dashboard](docs/features/manager-dashboard.md) are in the backlog.
