document.addEventListener('DOMContentLoaded', function() {
    const queryParams = new URLSearchParams(window.location.search);
    const templateId = queryParams.get('templateId');

    if (templateId) {
        fetchEmailPreview(templateId);
        fetchRecipientLists();
    } else {
        document.getElementById('emailSubject').textContent = 'No template selected';
        document.getElementById('emailFromName').textContent = '';
        document.getElementById('emailFromEmail').textContent = '';
    }
});

async function fetchEmailPreview(templateId) {
    const response = await fetch(`/template-preview/${templateId}`);
    const data = await response.json();

    if (data.success && data.results && data.results.content) {
        const { content } = data.results;
        const iframe = document.getElementById('emailPreviewFrame');
        iframe.contentWindow.document.open();
        iframe.contentWindow.document.write(content.html);
        iframe.contentWindow.document.close();

        document.getElementById('emailSubject').textContent = content.subject;
        document.getElementById('emailFromName').textContent = content.from.name;
        document.getElementById('emailFromEmail').textContent = content.from.email;
    } else {
        document.getElementById('emailSubject').textContent = 'Failed to load preview.';
    }
}

async function fetchRecipientLists() {
    const response = await fetch('/recipient-lists');
    const data = await response.json();
    const listDropdown = document.getElementById('recipientList');

    if (data.success) {
        data.data.forEach(list => {
            const option = new Option(list.name, list.id);
            listDropdown.add(option);
        });
    }
}

document.getElementById('sendEmail').addEventListener('click', function() {
    const recipientListId = document.getElementById('recipientList').value;
    const recipientListName = document.getElementById('recipientList').selectedOptions[0].text;

    if (recipientListId) {
        document.getElementById('modalEmailSubject').textContent = document.getElementById('emailSubject').textContent;
        document.getElementById('modalEmailFromName').textContent = document.getElementById('emailFromName').textContent;
        document.getElementById('modalEmailFromEmail').textContent = document.getElementById('emailFromEmail').textContent;
        document.getElementById('modalRecipientList').textContent = recipientListName;

        $('#confirmationModal').modal('show');
    } else {
        alert('Please select a recipient list.');
    }
});

function confirmSend() {
    const recipientListId = document.getElementById('recipientList').value;
    const templateId = new URLSearchParams(window.location.search).get('templateId');

    fetch('/send-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            templateId,
            recipientListId,
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Email sent successfully!');
            $('#confirmationModal').modal('hide');
        } else {
            alert('Failed to send email.');
        }
    });
}
