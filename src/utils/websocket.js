import * as SecureStore from 'expo-secure-store';

const BASE_WS = (process.env.EXPO_PUBLIC_API_URL || 'https://YOUR_RAILWAY_URL.up.railway.app')
  .replace('https://', 'wss://')
  .replace('http://', 'ws://');

let ws = null;
let reconnectTimer = null;
let listeners = {};

export const wsConnect = async (userId, onMessage) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (!token || !userId) return;

  const url = `${BASE_WS}/ws/${userId}?token=${token}`;
  ws = new WebSocket(url);

  ws.onopen = () => {
    console.log('[WS] Connected');
    clearInterval(reconnectTimer);
    // Heartbeat
    reconnectTimer = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) ws.send('ping');
    }, 30000);
  };

  ws.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      if (data === 'pong') return;
      onMessage(data);
    } catch {}
  };

  ws.onclose = () => {
    console.log('[WS] Disconnected — reconnecting in 3s');
    clearInterval(reconnectTimer);
    setTimeout(() => wsConnect(userId, onMessage), 3000);
  };

  ws.onerror = (e) => console.log('[WS] Error:', e.message);
};

export const wsDisconnect = () => {
  clearInterval(reconnectTimer);
  ws?.close();
  ws = null;
};
