document.addEventListener('DOMContentLoaded', function() {
    const queryParams = new URLSearchParams(window.location.search);
    const templateId = queryParams.get('templateId');
    const customTemplateId = queryParams.get('customTemplateId');

    if (templateId) {
        fetchEmailPreview(templateId);
    } else if (customTemplateId) {
        fetchCustomEmailPreview(customTemplateId);
    } else {
        document.getElementById('emailSubject').textContent = 'No template selected';
        document.getElementById('emailFromName').textContent = '';
        document.getElementById('emailFromEmail').textContent = '';
    }

    fetchRecipientLists();
});


async function fetchCustomEmailPreview(customTemplateId) {
    const response = await fetch(`/custom-templates/${customTemplateId}`);
    const data = await response.json();

    if (data.success) {
        const template = data.data;
        const iframe = document.getElementById('emailPreviewFrame');
        iframe.contentWindow.document.open();
        iframe.contentWindow.document.write(template.htmlContent);
        iframe.contentWindow.document.close();

        document.getElementById('emailSubject').textContent = template.subject;
        document.getElementById('emailFromName').textContent = template.fromName;
        document.getElementById('emailFromEmail').textContent = template.fromEmail;
    } else {
        document.getElementById('emailSubject').textContent = 'Failed to load preview.';
    }
}



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



function createCampaignRecord(campaignDetails) {
    fetch('/campaigns', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignDetails),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Campaign record created:', data);
        // Handle success or failure
    })
    .catch(error => {
        console.error('Error creating campaign record:', error);
    });
}

function showPopup(popupId) {
    document.getElementById(popupId).style.display = 'flex';
}

function closePopup(popupId) {
    document.getElementById(popupId).style.display = 'none';
}

function confirmSend() {
    const recipientListId = document.getElementById('recipientList').value;
    const templateId = new URLSearchParams(window.location.search).get('templateId');
    const customTemplateId = new URLSearchParams(window.location.search).get('customTemplateId');
    const emailSubject = document.getElementById('emailSubject').textContent;
    const emailFromName = document.getElementById('emailFromName').textContent;
    const emailFromEmail = document.getElementById('emailFromEmail').textContent;
    const iframe = document.getElementById('emailPreviewFrame');
    const htmlContent = iframe.contentWindow.document.body.innerHTML;
    const scheduledAtInput = document.getElementById('scheduledAt');
    const scheduledAt = scheduledAtInput.value ? new Date(scheduledAtInput.value) : new Date(Date.now() + 60000);

    const tempoRate = parseInt(document.getElementById('tempoRate').value);

    if (isNaN(tempoRate) || tempoRate < 1 || tempoRate > 200) {
        alert('Please enter a valid tempo rate between 1 and 200.');
        return;
    }

    const requestBody = {
        recipientListId,
        scheduledAt: scheduledAt.toISOString(),
    };

    if (templateId) {
        requestBody.templateId = templateId;
    } else if (customTemplateId) {
        requestBody.customTemplateId = customTemplateId;
        requestBody.subject = emailSubject;
        requestBody.fromName = emailFromName;
        requestBody.fromEmail = emailFromEmail;
        requestBody.htmlContent = htmlContent;
    }

    fetch('/send-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showPopup('successPopup');
            $('#confirmationModal').modal('hide');

            const campaignIdStr = data.campaignId;

            fetch('/save-campaign', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    campaignId: campaignIdStr,
                    subject: emailSubject,
                    fromName: emailFromName,
                    fromEmail: emailFromEmail,
                    htmlContent: htmlContent,
                    //templateId: templateId,
                    //customTemplateId: customTemplateId,
                    recipientListId: recipientListId,
                    isScheduleSent: false,
                    scheduledAt: scheduledAt,
                    tempo: true,
                    tempoRate: tempoRate,
                }),
            })
            .then(res => res.json())
            .then(saveData => {
                if (saveData.success) {
                    console.log('Campaign saved successfully');
                } else {
                    console.error('Failed to save campaign');
                }
            });
        } else {
            showPopup('errorPopup');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}


document.getElementById('tempoCheckbox').addEventListener('change', function() {
    const tempoRateContainer = document.getElementById('tempoRateContainer');
    if (this.checked) {
        tempoRateContainer.style.display = 'block';
    } else {
        tempoRateContainer.style.display = 'none';
    }
});