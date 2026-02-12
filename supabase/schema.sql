-- One Rehab Database Schema
-- Run this in Supabase SQL Editor to create all required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Patients Table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  service TEXT NOT NULL CHECK (service IN ('Physical Therapy', 'Occupational Therapy', 'Speech Therapy', 'Rehabilitation')),
  last_visit TIMESTAMPTZ,
  status TEXT CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Visit Schedules Table
CREATE TABLE IF NOT EXISTS visit_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL, -- User ID from auth.users or custom users table
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  visits_per_period INTEGER NOT NULL CHECK (visits_per_period > 0),
  start_date DATE NOT NULL,
  end_date DATE,
  occurrences INTEGER CHECK (occurrences > 0),
  time_slots JSONB, -- Array of TimeSlot objects: [{"time": "09:00", "dayOfWeek": 1, "dayOfMonth": 15}]
  generated_dates TEXT[] NOT NULL, -- Array of ISO date strings
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Visit Attendance Table (one row per patient+visitor+date+time; optional link to schedule)
CREATE TABLE IF NOT EXISTS visit_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID REFERENCES visit_schedules(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME, -- Optional time slot (HH:MM:SS format)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed')),
  marked_by TEXT, -- User ID who marked the attendance
  marked_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (patient_id, visitor_id, scheduled_date, scheduled_time)
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  service TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rate_per_visit DECIMAL(10, 2) NOT NULL CHECK (rate_per_visit >= 0),
  visits JSONB NOT NULL, -- Array of visit objects: [{"date": "2024-01-01", "attended": true, "rate": 75.00}]
  total_visits INTEGER NOT NULL DEFAULT 0,
  attended_visits INTEGER NOT NULL DEFAULT 0,
  missed_visits INTEGER NOT NULL DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_visit_schedules_patient_id ON visit_schedules(patient_id);
CREATE INDEX IF NOT EXISTS idx_visit_schedules_visitor_id ON visit_schedules(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visit_attendance_patient_id ON visit_attendance(patient_id);
CREATE INDEX IF NOT EXISTS idx_visit_attendance_scheduled_date ON visit_attendance(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_visit_attendance_date_time ON visit_attendance(scheduled_date, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_visit_attendance_schedule_id ON visit_attendance(schedule_id) WHERE schedule_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_visit_attendance_status ON visit_attendance(status);
CREATE INDEX IF NOT EXISTS idx_invoices_patient_id ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-update updated_at
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visit_schedules_updated_at
  BEFORE UPDATE ON visit_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visit_attendance_updated_at
  BEFORE UPDATE ON visit_attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patients table
-- Allow all authenticated users to read patients
CREATE POLICY "Allow authenticated users to read patients"
  ON patients FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert patients
CREATE POLICY "Allow authenticated users to insert patients"
  ON patients FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update patients
CREATE POLICY "Allow authenticated users to update patients"
  ON patients FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete patients
CREATE POLICY "Allow authenticated users to delete patients"
  ON patients FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for visit_schedules table
CREATE POLICY "Allow authenticated users to read visit schedules"
  ON visit_schedules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert visit schedules"
  ON visit_schedules FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update visit schedules"
  ON visit_schedules FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete visit schedules"
  ON visit_schedules FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for visit_attendance table
CREATE POLICY "Allow authenticated users to read visit attendance"
  ON visit_attendance FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert visit attendance"
  ON visit_attendance FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update visit attendance"
  ON visit_attendance FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete visit attendance"
  ON visit_attendance FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for invoices table
CREATE POLICY "Allow authenticated users to read invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete invoices"
  ON invoices FOR DELETE
  TO authenticated
  USING (true);

-- Note: Only authenticated users can access these tables
-- To allow anonymous access for development, you would need to create
-- additional policies for the 'anon' role, but this is NOT recommended
-- for production. Instead, implement proper authentication.

