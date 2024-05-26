const path = require('path');
const express = require('express');
const WebSocket = require('ws');
const helmet = require('helmet');
const app = express();

const WS_PORT = process.env.PORT || 8899;
const HTTP_PORT = 8199;

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'", "wss://websocket-server-2x1r.onrender.com"]
        }
    }
}));

const wsServer = new WebSocket.Server({ port: WS_PORT }, () => {
    console.log(`WS Server is listening at ${WS_PORT}`);
});

// Handle WebSocket server errors
wsServer.on('error', (error) => {
    console.error('WebSocket server error:', error);
});

let connectedClients = new Set();

wsServer.on('connection', (ws, req) => {
    console.log('Connected');
    connectedClients.add(ws);

    // Handle individual WebSocket connection errors
    ws.on('error', (error) => {
        console.error('WebSocket connection error:', error);
        connectedClients.delete(ws);
    });

    ws.on('close', () => {
        console.log('Connection closed');
        connectedClients.delete(ws);
    });

    ws.on('message', (data) => {
        try {
            const base64Data = Buffer.from(data).toString('base64'); // Convert binary data to base64
            const clientsToRemove = [];
            for (let client of connectedClients) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(base64Data, (err) => {
                        if (err) {
                            console.error('Error sending message:', err);
                            if (err.code === 'ECONNRESET' || err.code === 'EPIPE') {
                                console.log('Removing disconnected client');
                                clientsToRemove.push(client);
                            }
                        }
                    });
                } else {
                    clientsToRemove.push(client);
                }
            }
            clientsToRemove.forEach(client => connectedClients.delete(client));
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });
});

app.get('/client', (req, res) => {
    res.sendFile(path.resolve(__dirname, './index.html'), (err) => {
        if (err) {
            console.error('Error sending client.html:', err);
            res.status(500).send('Internal Server Error');
        }
    });
});

app.listen(HTTP_PORT, () => {
    console.log(`HTTP server listening at ${HTTP_PORT}`);
}).on('error', (error) => {
    console.error('HTTP server error:', error);
});