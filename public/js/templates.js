let currentPage = 1;
const templatesPerPage = 10;

document.addEventListener('DOMContentLoaded', function() {
    fetchTemplates();
    fetchCustomTemplates();
});

async function fetchCustomTemplates() {
    const response = await fetch('/custom-templates');
    const data = await response.json();

    if (data.success) {
        const list = document.getElementById('customTemplateList');
        list.innerHTML = ''; // Clear existing list items

        data.data.forEach(template => {
            const row = document.createElement('tr');
            const createdAt = new Date(template.createdAt).toLocaleString();
            const truncatedSubject = template.subject.length > 40 ? template.subject.slice(0, 39) + '...' : template.subject;

            row.innerHTML = `
                <td style="text-align:center">✔</td>
                <td>${truncatedSubject}</td>
                <td >${createdAt}</td>
                <td style="text-align:center">
                <a href="edit-template.html?customTemplateId=${template._id}">Edit</a> |
                <a href="#" onclick="deleteTemplate('${template._id}')">Delete</a> |
                <a href="deployment.html?customTemplateId=${template._id}">Deploy →</a> 
                </td>
            `;
            list.appendChild(row);
        });
    } else {
        console.error('Failed to load custom templates');
    }
}

document.getElementById('createTemplate').addEventListener('click', function() {
    window.location.href = 'create-template.html';
});

async function deleteTemplate(templateId) {
    if (confirm('Are you sure you want to delete this template?')) {
        const response = await fetch(`/custom-templates/${templateId}`, {
            method: 'DELETE',
        });
        const data = await response.json();

        if (data.success) {
            fetchCustomTemplates();
        } else {
            console.error('Failed to delete template');
        }
    }
}


async function fetchTemplates() {
    const response = await fetch(`/templates?page=${currentPage}&limit=${templatesPerPage}`);
    const data = await response.json();

    if (data.success) {
        // Sort templates by last_update_time in descending order (newest first)
        data.data.sort((a, b) => new Date(b.last_update_time) - new Date(a.last_update_time));

        const list = document.getElementById('templateList');
        list.innerHTML = ''; // Clear existing list items

        data.data.forEach(template => {
            const row = document.createElement('tr');
            // Determine the ready status symbol
            const readySymbol = template.published ? '✔' : '✘';
            const truncatedName = template.name.length > 40 ? template.name.slice(0, 39) + '...' : template.name;
            const truncatedDescription = template.description && template.description.length > 40 ? template.description.slice(0, 39) + '...' : template.description || 'Empty.';
            row.innerHTML = `
                <td style="text-align:center">${readySymbol}</td> <!-- New cell for "Ready" status -->
                <td>${truncatedName}</td>
                <td>${truncatedDescription}</td>
                <td style="text-align:center;"><a href="deployment.html?templateId=${template.id}">Deploy →</a></td>
            `;
            list.appendChild(row);
        });
        

        updatePagination(data.total);
        document.getElementById('loadingSpinner').remove();
    } else {
        console.error('Failed to load templates');
    }
}

function updatePagination(totalTemplates) {
    const pageCount = Math.ceil(totalTemplates / templatesPerPage);
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    for (let i = 1; i <= pageCount; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageItem.innerHTML = `<a class="page-link" href="#" onclick="changePage(${i})">${i}</a>`;
        pagination.appendChild(pageItem);
    }
}

function changePage(pageNumber) {
    currentPage = pageNumber;
    fetchTemplates();
}
