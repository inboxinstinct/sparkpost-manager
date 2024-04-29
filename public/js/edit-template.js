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
                initializeEditor();
            } else {
                console.error('Failed to load template');
            }
        });

    fetchSendingDomains();

});
function initializeEditor() {
    const editorContent = document.querySelector('.editor-content');
    const htmlContent = document.getElementById('htmlContent');
    const toggleEditorBtn = document.getElementById('toggleEditor');
    const addUnsubscribeBtn = document.getElementById('addUnsubscribe');
    const insertFooterBtn = document.getElementById('insertFooter');

    // Load the template's HTML content into the editor
    editorContent.innerHTML = htmlContent.value;

    editorContent.addEventListener('input', function() {
        htmlContent.value = editorContent.innerHTML;
    });

    htmlContent.addEventListener('input', function() {
        editorContent.innerHTML = htmlContent.value;
    });

    document.querySelectorAll('.editor-toolbar button').forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            const command = this.dataset.command;
            const value = this.dataset.value || null;
            if (command === 'createLink') {
                const url = prompt('Enter the link URL');
                document.execCommand(command, false, url);
            } else if (command === 'showGuides') {
                editorContent.classList.toggle('show-guides');
            } else {
                document.execCommand(command, false, value);
                editorContent.focus();
            }
            htmlContent.value = editorContent.innerHTML;
        });
    });

    toggleEditorBtn.addEventListener('click', function() {
        if (htmlContent.style.display === 'none') {
            editorContent.style.display = 'none';
            htmlContent.style.display = 'block';
            htmlContent.value = editorContent.innerHTML;
            this.textContent = 'Visual Editor';
        } else {
            editorContent.style.display = 'block';
            htmlContent.style.display = 'none';
            editorContent.innerHTML = htmlContent.value;
            this.textContent = 'Edit Source';
        }
    });
    


    function getSelectedNodes(range) {
        const selectedNodes = [];
        let node = range.startContainer;
        const endNode = range.endContainer;

        while (node) {
            if (node.nodeType === Node.TEXT_NODE && range.intersectsNode(node)) {
                selectedNodes.push(node);
            }
            if (node === endNode) {
                break;
            }
            node = getNextNode(node);
        }

        return selectedNodes;
    }

    function getNextNode(node) {
        if (node.firstChild) {
            return node.firstChild;
        }
        while (node) {
            if (node.nextSibling) {
                return node.nextSibling;
            }
            node = node.parentNode;
        }
    }






    
    function insertHtmlAtCursor(html) {
        const selection = window.getSelection();
        if (selection.getRangeAt && selection.rangeCount) {
            let range = selection.getRangeAt(0); // Change 'const' to 'let'
            range.deleteContents();
            const div = document.createElement('div');
            div.innerHTML = html;
            const frag = document.createDocumentFragment();
            let node, lastNode;
            while ((node = div.firstChild)) {
                lastNode = frag.appendChild(node);
            }
            range.insertNode(frag);
            if (lastNode) {
                range = range.cloneRange(); // No error now
                range.setStartAfter(lastNode);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
            }
            document.querySelector('.editor-content').focus();
            document.getElementById('htmlContent').value = document.querySelector('.editor-content').innerHTML;
        }
    }

    
    addUnsubscribeBtn.addEventListener('click', function() {
        fetch('/settings')
            .then(response => response.json())
            .then(data => {
                console.log('Settings Data:', data);
                if (data.unsubscribeString) {
                    const unsubscribeLink = data.unsubscribeString;
                    insertHtmlAtCursor(unsubscribeLink);
                } else {
                    console.error('Unsubscribe link not found in settings');
                }
            })
            .catch(error => {
                console.error('Error fetching settings:', error);
            });
    });
    
    insertFooterBtn.addEventListener('click', function() {
        fetch('/settings')
            .then(response => response.json())
            .then(data => {
                console.log('Settings Data:', data);
                if (data.customFooter) {
                    const footer = data.customFooter;
                    const editorContent = document.querySelector('.editor-content');
                    editorContent.innerHTML += footer;
                    document.getElementById('htmlContent').value = editorContent.innerHTML;
                } else {
                    console.error('Custom footer not found in settings');
                }
            })
            .catch(error => {
                console.error('Error fetching settings:', error);
            });
    });

    
}

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
