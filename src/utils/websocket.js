import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL ||
  'https://project-interface-melo-backend-production.up.railway.app';

const BASE_WS = API_URL
  .replace('https://', 'wss://')
  .replace('http://', 'ws://');

let ws = null;
let reconnectTimer = null;
let shouldReconnect = false; // set false by wsDisconnect() to stop the reconnect loop

export const wsConnect = async (userId, onMessage) => {
  shouldReconnect = true;

  const token = await SecureStore.getItemAsync('access_token');
  if (!token || !userId) return;

  const url = `${BASE_WS}/ws/${userId}?token=${token}`;
  ws = new WebSocket(url);

  ws.onopen = () => {
    console.log('[WS] Connected');
    clearInterval(reconnectTimer);
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
    clearInterval(reconnectTimer);
    if (shouldReconnect) {
      console.log('[WS] Disconnected — reconnecting in 3s');
      setTimeout(() => wsConnect(userId, onMessage), 3000);
    }
  };

  ws.onerror = (e) => console.log('[WS] Error:', e.message);
};

export const wsDisconnect = () => {
  shouldReconnect = false;
  clearInterval(reconnectTimer);
  ws?.close();
  ws = null;
};
