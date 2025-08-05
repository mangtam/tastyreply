const mongoose = require('mongoose');

const aiReplySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
    required: true
  },
  generatedReplies: [{
    text: String,
    tone: {
      type: String,
      enum: ['professional', 'friendly', 'apologetic', 'enthusiastic']
    },
    generatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  selectedReply: String,
  edited: Boolean,
  finalReply: String,
  posted: {
    type: Boolean,
    default: false
  },
  postedAt: Date
});

module.exports = mongoose.model('AIReply', aiReplySchema);