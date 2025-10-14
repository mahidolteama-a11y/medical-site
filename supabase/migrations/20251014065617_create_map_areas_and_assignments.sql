/*
  # Create Map Areas and Area Assignment System

  ## Overview
  This migration creates a comprehensive geographic zone management system where doctors can define service areas
  by drawing polygons on a map. Volunteers and patients are automatically assigned to these areas based on their
  location (GPS coordinates) and address information.

  ## New Tables
  
  ### `map_areas`
  Geographic zones defined by doctors with colored polygon boundaries.
  - `id` (uuid, primary key) - Unique identifier for each area
  - `name` (text, unique, not null) - Human-readable name for the area (e.g., "North District Zone 1")
  - `color` (text, not null) - Hex color code for area visualization (e.g., "#FF5733")
  - `geometry` (jsonb, not null) - Polygon coordinates stored as GeoJSON structure
  - `created_by` (uuid, foreign key to auth.users) - Doctor who created this area
  - `created_at` (timestamptz) - When the area was created
  - `updated_at` (timestamptz) - When the area was last modified
  
  ### `volunteers`
  Profile information for volunteer health workers (VHVs).
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key to auth.users) - Linked user account
  - `volunteer_code` (text, unique) - Volunteer identification code (e.g., "VHV-000123")
  - `name` (text, not null) - Full name
  - `email` (text, not null) - Email address
  - `phone` (text) - Contact phone number
  - `address` (text) - Full address as text
  - `lat` (double precision) - GPS latitude coordinate
  - `lng` (double precision) - GPS longitude coordinate
  - `dob` (date) - Date of birth
  - `photo_url` (text) - Profile picture URL
  - `area_id` (uuid, foreign key to map_areas) - Assigned geographic area
  - `area_name` (text) - Denormalized area name for quick access
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `patient_profiles`
  Medical and personal information for patients.
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key to auth.users) - Linked patient account
  - `medical_record_number` (text, unique) - MRN identifier (e.g., "MRN-000456")
  - `name` (text, not null) - Patient full name
  - `doe` (date) - Date of entry into system
  - `gender` (text) - Gender (male/female/other)
  - `address` (text) - Full address as text
  - `lat` (double precision) - GPS latitude coordinate
  - `lng` (double precision) - GPS longitude coordinate
  - `phone_number` (text) - Patient contact number
  - `caregivers_contact` (text) - Caregiver information
  - `assigned_doctor` (text) - Assigned doctor name
  - `assigned_vhv_name` (text) - Assigned volunteer name
  - `area_id` (uuid, foreign key to map_areas) - Assigned geographic area
  - `area_name` (text) - Denormalized area name for quick access
  - `last_record_date` (date) - Last medical record date
  - `today_date` (date) - Current date reference
  - `patient_categories` (jsonb) - Categories (critical, elderly, pregnant)
  - `personal_health_history` (text) - Health background
  - `doctor_diagnosed` (text) - Diagnoses
  - `medications_history` (text) - Medication records
  - `food_allergies` (text) - Food allergies
  - `medication_allergies` (text) - Medication allergies
  - `height` (text) - Height measurement
  - `weight` (text) - Weight measurement
  - `bmi` (text) - Body mass index
  - `temperature` (text) - Body temperature
  - `pulse` (text) - Pulse rate
  - `blood_pressure` (text) - Blood pressure reading
  - `diabetes` (text) - Diabetes information
  - `mental_health_status` (text) - Mental health notes
  - `other_symptoms` (text) - Additional symptoms
  - `pregnancy_details` (text) - Pregnancy information
  - `smoker` (boolean) - Smoking status
  - `doctors_note` (text) - Doctor's notes
  - `photo_url` (text) - Profile picture URL
  - `created_by` (uuid, foreign key to auth.users) - Doctor who created profile
  - `created_at` (timestamptz) - Profile creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  
  ### Row Level Security (RLS)
  All tables have RLS enabled with restrictive policies:
  
  - `map_areas`: 
    - Doctors can create, read, update, and delete areas
    - Volunteers and patients can only read areas
  
  - `volunteers`:
    - Doctors can create, read, update volunteer profiles
    - Volunteers can read their own profile
    - Patients cannot access volunteer data
  
  - `patient_profiles`:
    - Doctors can create, read, update patient profiles
    - Patients can read their own profile
    - Volunteers can read profiles of patients in their area
  
  ## Indexes
  
  Created for performance on commonly queried fields:
  - `map_areas.created_by` - For doctor's area list
  - `volunteers.area_id` - For area-based filtering
  - `volunteers.user_id` - For user profile lookup
  - `patient_profiles.area_id` - For area-based filtering
  - `patient_profiles.user_id` - For user profile lookup
  - `patient_profiles.medical_record_number` - For MRN searches

  ## Notes
  
  1. The `geometry` field stores polygon coordinates in GeoJSON format for compatibility
  2. Both `area_id` and `area_name` are stored for performance (denormalization)
  3. GPS coordinates (lat/lng) are optional but highly recommended for accurate area assignment
  4. All timestamps use UTC timezone
  5. Foreign key constraints ensure data integrity
*/

-- Create map_areas table
CREATE TABLE IF NOT EXISTS map_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  color text NOT NULL DEFAULT '#3B82F6',
  geometry jsonb NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create volunteers table
CREATE TABLE IF NOT EXISTS volunteers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  volunteer_code text UNIQUE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  address text,
  lat double precision,
  lng double precision,
  dob date,
  photo_url text,
  area_id uuid REFERENCES map_areas(id) ON DELETE SET NULL,
  area_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create patient_profiles table
CREATE TABLE IF NOT EXISTS patient_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  medical_record_number text UNIQUE NOT NULL,
  name text NOT NULL,
  doe date,
  gender text,
  address text,
  lat double precision,
  lng double precision,
  phone_number text,
  caregivers_contact text,
  assigned_doctor text,
  assigned_vhv_name text,
  area_id uuid REFERENCES map_areas(id) ON DELETE SET NULL,
  area_name text,
  last_record_date date,
  today_date date,
  patient_categories jsonb DEFAULT '{"critical": false, "elderly": false, "pregnant": false}'::jsonb,
  personal_health_history text,
  doctor_diagnosed text,
  medications_history text,
  food_allergies text,
  medication_allergies text,
  height text,
  weight text,
  bmi text,
  temperature text,
  pulse text,
  blood_pressure text,
  diabetes text,
  mental_health_status text,
  other_symptoms text,
  pregnancy_details text,
  smoker boolean DEFAULT false,
  doctors_note text,
  photo_url text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_map_areas_created_by ON map_areas(created_by);
CREATE INDEX IF NOT EXISTS idx_volunteers_area_id ON volunteers(area_id);
CREATE INDEX IF NOT EXISTS idx_volunteers_user_id ON volunteers(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_profiles_area_id ON patient_profiles(area_id);
CREATE INDEX IF NOT EXISTS idx_patient_profiles_user_id ON patient_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_profiles_mrn ON patient_profiles(medical_record_number);

-- Enable Row Level Security
ALTER TABLE map_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for map_areas
CREATE POLICY "Doctors can manage all areas"
  ON map_areas FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'doctor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'doctor'
    )
  );

CREATE POLICY "Everyone can view areas"
  ON map_areas FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for volunteers
CREATE POLICY "Doctors can manage volunteers"
  ON volunteers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'doctor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'doctor'
    )
  );

CREATE POLICY "Volunteers can view own profile"
  ON volunteers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for patient_profiles
CREATE POLICY "Doctors can manage patient profiles"
  ON patient_profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'doctor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'doctor'
    )
  );

CREATE POLICY "Patients can view own profile"
  ON patient_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Volunteers can view patients in their area"
  ON patient_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM volunteers
      WHERE volunteers.user_id = auth.uid()
      AND volunteers.area_id = patient_profiles.area_id
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_map_areas_updated_at
  BEFORE UPDATE ON map_areas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_volunteers_updated_at
  BEFORE UPDATE ON volunteers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_profiles_updated_at
  BEFORE UPDATE ON patient_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
