-- Add lastHeartbeatAt column to study_sessions table
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS last_heartbeat_at TIMESTAMP;

-- Create index for efficient stale session queries
CREATE INDEX IF NOT EXISTS idx_study_sessions_active_heartbeat 
ON study_sessions (is_active, last_heartbeat_at) 
WHERE is_active = true;
