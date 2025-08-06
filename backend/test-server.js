// Minimal test server for Railway debugging
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5001;

app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    port: PORT,
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
});