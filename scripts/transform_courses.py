#!/usr/bin/env python3
import json

input_file = "/Users/Shray/Developer/Rally/scripts/extract-data-2026-02-02.json"
output_file = "/Users/Shray/Developer/Rally/scripts/courses_upload.json"

with open(input_file, "r") as f:
    data = json.load(f)

courses = data.get("einsteinnyu_courses", [])

transformed = []
for course in courses:
    transformed.append({
        "name": course["course_name"],
        "code": course["course_code"],
        "section": None,
        "semester": "sp2026"
    })

with open(output_file, "w") as f:
    json.dump(transformed, f, indent=2)

print(f"Transformed {len(transformed)} courses")
print(f"Saved to: {output_file}")
