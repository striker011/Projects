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