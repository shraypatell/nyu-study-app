#!/usr/bin/env python3
import json

with open("/Users/Shray/Developer/Rally/scripts/courses_upload.json", "r") as f:
    courses = json.load(f)

sql_file = "/Users/Shray/Developer/Rally/scripts/import_courses_sp2026.sql"

with open(sql_file, "w") as f:
    f.write("BEGIN;\n\n")
    for course in courses:
        name = course["name"].replace("'", "''")
        code = course["code"]
        section = course["section"] if course["section"] else "NULL"
        semester = course["semester"]
        if section == "NULL":
            f.write(f"INSERT INTO classes (name, code, section, semester) VALUES ('{name}', '{code}', NULL, '{semester}') ON CONFLICT DO NOTHING;\n")
        else:
            f.write(f"INSERT INTO classes (name, code, section, semester) VALUES ('{name}', '{code}', '{section}', '{semester}') ON CONFLICT DO NOTHING;\n")
    f.write("\nCOMMIT;\n")

print(f"Created SQL file: {sql_file}")
print(f"Total statements: {len(courses)}")
