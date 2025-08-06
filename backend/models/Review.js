const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    enum: ['google', 'facebook', 'yelp', 'tripadvisor'],
    required: true
  },
  platformReviewId: {
    type: String,
    required: true
  },
  businessId: String,
  customerName: String,
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  text: String,
  reviewDate: Date,
  replied: {
    type: Boolean,
    default: false
  },
  reply: {
    text: String,
    date: Date,
    postedBy: String
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative']
  },
  keywords: [String],
  syncedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to prevent duplicate reviews
reviewSchema.index({ platformReviewId: 1, platform: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);