document.addEventListener('DOMContentLoaded', function() {
    const customTemplateId = new URLSearchParams(window.location.search).get('customTemplateId');

    fetch(`/custom-templates/${customTemplateId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const template = data.data;
                document.getElementById('subject').value = template.subject;
                document.getElementById('fromName').value = template.fromName;
                document.getElementById('fromEmail').value = template.fromEmail;
                document.getElementById('htmlContent').value = template.htmlContent;
            } else {
                console.error('Failed to load template');
            }
        });
});

function saveTemplate() {
    const subject = document.getElementById('subject').value;
    const fromName = document.getElementById('fromName').value;
    const fromEmail = document.getElementById('fromEmail').value;
    const htmlContent = document.getElementById('htmlContent').value;
    const createdAt = new Date();
    const customTemplateId = new URLSearchParams(window.location.search).get('customTemplateId');

    return fetch(`/custom-templates/${customTemplateId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            subject,
            fromName,
            fromEmail,
            htmlContent,
            createdAt,
        }),
    });
}

document.getElementById('templateForm').addEventListener('submit', function(event) {
    event.preventDefault();

    saveTemplate()
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = 'templates.html';
            } else {
                console.error('Failed to update template');
            }
        });
});

document.getElementById('deployTemplate').addEventListener('click', function() {
    saveTemplate()
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const customTemplateId = new URLSearchParams(window.location.search).get('customTemplateId');
                window.location.href = `deployment.html?customTemplateId=${customTemplateId}`;
            } else {
                console.error('Failed to update template');
            }
        });
});

function showPopup(popupId) {
    document.getElementById(popupId).style.display = 'flex';
}

function closePopup(popupId) {
    document.getElementById(popupId).style.display = 'none';
}

document.getElementById('deleteTemplate').addEventListener('click', function() {
    showPopup('deleteConfirmationPopup');
});

document.getElementById('confirmDelete').addEventListener('click', function() {
    const customTemplateId = new URLSearchParams(window.location.search).get('customTemplateId');

    if (customTemplateId) {
        fetch(`/custom-templates/${customTemplateId}`, {
            method: 'DELETE',
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = 'templates.html';
            } else {
                console.error('Failed to delete template');
            }
        });
    }
});
