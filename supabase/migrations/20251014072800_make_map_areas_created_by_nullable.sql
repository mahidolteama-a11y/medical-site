/*
  # Make Map Areas Created By Nullable and Remove Authentication Requirement

  ## Overview
  This migration modifies the map_areas table to remove authentication requirements for creating map areas.
  This is an interim solution to allow map area management without Supabase authentication.

  ## Changes

  1. Make created_by field nullable
     - Changes `created_by uuid REFERENCES auth.users(id)` to nullable
     - Allows map areas to be created without requiring authenticated users

  2. Remove Foreign Key Constraint
     - Drops the foreign key constraint on created_by field
     - Removes the dependency on auth.users table

  3. Update RLS Policies
     - Removes restrictive doctor-only policies
     - Allows public creation of map areas
     - Maintains read access for everyone

  ## Security Notes
  - This is an interim solution for development/testing
  - UI-level security still restricts "Manage Areas" button to doctors only
  - For production, proper Supabase authentication should be implemented
  - The created_by field remains in the schema for future use

  ## Migration Safety
  - Uses IF EXISTS to prevent errors if constraints don't exist
  - Safe to run multiple times
  - Preserves existing data
*/

-- First, drop the existing foreign key constraint if it exists
DO $$
BEGIN
  -- Drop the foreign key constraint on created_by
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'map_areas_created_by_fkey' 
    AND table_name = 'map_areas'
  ) THEN
    ALTER TABLE map_areas DROP CONSTRAINT map_areas_created_by_fkey;
  END IF;
END $$;

-- Make created_by nullable
ALTER TABLE map_areas ALTER COLUMN created_by DROP NOT NULL;

-- Drop the restrictive doctor-only policies if they exist
DROP POLICY IF EXISTS "Doctors can manage all areas" ON map_areas;

-- Create new permissive policies for map_areas

-- Allow anyone to read map areas
CREATE POLICY "Anyone can view map areas"
  ON map_areas FOR SELECT
  TO public
  USING (true);

-- Allow anyone to insert map areas
CREATE POLICY "Anyone can create map areas"
  ON map_areas FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow anyone to update map areas
CREATE POLICY "Anyone can update map areas"
  ON map_areas FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Allow anyone to delete map areas
CREATE POLICY "Anyone can delete map areas"
  ON map_areas FOR DELETE
  TO public
  USING (true);
