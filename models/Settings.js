const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    customFooter: { type: String, default: '' },
    unsubscribeString: { type: String, default: '' },
});

module.exports = mongoose.model('Settings', settingsSchema);
