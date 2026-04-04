import os
import json
from datetime import datetime

# -------------------------------
# 1️⃣ Eingaben vom User
# -------------------------------
project_id = input("ID des Projekts: ").strip()
title = input("Titel: ").strip()
description = input("Beschreibung: ").strip()
folder_name = input("Ordnername: ").strip()

# -------------------------------
# 2️⃣ Heutiges Datum
# -------------------------------
today = datetime.today().strftime("%Y-%m-%d")

# -------------------------------
# 3️⃣ Pfade definieren
# -------------------------------
base_path = os.path.dirname(os.path.abspath(__file__))   # z.B. Projects/docs/py
source_path = os.path.abspath(os.path.join(base_path, "../../source", folder_name))
projects_json_path = os.path.abspath(os.path.join(base_path, "../data/projects.json"))
techstack_json_path = os.path.abspath(os.path.join(base_path, "../data/techStack.json"))
readme_path = os.path.join(source_path, "Readme.md")

# -------------------------------
# 4️⃣ TechStack laden und anzeigen
# -------------------------------
if os.path.exists(techstack_json_path):
    with open(techstack_json_path, "r") as f:
        techstack_data = json.load(f)
else:
    techstack_data = {"techList": []}

existing_techs = [entry["tech"] for entry in techstack_data.get("techList", [])]
print("\nVorhandene Techs:")
print(", ".join(existing_techs) if existing_techs else "(keine vorhanden)")

# Eingabe vom User
user_techs = input("\nTechs für das Projekt (kommagetrennt): ").strip()
user_techs_list = [t.strip() for t in user_techs.split(",") if t.strip()]

# -------------------------------
# 5️⃣ TechStack aktualisieren
# -------------------------------
for tech in user_techs_list:
    existing_entry = next((e for e in techstack_data.get("techList", []) if e["tech"] == tech), None)
    if existing_entry:
        existing_entry["date"] = today  # update date
    else:
        # Neu: an erster Stelle einfügen
        techstack_data.setdefault("techList", []).insert(0, {"tech": tech, "date": today})

with open(techstack_json_path, "w") as f:
    json.dump(techstack_data, f, indent=2)
print("\ntechStack.json aktualisiert.")

# -------------------------------
# 6️⃣ Ordner + Readme erstellen
# -------------------------------
os.makedirs(source_path, exist_ok=True)

with open(readme_path, "w") as f:
    f.write(f"# {title}\n\n{description}")

print(f"Ordner + Readme erstellt: {source_path}")

# -------------------------------
# 7️⃣ projects.json aktualisieren
# -------------------------------
if os.path.exists(projects_json_path):
    with open(projects_json_path, "r") as f:
        projects_data = json.load(f)
else:
    projects_data = {"projects": []}

# Prüfen auf doppelte ID
if any(p["id"] == project_id for p in projects_data.get("projects", [])):
    print(f"Fehler: Projekt mit ID '{project_id}' existiert bereits!")
else:
    new_entry = {
        "id": project_id,
        "title": title,
        "description": description,
        "github": f"https://github.com/striker011/Projects/tree/main/source/{folder_name}",
        "tech": user_techs_list,
        "updated": today
    }
    projects_data.setdefault("projects", []).insert(0, new_entry)
    with open(projects_json_path, "w") as f:
        json.dump(projects_data, f, indent=2)
    print(f"projects.json aktualisiert. Projekt '{title}' hinzugefügt.")


print("\n✅ Projekt erfolgreich erstellt!")