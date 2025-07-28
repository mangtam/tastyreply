const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const passport = require('passport');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const GoogleReviewsService = require('./services/googleReviews');

// Railway sets PORT environment variable, default to 3000
const PORT = process.env.PORT || 3000;

console.log('🚀 Starting TastyReply server...');
console.log('📍 Port:', PORT);
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Mock reviews data
const mockReviews = [
  {
    id: 1,
    platform: 'google',
    customerName: 'Sarah Johnson',
    rating: 5,
    text: 'Amazing food and excellent service! The pasta was perfectly cooked and the staff was incredibly friendly. Will definitely be back!',
    date: '2024-07-20',
    replied: false,
    avatar: 'SJ'
  },
  {
    id: 2,
    platform: 'facebook',
    customerName: 'Mike Chen',
    rating: 4,
    text: 'Good food overall, but the wait time was a bit long. The ambiance is great though!',
    date: '2024-07-19',
    replied: true,
    reply: 'Thank you for your feedback, Mike! We\'re working on reducing wait times during peak hours. We\'d love to serve you again soon!',
    avatar: 'MC'
  },
  {
    id: 3,
    platform: 'google',
    customerName: 'Emily Rodriguez',
    rating: 2,
    text: 'Disappointed with my experience. Food was cold when it arrived and service was slow.',
    date: '2024-07-18',
    replied: false,
    avatar: 'ER'
  },
  {
    id: 4,
    platform: 'facebook',
    customerName: 'David Kim',
    rating: 5,
    text: 'Best restaurant in town! Fresh ingredients, creative dishes, and outstanding customer service.',
    date: '2024-07-17',
    replied: true,
    reply: 'Thank you so much, David! We\'re thrilled you enjoyed your experience. See you soon!',
    avatar: 'DK'
  }
];

// Health check endpoint - CRITICAL for Railway
app.get('/health', (req, res) => {
  console.log('🔍 Health check requested');
  res.status(200).json({ 
    status: 'OK', 
    message: 'TastyReply API is running',
    timestamp: new Date().toISOString(),
    port: PORT,
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'TastyReply API',
    status: 'running',
    endpoints: {
      health: '/health',
      reviews: '/api/reviews',
      analytics: '/api/analytics'
    }
  });
});

// Get all reviews
app.get('/api/reviews', async (req, res) => {
  try {
    console.log('📊 Fetching reviews');
    const reviews = mockReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json({
      success: true,
      data: reviews,
      total: reviews.length
    });
  } catch (error) {
    console.error('❌ Error fetching reviews:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch reviews' 
    });
  }
});

// Generate AI reply
app.post('/api/ai/generate-reply', async (req, res) => {
  try {
    const { reviewText, rating, customerName, businessType = 'restaurant' } = req.body;
    
    console.log(`🤖 Generating AI reply for ${customerName} (${rating} stars)`);
    
    // Validate required fields
    if (!reviewText || !rating || !customerName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: reviewText, rating, customerName'
      });
    }
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate contextual reply based on rating
    let reply = '';
    
    if (rating >= 4) {
      const positiveReplies = [
        `Thank you so much for the wonderful review, ${customerName}! We're thrilled you enjoyed your experience with us. Your kind words motivate our team to continue providing excellent service. We look forward to welcoming you back soon!`,
        `${customerName}, we're so grateful for your amazing feedback! It means the world to us that you had such a positive experience. We can't wait to serve you again and continue exceeding your expectations!`
      ];
      reply = positiveReplies[Math.floor(Math.random() * positiveReplies.length)];
    } else if (rating === 3) {
      reply = `Hi ${customerName}, thank you for taking the time to share your feedback. We appreciate your honest review and would love the opportunity to improve your experience. Please feel free to reach out to us directly so we can make things right!`;
    } else {
      reply = `Dear ${customerName}, we sincerely apologize for not meeting your expectations. Your feedback is valuable to us, and we're taking immediate steps to address these issues. We'd appreciate the chance to make this right - please contact us directly so we can resolve this matter.`;
    }
    
    res.json({
      success: true,
      data: {
        reply: reply,
        tone: rating >= 4 ? 'grateful' : rating === 3 ? 'understanding' : 'apologetic',
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ AI Reply Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate reply' 
    });
  }
});

// Reply to review
app.post('/api/reviews/:id/reply', async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;
    
    console.log(`💬 Posting reply to review ${id}`);
    
    if (!reply) {
      return res.status(400).json({
        success: false,
        error: 'Reply text is required'
      });
    }
    
    // Find and update the review
    const reviewIndex = mockReviews.findIndex(r => r.id === parseInt(id));
    
    if (reviewIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }
    
    // Update the review with reply
    mockReviews[reviewIndex] = {
      ...mockReviews[reviewIndex],
      replied: true,
      reply: reply,
      repliedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Reply posted successfully',
      data: mockReviews[reviewIndex]
    });
    
  } catch (error) {
    console.error('❌ Reply Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to post reply' 
    });
  }
});

// Get analytics/stats
app.get('/api/analytics', async (req, res) => {
  try {
    console.log('📈 Fetching analytics');
    const reviews = mockReviews;
    const totalReviews = reviews.length;
    const repliedReviews = reviews.filter(r => r.replied).length;
    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
    
    const analytics = {
      totalReviews,
      repliedReviews,
      responseRate: Math.round((repliedReviews / totalReviews) * 100),
      averageRating: Math.round(averageRating * 10) / 10,
      platformBreakdown: {
        google: reviews.filter(r => r.platform === 'google').length,
        facebook: reviews.filter(r => r.platform === 'facebook').length
      },
      ratingDistribution: {
        5: reviews.filter(r => r.rating === 5).length,
        4: reviews.filter(r => r.rating === 4).length,
        3: reviews.filter(r => r.rating === 3).length,
        2: reviews.filter(r => r.rating === 2).length,
        1: reviews.filter(r => r.rating === 1).length
      }
    };
    
    res.json({
      success: true,
      data: analytics
    });
    
  } catch (error) {
    console.error('❌ Analytics Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch analytics' 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('💥 Unhandled error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

app.use('/auth', require('./routes/auth'));

// 404 handler
app.use('*', (req, res) => {
  console.log(`❓ 404 - Route not found: ${req.originalUrl}`);
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found' 
  });
});

app.use('/auth', require('./routes/auth'));


// Start server - CRITICAL: Listen on 0.0.0.0 for Railway
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 TastyReply API Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

app.use('*', (req, res) => {
  console.log(`❓ 404 - Route not found: ${req.originalUrl}`);
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found' 
  });
});

module.exports = app;