import express from 'express';
import { getPrice } from '../services/market.js';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const STOCK_BETAS = {
  AAPL: 1.2, MSFT: 0.9, TSLA: 2.1, NVDA: 1.8,
  AMZN: 1.15, GOOGL: 1.05, BTC: 3.0, CASH: 0.0,
};

router.get('/generate', authenticateToken, async (req, res) => {
  try {
    const user = await db.getUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const [holdings, transactions] = await Promise.all([
      db.getPortfolio(user.id),
      db.getTransactions(user.id),
    ]);

    const cash = Number(user.balance);
    let holdingsVal = 0;
    let costBasisVal = 0;
    const allocation = [];

    for (const hold of holdings) {
      if (hold.shares <= 0) continue;
      const currentPrice = await getPrice(hold.ticker);
      const marketVal = Number((hold.shares * currentPrice).toFixed(2));
      const costBasis = Number((hold.shares * hold.average_buy_price).toFixed(2));

      holdingsVal += marketVal;
      costBasisVal += costBasis;

      allocation.push({
        ticker: hold.ticker,
        shares: hold.shares,
        averageCost: hold.average_buy_price,
        currentPrice,
        marketValue: marketVal,
        weight: 0,
      });
    }

    const netAssets = cash + holdingsVal;

    for (const item of allocation) {
      item.weight = netAssets > 0 ? Number(((item.marketValue / netAssets) * 100).toFixed(2)) : 0;
    }

    allocation.push({
      ticker: 'CASH',
      shares: cash,
      averageCost: 1.00,
      currentPrice: 1.00,
      marketValue: cash,
      weight: netAssets > 0 ? Number(((cash / netAssets) * 100).toFixed(2)) : 0,
    });

    let portfolioBeta = 0;
    for (const item of allocation) {
      const beta = STOCK_BETAS[item.ticker] ?? 1.0;
      portfolioBeta += beta * (item.weight / 100);
    }
    portfolioBeta = Number(portfolioBeta.toFixed(2));

    const riskLevel = portfolioBeta > 1.5 ? 'High' : portfolioBeta >= 0.8 ? 'Medium' : 'Low';

    const suggestions = [];
    if (cash / netAssets > 0.5) {
      suggestions.push('High cash allocation. Consider dollar-cost averaging into blue-chip stocks to beat inflation.');
    }
    if (portfolioBeta > 1.6) {
      suggestions.push('High portfolio beta. Consider adding lower-volatility equities or cash to insulate against market drops.');
    }
    const btcWeight = allocation.find(i => i.ticker === 'BTC')?.weight || 0;
    if (btcWeight > 20) {
      suggestions.push('Crypto allocation is above 20%. Rebalancing into diversified equities might mitigate capital drawdown risk.');
    }
    if (suggestions.length === 0) {
      suggestions.push('Your portfolio is well diversified across liquid equities and cash. Maintain current cost basis strategies.');
    }

    res.json({
      report: {
        id: `REP-${Date.now()}`,
        generatedAt: new Date(),
        clientEmail: user.email,
        financialSummary: {
          availableCash: cash,
          equitiesValue: Number(holdingsVal.toFixed(2)),
          netAssetValue: Number(netAssets.toFixed(2)),
          totalCostBasis: Number(costBasisVal.toFixed(2)),
          totalReturn: Number((holdingsVal - costBasisVal).toFixed(2)),
          totalReturnPct: costBasisVal > 0
            ? Number((((holdingsVal - costBasisVal) / costBasisVal) * 100).toFixed(2))
            : 0,
        },
        riskAnalysis: {
          portfolioBeta,
          riskLevel,
          sharpeRatioEstimate: portfolioBeta > 0 ? Number((2.1 / portfolioBeta).toFixed(2)) : 0,
          diversificationSuggestions: suggestions,
        },
        allocations: allocation,
        recentActivity: transactions.slice(0, 5),
      },
    });

  } catch (err) {
    console.error('[Reports] Generation error:', err.message);
    res.status(500).json({ error: 'Failed to generate report.' });
  }
});

export default router;
