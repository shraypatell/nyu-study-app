# Work Plan: NYU Class Data Scraping with Selenium

## Project Context
**Goal**: Scrape class data from NYU's class registration website (Albert) and import it into the existing NYU Study App database.

**Current Database Schema** (from `prisma/schema.prisma`):
```prisma
model Class {
  id        String   @id @default(uuid())
  name      String   // Course title (e.g., "Intro to Computer Science")
  code      String   // Course code (e.g., "CSCI-UA 101")
  section   String?  // Section number (e.g., "001")
  semester  String   // Semester (e.g., "Spring 2025")
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
}
```

**Unique constraint**: `[code, section, semester]` - no duplicate classes

## Work Required

### 1. Create Python Selenium Scraper
**Location**: `scripts/scraping/scraper.py`

**Requirements**:
- Navigate to NYU Albert class search
- Handle manual login (user must log in manually - security)
- Scrape class data for each course:
  - `name`: Course title
  - `code`: Course code (school-prefix + number)
  - `section`: Section identifier
  - `semester`: Current semester
  - `instructor`: Professor name (optional, for display)
  - `schedule`: Meeting times (optional, for display)
- Save raw data to JSON format
- Handle pagination/infinite scroll
- Add delays to avoid rate limiting

**Dependencies to install**:
```bash
pip install selenium webdriver-manager beautifulsoup4 pandas
```

### 2. Create Data Converter
**Location**: `scripts/scraping/convert_to_sql.py`

**Requirements**:
- Read `raw_classes.json`
- Transform to match Class model schema
- Generate SQL INSERT statements
- Handle duplicates (skip if code+section+semester already exists)
- Generate preview CSV for review
- Output: `import_classes.sql`

### 3. Create SQL Import File
**Location**: `scripts/scraping/import_classes.sql`

**Format**:
```sql
INSERT INTO classes (id, name, code, section, semester, is_active, created_at) 
VALUES 
  (gen_random_uuid(), 'Introduction to Computer Science', 'CSCI-UA 101', '001', 'Spring 2025', true, NOW()),
  (gen_random_uuid(), 'Data Structures', 'CSCI-UA 102', '001', 'Spring 2025', true, NOW()),
  -- ... more classes
ON CONFLICT (code, section, semester) DO NOTHING;
```

### 4. Create Documentation
**Location**: `scripts/scraping/README.md`

**Contents**:
- Step-by-step instructions
- Prerequisites (Python, Chrome, packages)
- How to run the scraper
- Manual login process
- How to convert and import data
- Troubleshooting common issues

## Data Flow

```
NYU Albert Website
       ↓ (Selenium scraper - manual login required)
raw_classes.json
       ↓ (Python converter script)
import_classes.sql
       ↓ (Copy to Supabase SQL Editor)
PostgreSQL Database
       ↓ (App queries)
Users can browse/join classes
```

## Implementation Notes

**Selenium Approach**:
- NYU Albert requires NetID login which can't be automated easily
- Scraper opens Chrome, navigates to login page
- User manually logs in (NetID + password + 2FA if required)
- User navigates to class search page
- User presses Enter in terminal to start scraping
- Scraper extracts data from the DOM
- Saves to JSON file

**Anti-Scraping Considerations**:
- Add random delays between requests (1-3 seconds)
- Use realistic User-Agent
- Handle CAPTCHAs gracefully (pause, alert user)
- Respect rate limits (don't hammer the server)

**Data Quality**:
- Validate course codes match expected format (XXX-YY ZZZ)
- Clean up whitespace and special characters
- Normalize semester names ("Spring 2025", "Fall 2024")
- Handle sections that are NULL vs empty string

## Files to Create

```
scripts/
└── scraping/
    ├── README.md              # Instructions for user
    ├── requirements.txt       # Python dependencies
    ├── scraper.py            # Main Selenium scraper
    ├── convert_to_sql.py     # Convert JSON to SQL
    └── example_output/       # Sample output files
        ├── raw_classes.json
        └── import_classes.sql
```

## Testing Strategy

1. Test scraper on small subset first (one department)
2. Verify JSON output structure matches expected format
3. Run converter and verify SQL syntax
4. Test SQL import on local/staging database
5. Review preview CSV before production import

## Success Criteria

- [ ] Scraper successfully extracts class data from NYU Albert
- [ ] Data is formatted correctly for the Class model
- [ ] SQL import adds classes to database without errors
- [ ] Users can see scraped classes in the app
- [ ] Duplicate classes are handled gracefully (ON CONFLICT DO NOTHING)
- [ ] Documentation is clear enough for non-technical user to follow

## Next Steps

1. Run `/start-work` to begin implementation
2. Sisyphus will create all scripts and documentation
3. User will run the scraper and provide the data
4. Import data to production database
