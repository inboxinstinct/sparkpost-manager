require('dotenv').config();
const express = require('express');
const SparkPost = require('sparkpost');
const bcrypt = require('bcrypt');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const router = express.Router();
const client = new SparkPost(process.env.SPARKPOST_API_KEY);
const app = express();
const db = new sqlite3.Database('./users.db');



app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: 'auto' }
}));

const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};

const Counter = require('./models/Counter');
const Campaign = require('./models/Campaign');

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));


  // Route to create a new campaign
app.post('/campaigns', requireAuth, async (req, res) => {
    try {
        // Create a new campaign using the request body
        const newCampaign = new Campaign({
            subject: req.body.subject,
            fromName: req.body.fromName,
            fromEmail: req.body.fromEmail,
            htmlContent: req.body.htmlContent,
            stats: req.body.stats,
            // Add any other fields you expect to receive and store
        });

        // Save the new campaign to the database
        const savedCampaign = await newCampaign.save();

        // Respond with the saved campaign
        res.status(201).json(savedCampaign);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

  
  // Route to get all campaigns
  app.get('/campaigns', async (req, res) => {
    try {
      const campaigns = await Campaign.find();
      res.json(campaigns);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Route to get a specific campaign
  app.get('/campaigns/:id', async (req, res) => {
    try {
      const campaign = await Campaign.findById(req.params.id);
      if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
      res.json(campaign);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

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

// Example in your Node.js server code
app.post('/save-campaign', async (req, res) => {
    try {
        const { campaignId, subject, fromName, fromEmail, htmlContent, templateId, recipientListId, } = req.body;


        const campaign = new Campaign({
            campaignId,
            subject,
            fromName,
            fromEmail,
            htmlContent,
            templateId,
            recipientListId,
            // sentDate is automatically set to now
        });

        await campaign.save(); // Save the campaign to MongoDB

        res.status(200).json({ success: true, message: "Campaign saved successfully" });
    } catch (err) {
        console.error("Failed to save campaign", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

async function getNextCampaignId() {
    const counterName = 'campaignId'; // Name of the counter for campaigns
    const update = { $inc: { seq: 1 } }; // Increment sequence
    const options = { new: true, upsert: true, setDefaultsOnInsert: true };
    
    const counter = await Counter.findByIdAndUpdate(counterName, update, options);
    return counter.seq;
  }

  app.post('/send-email', requireAuth, async (req, res) => {
    try {
        const { templateId, recipientListId } = req.body;
        const newCampaignId = await getNextCampaignId();
        const campaignIdStr = newCampaignId.toString();

        const response = await client.transmissions.send({
            content: {
                template_id: templateId,
            },
            recipients: {
                list_id: recipientListId,
            },
            campaign_id: campaignIdStr,
        });

        // Include campaignIdStr in the response
        res.status(200).json({ success: true, data: response, campaignId: campaignIdStr });
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
