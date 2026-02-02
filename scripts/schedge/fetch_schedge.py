import json
import requests

TERM = "sp2023"
SEMESTER_LABEL = "Spring 2023"
BASE = "https://nyu.a1liu.com/api"

def to_class_records(course, section):
    subject = course.get("subjectCode")
    dept_course_id = course.get("deptCourseId")
    code = f"{subject} {dept_course_id}".strip()

    section_code = section.get("code") or None
    name = course.get("name")

    return {
        "name": name,
        "code": code,
        "section": section_code,
        "semester": SEMESTER_LABEL,
    }

def main():
    schools_response = requests.get(f"{BASE}/schools/{TERM}").json()
    schools = schools_response.get("schools", [])
    
    subjects = []
    for school in schools:
        for subject in school.get("subjects", []):
            subjects.append(subject["code"])

    all_classes = []
    seen = set()

    for subject in subjects:
        print("Fetching", subject)
        try:
            courses = requests.get(f"{BASE}/courses/{TERM}/{subject}").json()

            for course in courses:
                for section in course.get("sections", []):
                    cls = to_class_records(course, section)
                    key = (cls["code"], cls["section"] or "", cls["semester"])
                    if key in seen:
                        continue
                    seen.add(key)
                    all_classes.append(cls)
        except Exception as e:
            print(f"Error fetching {subject}: {e}")

    with open("classes_upload.json", "w") as f:
        json.dump(all_classes, f, indent=2)

    values = []
    for cls in all_classes:
        name = cls["name"].replace("'", "''")
        code = cls["code"].replace("'", "''")
        section = cls["section"]
        semester = cls["semester"].replace("'", "''")

        section_sql = "NULL" if section is None else "'" + section.replace("'", "''") + "'"

        values.append(
            "(gen_random_uuid(), '" + name + "', '" + code + "', " + section_sql + ", '" + semester + "', true, NOW())"
        )

    sql = "INSERT INTO classes (id, name, code, section, semester, is_active, created_at) VALUES\n"
    sql += ",\n".join(values)
    sql += "\nON CONFLICT (code, section, semester) DO NOTHING;\n"

    with open("import_classes.sql", "w") as f:
        f.write(sql)

    print(f"Saved {len(all_classes)} classes to:")
    print("- classes_upload.json")
    print("- import_classes.sql")

if __name__ == "__main__":
    main()
