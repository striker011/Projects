        let techStack = [];
        let generatedFiles = null;

        // Set today's date as default
        document.getElementById('projectDate').valueAsDate = new Date();

        function addTech() {
            const name = document.getElementById('techName').value.trim();
            const category = document.getElementById('techCategory').value.trim();

            if (name && category) {
                techStack.push({ name, category });
                document.getElementById('techName').value = '';
                document.getElementById('techCategory').value = '';
                renderTechList();
            }
        }

        function removeTech(index) {
            techStack.splice(index, 1);
            renderTechList();
        }

        function renderTechList() {
            const container = document.getElementById('techList');
            const itemsContainer = document.getElementById('techItems');

            if (techStack.length === 0) {
                container.classList.add('hidden');
                return;
            }

            container.classList.remove('hidden');
            itemsContainer.innerHTML = techStack.map((tech, index) => `
                <div class="tech-item">
                    <div>
                        <span class="tech-name">${tech.name}</span>
                        <span class="tech-category">(${tech.category})</span>
                    </div>
                    <button class="btn-remove" onclick="removeTech(${index})">🗑️ Remove</button>
                </div>
            `).join('');
        }

        function generateFiles() {
            const projectName = document.getElementById('projectName').value.trim();
            const projectTitle = document.getElementById('projectTitle').value.trim();

            if (!projectName || !projectTitle) {
                alert('Bitte fülle mindestens Projektname und Titel aus!');
                return;
            }

            const projectDescription = document.getElementById('projectDescription').value.trim();
            const projectId = projectName.toLowerCase().replace(/\s+/g, '-');

            // Topics.json entry
            const topicsEntry = {
                id: document.getElementById('topicId').value.trim() || projectId,
                title: document.getElementById('topicTitle').value.trim() || projectTitle,
                description: document.getElementById('topicDescription').value.trim() || projectDescription,
                icon: document.getElementById('topicIcon').value.trim() || '📦',
                color: document.getElementById('topicColor').value.trim() || '#3b82f6'
            };

            // Projects.json entry
            const projectsEntry = {
                id: document.getElementById('projectId').value.trim() || projectId,
                title: projectTitle,
                description: projectDescription,
                image: document.getElementById('projectImageUrl').value.trim() || '/images/projects/placeholder.png',
                github: document.getElementById('projectGithubUrl').value.trim(),
                live: document.getElementById('projectLiveUrl').value.trim(),
                date: document.getElementById('projectDate').value || new Date().toISOString().split('T')[0],
                featured: document.getElementById('projectFeatured').checked,
                tags: techStack.map(t => t.name)
            };

            // Tech stack entries
            const techStackEntries = techStack.map(tech => ({
                name: tech.name,
                category: tech.category
            }));

            // Markdown file
            const markdownContent = `---
title: "${projectTitle}"
description: "${projectDescription}"
date: ${projectsEntry.date}
tags: [${techStack.map(t => `"${t.name}"`).join(', ')}]
featured: ${projectsEntry.featured}
---

# ${projectTitle}

## Übersicht

${projectDescription}

## Technologien

${techStack.map(t => `- ${t.name}`).join('\n')}

## Features

- Feature 1
- Feature 2
- Feature 3

## Installation

\`\`\`bash
# Anleitung folgt
\`\`\`

## Links

${projectsEntry.github ? `- [GitHub Repository](${projectsEntry.github})` : ''}
${projectsEntry.live ? `- [Live Demo](${projectsEntry.live})` : ''}
`;

            generatedFiles = {
                topics: topicsEntry,
                projects: projectsEntry,
                techstack: techStackEntries,
                markdown: markdownContent,
                folderName: projectName,
                fileName: projectId
            };

            // Show success and preview
            document.getElementById('successAlert').classList.remove('hidden');
            document.getElementById('downloadBtn').classList.remove('hidden');
            document.getElementById('preview').classList.remove('hidden');
            document.getElementById('folderPath').textContent = `source/${projectName}/`;
            document.getElementById('mdFileName').textContent = `✓ ${projectId}.md`;

            setTimeout(() => {
                document.getElementById('successAlert').classList.add('hidden');
            }, 3000);
        }

        function downloadFile(content, filename) {
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        function downloadAll() {
            if (!generatedFiles) return;

            downloadFile(JSON.stringify(generatedFiles.topics, null, 2), 'topics-entry.json');
            downloadFile(JSON.stringify(generatedFiles.projects, null, 2), 'projects-entry.json');
            downloadFile(JSON.stringify(generatedFiles.techstack, null, 2), 'techstack-entries.json');
            downloadFile(generatedFiles.markdown, `${generatedFiles.fileName}.md`);
        }

        // Allow Enter key to add tech
        document.getElementById('techCategory').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addTech();
            }
        });