

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



loadProjects();

console.log("project_loader loaded successfully");