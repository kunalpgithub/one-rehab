-- Add unique constraint to prevent duplicate attendance records
-- This ensures one attendance record per patient, date, and time combination

-- First, check if constraint already exists and drop it if it does
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_attendance_per_patient_date_time'
  ) THEN
    ALTER TABLE visit_attendance 
    DROP CONSTRAINT unique_attendance_per_patient_date_time;
  END IF;
END $$;

-- Remove any existing duplicates (keep the oldest one)
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

-- Add unique constraint
ALTER TABLE visit_attendance
ADD CONSTRAINT unique_attendance_per_patient_date_time 
UNIQUE (patient_id, scheduled_date, scheduled_time);
