document.addEventListener('DOMContentLoaded', () => {
    // Fetch the current settings and populate the form
    fetch('/settings')
        .then(response => response.json())
        .then(data => {
            document.getElementById('customFooter').value = data.customFooter || '';
            document.getElementById('unsubscribeString').value = data.unsubscribeString || '';
        })
        .catch(error => console.error('Error fetching settings:', error));

    // Save settings when the save button is clicked
    document.getElementById('saveSettings').addEventListener('click', () => {
        const customFooter = document.getElementById('customFooter').value;
        const unsubscribeString = document.getElementById('unsubscribeString').value;

        fetch('/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ customFooter, unsubscribeString }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Settings saved successfully!');
            } else {
                alert('Failed to save settings. Please try again.');
            }
        })
        .catch(error => console.error('Error saving settings:', error));
    });
});