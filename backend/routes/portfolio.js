import express from 'express';
import { getPrice } from '../services/market.js';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const user = await db.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const holdings = await db.getPortfolio(user.id);
    const cash = Number(user.balance);

    let totalHoldingsValue = 0;
    let totalCostBasis = 0;
    const holdingsDetails = [];

    for (const hold of holdings) {
      if (hold.shares <= 0) continue;

      const currentPrice = await getPrice(hold.ticker);
      const marketValue = Number((hold.shares * currentPrice).toFixed(2));
      const costBasis = Number((hold.shares * hold.average_buy_price).toFixed(2));
      const profitLoss = Number((marketValue - costBasis).toFixed(2));
      const profitLossPct = costBasis > 0 ? Number(((profitLoss / costBasis) * 100).toFixed(2)) : 0;

      totalHoldingsValue += marketValue;
      totalCostBasis += costBasis;

      holdingsDetails.push({
        ticker: hold.ticker,
        shares: hold.shares,
        averageBuyPrice: hold.average_buy_price,
        currentPrice,
        marketValue,
        costBasis,
        profitLoss,
        profitLossPct,
      });
    }

    const totalPortfolioValue = Number((cash + totalHoldingsValue).toFixed(2));
    const totalProfitLoss = Number((totalHoldingsValue - totalCostBasis).toFixed(2));
    const totalProfitLossPct = totalCostBasis > 0
      ? Number(((totalProfitLoss / totalCostBasis) * 100).toFixed(2))
      : 0;

    res.json({
      summary: {
        cash,
        holdingsValue: Number(totalHoldingsValue.toFixed(2)),
        totalValue: totalPortfolioValue,
        totalCostBasis: Number(totalCostBasis.toFixed(2)),
        totalProfitLoss,
        totalProfitLossPct,
      },
      holdings: holdingsDetails,
    });

  } catch (err) {
    console.error('[Portfolio] Overview error:', err.message);
    res.status(500).json({ error: 'Failed to load portfolio summary.' });
  }
});

export default router;
