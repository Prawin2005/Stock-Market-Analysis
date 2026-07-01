import express from 'express';
import { getPrice } from '../services/market.js';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const MAX_SHARES = 1_000_000;

router.post('/order', authenticateToken, async (req, res) => {
  const { ticker, type, shares } = req.body;

  if (!ticker || typeof ticker !== 'string') {
    return res.status(400).json({ error: 'A valid ticker symbol is required.' });
  }

  const orderType = typeof type === 'string' ? type.toUpperCase() : '';
  if (orderType !== 'BUY' && orderType !== 'SELL') {
    return res.status(400).json({ error: "Order type must be 'BUY' or 'SELL'." });
  }

  const sharesNum = Number(shares);
  if (!isFinite(sharesNum) || isNaN(sharesNum) || sharesNum <= 0 || sharesNum > MAX_SHARES) {
    return res.status(400).json({ error: `Shares must be a positive number no greater than ${MAX_SHARES.toLocaleString()}.` });
  }

  try {
    const symbol = ticker.toUpperCase().trim();
    const currentPrice = await getPrice(symbol);

    if (!currentPrice) {
      return res.status(404).json({ error: `Stock symbol '${symbol}' not found.` });
    }

    const totalCost = Number((sharesNum * currentPrice).toFixed(2));
    const user = await db.getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    if (orderType === 'BUY') {
      
      const newBalance = await db.deductBalance(user.id, totalCost);

      if (newBalance === null) {
        return res.status(400).json({
          error: `Insufficient funds. Required: $${totalCost.toFixed(2)}, Available: $${Number(user.balance).toFixed(2)}`,
        });
      }

      const holding = await db.getPortfolioHolding(user.id, symbol);
      let newShares = sharesNum;
      let newAvgPrice = currentPrice;

      if (holding) {
        newShares = Number(holding.shares) + sharesNum;
        newAvgPrice = Number(
          (((Number(holding.shares) * Number(holding.average_buy_price)) + totalCost) / newShares).toFixed(2)
        );
      }

      const updatedHolding = await db.upsertPortfolioHolding(user.id, symbol, newShares, newAvgPrice);
      await db.createTransaction(user.id, symbol, 'BUY', sharesNum, currentPrice);

      return res.json({
        message: `Bought ${sharesNum} share(s) of ${symbol} at $${currentPrice}.`,
        transaction: { ticker: symbol, type: 'BUY', shares: sharesNum, price: currentPrice, total: totalCost },
        balance: newBalance,
        holding: updatedHolding,
      });

    } else {
      // Atomically deduct the shares from the portfolio
      const updatedHolding = await db.deductHoldingShares(user.id, symbol, sharesNum);

      if (!updatedHolding) {
        // Fetch current holding to return a precise error message
        const holding = await db.getPortfolioHolding(user.id, symbol);
        const availableShares = holding ? Number(holding.shares) : 0;
        return res.status(400).json({
          error: `Insufficient shares. You own ${availableShares} of ${symbol}, tried to sell ${sharesNum}.`,
        });
      }

      // Atomically add cash to user's balance
      const newBalance = await db.addBalance(user.id, totalCost);

      await db.createTransaction(user.id, symbol, 'SELL', sharesNum, currentPrice);

      return res.json({
        message: `Sold ${sharesNum} share(s) of ${symbol} at $${currentPrice}.`,
        transaction: { ticker: symbol, type: 'SELL', shares: sharesNum, price: currentPrice, total: totalCost },
        balance: newBalance,
        holding: updatedHolding,
      });
    }

  } catch (err) {
    console.error('[Trading] Order error:', err.message);
    res.status(500).json({ error: 'Order execution failed. Please try again.' });
  }
});

router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const list = await db.getTransactions(req.user.id);
    res.json({ transactions: list });
  } catch (err) {
    console.error('[Trading] Transaction fetch error:', err.message);
    res.status(500).json({ error: 'Could not retrieve transaction history.' });
  }
});

export default router;
