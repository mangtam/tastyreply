const express = require('express');
const router = express.Router();

// Simple test route first
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Auth routes working!', 
    timestamp: new Date().toISOString(),
    success: true
  });
});

console.log('✅ Auth routes loaded');
module.exports = router;