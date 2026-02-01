-- Hierarchical Locations Migration for NYU Study App
-- Run this in Supabase SQL Editor (ONLY the migration part, schema already exists)

-- Step 1: Add parent_id column to locations table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'locations' AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE locations ADD COLUMN parent_id UUID REFERENCES locations(id);
  END IF;
END $$;

-- Step 2: Create index for parent_id (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_locations_parent_id'
  ) THEN
    CREATE INDEX idx_locations_parent_id ON locations(parent_id);
  END IF;
END $$;

-- Step 3: Insert new main locations (skip if already exist)
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
  
  IF stern_id IS NOT NULL THEN
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
  END IF;
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
-- Migrate them to Home, then delete old locations
DO $$
DECLARE
  home_id UUID;
  other_id UUID;
  off_campus_id UUID;
BEGIN
  SELECT id INTO home_id FROM locations WHERE name = 'Home';
  SELECT id INTO other_id FROM locations WHERE name = 'Other';
  SELECT id INTO off_campus_id FROM locations WHERE name = 'Off Campus';
  
  -- Update users who have Other or Off Campus to Home
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
