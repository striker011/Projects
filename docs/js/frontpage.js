const pathToJSONPrefix = "../data/"

function extractFileName(filePath) {

    const fileNameWithExtension = filePath.split('/').pop();  

    const fileName = fileNameWithExtension.replace('.md', '');

    return fileName;
}

function openProject(id){
  window.location.href=`blog.html?id=${id}`;
}
function openBlog(title){
  window.location.href=`blog.html?id=${title}`;
}



async function loadJSON(jsonPath){
    const res = await fetch(pathToJSONPrefix+jsonPath);
    const jsonData = await res.json();
    return jsonData;
}

async function buildApps(){

}

async function loadTechStack(){
    let techList = await loadJSON("techStack.json");
    let techGrid = document.getElementById("techGrid");
    for(const tech in techList){
        
        techList[tech].forEach(technologie =>{
            const span = document.createElement("span");
            span.className="badge";
            span.textContent=technologie.tech;
            techGrid.appendChild(span);
        });

    }
}

async function loadLatestThreeProjects(){
    let projectList = await loadJSON("projects.json");

    let projectGrid = document.getElementById("projectGrid");
    let counter = 0;

    projectList.projects.forEach(proj => {
    
    if(!Array.isArray(proj.tech)){
      return;
    }

    if(counter>=3){
        return;
    }
    counter++;
    const card = document.createElement("div");
    card.className = "project-card";
    

    card.innerHTML = `
      <h3>${proj.title}</h3>
      <p>${proj.description}</p>


      <div class="project-actions">
        <button type="button" class="btn-small" onclick="openProject('${proj.id}')">Read More</button>
        <a href="${proj.github}" target="_blank" class="btn-small" >GitHub ↗</a>
      </div>
    `;

    projectGrid.appendChild(card);
  });
}

async function loadLatestThreeBlogPosts(){
 let blogList = await loadJSON("topics.json");

    let blogGrid = document.getElementById("blogGrid");
    let counter = 0;

    for(const topic in blogList){

        const article = blogList[topic];

        
        article.forEach(text => { 

            if(counter>=3){
                return;
            }
            counter++;
            const card = document.createElement("div");
            card.className = "blog-card";
            
            let title = extractFileName(text.file);

            card.innerHTML = `
            <h3>${text.title}</h3>
            <p>${text.intro}</p>


            <div class="project-actions">
                <button type="button" class="btn-small" onclick="openBlog('${title}')">Read More</button>
            </div>
            `;

            blogGrid.appendChild(card);
        });
        
    }
}

async function functionListOnStartUp(){
    console.log("starting functions now");
    loadTechStack();
    loadLatestThreeProjects();
    loadLatestThreeBlogPosts();
}

window.addEventListener("load",functionListOnStartUp);