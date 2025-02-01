const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static(path.join(__dirname)));
app.use(express.json());

// In-memory message store (replace with a database in production)
let messages = [];
const MAX_MESSAGES = 100;

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('New client connected');
    
    // Send existing messages to new client
    ws.send(JSON.stringify({
        type: 'init',
        messages: messages
    }));

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            
            if (message.type === 'chat') {
                // Add new message
                messages.push({
                    id: message.id,
                    text: message.text,
                    emoji: message.emoji,
                    timestamp: message.timestamp
                });

                // Keep only last MAX_MESSAGES
                if (messages.length > MAX_MESSAGES) {
                    messages = messages.slice(-MAX_MESSAGES);
                }

                // Broadcast to all clients
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'update',
                            message: messages[messages.length - 1]
                        }));
                    }
                });
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// REST endpoints for message history
app.get('/api/messages', (req, res) => {
    res.json(messages);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 