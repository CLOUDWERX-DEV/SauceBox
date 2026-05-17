const http = require('http');
const state = require('../state');

function isAllowedUrl(value) {
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch (error) {
    return false;
  }
}

function startExtensionServer() {
  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'POST' && req.url === '/add-download') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
        if (body.length > 8192) req.destroy();
      });
      req.on('end', () => {
        try {
          const { url } = JSON.parse(body);
          if (!isAllowedUrl(url)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid URL' }));
            return;
          }
          if (state.mainWindow) {
            state.mainWindow.webContents.send('external-add-url', url);
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  
  server.listen(13337, '127.0.0.1');
}

module.exports = { startExtensionServer };
