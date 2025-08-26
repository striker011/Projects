// 📅 Helper: Format date
function formatDate(date) {
    return new Date(date).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
  
  // 🗂️ Default roadmap items
  const defaultTasks = [
    {
      text: "Connect stock dashboard to live API",
      created: Date.now(),
      done: false,
      doneAt: ""
    },
    {
      text: "Add user authentication (optional)",
      created: Date.now(),
      done: false,
      doneAt: ""
    },
    {
      text: "Expand blog with full article pages",
      created: Date.now(),
      done: false,
      doneAt: ""
    },
    {
      text: "Add mobile responsiveness",
      created: Date.now(),
      done: false,
      doneAt: ""
    },
    {
      text: "Polish UI styling and layout",
      created: Date.now(),
      done: false,
      doneAt: ""
    },
    {
      text: "Add dark mode toggle",
      created: Date.now(),
      done: false,
      doneAt: ""
    },
    {
      text: "Deploy site online (Netlify / Vercel / GitHub Pages)",
      created: Date.now(),
      done: false,
      doneAt: ""
    }
  ];
  
  // 🔄 Load or initialize roadmap
  let roadmap = JSON.parse(localStorage.getItem('roadmap')) || defaultTasks;
  
  // 📌 Render tasks
  function renderRoadmap() {
    const list = document.getElementById("roadmap-list");
    list.innerHTML = "";
  
    roadmap.forEach((task, i) => {
      const li = document.createElement("li");
      li.className = task.done ? "done" : "";
  
      li.innerHTML = `
        <label>
          <input type="checkbox" ${task.done ? "checked" : ""} onchange="toggleDone(${i})" />
          ${task.text}
        </label>
        <div class="dates">
          <small>Created: ${formatDate(task.created)}</small><br />
          ${task.doneAt ? `<small>Finished: ${formatDate(task.doneAt)}</small>` : ""}
        </div>
      `;
      list.appendChild(li);
    });
  }
  
  // ✅ Mark complete/incomplete
  function toggleDone(index) {
    const task = roadmap[index];
    task.done = !task.done;
    task.doneAt = task.done ? Date.now() : "";
    saveRoadmap();
    renderRoadmap();
  }
  
  // 💾 Save to localStorage
  function saveRoadmap() {
    localStorage.setItem('roadmap', JSON.stringify(roadmap));
  }
  
  renderRoadmap();
  

  document.getElementById('add-task-btn').addEventListener('click', () => {
    const input = document.getElementById('new-task-input');
    const text = input.value.trim();
  
    if (text === "") {
      alert("Please enter a task description.");
      return;
    }
  
    // Create new task object
    const newTask = {
      text: text,
      created: Date.now(),
      done: false,
      doneAt: ""
    };
  
    // Add to roadmap and save
    roadmap.push(newTask);
    saveRoadmap();
  
    // Clear input and re-render list
    input.value = "";
    renderRoadmap();
  });
  
  // Optional: Allow pressing Enter to add task
  document.getElementById('new-task-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('add-task-btn').click();
    }
  });