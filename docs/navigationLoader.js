const navPlaceholder = document.getElementById("nav-placeholder");

// Load nav.html first
fetch("navigation.html")
  .then(res => res.text())
  .then(html => {
    navPlaceholder.innerHTML = html;
    //does jack shit, error reading null when appending child for  navList.appendChild(li); happens anyway
     setTimeout(() => {
      const navList = navPlaceholder.querySelector(".nav-list");
      if (navList) {
        initNavigation(navList);
      } else {
        console.error("Nav list not found");
      }
    }, 0);
  })
  .catch(err => console.error("Nav HTML load error:", err));

function initNavigation() {
  const navList = document.querySelector(".nav-list");

  fetch("navigationLinks.json")
    .then(res => res.json())
    .then(links => {
      buildNavigation(navList, links);
    })
    .catch(err => console.error("Navigation JSON load error:", err));
}

function buildNavigation(navList, links) {
  links.forEach(link => {
    const li = document.createElement("li");
    const a = document.createElement("a");

    a.href = `${link.page}.html`;
    a.textContent = link.label;

    li.appendChild(a);
    navList.appendChild(li);
  });
}



initNavigation();