const https = require('https');
const fs = require('fs');
const path = require('path');

const options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
};

const distPath = path.join(__dirname, 'dist');

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webmanifest': 'application/manifest+json'
};

https.createServer(options, (req, res) => {
    let filePath = path.join(distPath, req.url === '/' ? '/index.html' : req.url);

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                fs.readFile(path.join(distPath, 'index.html'), (err, content) => {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(content, 'utf-8');
                });
            } else {
                res.writeHead(500);
                res.end('Server error: ' + err.code);
            }
        } else {
            const ext = path.extname(filePath);
            const contentType = mimeTypes[ext] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
}).listen(3443, '0.0.0.0', () => {
    console.log('HTTPS Server running on:');
    console.log('  Local: https://localhost:3443/');
    console.log('  Network: https://192.168.0.104:3443/');
    console.log('\nNote: Accept the self-signed certificate warning in your browser');
});
