const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const router = express.Router();

console.log('🔐 Setting up authentication routes...');

// Configure Passport serialization
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('✅ Google OAuth Success for:', profile.displayName);
    
    const user = {
      id: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      avatar: profile.photos[0].value,
      accessToken: accessToken,
      refreshToken: refreshToken,
      provider: 'google'
    };
    
    return done(null, user);
  } catch (error) {
    console.error('❌ Google OAuth Error:', error);
    return done(error, null);
  }
}));

// Routes
router.get('/google', (req, res, next) => {
  console.log('🚀 Starting Google OAuth flow...');
  passport.authenticate('google', { 
    scope: [
      'profile', 
      'email', 
      'https://www.googleapis.com/auth/business.manage'
    ]
  })(req, res, next);
});

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    try {
      console.log('🔄 Processing OAuth callback for:', req.user.name);
      const token = jwt.sign(req.user, process.env.JWT_SECRET, { expiresIn: '7d' });
      console.log('✅ JWT token created, redirecting to dashboard...');
      res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}`);
    } catch (error) {
      console.error('❌ JWT Error:', error);
      res.redirect(`${process.env.FRONTEND_URL}?error=auth_failed`);
    }
  }
);

// Test route
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Auth routes working!', 
    timestamp: new Date().toISOString() 
  });
});

console.log('✅ Authentication routes configured');
module.exports = router;