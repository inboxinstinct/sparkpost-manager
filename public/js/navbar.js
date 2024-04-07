// navbar.js
document.addEventListener('DOMContentLoaded', () => {
    const navbarHTML = `
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
        <style>
            body {
                background-color: #f7f7f7;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            }
            .navbar {
                background-color: #fff;
                box-shadow: 0 1px 10px rgba(0, 0, 0, 0.1);
            }
            .container {
                padding-top: 2rem;
            }
            .btn-primary {
                background-color: #007bff;
                border-color: #007bff;
            }
            .btn-primary:hover {
                background-color: #0056b3;
                border-color: #0056b3;
            }
        </style>
        <nav class="navbar navbar-expand-lg navbar-light">
            <div class="container">
                <a class="navbar-brand" href="/">Campaign Manager</a>
                <div class="ml-auto">
                    <span id="navbarGreeting" class="navbar-text mr-3"></span>
                    <a id="logoutLink" href="/logout" class="btn btn-outline-primary">Logout</a>
                </div>
            </div>
        </nav>`;

    document.body.insertAdjacentHTML('afterbegin', navbarHTML);

    // Fetch and display the username, adjust this part as per your user session management
    // In navbar.js
fetch('/auth/userinfo')
.then(response => response.json())
.then(data => {
    if (data.username) {
        document.getElementById('navbarGreeting').textContent = `Hello, ${data.username}.`;
    }
})
.catch(error => console.error('Error fetching user info:', error));

});
