import os
import json
from datetime import datetime

# -------------------------------
# 0️⃣ Grundpfade
# -------------------------------
base_path = os.path.dirname(os.path.abspath(__file__))  # z.B. Projects/docs/py
posts_path = os.path.abspath(os.path.join(base_path, "../posts"))
source_path = os.path.abspath(os.path.join(base_path, "../../source"))
topics_json_path = os.path.abspath(os.path.join(base_path, "../data/topics.json"))

today = datetime.today().strftime("%Y-%m-%d")

# -------------------------------
# 1️⃣ Art auswählen
# -------------------------------
post_type = input("Projekt-Post (p) oder Blog-Post (b)? ").strip().lower()
while post_type not in ["p", "b"]:
    post_type = input("Bitte 'p' für Projekt oder 'b' für Blog eingeben: ").strip().lower()

title = input("Titel des Beitrags: ").strip()

# -------------------------------
# 2️⃣ Projekt-Post
# -------------------------------
if post_type == "p":
    project_folder = input("Projekt-Ordnername: ").strip()
    file_name = input("Markdown-Dateiname (z.B. Readme.md): ").strip()

    folder_path = os.path.join(source_path, project_folder)
    os.makedirs(folder_path, exist_ok=True)

    file_path = os.path.join(folder_path, file_name)

    if not os.path.exists(file_path):
        with open(file_path, "w") as f:
            f.write(f"# {title}\n\nEinleitung hier...")

    file_value = f"../../source/{project_folder}/{file_name}"
    github_value = f"{project_folder}/{file_name}"

# -------------------------------
# 3️⃣ Blog-Post
# -------------------------------
else:
    blog_folder = input("Blog-Ordnername: ").strip()
    file_name = input("Markdown-Dateiname (z.B. test.md): ").strip()

    folder_path = os.path.join(posts_path, blog_folder)
    os.makedirs(folder_path, exist_ok=True)

    file_path = os.path.join(folder_path, file_name)

    if not os.path.exists(file_path):
        with open(file_path, "w") as f:
            f.write(f"# {title}\n\nIntro hier...")

    file_value = f"../posts/{blog_folder}/{file_name}"
    github_value = f"{blog_folder}/{file_name}"

# -------------------------------
# 4️⃣ topics.json laden
# -------------------------------
if os.path.exists(topics_json_path):
    with open(topics_json_path, "r") as f:
        topics_data = json.load(f)
else:
    topics_data = {"Projects": []}

# -------------------------------
# 5️⃣ Neuen Eintrag oben einfügen
# -------------------------------
new_entry = {
    "title": title,
    "file": file_value,
    "github": github_value,
    "updated": today,
    "intro": "Intro hier..."  # Kann der User später ergänzen
}

topics_data.setdefault("Projects", []).insert(0, new_entry)

# -------------------------------
# 6️⃣ topics.json speichern
# -------------------------------
with open(topics_json_path, "w") as f:
    json.dump(topics_data, f, indent=2)

print("\n✅ Beitrag erfolgreich erstellt!")
print(f"Datei: {file_path}")
print(f"topics.json Entry: {github_value}")