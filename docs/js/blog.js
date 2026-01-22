var jsonData = [];

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
    jsonData = await res.json();

    topics = jsonData;

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

function isLocalhost() {
    const hostname = window.location.hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
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
    document.getElementById("article-github").href = `https://github.com/striker011/Projects/blob/main/source/${post.github}`;
    document.getElementById("article-github").style.display ="inline";
  }else{
    document.getElementById("article-github").style.display ="none";
  }
  // GitHub link (for step C)
  /*document.getElementById("article-github").href =
    "https://github.com/striker011/Projects/blob/main/" + post.github;
    */

  var url = "https://github.com/striker011/Projects/blob/main/source/"+post.github;

  // Load Markdown file
  var res;

  if(isLocalhost()){
  res = await fetch(post.file);
  }else{
    res = await fetch(url);
  }

  
  const text = await res.text();

  var test = marked.parse(text);
  test = transformMermaidBlocks(test);
  loadContent(test,"article-content");

  // Scroll to top of article
  let testing = document.getElementsByClassName('blog-content')[0];
  testing.scrollTo(0,0);

  

}

async function getIdFromUrl() {
  console.log("URI triggered");
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id'); // Get the 'id' query parameter from the URL

  const topics = jsonData; // Assuming jsonData is already loaded with the posts

  // Loop through each category in the topics
  for (const category in topics) {
    // Loop through each post in the category
    for (const post of topics[category]) {
      // Remove the ".md" extension from post.file to compare with the URL id
      const postId = post.file.replace('.md', '').split('/').pop(); // Extracts the last part of the file path (without .md)

      // Check if the id from the URL matches the postId
      if (id === postId) {
        // If they match, load the post
        loadPost(post, category);
        return; // Exit after finding the matching post
      }
    }
  }
}



async function initializeBlogPage() {

  //functions
  await loadSidebar();
  getIdFromUrl();
}

window.addEventListener('load', initializeBlogPage);