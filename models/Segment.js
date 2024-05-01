const mongoose = require('mongoose');

const segmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  criteria: [
    {
      field: { type: String, required: true },
      operator: { type: String, required: true },
      value: { type: Number, required: true },
      timeframe: { type: String, required: true },
    },
  ],
  totalCount: { type: Number, default: 0 },
  emails: [{ type: String }],
  lastUpdated: { type: Date, default: Date.now },
});

const Segment = mongoose.model('Segment', segmentSchema);
module.exports = Segment;
