// Absolute minimal server for Railway debugging
const http = require('http');

const PORT = process.env.PORT || 5001;

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok',
      port: PORT,
      timestamp: new Date().toISOString(),
      env: {
        NODE_ENV: process.env.NODE_ENV || 'not set',
        PORT: process.env.PORT || 'not set',
        MONGODB_URI: process.env.MONGODB_URI ? 'set' : 'not set'
      }
    }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Minimal server running on port ${PORT}`);
  console.log('Environment variables:', {
    NODE_ENV: process.env.NODE_ENV || 'not set',
    PORT: process.env.PORT || 'not set',
    MONGODB_URI: process.env.MONGODB_URI ? 'set' : 'not set'
  });
});