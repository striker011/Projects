// Toggle dropdown lists on click
document.querySelectorAll(".toggle").forEach(button => {
    button.addEventListener("click", () => {
      const list = button.nextElementSibling;
      const isOpen = list.style.display === "block";
      list.style.display = isOpen ? "none" : "block";
      button.textContent = button.textContent.replace(isOpen ? '▴' : '▾', isOpen ? '▾' : '▴');
    });
  
    // Start closed
    button.nextElementSibling.style.display = "none";
  });

async function loadMarkdown(file) {
  const response = await fetch(file);
  const text = await response.text();
  const html = marked.parse(text);
  document.querySelector(".blog-main").innerHTML = html;
}

async function buildSidebar() {
  const response = await fetch("topics.json");
  const topics = await response.json();

  const sidebar = document.querySelector(".sidebar");

  for (const [catName, posts] of Object.entries(topics)) {
    const catDiv = document.createElement("div");
    catDiv.classList.add("category");

    const btn = document.createElement("button");
    btn.classList.add("toggle");
    btn.textContent = `${catName} ▾`;

    const ul = document.createElement("ul");
    ul.classList.add("sub-list");
    ul.style.display = "none";

    btn.addEventListener("click", () => {
      const isOpen = ul.style.display === "block";
      ul.style.display = isOpen ? "none" : "block";
      btn.textContent = btn.textContent.replace(isOpen ? '▴' : '▾', isOpen ? '▾' : '▴');
    });

    posts.forEach(p => {
      const li = document.createElement("li");
      li.innerHTML = `<a class="post-link" data-file="${p.file}">${p.title}</a>`;
      ul.appendChild(li);
    });

    catDiv.appendChild(btn);
    catDiv.appendChild(ul);
    sidebar.appendChild(catDiv);
  }

  // click handler für dynamic posts
  setTimeout(() => {
    document.querySelectorAll(".post-link").forEach(link => {
      link.addEventListener("click", () => {
        loadMarkdown(`posts/${link.getAttribute("data-file")}`);
      });
    });
  }, 100);
}