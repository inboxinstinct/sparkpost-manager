require('dotenv').config();
const express = require('express');
const SparkPost = require('sparkpost');
const bcrypt = require('bcrypt');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const client = new SparkPost(process.env.SPARKPOST_API_KEY);
const app = express();
const db = new sqlite3.Database('./users.db');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: 'auto' }
}));

// Middleware to check if the user is logged in

app.get('/auth/check', (req, res) => {
    res.json({ isAuthenticated: !!req.session.userId });
});

// index.js
app.get('/auth/userinfo', (req, res) => {
    if (req.session.userId && req.session.username) {
        res.json({ username: req.session.username });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});


const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};

app.get('/login', (req, res) => {
    // Serve the login page
    res.sendFile(path.join(__dirname, '/public/login.html'));
});

app.post('/login', async (req, res) => {
    // Handle login
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) return res.status(500).send('Internal Server Error');
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.userId = user.id;
            req.session.username = user.username;
            return res.redirect('/');
        }
        res.redirect('/login?error=invalid');
    });
});

app.get('/logout', (req, res) => {
    // Handle logout
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// index.js
app.get('/navbar', (req, res) => {
    res.sendFile(path.join(__dirname, 'navbar.html'));
});


// Protect the main route
app.get('/', requireAuth, (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/template-preview/:templateId', requireAuth, async (req, res) => {
    try {
        const { templateId } = req.params;
        const response = await client.templates.get(templateId);
        // Assuming 'client.templates.get' returns the full API response directly
        // You might need to adjust based on the actual SparkPost Node client behavior
        res.json({ success: true, results: response.results });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/recipient-lists', requireAuth, async (req, res) => {
    try {
        const response = await client.recipientLists.list(); // Fetch recipient lists from SparkPost
        res.status(200).json({ success: true, data: response.results });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    
    // Check if the username and password were provided
    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    // Check if the username already exists
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, row) => {
        if (err) {
            return res.status(500).send('Error checking user existence');
        }

        if (row) {
            return res.status(409).send('User already exists');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new user into the database
        db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err) => {
            if (err) {
                return res.status(500).send('Error saving the user');
            }
            res.status(201).send('User created successfully');
        });
    });
});



app.post('/send-email', requireAuth, async (req, res) => {
    try {
        const { templateId, recipientListId } = req.body; // Expecting the template ID and recipient list ID in the request body

        const response = await client.transmissions.send({
            content: {
                template_id: templateId,
            },
            recipients: {
                list_id: recipientListId, // Use the recipient list ID here
            },
        });

        res.status(200).json({ success: true, data: response });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});



app.get('/templates', requireAuth, async (req, res) => {
    try {
        const response = await client.templates.list(); // Fetches all templates
        res.status(200).json({ success: true, data: response.results });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
