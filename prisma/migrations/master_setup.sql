-- NYU Study App - Master SQL Setup File
-- Run this entire file in Supabase SQL Editor
-- This creates the complete schema and seed data

-- ============================================
-- PART 1: Enable UUID Extension
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PART 2: Create Enums (if not exist)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ChatRoomType') THEN
    CREATE TYPE "ChatRoomType" AS ENUM ('CLASS', 'DM');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FriendshipStatus') THEN
    CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED');
  END IF;
END $$;

-- ============================================
-- PART 3: Create Tables
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "email" TEXT UNIQUE NOT NULL,
    "username" TEXT UNIQUE NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "display_name" TEXT,
    "bio" TEXT,
    "avatar_url" TEXT,
    "is_timer_public" BOOLEAN DEFAULT true,
    "is_classes_public" BOOLEAN DEFAULT true,
    "is_location_public" BOOLEAN DEFAULT true
);

-- Study Sessions table
CREATE TABLE IF NOT EXISTS "study_sessions" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "started_at" TIMESTAMP NOT NULL,
    "ended_at" TIMESTAMP,
    "duration_seconds" INTEGER DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "created_date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "study_sessions_user_id_created_date_idx" ON "study_sessions"("user_id", "created_date");
CREATE INDEX IF NOT EXISTS "study_sessions_is_active_idx" ON "study_sessions"("is_active");

-- Daily Stats table
CREATE TABLE IF NOT EXISTS "daily_stats" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "date" DATE NOT NULL,
    "total_seconds" INTEGER DEFAULT 0,
    "is_public" BOOLEAN DEFAULT true,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("user_id", "date")
);

CREATE INDEX IF NOT EXISTS "daily_stats_date_total_seconds_idx" ON "daily_stats"("date", "total_seconds" DESC);

-- Locations table (with parent_id for hierarchical support)
CREATE TABLE IF NOT EXISTS "locations" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT UNIQUE NOT NULL,
    "slug" TEXT UNIQUE NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "sort_order" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add parent_id column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'locations' AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE locations ADD COLUMN parent_id UUID REFERENCES locations(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_locations_parent_id" ON locations(parent_id);

-- User Locations table
CREATE TABLE IF NOT EXISTS "user_locations" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "location_id" UUID NOT NULL REFERENCES "locations"("id") ON DELETE CASCADE,
    "is_public" BOOLEAN DEFAULT true,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("user_id")
);

CREATE INDEX IF NOT EXISTS "user_locations_location_id_updated_at_idx" ON "user_locations"("location_id", "updated_at");

-- Classes table
CREATE TABLE IF NOT EXISTS "classes" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "section" TEXT,
    "semester" TEXT NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("code", "section", "semester")
);

-- User Classes table
CREATE TABLE IF NOT EXISTS "user_classes" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "class_id" UUID NOT NULL REFERENCES "classes"("id") ON DELETE CASCADE,
    "is_public" BOOLEAN DEFAULT true,
    "joined_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("user_id", "class_id")
);

CREATE INDEX IF NOT EXISTS "user_classes_class_id_idx" ON "user_classes"("class_id");

-- Chat Rooms table
CREATE TABLE IF NOT EXISTS "chat_rooms" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "type" "ChatRoomType" NOT NULL,
    "class_id" UUID UNIQUE REFERENCES "classes"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat Room Users table
CREATE TABLE IF NOT EXISTS "chat_room_users" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "room_id" UUID NOT NULL REFERENCES "chat_rooms"("id") ON DELETE CASCADE,
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "joined_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "last_read_at" TIMESTAMP,
    UNIQUE("room_id", "user_id")
);

CREATE INDEX IF NOT EXISTS "chat_room_users_user_id_idx" ON "chat_room_users"("user_id");

-- Messages table
CREATE TABLE IF NOT EXISTS "messages" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "room_id" UUID NOT NULL REFERENCES "chat_rooms"("id") ON DELETE CASCADE,
    "sender_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "messages_room_id_created_at_idx" ON "messages"("room_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "messages_sender_id_idx" ON "messages"("sender_id");

-- Friendships table
CREATE TABLE IF NOT EXISTS "friendships" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "requester_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "addressee_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "status" "FriendshipStatus" DEFAULT 'PENDING',
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("requester_id", "addressee_id")
);

CREATE INDEX IF NOT EXISTS "friendships_addressee_id_status_idx" ON "friendships"("addressee_id", "status");
CREATE INDEX IF NOT EXISTS "friendships_requester_id_status_idx" ON "friendships"("requester_id", "status");

-- ============================================
-- PART 4: Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "study_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "daily_stats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "locations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_locations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "classes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_classes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "chat_rooms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "chat_room_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "friendships" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 5: Create Triggers
-- ============================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON "users";
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_stats_updated_at ON "daily_stats";
CREATE TRIGGER update_daily_stats_updated_at BEFORE UPDATE ON "daily_stats" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_locations_updated_at ON "user_locations";
CREATE TRIGGER update_user_locations_updated_at BEFORE UPDATE ON "user_locations" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_friendships_updated_at ON "friendships";
CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON "friendships" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PART 6: Insert Default Locations (with hierarchy support)
-- ============================================

-- Main locations
INSERT INTO "locations" ("id", "name", "slug", "description", "sort_order") VALUES
(gen_random_uuid(), 'Bobst Library', 'bobst-library', 'Main NYU library at Washington Square', 1),
(gen_random_uuid(), 'Kimmel Center', 'kimmel-center', 'Student center with study spaces', 2),
(gen_random_uuid(), 'Silver Center', 'silver-center', 'Academic building with study areas', 3),
(gen_random_uuid(), 'Tandon School of Engineering', 'tandon', 'Brooklyn campus study spaces', 4),
(gen_random_uuid(), 'Dorm Room', 'dorm-room', 'Study from your residence hall', 5),
(gen_random_uuid(), 'Stern School of Business', 'stern-school-of-business', 'NYU Stern School of Business', 6),
(gen_random_uuid(), 'Home', 'home', 'Studying from home', 100)
ON CONFLICT (name) DO NOTHING;

-- Stern sub-locations
DO $$
DECLARE
  stern_id UUID;
BEGIN
  SELECT id INTO stern_id FROM locations WHERE name = 'Stern School of Business';
  
  IF stern_id IS NOT NULL THEN
    INSERT INTO locations (id, name, slug, description, parent_id, is_active, sort_order, created_at)
    VALUES
      (gen_random_uuid(), 'Tisch Hall', 'tisch-hall', 'Tisch Hall at Stern', stern_id, true, 7, NOW()),
      (gen_random_uuid(), 'Kaufman Management Center', 'kaufman-management-center', 'Kaufman Management Center at Stern', stern_id, true, 8, NOW())
    ON CONFLICT (name) DO NOTHING;
  END IF;
END $$;

-- Bobst Library floors (sub-locations)
DO $$
DECLARE
  bobst_id UUID;
  floor_num INT;
BEGIN
  SELECT id INTO bobst_id FROM locations WHERE name = 'Bobst Library';
  
  IF bobst_id IS NOT NULL THEN
    FOR floor_num IN 1..10 LOOP
      INSERT INTO locations (id, name, slug, description, parent_id, is_active, sort_order, created_at)
      VALUES (
        gen_random_uuid(),
        'Floor ' || floor_num::text,
        'bobst-floor-' || floor_num::text,
        'Floor ' || floor_num::text || ' of Bobst Library',
        bobst_id,
        true,
        1 + floor_num,
        NOW()
      )
      ON CONFLICT (name) DO NOTHING;
    END LOOP;
  END IF;
END $$;

-- ============================================
-- PART 7: Create Utility Functions
-- ============================================

-- Function for midnight reset (cron job)
CREATE OR REPLACE FUNCTION reset_active_sessions()
RETURNS void AS $$
BEGIN
    UPDATE "study_sessions"
    SET "is_active" = false,
        "ended_at" = CURRENT_TIMESTAMP,
        "duration_seconds" = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - "started_at"))::INTEGER
    WHERE "is_active" = true
    AND "created_date" < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 8: Migration Cleanup (run if upgrading)
-- ============================================

-- Migrate users from old "Other" and "Off Campus" to "Home"
DO $$
DECLARE
  home_id UUID;
  other_id UUID;
  off_campus_id UUID;
BEGIN
  SELECT id INTO home_id FROM locations WHERE name = 'Home';
  SELECT id INTO other_id FROM locations WHERE name = 'Other';
  SELECT id INTO off_campus_id FROM locations WHERE name = 'Off Campus';
  
  IF home_id IS NOT NULL THEN
    UPDATE user_locations 
    SET location_id = home_id 
    WHERE location_id = other_id OR location_id = off_campus_id;
  END IF;
  
  DELETE FROM locations WHERE name IN ('Other', 'Off Campus');
END $$;

-- ============================================
-- VERIFICATION: View all locations with hierarchy
-- ============================================
SELECT 
  l.id,
  l.name,
  l.slug,
  l.parent_id,
  p.name as parent_name,
  l.sort_order,
  CASE WHEN l.parent_id IS NULL THEN 'Main Location' ELSE 'Sub-location' END as type
FROM locations l
LEFT JOIN locations p ON l.parent_id = p.id
WHERE l.is_active = true
ORDER BY 
  COALESCE(p.sort_order, l.sort_order),
  l.parent_id NULLS FIRST,
  l.sort_order;
