-- Migration: Change skill_level to learning_purpose
-- Run this after the initial schema

-- Update learning_preferences table
ALTER TABLE learning_preferences 
  RENAME COLUMN skill_level TO learning_purpose;

-- Update learning_paths table
ALTER TABLE learning_paths 
  RENAME COLUMN skill_level TO learning_purpose;

-- Update existing data (optional - maps old values to new)
-- Overview = beginner/intermediate mix
-- Steps = intermediate
-- Project-based = advanced
UPDATE learning_preferences 
SET learning_purpose = 'overview' 
WHERE learning_purpose IN ('beginner', 'intermediate');

UPDATE learning_preferences 
SET learning_purpose = 'steps' 
WHERE learning_purpose = 'intermediate';

UPDATE learning_preferences 
SET learning_purpose = 'project-based' 
WHERE learning_purpose = 'advanced';

UPDATE learning_paths 
SET learning_purpose = 'overview' 
WHERE learning_purpose IN ('beginner', 'intermediate');

UPDATE learning_paths 
SET learning_purpose = 'steps' 
WHERE learning_purpose = 'intermediate';

UPDATE learning_paths 
SET learning_purpose = 'project-based' 
WHERE learning_purpose = 'advanced';

-- Add constraint to ensure valid values
ALTER TABLE learning_preferences 
  ADD CONSTRAINT learning_preferences_purpose_check 
  CHECK (learning_purpose IN ('overview', 'steps', 'project-based'));

ALTER TABLE learning_paths 
  ADD CONSTRAINT learning_paths_purpose_check 
  CHECK (learning_purpose IN ('overview', 'steps', 'project-based'));

