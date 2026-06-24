import express from 'express';
import { STOCKS_LIST, getPrice, getHistory } from '../services/market.js';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ stocks: STOCKS_LIST });
});

router.get('/:ticker/price', async (req, res) => {
  const { ticker } = req.params;
  try {
    const price = await getPrice(ticker.toUpperCase());
    if (!price) {
      return res.status(404).json({ error: 'Stock symbol not found.' });
    }
    res.json({ ticker: ticker.toUpperCase(), price });
  } catch {
    res.status(500).json({ error: 'Failed to fetch price.' });
  }
});

router.get('/:ticker/history', async (req, res) => {
  const { ticker } = req.params;
  try {
    const history = await getHistory(ticker.toUpperCase());
    if (!history) {
      return res.status(404).json({ error: 'No history found for this symbol.' });
    }
    const hasRealKey = !!process.env.FINNHUB_API_KEY;
    res.json({ 
      ticker: ticker.toUpperCase(), 
      history, 
      isRealTime: hasRealKey
    });
  } catch (err) {
    console.error(`[Stocks] Error retrieving history for ${ticker}:`, err.message);
    res.status(500).json({ error: 'Failed to fetch chart data.' });
  }
});

router.get('/watchlist/list', authenticateToken, async (req, res) => {
  try {
    const tickers = await db.getWatchlist(req.user.id);
    res.json({ watchlist: tickers });
  } catch (err) {
    console.error('[Stocks] Watchlist fetch error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve watchlist.' });
  }
});

router.post('/watchlist/add', authenticateToken, async (req, res) => {
  const { ticker } = req.body;
  if (!ticker) {
    return res.status(400).json({ error: 'Ticker symbol is required.' });
  }

  const upperTicker = ticker.toUpperCase();
  if (!STOCKS_LIST.some(s => s.ticker === upperTicker)) {
    return res.status(400).json({ error: 'Invalid stock symbol.' });
  }

  try {
    await db.addToWatchlist(req.user.id, upperTicker);
    res.json({ message: `${upperTicker} added to watchlist.` });
  } catch (err) {
    console.error('[Stocks] Watchlist add error:', err.message);
    res.status(500).json({ error: 'Failed to add to watchlist.' });
  }
});

router.delete('/watchlist/remove/:ticker', authenticateToken, async (req, res) => {
  const upperTicker = req.params.ticker.toUpperCase();
  try {
    await db.removeFromWatchlist(req.user.id, upperTicker);
    res.json({ message: `${upperTicker} removed from watchlist.` });
  } catch (err) {
    console.error('[Stocks] Watchlist remove error:', err.message);
    res.status(500).json({ error: 'Failed to remove from watchlist.' });
  }
});

export default router;
