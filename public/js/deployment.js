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

/* 
function confirmSend() {
    const recipientListId = document.getElementById('recipientList').value;
    const templateId = new URLSearchParams(window.location.search).get('templateId');
    const emailSubject = document.getElementById('emailSubject').textContent;
    const emailFromName = document.getElementById('emailFromName').textContent;
    const emailFromEmail = document.getElementById('emailFromEmail').textContent;
    const iframe = document.getElementById('emailPreviewFrame');
    const htmlContent = iframe.contentWindow.document.body.innerHTML; // Extract HTML content

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
            // After successful email send, post to campaigns to create a new record
            createCampaignRecord({
                subject: emailSubject,
                fromName: emailFromName,
                fromEmail: emailFromEmail,
                // Assuming you can get these details or set initial values
                htmlContent: htmlContent, // You might need to adjust this
                stats: {
                    opens: 0,
                    clicks: 0,
                    bounces: 0,
                    successfulDeliveries: 0,
                },
            });
        } else {
            alert('Failed to send email.');
        }
    });
}
 */

function showPopup(popupId) {
    document.getElementById(popupId).style.display = 'flex';
}

function closePopup(popupId) {
    document.getElementById(popupId).style.display = 'none';
}

function confirmSend() {
    const recipientListId = document.getElementById('recipientList').value;
    const templateId = new URLSearchParams(window.location.search).get('templateId');
    const emailSubject = document.getElementById('emailSubject').textContent;
    const emailFromName = document.getElementById('emailFromName').textContent;
    const emailFromEmail = document.getElementById('emailFromEmail').textContent;
    const iframe = document.getElementById('emailPreviewFrame');
    const htmlContent = iframe.contentWindow.document.body.innerHTML;

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
            showPopup('successPopup');
            $('#confirmationModal').modal('hide');

            // Use the campaignIdStr from the response here
            const campaignIdStr = data.campaignId;

            setTimeout(() => {
                window.location.href = `campaign-details.html?campaignId=${campaignIdStr}`;
            }, 5000); // 5000 milliseconds = 5 seconds


            // Now, save the campaign details with the campaignIdStr
            fetch('/save-campaign', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    campaignId: campaignIdStr, // Use the campaign ID here
                    subject: emailSubject,
                    fromName: emailFromName,
                    fromEmail: emailFromEmail,
                    htmlContent: htmlContent,
                    templateId: templateId,
                    recipientListId: recipientListId,
                }),
            })
            .then(res => res.json())
            .then(saveData => {
                if (saveData.success) {
                    console.log('Campaign saved successfully');
                    // Handle success, maybe redirect or show a message
                } else {
                    console.error('Failed to save campaign');
                    // Handle failure, show an error message
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

