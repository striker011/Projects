 src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"


fetch('project_pages/dashboard.md')
.then(response => response.text())
.then(md => {
    document.getElementById('content').innerHTML = marked(md);
});


document.addEventListener('DOMContentLoaded', async ()=>{
    
});