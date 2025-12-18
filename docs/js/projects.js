console.log("projects.js loaded as module");

// --------------------------
// HARD-CODED PROJECT DATA
// --------------------------
const PROJECTS = {
  "projects": [
    {
      "id": "kafka_simulation",
      "title": "Kafka Simulation & Benchmarking",
      "description": "Simulation und Evaluierung von Kafka-Konfigurationen basierend auf meiner Bachelorarbeit.",
      "file": "projects/kafka_simulation.md",
      "github": "https://github.com/striker011/Projects/tree/main/source/website/projects/kafka_simulation",
      "tech": ["C#", "Kafka", "Distributed Systems", "Simulation"],
      "updated": "2025-01-12"
    },
    {
      "id": "financemanager",
      "title": "Finance Manager App",
      "description": ".NET MAUI App mit SQLite zum Tracken von Budget, Income, Expenses und Kategorien.",
      "file": "projects/finance_manager.md",
      "github": "https://github.com/striker011/Projects/tree/main/source/website/projects/finance_manager",
      "tech": [".NET MAUI", "C#", "SQLite", "MVVM"],
      "updated": "2024-12-20"
    },
    {
      "id": "assetcreator",
      "title": "AssetCreator Tool",
      "description": "C# Tool zur dynamischen XML-Asset-Generierung mit Reflection und UI.",
      "file": "projects/asset_creator.md",
      "github": "https://github.com/striker011/Projects/tree/main/source/website/projects/asset_creator",
      "tech": ["C#", "Reflection", "XML", "UI Toolkit"],
      "updated": "2024-11-10"
    }
  ]
};

// --------------------------
// LOAD PROJECT CARDS
// --------------------------
function loadProjectsLocal() {
  const container = document.getElementById("project-container");
  const data = PROJECTS;

  container.innerHTML = "";

  data.projects.forEach(proj => {
    const card = document.createElement("div");
    card.className = "project-card";

    card.innerHTML = `
      <h2>${proj.title}</h2>
      <p>${proj.description}</p>

      <div class="project-tech">
        ${proj.tech.map(t => `<span class="badge">${t}</span>`).join("")}
      </div>

      <div class="project-actions">
        <button type="button"  class="project-btn-small" onclick="openProject('${proj.id}')">Read More</button>
        <a href="${proj.github}" target="_blank">GitHub ↗</a>
      </div>
    `;

    container.appendChild(card);
  });
}


async function loadProjects() {
  const container = document.getElementById("project-container");
  const response = await fetch("../data/projects.json");
  const data = await response.json();

  container.innerHTML = "";

  data.projects.forEach(proj => {
    
    if(!Array.isArray(proj.tech)){
      return;
    }

    const card = document.createElement("div");
    card.className = "project-card";
    

    card.innerHTML = `
      <h2>${proj.title}</h2>
      <p>${proj.description}</p>

      <div class="project-tech">
        ${proj.tech.map(t => `<span class="badge">${t}</span>`).join("")}
      </div>

      <div class="project-actions">
        <button type="button" class="project-btn-small" onclick="openProject('${proj.id}')">Read More</button>
        <a href="${proj.github}" target="_blank">GitHub ↗</a>
      </div>
    `;

    container.appendChild(card);
  });
}

function openProject(id) {
  window.location.href = `project_post.html?id=${id}`;
}

loadProjects();

