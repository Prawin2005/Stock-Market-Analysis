import { WebSocketServer } from 'ws';
import { subscribeToPrices, getAllPrices } from '../services/market.js';

export function initWebSocketServer(server) {
  const wss = new WebSocketServer({ noServer: true });
  console.log('[WebSocket] Server initialized.');

  wss.on('connection', async (ws) => {
    try {
      const initialPrices = await getAllPrices();
      ws.send(JSON.stringify({ type: 'INITIAL_PRICES', prices: initialPrices }));
    } catch (err) {
      console.error('[WebSocket] Failed to send initial prices:', err.message);
    }

    ws.on('error', (err) => {
      console.error('[WebSocket] Client error:', err.message);
    });
  });

  subscribeToPrices((updates) => {
    const message = JSON.stringify({ type: 'PRICE_UPDATES', prices: updates });
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(message);
      }
    });
  });

  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  return wss;
}
