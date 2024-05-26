const path = require('path');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const helmet = require('helmet');
const crypto = require('crypto');
const app = express();

const HTTP_PORT =  8199;

app.use((req, res, next) => {
    res.locals.nonce = crypto.randomBytes(16).toString('base64');
    next();
});

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'", "wss://websocket-server-2x1r.onrender.com"],
            scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`]
        }
    }
}));

const server = http.createServer(app);
const wsServer = new WebSocket.Server({ server });

wsServer.on('connection', (ws) => {
    console.log('Connected');
    ws.on('message', (data) => {
        const base64Data = Buffer.from(data).toString('base64');
        ws.send(base64Data);
    });
    ws.on('close', () => {
        console.log('Connection closed');
    });
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

app.get('/client', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Client</title>
            <meta http-equiv="Content-Security-Policy" content="connect-src 'self' wss://websocket-server-2x1r.onrender.com; script-src 'self' 'nonce-${res.locals.nonce}'">
        </head>
        <body>
            <img id="image" src="" width="450" height="320">
            <script nonce="${res.locals.nonce}">
                const img = document.getElementById('image');
                const WS_URL = 'wss://websocket-server-2x1r.onrender.com';
                const ws = new WebSocket(WS_URL);

                ws.onopen = () => console.log(\`Connected to \${WS_URL}\`);

                ws.onmessage = message => {
                    const base64Data = message.data; // Assuming server sends base64 directly
                    img.src = \`data:image/jpeg;base64,\${base64Data}\`;
                }

                ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                }

                ws.onclose = () => {
                    console.log('WebSocket connection closed');
                }
            </script>
        </body>
        </html>
    `);
});

server.listen(HTTP_PORT, () => {
    console.log(`HTTP server listening at ${HTTP_PORT}`);
}).on('error', (error) => {
    console.error('HTTP server error:', error);
});
