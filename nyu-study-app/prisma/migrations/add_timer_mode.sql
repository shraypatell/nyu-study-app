-- Add timer mode support for CLASSIC/FOCUS modes

-- Step 1: Add mode column to study_sessions table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'study_sessions' AND column_name = 'mode'
  ) THEN
    ALTER TABLE study_sessions ADD COLUMN mode VARCHAR(10) DEFAULT 'CLASSIC';
  END IF;
END $$;

-- Step 2: Create index for userId + mode + isActive (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_mode_active'
  ) THEN
    CREATE INDEX idx_user_mode_active ON study_sessions(user_id, mode, is_active);
  END IF;
END $$;

-- Step 3: Verify the migration
SELECT
  id,
  user_id,
  mode,
  is_active,
  started_at
FROM study_sessions
WHERE is_active = true
LIMIT 5;
