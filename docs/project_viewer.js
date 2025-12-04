// --------------------------
// SAME HARD-CODED DATA AS IN projects.js
// (du kannst es später in eine gemeinsame Datei auslagern)
// --------------------------
const PROJECTS = {
  "projects": [
    {
      "id": "kafka_simulation",
      "title": "Kafka Simulation & Benchmarking",
      "description": "Simulation und Evaluierung von Kafka-Konfigurationen basierend auf der Bachelorarbeit.",
      "file": "projects/kafka_simulation.md",
      "github": "https://github.com/striker011/Projects/tree/main/source/website/projects/kafka_simulation",
      "tech": ["C#", "Kafka", "Distributed Systems", "Simulation"],
      "updated": "2025-01-12"
    },
    {
      "id": "financemanager",
      "title": "Finance Manager App",
      "description": "Mobile MAUI App zum Finanzmanagement.",
      "file": "projects/finance_manager.md",
      "github": "https://github.com/striker011/Projects/tree/main/source/website/projects/financemanager",
      "tech": [".NET MAUI", "C#", "SQLite", "MVVM"],
      "updated": "2024-12-20"
    },
    {
      "id": "assetcreator",
      "title": "AssetCreator Tool",
      "description": "C# XML Asset Creator mit Reflection.",
      "file": "projects/asset_creator.md",
      "github": "https://github.com/striker011/Projects/tree/main/source/website/projects/assetcreator",
      "tech": ["C#", "Reflection", "XML", "UI Toolkit"],
      "updated": "2024-11-10"
    }
  ]
};

// --------------------------
// LOAD INDIVIDUAL PROJECT PAGE
// --------------------------
async function loadProjectLocal() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  const proj = PROJECTS.projects.find(p => p.id === id);

  if (!proj) {
    document.getElementById("project-content").innerHTML = "Project not found.";
    return;
  }

  // SET HEADER
  document.getElementById("project-title").textContent = proj.title;
  document.getElementById("project-updated").textContent = proj.updated;
  document.getElementById("project-github").href = proj.github;

  // LOAD MARKDOWN (lokal erlaubt)
  const md = await fetch(proj.file).then(r => r.text());
  document.getElementById("project-content").innerHTML = marked.parse(md);
}



async function loadProject() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  const response = await fetch("projects.json");
  const data = await response.json();

  const proj = data.projects.find(p => p.id === id);

  if (!proj) {
    document.getElementById("project-content").innerHTML = "Project not found.";
    return;
  }

  document.getElementById("project-title").textContent = proj.title;
  document.getElementById("project-updated").textContent = proj.updated;
  document.getElementById("project-github").href = proj.github;

  const md = await fetch(proj.file).then(r => r.text());
  document.getElementById("project-content").innerHTML = marked.parse(md);
}

loadProject();
//loadProjectLocal();