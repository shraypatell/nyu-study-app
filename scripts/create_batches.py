#!/usr/bin/env python3
import json

with open("/Users/Shray/Developer/Rally/scripts/courses_upload.json", "r") as f:
    courses = json.load(f)

batch_size = 500
total_courses = len(courses)

for batch_num in range(0, (total_courses + batch_size - 1) // batch_size):
    start_idx = batch_num * batch_size
    end_idx = min(start_idx + batch_size, total_courses)
    batch = courses[start_idx:end_idx]
    
    sql_file = f"/Users/Shray/Developer/Rally/scripts/import_batch_{batch_num + 1}.sql"
    
    with open(sql_file, "w") as f:
        f.write("BEGIN;\n\n")
        for course in batch:
            name = course["name"].replace("'", "''")
            code = course["code"]
            section = course["section"] if course["section"] else "NULL"
            semester = course["semester"]
            if section == "NULL":
                f.write(f"INSERT INTO classes (name, code, section, semester) VALUES ('{name}', '{code}', NULL, '{semester}') ON CONFLICT DO NOTHING;\n")
            else:
                f.write(f"INSERT INTO classes (name, code, section, semester) VALUES ('{name}', '{code}', '{section}', '{semester}') ON CONFLICT DO NOTHING;\n")
        f.write("\nCOMMIT;\n")
    
    print(f"Created: import_batch_{batch_num + 1}.sql ({len(batch)} courses)")

print(f"\nTotal: {total_courses} courses in {(total_courses + batch_size - 1) // batch_size} batches")
print("\nRun each batch in Supabase SQL Editor, one at a time.")
