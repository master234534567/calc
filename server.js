
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 3000;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.wasm': 'application/wasm',
    '.json': 'application/json; charset=utf-8'
};

http.createServer((req, res) => {
    let pathname;
    try {
        pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch {
        res.writeHead(400);
        res.end('Bad request');
        return;
    }

    const root = path.resolve(__dirname);
    const filePath = path.resolve(root, pathname === '/' ? 'index.html' : `.${pathname}`);
    if (filePath !== root && !filePath.startsWith(root + path.sep)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    let extname = String(path.extname(filePath)).toLowerCase();
    let contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if(error.code == 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1><p>Make sure index.html exists in this folder!</p>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
            }
        } else {
            res.writeHead(200, {
                'Content-Type': contentType,
                'Content-Length': content.length
            });
            res.end(req.method === 'HEAD' ? undefined : content);
        }
    });
}).listen(PORT);

console.log(`Server running at http://localhost:${PORT}/`);
