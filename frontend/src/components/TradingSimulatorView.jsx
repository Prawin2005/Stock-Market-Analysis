import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { ArrowRightLeft, DollarSign, ListOrdered, TrendingUp, TrendingDown } from 'lucide-react';

export default function TradingSimulatorView() {
  const { stocks, prices, executeTrade, transactions, user } = useApp();
  const [selectedTicker, setSelectedTicker] = useState('AAPL');
  const [tradeType, setTradeType] = useState('BUY');
  const [sharesInput, setSharesInput] = useState('');
  const [loading, setLoading] = useState(false);

  const activeStock = stocks.find(s => s.ticker === selectedTicker) || stocks[0];
  const currentPrice = prices[selectedTicker] || activeStock?.basePrice || 0;
  const totalCost = Number((sharesInput || 0) * currentPrice);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const qty = Number(sharesInput);
    if (!qty || qty <= 0) return;

    setLoading(true);
    const success = await executeTrade(selectedTicker, tradeType, qty);
    setLoading(false);
    if (success) {
      setSharesInput('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', padding: '10px 0' }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '6px' }}>Trading Simulator</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Execute paper trade buy/sell orders instantly with your virtual cash balance.</p>
      </div>

      {/* Main trading container split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '30px' }}>
        
        {/* Left Side: Order Terminal */}
        <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <ArrowRightLeft size={18} style={{ color: 'var(--color-success)' }} /> Trade Desk
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Ticker Select */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TICKER SYMBOL</label>
              <select
                value={selectedTicker}
                onChange={(e) => setSelectedTicker(e.target.value)}
                className="glass-input"
                style={{ width: '100%', cursor: 'pointer', fontWeight: 600, backgroundColor: '#0f172a', color: '#ffffff' }}
              >
                {stocks.map(s => (
                  <option key={s.ticker} value={s.ticker} style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                    {s.ticker} (${(prices[s.ticker] || s.basePrice).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {/* Order Type Toggle */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '4px', border: '1px solid var(--card-border)' }}>
              <button
                type="button"
                onClick={() => setTradeType('BUY')}
                className={`glass-btn ${tradeType === 'BUY' ? 'glass-btn-success' : ''}`}
                style={{ flex: 1, border: 'none', borderRadius: '6px', padding: '8px 0', fontSize: '0.85rem' }}
              >
                BUY
              </button>
              <button
                type="button"
                onClick={() => setTradeType('SELL')}
                className={`glass-btn ${tradeType === 'SELL' ? 'glass-btn-error' : ''}`}
                style={{ flex: 1, border: 'none', borderRadius: '6px', padding: '8px 0', fontSize: '0.85rem' }}
              >
                SELL
              </button>
            </div>

            {/* Quantity */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>NUMBER OF SHARES</label>
              <input
                type="number"
                step="any"
                min="0.0001"
                className="glass-input"
                placeholder="0.00"
                value={sharesInput}
                onChange={(e) => setSharesInput(e.target.value)}
                required
              />
            </div>

            {/* Pricing details summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Market Price:</span>
                <span style={{ fontWeight: 600, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>${currentPrice.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Estimated Order Total:</span>
                <span style={{ fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                  ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>Simulator Cash Balance:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  ${(user?.balance || 100000.00).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className={`glass-btn ${tradeType === 'BUY' ? 'glass-btn-success' : 'glass-btn-error'}`}
              style={{ width: '100%', height: '42px', fontWeight: 'bold' }}
              disabled={loading}
            >
              {loading ? 'Executing...' : `Submit ${tradeType} Order`}
            </button>

          </form>
        </div>

        {/* Right Side: Transaction Ledger */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <ListOrdered size={18} style={{ color: 'var(--color-accent)' }} /> Transaction Ledger
          </h3>

          {transactions.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No transaction logs found. When you complete paper trades, they will be logged here.
            </div>
          ) : (
            <div style={{ overflowY: 'auto', maxHeight: '420px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    <th style={{ padding: '10px 4px' }}>TYPE</th>
                    <th style={{ padding: '10px 4px' }}>SYMBOL</th>
                    <th style={{ padding: '10px 4px', textAlign: 'right' }}>SHARES</th>
                    <th style={{ padding: '10px 4px', textAlign: 'right' }}>PRICE</th>
                    <th style={{ padding: '10px 4px', textAlign: 'right' }}>TOTAL</th>
                    <th style={{ padding: '10px 4px', textAlign: 'right' }}>EXECUTION TIME</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const isBuy = tx.type === 'BUY';
                    const dateStr = new Date(tx.timestamp).toLocaleTimeString() + ' ' + new Date(tx.timestamp).toLocaleDateString();
                    return (
                      <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '12px 4px' }}>
                          <span className={isBuy ? 'badge bg-success-subtle' : 'badge bg-error-subtle'} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                            {tx.type}
                          </span>
                        </td>
                        <td style={{ padding: '12px 4px', fontWeight: 700, color: '#ffffff' }}>{tx.ticker}</td>
                        <td style={{ padding: '12px 4px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{tx.shares}</td>
                        <td style={{ padding: '12px 4px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>${tx.price.toFixed(2)}</td>
                        <td style={{ padding: '12px 4px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          ${(tx.shares * tx.price).toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 4px', textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {dateStr}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
