document.addEventListener('DOMContentLoaded', function() {
    fetchSendingDomains();
});

function fetchSendingDomains() {
    fetch('/sending-domains')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const sendingDomains = data.data;
                const datalistElement = document.getElementById('sendingDomainsList');
                sendingDomains.forEach(domain => {
                    const option = document.createElement('option');
                    const emailAddress = `mail@${domain.domain}`;
                    option.value = emailAddress;
                    datalistElement.appendChild(option);
                });
            } else {
                console.error('Failed to load sending domains');
            }
        });
}





function saveTemplate() {
    const subject = document.getElementById('subject').value;
    const fromName = document.getElementById('fromName').value;
    const fromEmail = document.getElementById('fromEmail').value;
    const htmlContent = document.getElementById('htmlContent').value;

    return fetch('/custom-templates', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            subject,
            fromName,
            fromEmail,
            htmlContent,
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
                console.error('Failed to save template');
            }
        });
});

document.getElementById('deployTemplate').addEventListener('click', function() {
    saveTemplate()
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const customTemplateId = data.data._id;
                window.location.href = `deployment.html?customTemplateId=${customTemplateId}`;
            } else {
                console.error('Failed to save template');
            }
        });
});
