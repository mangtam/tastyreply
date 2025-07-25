const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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
  }
];

// Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'TastyReply API is running',
    timestamp: new Date().toISOString() 
  });
});

app.get('/api/reviews', async (req, res) => {
  try {
    const reviews = mockReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ success: true, data: reviews, total: reviews.length });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch reviews' });
  }
});

app.post('/api/ai/generate-reply', async (req, res) => {
  try {
    const { reviewText, rating, customerName } = req.body;
    
    if (!reviewText || !rating || !customerName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    let reply = '';
    if (rating >= 4) {
      reply = `Thank you so much for the wonderful review, ${customerName}! We're thrilled you enjoyed your experience with us. Your kind words motivate our team to continue providing excellent service. We look forward to welcoming you back soon!`;
    } else if (rating === 3) {
      reply = `Hi ${customerName}, thank you for taking the time to share your feedback. We appreciate your honest review and would love the opportunity to improve your experience. Please feel free to reach out to us directly so we can make things right!`;
    } else {
      reply = `Dear ${customerName}, we sincerely apologize for not meeting your expectations. Your feedback is valuable to us, and we're taking immediate steps to address these issues. We'd appreciate the chance to make this right - please contact us directly so we can resolve this matter.`;
    }
    
    res.json({ success: true, data: { reply } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate reply' });
  }
});

app.post('/api/reviews/:id/reply', async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;
    
    if (!reply) {
      return res.status(400).json({ success: false, error: 'Reply text is required' });
    }
    
    const reviewIndex = mockReviews.findIndex(r => r.id === parseInt(id));
    if (reviewIndex === -1) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }
    
    mockReviews[reviewIndex] = {
      ...mockReviews[reviewIndex],
      replied: true,
      reply: reply,
      repliedAt: new Date().toISOString()
    };
    
    res.json({ success: true, message: 'Reply posted successfully', data: mockReviews[reviewIndex] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to post reply' });
  }
});

app.get('/api/analytics', async (req, res) => {
  try {
    const reviews = mockReviews;
    const totalReviews = reviews.length;
    const repliedReviews = reviews.filter(r => r.replied).length;
    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
    
    res.json({
      success: true,
      data: {
        totalReviews,
        repliedReviews,
        responseRate: Math.round((repliedReviews / totalReviews) * 100),
        averageRating: Math.round(averageRating * 10) / 10
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 TastyReply API Server running on port ${PORT}`);
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'TastyReply API is running',
    timestamp: new Date().toISOString(),
    port: PORT 
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 TastyReply API Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

module.exports = app;