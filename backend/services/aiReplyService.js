// backend/services/aiReplyService.js
const OpenAI = require('openai');

class AIReplyService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate multiple reply options for a review
   */
  async generateReplies(review, businessInfo = {}) {
    const { customerName, rating, text } = review;
    const { businessName = 'our restaurant', businessType = 'restaurant' } = businessInfo;

    const tones = ['professional', 'friendly', 'apologetic', 'enthusiastic'];
    const replies = [];

    for (const tone of tones) {
      const prompt = this.buildPrompt(review, businessInfo, tone);
      
      try {
        const completion = await this.openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are a helpful assistant that writes ${tone} responses to customer reviews for a ${businessType}. Keep responses concise (2-3 sentences), genuine, and address specific points mentioned in the review.`
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 150
        });

        replies.push({
          text: completion.choices[0].message.content.trim(),
          tone
        });
      } catch (error) {
        console.error(`Error generating ${tone} reply:`, error);
        replies.push({
          text: this.getFallbackReply(rating, customerName, tone),
          tone
        });
      }
    }

    return replies;
  }

  buildPrompt(review, businessInfo, tone) {
    const { customerName, rating, text } = review;
    const { businessName } = businessInfo;

    let contextualInstructions = '';

    if (rating >= 4) {
      contextualInstructions = 'Thank them for the positive feedback and invite them back.';
    } else if (rating === 3) {
      contextualInstructions = 'Acknowledge their mixed experience and express desire to improve.';
    } else {
      contextualInstructions = 'Apologize sincerely and offer to make things right.';
    }

    return `
Write a ${tone} response to this ${rating}-star review from ${customerName}:
"${text}"

Business name: ${businessName}
Instructions: ${contextualInstructions}
`;
  }

  getFallbackReply(rating, customerName, tone) {
    const replies = {
      professional: {
        high: `Thank you for your excellent review, ${customerName}. We're delighted you had a positive experience and look forward to serving you again soon.`,
        medium: `Thank you for your feedback, ${customerName}. We appreciate your honest review and will use it to improve our service.`,
        low: `Dear ${customerName}, we sincerely apologize for not meeting your expectations. Please contact us directly so we can address your concerns.`
      },
      friendly: {
        high: `Hi ${customerName}! Thanks so much for the amazing review! We're thrilled you enjoyed your visit and can't wait to see you again! 😊`,
        medium: `Hi ${customerName}, thanks for taking the time to share your thoughts! We'd love the chance to turn your 3-star experience into a 5-star one next time!`,
        low: `Hi ${customerName}, we're really sorry to hear about your experience. This isn't like us at all - please give us another chance to make it right!`
      },
      apologetic: {
        high: `${customerName}, we're grateful for your kind words and wonderful rating. Your satisfaction means everything to us.`,
        medium: `${customerName}, we appreciate your feedback and apologize for any aspects that didn't meet your expectations. We're committed to doing better.`,
        low: `${customerName}, we are deeply sorry for your disappointing experience. This falls far short of our standards, and we'd like to make amends.`
      },
      enthusiastic: {
        high: `WOW! Thank you so much, ${customerName}! Your amazing review made our day! We're absolutely thrilled you loved your experience! 🌟`,
        medium: `Hey ${customerName}! Thanks for the honest feedback! We're pumped to have the chance to wow you next time - challenge accepted! 💪`,
        low: `${customerName}, thank you for bringing this to our attention! We're incredibly motivated to turn this around and show you the experience you deserve!`
      }
    };

    const level = rating >= 4 ? 'high' : rating === 3 ? 'medium' : 'low';
    return replies[tone][level];
  }

  /**
   * Analyze review sentiment
   */
  analyzeSentiment(review) {
    const { rating, text } = review;
    
    // Simple sentiment based on rating
    if (rating >= 4) return 'positive';
    if (rating <= 2) return 'negative';
    
    // For 3-star reviews, analyze text
    const positiveWords = ['good', 'nice', 'great', 'excellent', 'love', 'delicious', 'friendly'];
    const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'hate', 'cold', 'slow', 'rude'];
    
    const textLower = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => textLower.includes(word)).length;
    const negativeCount = negativeWords.filter(word => textLower.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Extract keywords from review
   */
  extractKeywords(review) {
    const { text } = review;
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'is', 'are', 'am']);
    
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word));
    
    // Count word frequency
    const wordFreq = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    // Return top 5 most frequent words
    return Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }
}

module.exports = new AIReplyService();

// backend/routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const aiReplyService = require('../services/aiReplyService');
const Review = require('../models/Review');
const AIReply = require('../models/AIReply');
const { authenticateToken } = require('../middleware/auth');

// Generate AI replies for a review
router.post('/generate-reply/:reviewId', authenticateToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { businessInfo } = req.body;
    
    // Get the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }
    
    // Check if user owns the review
    if (review.userId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    
    // Generate replies
    const replies = await aiReplyService.generateReplies(review, businessInfo);
    
    // Save to database
    const aiReply = await AIReply.findOneAndUpdate(
      { reviewId, userId: req.user.userId },
      {
        generatedReplies: replies,
        reviewId,
        userId: req.user.userId
      },
      { upsert: true, new: true }
    );
    
    res.json({
      success: true,
      replies,
      aiReplyId: aiReply._id
    });
  } catch (error) {
    console.error('Error generating AI reply:', error);
    res.status(500).json({ success: false, error: 'Failed to generate reply' });
  }
});

// Save selected/edited reply
router.post('/save-reply/:aiReplyId', authenticateToken, async (req, res) => {
  try {
    const { aiReplyId } = req.params;
    const { selectedReply, edited, finalReply } = req.body;
    
    const aiReply = await AIReply.findOneAndUpdate(
      { _id: aiReplyId, userId: req.user.userId },
      {
        selectedReply,
        edited,
        finalReply
      },
      { new: true }
    );
    
    if (!aiReply) {
      return res.status(404).json({ success: false, error: 'AI reply not found' });
    }
    
    res.json({ success: true, aiReply });
  } catch (error) {
    console.error('Error saving reply:', error);
    res.status(500).json({ success: false, error: 'Failed to save reply' });
  }
});

module.exports = router;