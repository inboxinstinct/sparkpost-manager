document.addEventListener('DOMContentLoaded', function() {
    fetchSendingDomains();
    initializeEditor();
});

function initializeEditor() {
    const editorContent = document.querySelector('.editor-content');
    const htmlContent = document.getElementById('htmlContent');
    const toggleEditorBtn = document.getElementById('toggleEditor');
    const addUnsubscribeBtn = document.getElementById('addUnsubscribe');
    const insertFooterBtn = document.getElementById('insertFooter');
    const insertHeaderBtn = document.getElementById('insertHeader');


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

    function insertHtmlAtCursor(html) {
        const selection = window.getSelection();
        if (selection.getRangeAt && selection.rangeCount) {
            let range = selection.getRangeAt(0);
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
                range = range.cloneRange();
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
                    if (htmlContent.style.display === 'none') {
                        insertHtmlAtCursor(unsubscribeLink);
                    } else {
                        htmlContent.value += unsubscribeLink;
                    }
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
                    if (htmlContent.style.display === 'none') {
                        const editorContent = document.querySelector('.editor-content');
                        editorContent.innerHTML += footer;
                        document.getElementById('htmlContent').value = editorContent.innerHTML;
                    } else {
                        htmlContent.value += footer;
                    }
                } else {
                    console.error('Custom footer not found in settings');
                }
            })
            .catch(error => {
                console.error('Error fetching settings:', error);
            });
    });

    insertHeaderBtn.addEventListener('click', function() {
        const previewText = prompt('Enter the preview text:');
        if (previewText) {
            fetch('/settings')
                .then(response => response.json())
                .then(data => {
                    console.log('Settings Data:', data);
                    if (data.unsubscribeString) {
                        const unsubscribeLink = data.unsubscribeString;
                        const invisibleSpacers = '<div style="display:none;">&#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; </div>';
                        const headerHtml = `<div style="display:none;">${previewText}</div>${invisibleSpacers}${unsubscribeLink}`;
                        if (htmlContent.style.display === 'none') {
                            const editorContent = document.querySelector('.editor-content');
                            editorContent.innerHTML = headerHtml + editorContent.innerHTML;
                            document.getElementById('htmlContent').value = editorContent.innerHTML;
                        } else {
                            htmlContent.value = headerHtml + htmlContent.value;
                        }
                    } else {
                        console.error('Unsubscribe link not found in settings');
                    }
                })
                .catch(error => {
                    console.error('Error fetching settings:', error);
                });
        }
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
