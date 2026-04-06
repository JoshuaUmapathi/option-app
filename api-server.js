const http = require('http');

let handler;
// Use dynamic import because the Vercel function is an ES Module
import('./api/studentvue.js').then(m => {
  handler = m.default;
}).catch(err => {
  console.error("Failed to load api/studentvue.js", err);
});

const server = http.createServer((req, res) => {
  if (!handler) {
    res.statusCode = 500;
    res.end('Handler not loaded yet');
    return;
  }

  // Handle CORS preflight if needed
  if (req.method === 'OPTIONS') {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.url === '/api/studentvue' && req.method === 'POST') {
    let bodyData = '';
    req.on('data', chunk => bodyData += chunk.toString());
    req.on('end', async () => {
      // Set body just like express / vercel does
      req.body = bodyData;
      
      // Mock the res objects Vercel injects
      const proxyRes = {
        setHeader: (name, val) => res.setHeader(name, val),
        status: (code) => { 
          res.statusCode = code; 
          return proxyRes; 
        },
        json: (val) => { 
          res.setHeader('Content-Type', 'application/json'); 
          res.end(JSON.stringify(val)); 
        },
        end: () => res.end(),
      };
      
      try {
        await handler(req, proxyRes);
      } catch (e) {
        console.error(e);
        res.statusCode = 500;
        res.end(e.toString());
      }
    });
  } else {
    res.statusCode = 404;
    res.end('Not found');
  }
});

server.listen(3001, () => {
  console.log('Local Node Mock Server listening for /api/* on port 3001');
});
