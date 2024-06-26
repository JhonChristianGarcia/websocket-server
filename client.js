const img = document.getElementById('image');
const WS_URL = 'wss://websocket-server-2x1r.onrender.com';
const ws = new WebSocket(WS_URL);

ws.onopen = () => console.log(`Connected to ${WS_URL}`);

ws.onmessage = message => {
    const base64Data = message.data; // Assuming server sends base64 directly
    img.src = `data:image/jpeg;base64,${base64Data}`;
    console.log(base64Data)
}

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
}

ws.onclose = () => {
    console.log('WebSocket connection closed');
}
