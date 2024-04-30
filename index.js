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
const schedule = require('node-schedule');
const Template = require('./models/Template');
const Settings = require('./models/Settings');
const { requireAuth, requireAdmin } = require('./authMiddleware');
const User = require('./models/User');





// {{ render_snippet( "unsubscribe" ) }}

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
        const campaign = await Campaign.findOne({ campaignId: req.params.campaignId });
        if (!campaign) {
            return res.status(404).send('Campaign not found');
        }
        res.json(campaign);
    } catch (error) {
        res.status(500).send(error.toString());
    }
  });

  app.get('/campaigns/details/:campaignId', async (req, res) => {
    try {
        const campaign = await Campaign.findOne({ campaignId: req.params.campaignId });
        if (!campaign) {
            return res.status(404).send('Campaign not found');
        }
        res.json(campaign);
    } catch (error) {
        res.status(500).send(error.toString());
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




// Fetch settings
app.get('/settings', requireAuth, async (req, res) => {
    try {
        const settings = await Settings.findOne();
        res.json(settings || {});
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch settings' });
    }
});

// Save settings
app.post('/settings', requireAuth, async (req, res) => {
    try {
        const { customFooter, unsubscribeString } = req.body;
        let settings = await Settings.findOne();

        if (settings) {
            settings.customFooter = customFooter;
            settings.unsubscribeString = unsubscribeString;
        } else {
            settings = new Settings({ customFooter, unsubscribeString });
        }

        await settings.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving settings:', error);
        res.status(500).json({ success: false, error: 'Failed to save settings' });
    }
});






app.get('/login', (req, res) => {
    // Serve the login page
    res.sendFile(path.join(__dirname, '/public/login.html'));
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
      const user = await User.findOne({ username });
      req.session.username = user.username;

      if (user && await bcrypt.compare(password, user.password)) {
        req.session.userId = user._id;
        req.session.userRole = user.role;
        return res.redirect('/');
      }
      res.redirect('/login?error=invalid');
    } catch (err) {
      res.status(500).send('Internal Server Error');
    }
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

/*function arrayToCSV(data) {
    const csvRows = data.map(row => (typeof row === 'string' ? row : row.email).replace(/"/g, '""')); // Assuming each row is a simple email string or an object with an email property
    return `"${csvRows.join('"\n"')}"`; // Quote strings and separate by newline
} */

app.get('/campaigns/export/:campaignId/:dataType', requireAuth, async (req, res) => {
    try {
        const { campaignId, dataType } = req.params;
        const campaign = await Campaign.findOne({ campaignId: campaignId });
        if (!campaign) {
            return res.status(404).send('Campaign not found');
        }

        const data = campaign[dataType];
        if (!data) {
            return res.status(404).send('Data type not found');
        }

        const csvData = arrayToCSV(data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${dataType}-${campaignId}.csv"`);
        res.send(csvData);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

function arrayToCSV(data) {
    const csvRows = data.map(row => (typeof row === 'string' ? row : row.email).replace(/"/g, '""')); // Assuming each row is a simple email string or an object with an email property
    return `"${csvRows.join('"\n"')}"`; // Quote strings and separate by newline
}




app.post('/register', async (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password) {
      return res.status(400).send('Username and password are required');
    }
    try {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(409).send('User already exists');
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ username, password: hashedPassword, role });
      await user.save();
      res.status(201).send('User created successfully');
    } catch (err) {
      res.status(500).send('Error saving the user');
    }
  });
  

  app.get('/admin', requireAdmin, (req, res) => {
    res.sendFile(__dirname + '/public/admin.html');
  });
  
  app.get('/admin/users', requireAdmin, async (req, res) => {
    try {
      const users = await User.find();
      res.json(users);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
  
  app.post('/admin/users', requireAdmin, async (req, res) => {
    try {
      const { username, password, role } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ username, password: hashedPassword, role });
      await user.save();
      res.status(201).json({ success: true, message: 'User created successfully' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
  
  app.put('/admin/users/:userId', requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { username, password, role } = req.body;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      user.username = username;
      if (password) {
        user.password = await bcrypt.hash(password, 10);
      }
      user.role = role;
      await user.save();
      res.json({ success: true, message: 'User updated successfully' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
  
  app.delete('/admin/users/:userId', requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      await User.findByIdAndDelete(userId);
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/auth/userinfo', (req, res) => {
    if (req.session.userId && req.session.username) {
        res.json({ username: req.session.username });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});






app.get('/custom-templates', requireAuth, async (req, res) => {
    try {
        const templates = await Template.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: templates });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/custom-templates', requireAuth, async (req, res) => {
    try {
        const { subject, fromName, fromEmail, htmlContent } = req.body;
        const template = new Template({ subject, fromName, fromEmail, htmlContent });
        await template.save();
        res.status(201).json({ success: true, data: template });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/custom-templates/:customTemplateId', requireAuth, async (req, res) => {
    try {
        const { customTemplateId } = req.params;
        const template = await Template.findById(customTemplateId);
        res.status(200).json({ success: true, data: template });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/custom-templates/:customTemplateId', requireAuth, async (req, res) => {
    try {
        const { customTemplateId } = req.params;
        const { subject, fromName, fromEmail, htmlContent, createdAt } = req.body;
        const template = await Template.findByIdAndUpdate(
            customTemplateId,
            { subject, fromName, fromEmail, htmlContent, createdAt },
            { new: true }
        );
        res.status(200).json({ success: true, data: template });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


app.delete('/custom-templates/:customTemplateId', requireAuth, async (req, res) => {
    try {
        const { customTemplateId } = req.params;
        await Template.findByIdAndDelete(customTemplateId);
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});



// Example in your Node.js server code
app.post('/save-campaign', async (req, res) => {
    try {
        const { campaignId, subject, fromName, fromEmail, htmlContent, recipientListId, isScheduleSent, scheduledAt, tempo, tempoRate } = req.body;

        const campaign = new Campaign({
            campaignId,
            subject,
            fromName,
            fromEmail,
            htmlContent,
            //templateId,
            recipientListId,
            isScheduleSent,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
            tempo,
            tempoRate,
            tempoProgress: tempo ? 0 : null,
            inProgress: false,
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
        const { templateId, recipientListId, scheduledAt } = req.body;
        const newCampaignId = await getNextCampaignId();
        const campaignIdStr = newCampaignId.toString();

        if (scheduledAt) {
          /*  const scheduledJob = schedule.scheduleJob(new Date(scheduledAt), async () => {
                await sendEmail(templateId, recipientListId, campaignIdStr);
            }); */ 

            res.status(200).json({ success: true, message: 'Email scheduled for deployment', campaignId: campaignIdStr });
        } else {
            await sendEmail(templateId, recipientListId, campaignIdStr);
            res.status(200).json({ success: true, message: 'Email deployed successfully', campaignId: campaignIdStr });
        }
    } catch (err) {
        console.error('Error sending email:', err);
        res.status(500).json({ success: false, message: 'Failed to send email. Please try again.' });
    }
});

async function sendEmail(templateId, recipientListId, campaignIdStr) {
    try {
        const response = await client.transmissions.send({
            content: {
                template_id: templateId,
            },
            recipients: {
                list_id: recipientListId,
            },
            campaign_id: campaignIdStr,
        });
        console.log('Email sent successfully:', response);
    } catch (err) {
        console.error('Error sending email:', err);
        throw err;
    }
}

app.post('/test-email', async (req, res) => {

    try {
      const { fromName, fromEmail, subject, htmlContent, recipients } = req.body;
      await testEmail(fromName, fromEmail, subject, htmlContent, recipients);
      res.status(200).json({ success: true, message: 'Preview email sent successfully' });
    } catch (error) {
      console.error('Error sending preview email:', error);
      res.status(500).json({ success: false, message: 'Failed to send preview email' });
    }
  });
  
  async function testEmail(fromName, fromEmail, subject, htmlContent, recipients) {
    try {
      await client.transmissions.send({
        content: {
          from: {
            name: fromName,
            email: fromEmail,
          },
          subject: `[Preview] ${subject}`,
          html: htmlContent,
        },
        recipients: recipients,
        campaign_id: `0`,
      });
    } catch (error) {
      console.error('SparkPost API error:', error);
      throw error;
    }
  }


app.get('/templates', requireAuth, async (req, res) => {
    try {
        const response = await client.templates.list(); // Fetches all templates
        res.status(200).json({ success: true, data: response.results });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});



app.get('/sending-domains', requireAuth, async (req, res) => {
    try {
        const response = await client.sendingDomains.list();
        res.status(200).json({ success: true, data: response.results });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/*app.post('/create-admin', async (req, res) => {
    if (adminCreated) {
      return res.status(403).send('Admin account has already been created');
    }
  
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).send('Username and password are required');
    }
    try {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(409).send('User already exists');
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ username, password: hashedPassword, role: 'admin' });
      await user.save();
      adminCreated = true; // Set the flag to indicate that an admin account has been created
      res.status(201).send('Admin user created successfully');
    } catch (err) {
      console.error('Error saving the admin user:', err);
      res.status(500).send('Error saving the admin user');
    }
  });*/

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
