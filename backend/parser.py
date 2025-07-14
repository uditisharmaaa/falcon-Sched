from bs4 import BeautifulSoup
import os
import re

def format_day_time(text):
    match = re.match(r"([A-Za-z,]+)\s+([\d.]+ [APM]+)\s*-\s*([\d.]+ [APM]+)", text)
    if not match:
        return text

    days_str, start_time, end_time = match.groups()
    days = "/".join([d.strip() for d in days_str.split(",")])

    def fix_time(t):
        parts = t.strip().split()
        if len(parts) != 2:
            return t
        hour_min, am_pm = parts
        if "." in hour_min:
            hour, minute = hour_min.split(".")
            return f"{int(hour)}:{minute} {am_pm.upper()}"
        return hour_min + " " + am_pm.upper()

    return f"{days} {fix_time(start_time)} – {fix_time(end_time)}"

def parse_courses():
    file_path = os.path.join(os.path.dirname(__file__), "csclassfall25.html")

    if not os.path.exists(file_path):
        print("❌ File not found:", file_path)
        return []

    with open(file_path, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f.read(), "html.parser")

    print("✅ File loaded")

    text_blocks = soup.get_text(separator="\n").split("\n")

    courses = {}
    current_code = None
    current_name = ""

    for line in text_blocks:
        line = line.strip()
        if not line:
            continue

        match = re.match(r"(CS-UH \d{4})\s+(.*)", line)
        if match:
            current_code = match.group(1)
            current_name = match.group(2).strip()
            if current_code not in courses:
                courses[current_code] = {
                    "name": current_name,
                    "timings": set()
                }
            continue

        if current_code:
            if re.search(r"\b(Mon|Tue|Wed|Thu|Fri)\b", line) and re.search(r"\d{1,2}\.\d{2}", line):
                # Extract only the time portion (ignore date)
                parts = line.split()
                for i, part in enumerate(parts):
                    if re.match(r"(Mon|Tue|Wed|Thu|Fri)", part):
                        time_part = " ".join(parts[i:])
                        formatted = format_day_time(time_part)
                        courses[current_code]["timings"].add(formatted)
                        break

    output = []
    for code, data in courses.items():
        output.append({
            "code": code,
            "name": data["name"],
            "timings": sorted(data["timings"]) if data["timings"] else ["Timing not found"]
        })

    print(f"✅ Parsed {len(output)} total courses")
    return output
