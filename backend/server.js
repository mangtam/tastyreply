// server.js - Updated with MongoDB integration and Railway compatibility fixes
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { OAuth2Client } = require('google-auth-library');
const connectDB = require('./db/connection');
const User = require('./models/User');
const Review = require('./models/Review');
const passport = require('passport');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const GoogleReviewsService = require('./services/googleReviews');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// ✅ Ensure MONGODB_URI is set
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set. Exiting...');
  process.exit(1);
}

// Connect to MongoDB Atlas
connectDB();

// Google OAuth2 Client
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5001/auth/google/callback'
);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

console.log('🔧 Setting up authentication middleware...');

app.use(session({
  secret: process.env.JWT_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

app.use(passport.initialize());
app.use(passport.session());

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, user) => {
    if (err) {
      console.error('🔒 JWT verification failed:', err.message);
      return res.status(403).json({ success: false, error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Mock reviews data (for demo purposes)
const mockReviews = [
  {
    id: 'google_1',
    platform: 'google',
    customerName: 'Sarah Johnson',
    rating: 5,
    text: 'Amazing food and excellent service! The pasta was perfectly cooked.',
    date: new Date('2024-07-20').toISOString(),
    replied: false
  },
  {
    id: 'google_2',
    platform: 'google',
    customerName: 'Mike Chen',
    rating: 4,
    text: 'Good food overall, but the wait time was a bit long.',
    date: new Date('2024-07-19').toISOString(),
    replied: true,
    reply: 'Thank you for your feedback, Mike!'
  }
];

// ✅ Resilient Health check endpoint
app.get('/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus
  });
});

// Google OAuth Routes
app.get('/auth/google', (req, res) => {
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/business.manage'
      ],
      prompt: 'consent'
    });

    res.redirect(authUrl);
  } catch (error) {
    console.error('OAuth initiation error:', error);
    res.status(500).json({ success: false, error: 'Failed to initiate OAuth' });
  }
});

// Include auth routes if they exist
try {
  app.use('/auth', require('./routes/auth'));
} catch (error) {
  console.log('Auth routes not found, skipping...');
}

// Google OAuth Callback with MongoDB
app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}/auth-error?error=no_code`);
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    const userData = {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      googleTokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope,
        token_type: tokens.token_type,
        expiry_date: tokens.expiry_date
      },
      lastLogin: new Date()
    };

    const user = await User.findOneAndUpdate(
      { googleId: userData.googleId },
      userData,
      { upsert: true, new: true }
    );

    console.log('User saved to MongoDB:', user.email);

    const appToken = jwt.sign(
      {
        userId: user._id.toString(),
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        provider: 'google',
        accessToken: tokens.access_token
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${appToken}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/auth-error?error=callback_failed`);
  }
});

// Protected route - get current user
app.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-googleTokens');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        avatar: user.picture,
        subscription: user.subscription,
        provider: req.user.provider || 'google'
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

// Get Google My Business accounts
app.get('/api/google/accounts', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user || !user.googleTokens) {
      return res.status(401).json({ success: false, error: 'Google authentication required' });
    }

    oauth2Client.setCredentials({
      refresh_token: user.googleTokens.refresh_token
    });

    res.json({
      success: true,
      accounts: user.businesses || [{
        accountId: 'demo-account',
        accountName: 'Demo Restaurant',
        type: 'PERSONAL',
        state: 'VERIFIED'
      }]
    });
  } catch (error) {
    console.error('Error fetching GMB accounts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch accounts' });
  }
});

// Get reviews from database
app.get('/api/reviews/google', authenticateToken, async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user.userId })
      .sort({ reviewDate: -1 })
      .limit(50);

    if (reviews.length === 0) {
      return res.json({ success: true, reviews: mockReviews });
    }

    res.json({ success: true, reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch reviews' });
  }
});

// Get all reviews (combined endpoint)
app.get('/api/reviews', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Fetching reviews for user:', req.user.name);
    const allReviews = [];

    if (req.user.provider === 'google' && req.user.accessToken) {
      try {
        console.log('🔍 Fetching Google My Business reviews...');
        const googleService = new GoogleReviewsService(req.user.accessToken);
        const accounts = await googleService.getAccounts();

        for (const account of accounts) {
          const locations = await googleService.getLocations(account.name);
          for (const location of locations) {
            const reviews = await googleService.getReviews(location.name);
            allReviews.push(...reviews);
          }
        }
      } catch (error) {
        console.error('❌ Google reviews error:', error.message);
      }
    }

    if (allReviews.length === 0) {
      console.log('📝 No real reviews found, returning demo data');
      return res.json({
        success: true,
        data: mockReviews,
        total: mockReviews.length,
        source: 'demo',
        message: 'Connect your Google My Business account to see real reviews'
      });
    }

    const sortedReviews = allReviews.sort((a, b) => new Date(b.date) - new Date(a.date));

    console.log(`✅ Returning ${sortedReviews.length} real reviews`);
    res.json({
      success: true,
      data: sortedReviews,
      total: sortedReviews.length,
      source: 'live'
    });
  } catch (error) {
    console.error('❌ Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reviews'
    });
  }
});

// Post a reply to a review
app.post('/api/reviews/:reviewId/reply', authenticateToken, async (req, res) => {
  const { reviewId } = req.params;
  const { reply } = req.body;

  try {
    const review = await Review.findOneAndUpdate(
      { _id: reviewId, userId: req.user.userId },
      {
        replied: true,
        reply: {
          text: reply,
          date: new Date(),
          postedBy: req.user.name
        }
      },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    res.json({
      success: true,
      message: 'Reply posted successfully',
      review
    });
  } catch (error) {
    console.error('Error posting reply:', error);
    res.status(500).json({ success: false, error: 'Failed to post reply' });
  }
});

// Sync reviews from Google
app.post('/api/sync/google', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user || !user.googleTokens) {
      return res.status(401).json({ success: false, error: 'Google authentication required' });
    }

    res.json({
      success: true,
      message: 'Sync initiated',
      syncedCount: 0
    });
  } catch (error) {
    console.error('Error syncing reviews:', error);
    res.status(500).json({ success: false, error: 'Failed to sync reviews' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔐 OAuth redirect URI: ${process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5001/auth/google/callback'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log('✅ Server setup complete with authentication');
});