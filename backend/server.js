import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import rateLimit from 'express-rate-limit';

import { initDb } from './db.js';
import { initCache } from './cache.js';
import { initMarketData } from './services/market.js';
import { initWebSocketServer } from './websocket/socket.js';

import authRouter from './routes/auth.js';
import portfolioRouter from './routes/portfolio.js';
import stocksRouter from './routes/stocks.js';
import tradingRouter from './routes/trading.js';
import aiRouter from './routes/ai.js';
import reportsRouter from './routes/reports.js';

const app = express();
const port = process.env.PORT || 5000;

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

app.use('/api/auth', authLimiter, authRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/stocks', stocksRouter);
app.use('/api/trading', tradingRouter);
app.use('/api/ai', aiRouter);
app.use('/api/reports', reportsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

const server = http.createServer(app);

async function startServer() {
  await initDb();
  await initCache();
  await initMarketData();
  initWebSocketServer(server);

  server.listen(port, () => {
    console.log(`[Server] Listening on http://localhost:${port}`);
    console.log(`[Server] WebSocket bound to ws://localhost:${port}/ws`);
    console.log(`[Server] CORS origin: ${allowedOrigin}`);
  });
}

startServer().catch(err => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
