const Segment = require('../models/Segment');
const Campaign = require('../models/Campaign');

exports.createSegment = async (req, res) => {
  try {
    const { name, criteria } = req.body;
    const segment = new Segment({ name, criteria });
    await segment.save();
    res.redirect('/segments.html');
  } catch (error) {
    res.status(500).json({ error: 'Failed to create segment' });
  }
};

exports.deleteSegment = async (req, res) => {
  try {
    const segment = await Segment.findByIdAndDelete(req.params.id);
    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }
    res.json({ message: 'Segment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete segment' });
  }
};

exports.getSegments = async (req, res) => {
  try {
    const segments = await Segment.find();
    res.json(segments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve segments' });
  }
};

exports.getSegmentById = async (req, res) => {
  try {
    const segment = await Segment.findById(req.params.id);
    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }
    res.json(segment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve segment' });
  }
};

exports.updateSegment = async (req, res) => {
  try {
    const { name, criteria } = req.body;
    const segment = await Segment.findByIdAndUpdate(
      req.params.id,
      { name, criteria },
      { new: true }
    );
    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }
    res.redirect('/segments.html');
  } catch (error) {
    res.status(500).json({ error: 'Failed to update segment' });
  }
};


exports.refreshSegment = async (req, res) => {
  try {
    const segment = await Segment.findById(req.params.id);
    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    // Refresh the segment data based on the criteria
    const { criteria } = segment;
    const campaigns = await Campaign.find();

    let segmentEmails = new Set();

    const evaluateCriterion = (criterion, email) => {
      const { field, value, timeframe } = criterion;

      let filteredCampaigns = campaigns;

      if (timeframe === 'campaigns') {
        filteredCampaigns = campaigns.slice(-value);
      }

      switch (field) {
        case 'hasOpened':
          return filteredCampaigns.some((campaign) => campaign.openers.includes(email));
        case 'hasNotOpened':
          return filteredCampaigns.every((campaign) => !campaign.openers.includes(email));
        case 'hasClicked':
          return filteredCampaigns.some((campaign) => campaign.clickers.includes(email));
        case 'hasNotClicked':
          return filteredCampaigns.every((campaign) => !campaign.clickers.includes(email));
        case 'hasDelivered':
          return filteredCampaigns.some((campaign) => campaign.delivered.includes(email));
        case 'hasNotDelivered':
          return filteredCampaigns.every((campaign) => !campaign.delivered.includes(email));
        case 'hasUnsubscribed':
          return filteredCampaigns.some((campaign) => campaign.unsubscribed.includes(email));
        case 'hasNotUnsubscribed':
          return filteredCampaigns.every((campaign) => !campaign.unsubscribed.includes(email));
        case 'hasBounced':
          return filteredCampaigns.some((campaign) => campaign.bouncers.map((bouncer) => bouncer.email).includes(email));
        case 'hasNotBounced':
          return filteredCampaigns.every((campaign) => !campaign.bouncers.map((bouncer) => bouncer.email).includes(email));
        default:
          return false;
      }
    };

    const evaluateCriteria = (email) => {
      let result = true;

      for (const criterion of criteria) {
        const { operator } = criterion;

        if (operator === 'and') {
          result = result && evaluateCriterion(criterion, email);
        } else if (operator === 'or') {
          result = result || evaluateCriterion(criterion, email);
        }
      }

      return result;
    };

    campaigns.forEach((campaign) => {
      campaign.delivered.forEach((email) => {
        if (evaluateCriteria(email)) {
          segmentEmails.add(email);
        }
      });
    });

    segment.totalCount = segmentEmails.size;
    segment.emails = Array.from(segmentEmails);
    segment.lastUpdated = new Date();
    await segment.save();

    res.json(segment);
  } catch (error) {
    console.error('Failed to refresh segment:', error);
    res.status(500).json({ error: 'Failed to refresh segment' });
  }
};




  
  
  
  


exports.getSegmentEditPage = async (req, res) => {
  try {
    const segment = await Segment.findById(req.params.id);
    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }
    res.render('segmentBuilder', { segment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve segment' });
  }
};



exports.exportSegment = async (req, res) => {
  try {
    const segment = await Segment.findById(req.params.id);
    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    // Extract the email addresses from the segment
    const emailAddresses = segment.emails;

    // Generate the CSV data
    const csvData = emailAddresses.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="segment.csv"');
    res.send(csvData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export segment' });
  }
};



