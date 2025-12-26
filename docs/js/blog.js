function transformMermaidBlocks(text) {
    // Match ::: mermaid ... ::: blocks
    const mermaidRegex = /::: mermaid([\s\S]*?):::/g;
    
    // Match <pre><code class="language-mermaid">...</code></pre> blocks
    const preCodeRegex = /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g;

    // Replace ::: mermaid ... ::: blocks with <pre><code class="mermaid">...</code></pre>
    let transformedText = text.replace(mermaidRegex, (match, code) => {
        const cleanedCode = code.trim().replace(/&gt;/g, '>');  // Fix HTML entities
        return `<pre><code class="mermaid">${cleanedCode}</code></pre>`;
    });

    // Replace <pre><code class="language-mermaid">...</code></pre> blocks with <pre><code class="mermaid">...</code></pre>
    transformedText = transformedText.replace(preCodeRegex, (match, code) => {
        const cleanedCode = code.trim().replace(/&gt;/g, '>');  // Fix HTML entities
        return `<pre><code class="mermaid">${cleanedCode}</code></pre>`;
    });

    return transformedText;
}

function loadContent(newContent,contentID){
  const container = document.getElementById(contentID);

  // Log the action of adding new content
  console.log("Loading new content into container...");
  
  // Add new content to the container
  container.innerHTML = newContent;

  // Log that the content has been loaded into the container
  console.log("New content loaded:", newContent);

  // Now call mermaid to render the new diagrams
  console.log("Triggering Mermaid contentLoaded for new content...");
  mermaid.contentLoaded();

  /*
      // Render Markdown
  var test = marked.parse(text);
  //console.log(test);
  console.log("TRANSFORMATION______________________________________");
  //test = transformMermaidBlocks(test);
  document.getElementById("article-content").innerHTML = test;
  //console.log(test);
  
  mermaid.contentLoaded();
  */
}

// Load topics.json and build sidebar
async function loadSidebar() {
  const sidebar = document.getElementById("sidebar-menu");
  sidebar.innerHTML = "<div>Loading…</div>";

  try {
    const res = await fetch("../data/topics.json");
    const topics = await res.json();

    sidebar.innerHTML = ""; // clear loader

    // Loop categories
    for (const category in topics) {
      // category title
      const catDiv = document.createElement("div");
      catDiv.className = "blog-sidebar-category";
      catDiv.textContent = category;
      sidebar.appendChild(catDiv);

      // posts of this category
      topics[category].forEach(post => {
        const link = document.createElement("a");
        link.className = "blog-sidebar-post";
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

function loadSidebarLocal() {
  const sidebar = document.getElementById("sidebar-menu");
  sidebar.innerHTML = "";

  for (const category in TOPICS) {
    const cat = document.createElement("div");
    cat.className = "blog-sidebar-category";
    cat.textContent = category;
    sidebar.appendChild(cat);

    TOPICS[category].forEach(post => {
      const link = document.createElement("a");
      link.className = "blog-sidebar-post";
      link.textContent = post.title;
      link.onclick = () => loadPost(post, category);
      sidebar.appendChild(link);
    });
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
    document.getElementById("article-github").href = `https://github.com/striker011/Projects/blob/main/${post.github}`;
    document.getElementById("article-github").style.display ="inline";
  }else{
    document.getElementById("article-github").style.display ="none";
  }
  // GitHub link (for step C)
  /*document.getElementById("article-github").href =
    "https://github.com/striker011/Projects/blob/main/" + post.github;
    */

  // Load Markdown file
  const res = await fetch(post.file);
  const text = await res.text();

  var test = marked.parse(text);
  test = transformMermaidBlocks(test);
  loadContent(test,"article-content");

  // Scroll to top of article
  document.querySelector(".layout").scrollTo(50, 0);

  

}


loadSidebar();
//loadSidebarLocal(); //local testing variable