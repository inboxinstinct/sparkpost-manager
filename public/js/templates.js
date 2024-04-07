let currentPage = 1;
const templatesPerPage = 10;

document.addEventListener('DOMContentLoaded', function() {
    fetchTemplates();
});

async function fetchTemplates() {
    const response = await fetch(`/templates?page=${currentPage}&limit=${templatesPerPage}`);
    const data = await response.json();

    if (data.success) {
        const list = document.getElementById('templateList');
        list.innerHTML = ''; // Clear existing list items

        data.data.forEach(template => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${template.name}</td>
                <td>${template.description || 'No description available'}</td>
                <td><a href="deployment.html?templateId=${template.id}" class="btn btn-primary btn-sm">View</a></td>
            `;
            list.appendChild(row);
        });

        updatePagination(data.total);
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
