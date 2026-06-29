import { cache } from '../cache.js';
import yahooFinance from 'yahoo-finance2';

export const STOCKS_LIST = [
  { ticker: 'AAPL',  name: 'Apple Inc.',      basePrice: 182.50,  volatility: 0.015, drift:  0.0001 },
  { ticker: 'MSFT',  name: 'Microsoft Corp.', basePrice: 415.60,  volatility: 0.012, drift:  0.0002 },
  { ticker: 'TSLA',  name: 'Tesla Inc.',       basePrice: 177.40,  volatility: 0.035, drift: -0.0003 },
  { ticker: 'NVDA',  name: 'NVIDIA Corp.',     basePrice: 875.12,  volatility: 0.040, drift:  0.0012 },
  { ticker: 'AMZN',  name: 'Amazon.com Inc.',  basePrice: 178.15,  volatility: 0.018, drift:  0.0001 },
  { ticker: 'GOOGL', name: 'Alphabet Inc.',    basePrice: 151.60,  volatility: 0.015, drift:  0.0002 },
  { ticker: 'BTC',   name: 'Bitcoin (USD)',    basePrice: 64250.00, volatility: 0.050, drift: 0.0005 },
];

const currentPrices = new Map();
const historicalCache = new Map();
const listeners = [];

export async function initMarketData() {
  console.log('[Market] Initializing market data with real live prices...');

  for (const stock of STOCKS_LIST) {
    let basePrice = stock.basePrice;
    try {
      let queryTicker = stock.ticker;
      if (stock.ticker === 'BTC') queryTicker = 'BTC-USD';
      
      const quote = await yahooFinance.quote(queryTicker);
      if (quote && quote.regularMarketPrice) {
        basePrice = Number(quote.regularMarketPrice.toFixed(2));
        stock.basePrice = basePrice;
      }
    } catch (err) {
      console.warn(`[Market] Failed to fetch live price for ${stock.ticker}.`);
    }

    currentPrices.set(stock.ticker, basePrice);

    const history = [];
    let price = basePrice;
    const now = new Date();

    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);

      const changePercent = (Math.random() - 0.48) * stock.volatility * 2;
      price = price * (1 + changePercent);

      history.push({
        date: date.toISOString().split('T')[0],
        price: Number(price.toFixed(2)),
        open:  Number((price * (1 - changePercent * 0.2)).toFixed(2)),
        high:  Number((price * (1 + Math.abs(changePercent) * 0.8)).toFixed(2)),
        low:   Number((price * (1 - Math.abs(changePercent) * 0.8)).toFixed(2)),
        close: Number(price.toFixed(2)),
        volume: Math.floor(100000 + Math.random() * 900000),
      });
    }

    historicalCache.set(stock.ticker, history);
  }

  setInterval(fluctuatePrices, 2000);
}

async function fluctuatePrices() {
  const updates = {};

  for (const stock of STOCKS_LIST) {
    const currentPrice = currentPrices.get(stock.ticker);
    const rand = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
    const pctChange = stock.drift + stock.volatility * rand;
    const newPrice = Math.max(0.1, Number((currentPrice * (1 + pctChange)).toFixed(2)));

    currentPrices.set(stock.ticker, newPrice);
    updates[stock.ticker] = newPrice;

    await cache.setEx(`stock:${stock.ticker}:price`, 60, newPrice);
  }

  for (const listener of listeners) {
    listener(updates);
  }
}

export function subscribeToPrices(callback) {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

export async function getAllPrices() {
  const prices = {};
  for (const stock of STOCKS_LIST) {
    const cached = await cache.get(`stock:${stock.ticker}:price`);
    if (cached) {
      prices[stock.ticker] = Number(cached);
      currentPrices.set(stock.ticker, Number(cached));
    } else {
      const memPrice = currentPrices.get(stock.ticker);
      prices[stock.ticker] = memPrice;
      await cache.setEx(`stock:${stock.ticker}:price`, 60, memPrice);
    }
  }
  return prices;
}

export async function getPrice(ticker) {
  const cached = await cache.get(`stock:${ticker}:price`);
  if (cached) return Number(cached);

  const price = currentPrices.get(ticker) || null;
  if (price) {
    await cache.setEx(`stock:${ticker}:price`, 60, price);
  }
  return price;
}

export async function getHistory(ticker) {
  try {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    
    let queryTicker = ticker;
    if (ticker === 'BTC') {
      queryTicker = 'BTC-USD';
    }

    const queryOptions = {
      period1: from,
      period2: to,
      interval: '1d'
    };

    const result = await yahooFinance.chart(queryTicker, queryOptions);
    
    if (result && result.quotes && result.quotes.length > 0) {
      const history = result.quotes.map(quote => {
        const d = new Date(quote.date);
        return {
          date: d.toISOString().split('T')[0],
          price: Number((quote.close || quote.adjclose || 0).toFixed(2)),
          open: Number((quote.open || 0).toFixed(2)),
          high: Number((quote.high || 0).toFixed(2)),
          low: Number((quote.low || 0).toFixed(2)),
          close: Number((quote.close || 0).toFixed(2)),
          volume: quote.volume || 0,
        };
      });
      return history;
    } else {
      console.warn(`[Market] Yahoo Finance returned no data for ${ticker}. Using mock fallback.`);
      return historicalCache.get(ticker) || null;
    }
  } catch (err) {
    console.error(`[Market] Error fetching candles for ${ticker} from Yahoo Finance:`, err.message);
    return historicalCache.get(ticker) || null;
  }
}
