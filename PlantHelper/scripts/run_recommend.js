#!/usr/bin/env node
// Simple helper to POST a recommend payload to the local server (like your curl test)
// Usage: node scripts/run_recommend.js [host]

const http = require('http');
const https = require('https');

const host = process.argv[2] || 'http://localhost:8000';
const url = new URL('/recommend', host).toString();

const payload = {
  identification: {},
  meta: { busyLevel: 'very', sunlight: 'low', space: 'small', watering: 'rare', climate: 'temperate' },
};

(async () => {
  try {
    const lib = url.startsWith('https') ? https : http;
    const body = JSON.stringify(payload);
    const u = new URL(url);
    const opts = { method: 'POST', hostname: u.hostname, port: u.port, path: u.pathname, headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } };
    const req = lib.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        console.log('HTTP', res.statusCode);
        try { console.log(JSON.stringify(JSON.parse(data), null, 2)); } catch (e) { console.log(data); }
      });
    });
    req.on('error', (err) => { console.error('Request error', err); process.exit(1); });
    req.write(body);
    req.end();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
