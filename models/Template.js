// models/Template.js
const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  fromName: { type: String, required: true },
  fromEmail: { type: String, required: true },
  htmlContent: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Template = mongoose.model('Template', templateSchema);

module.exports = Template;
