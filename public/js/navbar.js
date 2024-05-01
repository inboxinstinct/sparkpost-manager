// navbar.js
document.addEventListener('DOMContentLoaded', () => {
    const navbarHTML = `
        <style>
            #customNavbar {
                background-color: #fff;
                box-shadow: 0 1px 10px rgba(0, 0, 0, 0.1);
                padding: 1rem 0;
            }
            #customNavbar .container {
                display: flex;
                justify-content: space-between;
                align-items: center;
                width: 100%;
            }
            #customNavbar .navigation-links {
                display: flex;
                justify-content: center;
                flex-grow: 1;
            }
            #customNavbar .nav-link {
                color: #6c757d;
                margin: 0 10px;
                text-decoration: none;
                font-weight: 500;
                transition: color 0.2s;
            }
            #customNavbar .nav-link:hover {
                color: #007bff;
            }
            #customNavbar .btn-primary {
                background-color: #007bff;
                border-color: #007bff;
                transition: background-color 0.2s, border-color 0.2s;
            }
            #customNavbar .btn-primary:hover {
                background-color: #0056b3;
                border-color: #0056b3;
            }
        </style>
        <nav id="customNavbar" class="navbar navbar-expand-lg navbar-light">
            <div class="container">
                <a class="navbar-brand" href="/">Campaign Manager</a>
                <div class="navigation-links">
                    <a class="nav-link" href="/index.html">Home</a>
                    <a class="nav-link" href="/templates.html">Templates</a>
                    <a class="nav-link" href="/campaigns.html">Campaigns</a>
                    <a class="nav-link" href="/segments.html">Segments</a>
                    <a class="nav-link" href="/settings.html">Settings</a>
                </div>
                <div>
                    <span id="navbarGreeting" class="navbar-text mr-3"></span>
                    <a id="logoutLink" href="/logout" class="btn btn-outline-primary">Logout</a>
                </div>
            </div>
        </nav>`;

    document.body.insertAdjacentHTML('afterbegin', navbarHTML);

    // Fetch and display the username, adjust this part as per your user session management
    fetch('/auth/userinfo')
    .then(response => response.json())
    .then(data => {
        if (data.username) {
            document.getElementById('navbarGreeting').textContent = `Hello, ${data.username}.`;
        }
    })
    .catch(error => console.error('Error fetching user info:', error));
});
