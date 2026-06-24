import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const AI_SEED_DATA = [
  {
    ticker: 'NVDA',
    recommendation: 'BUY',
    score: 92,
    rationale: 'NVIDIA maintains near-monopolistic control (85%+) of the AI data center chip market. Growth continues to outpace expectations with Blackwell GPU launch. Extremely strong return on equity and profit margins justify premium multiples.',
  },
  {
    ticker: 'MSFT',
    recommendation: 'BUY',
    score: 88,
    rationale: 'Microsoft Azure cloud computing platform continues to grab market share through its exclusive OpenAI partnership. Office 365 Copilot monetization represents a high-margin ARR expansion engine that hedges macro cycles.',
  },
  {
    ticker: 'AMZN',
    recommendation: 'BUY',
    score: 84,
    rationale: 'AWS shows re-accelerated growth as cloud optimization cycles wind down and AI workloads increase. Margin gains in e-commerce fulfillment operations and high-growth retail ads segment continue to support profitability.',
  },
  {
    ticker: 'GOOGL',
    recommendation: 'BUY',
    score: 81,
    rationale: 'Search ad revenue remains highly resilient while YouTube Premium growth accelerates. Gemini AI integration across Android, Google Workspace, and GCP provides defensive moats against competitors.',
  },
  {
    ticker: 'AAPL',
    recommendation: 'HOLD',
    score: 62,
    rationale: 'Apple is positioned for massive long-term growth with Apple Intelligence, but hardware replacement cycles are currently elongating in key global markets. Elevated valuations demand patience near term.',
  },
  {
    ticker: 'TSLA',
    recommendation: 'SELL',
    score: 38,
    rationale: 'Global EV demand faces strong pricing headwinds and margin pressure from cheaper competitors. Near-term valuation is heavily reliant on autonomous driving (FSD) and robotics, which face regulatory delays.',
  },
  {
    ticker: 'BTC',
    recommendation: 'BUY',
    score: 74,
    rationale: 'Substantial ETF institutional inflows support strong supply dynamics. While short-term technical indicators show standard crypto volatility, high-liquidity consolidation points to an upward breakout.',
  },
];

const mockConsensus = {
  NVDA: { buy: 35, hold: 4, sell: 1, strongBuy: 20, strongSell: 0 },
  MSFT: { buy: 28, hold: 6, sell: 0, strongBuy: 18, strongSell: 0 },
  AMZN: { buy: 30, hold: 5, sell: 1, strongBuy: 15, strongSell: 0 },
  GOOGL: { buy: 25, hold: 8, sell: 1, strongBuy: 12, strongSell: 0 },
  AAPL: { buy: 18, hold: 15, sell: 2, strongBuy: 10, strongSell: 1 },
  TSLA: { buy: 10, hold: 12, sell: 15, strongBuy: 5, strongSell: 8 },
  BTC: { buy: 12, hold: 5, sell: 2, strongBuy: 8, strongSell: 1 }
};

// Finnhub validation helper
async function validateWithFinnhub(ticker, currentRecommendation) {
  const { FINNHUB_API_KEY } = process.env;

  if (!FINNHUB_API_KEY) {
    // Return NO KEY status but generate realistic mock metrics so the UI displays nicely
    const data = mockConsensus[ticker] || { buy: 10, hold: 10, sell: 2, strongBuy: 5, strongSell: 1 };
    const total = data.strongBuy + data.buy + data.hold + data.sell + data.strongSell;
    const score = Math.round(((data.strongBuy * 100) + (data.buy * 80) + (data.hold * 50) + (data.sell * 20) + (data.strongSell * 0)) / total);
    return {
      validation_status: 'NO KEY',
      consensus_score: score,
      consensus_details: JSON.stringify(data)
    };
  }

  try {
    const url = `https://finnhub.io/api/v1/stock/recommendation?symbol=${ticker}&token=${FINNHUB_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`[AI] Finnhub response not OK for ${ticker}: Status ${response.status}`);
      return { validation_status: 'FAILED', consensus_score: null, consensus_details: null };
    }

    const list = await response.json();
    if (Array.isArray(list) && list.length > 0) {
      const data = list[0]; // Get the latest monthly consensus period
      const strongBuy = data.strongBuy || 0;
      const buy = data.buy || 0;
      const hold = data.hold || 0;
      const sell = data.sell || 0;
      const strongSell = data.strongSell || 0;
      
      const total = strongBuy + buy + hold + sell + strongSell;
      if (total === 0) {
        return { validation_status: 'NO DATA', consensus_score: null, consensus_details: null };
      }

      const consensus_score = Math.round(((strongBuy * 100) + (buy * 80) + (hold * 50) + (sell * 20) + (strongSell * 0)) / total);
      
      // Determine consensus recommendation
      let consensusRec = 'HOLD';
      if (consensus_score >= 65) {
        consensusRec = 'BUY';
      } else if (consensus_score <= 35) {
        consensusRec = 'SELL';
      }

      const validation_status = (currentRecommendation === consensusRec) ? 'VALIDATED' : 'DIVERGENT';

      return {
        validation_status,
        consensus_score,
        consensus_details: JSON.stringify({ buy, hold, sell, strongBuy, strongSell })
      };
    } else {
      return { validation_status: 'NO DATA', consensus_score: null, consensus_details: null };
    }
  } catch (err) {
    console.error(`[AI] Error validating ${ticker} with Finnhub:`, err.message);
    return { validation_status: 'FAILED', consensus_score: null, consensus_details: null };
  }
}

router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    let recs = await db.getAiRecommendations();

    if (recs.length === 0) {
      for (const item of AI_SEED_DATA) {
        const val = await validateWithFinnhub(item.ticker, item.recommendation);
        await db.upsertAiRecommendation(
          item.ticker, 
          item.recommendation, 
          item.score, 
          item.rationale,
          val.validation_status,
          val.consensus_score,
          val.consensus_details
        );
      }
      recs = await db.getAiRecommendations();
    }

    res.json({ recommendations: recs });
  } catch (err) {
    console.error('[AI] Recommendations fetch error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve recommendations.' });
  }
});

router.post('/recalculate', authenticateToken, async (req, res) => {
  try {
    for (const item of AI_SEED_DATA) {
      const noise = Math.floor(Math.random() * 9) - 4;
      const newScore = Math.max(10, Math.min(99, item.score + noise));
      const newRec = newScore > 75 ? 'BUY' : newScore < 45 ? 'SELL' : 'HOLD';

      const val = await validateWithFinnhub(item.ticker, newRec);

      await db.upsertAiRecommendation(
        item.ticker, 
        newRec, 
        newScore, 
        item.rationale,
        val.validation_status,
        val.consensus_score,
        val.consensus_details
      );
    }

    const recs = await db.getAiRecommendations();
    res.json({ message: 'Ratings recalculated.', recommendations: recs });
  } catch (err) {
    console.error('[AI] Recalculate error:', err.message);
    res.status(500).json({ error: 'Failed to update recommendations.' });
  }
});

export default router;
