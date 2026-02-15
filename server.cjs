const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
    // Remover query strings de la URL
    let filePath = '.' + req.url.split('?')[0];
    if (filePath === './') {
        filePath = './actividad0.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    console.log(`📥 Solicitando: ${req.url} -> ${filePath}`);

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                console.log(`❌ No encontrado: ${filePath}`);
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - Archivo no encontrado</h1>', 'utf-8');
            } else {
                console.log(`❌ Error: ${error.code}`);
                res.writeHead(500);
                res.end('Error del servidor: ' + error.code, 'utf-8');
            }
        } else {
            console.log(`✅ Servido: ${filePath}`);
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📂 Abre: http://localhost:${PORT}/actividad0.html`);
});
