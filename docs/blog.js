// Load topics.json and build sidebar
async function loadSidebar() {
  const sidebar = document.getElementById("sidebar-menu");
  sidebar.innerHTML = "<div>Loading…</div>";

  try {
    const res = await fetch("topics.json");
    const topics = await res.json();

    sidebar.innerHTML = ""; // clear loader

    // Loop categories
    for (const category in topics) {
      // category title
      const catDiv = document.createElement("div");
      catDiv.className = "sidebar-category";
      catDiv.textContent = category;
      sidebar.appendChild(catDiv);

      // posts of this category
      topics[category].forEach(post => {
        const link = document.createElement("a");
        link.className = "sidebar-post";
        link.textContent = post.title;

        // load post when clicked
        link.onclick = () => loadPost(post, category);

        sidebar.appendChild(link);
      });
    }
  } catch (err) {
    sidebar.innerHTML = "<div>Error loading topics</div>";
  }
}

async function loadPost(post, category) {
  // Show header section
  document.getElementById("article-header").classList.remove("hidden");

  // Title
  document.getElementById("article-title").textContent = post.title;

  // Category
  document.getElementById("article-category").textContent = category;

  // Updated
  document.getElementById("article-updated").textContent = post.updated || "Unknown";

  if(post.github){
    document.getElementById("article-github").href = "https://github.com/striker011/Projects/blob/main/"+post.github;
    document.getElementById("article-github").style.display ="inline";
  }else{
    document.getElementById("article-github").style.display ="none";
  }
  // GitHub link (for step C)
  document.getElementById("article-github").href =
    "https://github.com/striker011/Projects/blob/main/" + post.github;

  // Load Markdown file
  const res = await fetch(post.file);
  const text = await res.text();

  // Render Markdown
  document.getElementById("article-content").innerHTML = marked.parse(text);

  // Run Mermaid
  if (text.includes("```mermaid")) {
    mermaid.run();
  }

  // Scroll to top of article
  document.querySelector(".content").scrollTo(0, 0);
}


loadSidebar();