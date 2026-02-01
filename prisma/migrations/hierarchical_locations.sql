-- Hierarchical Locations Migration for NYU Study App
-- Run this in Supabase SQL Editor

-- Step 1: Add parent_id column to locations table
ALTER TABLE locations ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES locations(id);

-- Step 2: Create index for parent_id for better query performance
CREATE INDEX IF NOT EXISTS idx_locations_parent_id ON locations(parent_id);

-- Step 3: Insert new main locations
-- Stern School of Business
INSERT INTO locations (id, name, slug, description, is_active, sort_order, created_at)
VALUES (
  gen_random_uuid(),
  'Stern School of Business',
  'stern-school-of-business',
  'NYU Stern School of Business',
  true,
  5,
  NOW()
)
ON CONFLICT (name) DO NOTHING;

-- Home
INSERT INTO locations (id, name, slug, description, is_active, sort_order, created_at)
VALUES (
  gen_random_uuid(),
  'Home',
  'home',
  'Studying from home',
  true,
  100,
  NOW()
)
ON CONFLICT (name) DO NOTHING;

-- Step 4: Insert sub-locations for Stern School of Business
DO $$
DECLARE
  stern_id UUID;
BEGIN
  SELECT id INTO stern_id FROM locations WHERE name = 'Stern School of Business';
  
  -- Tisch Hall (sub-location of Stern)
  INSERT INTO locations (id, name, slug, description, parent_id, is_active, sort_order, created_at)
  VALUES (
    gen_random_uuid(),
    'Tisch Hall',
    'tisch-hall',
    'Tisch Hall at Stern',
    stern_id,
    true,
    6,
    NOW()
  )
  ON CONFLICT (name) DO NOTHING;
  
  -- Kaufman Management Center (sub-location of Stern)
  INSERT INTO locations (id, name, slug, description, parent_id, is_active, sort_order, created_at)
  VALUES (
    gen_random_uuid(),
    'Kaufman Management Center',
    'kaufman-management-center',
    'Kaufman Management Center at Stern',
    stern_id,
    true,
    7,
    NOW()
  )
  ON CONFLICT (name) DO NOTHING;
END $$;

-- Step 5: Insert sub-locations for Bobst Library (Floors 1-10)
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

-- Step 6: Handle users who have "Other" or "Off Campus" locations
-- First, get the Home location id to use as fallback
DO $$
DECLARE
  home_id UUID;
  other_id UUID;
  off_campus_id UUID;
BEGIN
  SELECT id INTO home_id FROM locations WHERE name = 'Home';
  SELECT id INTO other_id FROM locations WHERE name = 'Other';
  SELECT id INTO off_campus_id FROM locations WHERE name = 'Off Campus';
  
  -- Update users who have Other or Off Campus to Home (or NULL if you prefer)
  IF home_id IS NOT NULL THEN
    UPDATE user_locations 
    SET location_id = home_id 
    WHERE location_id = other_id OR location_id = off_campus_id;
  END IF;
  
  -- Delete the Other and Off Campus locations
  DELETE FROM locations WHERE name IN ('Other', 'Off Campus');
END $$;

-- Step 7: Verify the migration
SELECT 
  l.id,
  l.name,
  l.slug,
  l.parent_id,
  p.name as parent_name,
  l.sort_order
FROM locations l
LEFT JOIN locations p ON l.parent_id = p.id
WHERE l.is_active = true
ORDER BY 
  COALESCE(p.sort_order, l.sort_order),
  l.parent_id NULLS FIRST,
  l.sort_order;
