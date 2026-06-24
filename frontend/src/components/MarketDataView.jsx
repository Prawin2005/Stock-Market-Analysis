import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import StockChart from './StockChart.jsx';
import { Search, Eye, TrendingUp, TrendingDown, ArrowRightLeft, ShieldAlert } from 'lucide-react';

export default function MarketDataView() {
  const { stocks, prices, watchlist, toggleWatchlist, executeTrade, API_BASE, getHeaders, user } = useApp();
  const [selectedTicker, setSelectedTicker] = useState('AAPL');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Trade inputs
  const [sharesInput, setSharesInput] = useState('');
  const [tradeType, setTradeType] = useState('BUY');
  const [tradeLoading, setTradeLoading] = useState(false);

  // Fetch chosen ticker from localStorage redirect
  useEffect(() => {
    const cached = localStorage.getItem('selectedTicker');
    if (cached) {
      setSelectedTicker(cached);
      localStorage.removeItem('selectedTicker');
    }
  }, []);

  const [isRealTime, setIsRealTime] = useState(false);

  // Fetch historical data on ticker change
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/stocks/${selectedTicker}/history`);
        const data = await res.json();
        if (res.ok) {
          setHistory(data.history || []);
          setIsRealTime(!!data.isRealTime);
        }
      } catch (err) {
        console.error('Failed to load stock history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [selectedTicker]);

  const activeStock = stocks.find(s => s.ticker === selectedTicker) || stocks[0];
  const currentPrice = prices[selectedTicker] || activeStock?.basePrice || 0;
  const isWatched = watchlist.includes(selectedTicker);

  const priceDiff = activeStock ? currentPrice - activeStock.basePrice : 0;
  const priceDiffPct = activeStock ? (priceDiff / activeStock.basePrice) * 100 : 0;
  const isPositive = priceDiff >= 0;

  const handleTrade = async (e) => {
    e.preventDefault();
    const qty = Number(sharesInput);
    if (!qty || qty <= 0) return;

    setTradeLoading(true);
    const success = await executeTrade(selectedTicker, tradeType, qty);
    setTradeLoading(false);
    if (success) {
      setSharesInput('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', padding: '10px 0' }}>
      
      {/* Search & Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '6px' }}>Market Data</h1>
          <p style={{ color: 'var(--text-secondary)' }}>View interactive technical indicators and execute paper trades.</p>
        </div>

        {/* Stock Select Picker */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <select 
            value={selectedTicker} 
            onChange={(e) => setSelectedTicker(e.target.value)}
            className="glass-input"
            style={{ minWidth: '150px', cursor: 'pointer', fontWeight: 600, backgroundColor: '#0f172a', color: '#ffffff' }}
          >
            {stocks.map(s => (
              <option key={s.ticker} value={s.ticker} style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                {s.ticker} - {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Stock Statistics header */}
      {activeStock && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TICKER</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '2px' }}>
              <h2 style={{ fontSize: '1.8rem' }}>{activeStock.ticker}</h2>
              <span style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>{activeStock.name}</span>
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>LIVE PRICE</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '2px' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>${currentPrice.toFixed(2)}</span>
              <span className={isPositive ? 'text-success' : 'text-error'} style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.95rem' }}>
                {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {isPositive ? '+' : ''}{priceDiff.toFixed(2)} ({isPositive ? '+' : ''}{priceDiffPct.toFixed(2)}%)
              </span>
            </div>
          </div>
          <button 
            onClick={() => toggleWatchlist(selectedTicker)} 
            className="glass-btn" 
            style={{ 
              borderColor: isWatched ? 'rgba(245, 158, 11, 0.4)' : 'var(--card-border)',
              color: isWatched ? 'var(--color-warning)' : 'var(--text-primary)'
            }}
          >
            <Eye size={16} /> {isWatched ? 'Watched' : 'Watch Symbol'}
          </button>
        </div>
      )}

      {/* Core Split: Graph & Trade executor */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.5fr', gap: '30px' }}>
        
        {/* Graph Card */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ fontSize: '1.25rem' }}>30-Day Historical Trend</h3>
            <span style={{ 
              fontSize: '0.7rem', 
              color: isRealTime ? 'var(--color-success)' : 'var(--text-muted)', 
              background: isRealTime ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)', 
              padding: '2px 8px', 
              borderRadius: '9999px',
              border: isRealTime ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(255, 255, 255, 0.05)',
              fontWeight: 600,
              letterSpacing: '0.05em'
            }}>
              ● {isRealTime ? 'LIVE FINNHUB FEED' : 'SIMULATED DATA'}
            </span>
          </div>
          {loading ? (
            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Loading technical data...
            </div>
          ) : (
            <StockChart history={history} ticker={selectedTicker} />
          )}
        </div>

        {/* Trade Panel */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <ArrowRightLeft size={18} style={{ color: 'var(--color-accent)' }} /> Place Order
          </h3>

          <form onSubmit={handleTrade} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Type selector toggle */}
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

            {/* Price reference */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span>Price per Share</span>
              <span style={{ fontWeight: 600, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>${currentPrice.toFixed(2)}</span>
            </div>

            {/* Quantity inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>SHARES QUANTITY</label>
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

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <span>Estimated cost</span>
                <span style={{ fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                  ${((Number(sharesInput) || 0) * currentPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>Simulator Cash</span>
                <span>${(user?.balance || 100000.00).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <button
              type="submit"
              className={`glass-btn ${tradeType === 'BUY' ? 'glass-btn-success' : 'glass-btn-error'}`}
              style={{ width: '100%', height: '42px', fontWeight: 'bold' }}
              disabled={tradeLoading}
            >
              {tradeLoading ? 'Submitting Order...' : `Execute ${tradeType}`}
            </button>
          </form>

          {/* Risk Warning Disclaimer */}
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px' }}>
            <ShieldAlert size={16} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: '2px' }} />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              This is a trading simulation. No actual capital is at risk. All pricing coordinates are synthesized models.
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
