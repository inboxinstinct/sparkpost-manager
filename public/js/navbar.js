// navbar.js
document.addEventListener('DOMContentLoaded', () => {
    const navbarHTML = `
        <style>
            #customNavbar {
                background-color: #fff;
                box-shadow: 0 1px 10px rgba(0, 0, 0, 0.1);
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
                color: #f1f1f1
            }

            #Campaigns {
                border-left: 1px solid #dee2e6
            }

            #title1 {
                padding-top: 20px;
            }
            
            #customNavbar .nav-link {
                color: #343a40;
                margin: 0 10px; /* Adjust spacing between links */
            }
            #customNavbar .container {
                padding-top: 2rem;
            }
            #customNavbar .nav-link:hover {
                color: #000;
            }
            #customNavbar .btn-primary {
                background-color: #007bff;
                border-color: #007bff;
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
