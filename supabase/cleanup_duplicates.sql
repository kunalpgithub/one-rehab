-- Quick script to remove duplicate attendance records
-- Keeps the oldest record for each patient/date/time combination
-- Run this in Supabase SQL Editor

WITH duplicates AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY patient_id, scheduled_date, scheduled_time 
      ORDER BY created_at ASC
    ) as rn
  FROM visit_attendance
)
DELETE FROM visit_attendance
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Show how many duplicates were removed
-- (This will show 0 if run again after cleanup)
