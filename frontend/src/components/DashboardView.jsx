import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import { TrendingUp, TrendingDown, Wallet, Briefcase, Eye, Activity, Award } from 'lucide-react';

export default function DashboardView() {
  const { prices, stocks, watchlist, portfolio, transactions, toggleWatchlist, setActiveTab } = useApp();

  const currentPrices = prices;
  const summary = portfolio.summary || { cash: 100000.00, holdingsValue: 0.00, totalValue: 100000.00, totalProfitLoss: 0.00, totalProfitLossPct: 0.00 };


  const stockMetrics = stocks.map((s) => {
    const price = currentPrices[s.ticker] || s.basePrice;
    const change = price - s.basePrice;
    const changePct = (change / s.basePrice) * 100;
    return { ...s, price, change, changePct };
  });

  const gainers = [...stockMetrics].sort((a, b) => b.changePct - a.changePct).slice(0, 3);
  const losers = [...stockMetrics].sort((a, b) => a.changePct - b.changePct).slice(0, 3);


  const viewChart = (ticker) => {

    localStorage.setItem('selectedTicker', ticker);
    setActiveTab('market');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', padding: '10px 0' }}>

      {/* 1. Header welcome */}
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '6px' }}>Simulator Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Welcome to your Real-Time Paper Trading & Market Analytics Center.</p>
      </div>

      {/* 2. Top Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>

        {/* Net Asset Value */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'var(--color-accent-glow)', color: 'var(--color-accent)', padding: '12px', borderRadius: '12px' }}>
            <Briefcase size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>NET PORTFOLIO VALUE</span>
            <h2 style={{ fontSize: '1.65rem', margin: '2px 0 4px 0' }}>${(summary.totalValue || 100000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }} className={(summary.totalProfitLoss || 0) >= 0 ? 'text-success' : 'text-error'}>
              {(summary.totalProfitLoss || 0) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>
                ${Math.abs(summary.totalProfitLoss || 0).toFixed(2)} ({summary.totalProfitLossPct?.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Cash Balance */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', padding: '12px', borderRadius: '12px' }}>
            <Wallet size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>AVAILABLE CASH</span>
            <h2 style={{ fontSize: '1.65rem', margin: '2px 0 4px 0' }}>${(summary.cash || 100000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Buying Power: 100% Cash Equivalent</span>
          </div>
        </div>

        {/* Watchlist Count */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)', padding: '12px', borderRadius: '12px' }}>
            <Eye size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>WATCHED</span>
            <h2 style={{ fontSize: '1.65rem', margin: '2px 0 4px 0' }}>{watchlist.length}</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quick tracking elements configured</span>
          </div>
        </div>

        {/* Portfolio Assets Valuation */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'var(--color-purple-glow)', color: 'var(--color-purple)', padding: '12px', borderRadius: '12px' }}>
            <Activity size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>EQUITIES MARKET VALUE</span>
            <h2 style={{ fontSize: '1.65rem', margin: '2px 0 4px 0' }}>${(summary.holdingsValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active asset positions</span>
          </div>
        </div>

      </div>

      {/* 3. Core content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>

        {/* Left Side: Live Stock Market Board */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.25rem' }}>Asset Monitor</h3>
            <span className="badge bg-success-subtle" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-success)' }} />
              Live WebSocket Stream
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '400px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  <th style={{ padding: '12px 8px' }}>TICKER</th>
                  <th style={{ padding: '12px 8px' }}>COMPANY</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>LIVE PRICE</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>CHANGE</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {stockMetrics.map((stock) => {
                  const isUp = stock.change >= 0;
                  const isWatched = watchlist.includes(stock.ticker);
                  return (
                    <tr key={stock.ticker} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.9rem', transition: 'background 0.1s' }} className="table-row-hover">
                      <td style={{ padding: '16px 8px', fontWeight: 700, color: '#ffffff' }}>{stock.ticker}</td>
                      <td style={{ padding: '16px 8px', color: 'var(--text-secondary)' }}>{stock.name}</td>
                      <td style={{ padding: '16px 8px', textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        ${stock.price.toFixed(2)}
                      </td>
                      <td style={{ padding: '16px 8px', textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-mono)' }} className={isUp ? 'text-success' : 'text-error'}>
                        {isUp ? '+' : ''}{stock.change.toFixed(2)} ({isUp ? '+' : ''}{stock.changePct.toFixed(2)}%)
                      </td>
                      <td style={{ padding: '16px 8px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => viewChart(stock.ticker)} className="glass-btn" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                          Chart
                        </button>
                        <button
                          onClick={() => toggleWatchlist(stock.ticker)}
                          className="glass-btn"
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.75rem',
                            color: isWatched ? 'var(--color-warning)' : 'var(--text-primary)',
                            borderColor: isWatched ? 'rgba(245, 158, 11, 0.4)' : 'var(--card-border)'
                          }}
                        >
                          {isWatched ? 'Unwatch' : 'Watch'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Market Movers & Recent Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Movers Card */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Award size={18} style={{ color: 'var(--color-warning)' }} /> Top Gainers
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {gainers.map((g) => (
                <div key={g.ticker} onClick={() => viewChart(g.ticker)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', cursor: 'pointer', border: '1px solid transparent' }} className="mover-card">
                  <div>
                    <div style={{ fontWeight: 700, color: '#ffffff' }}>{g.ticker}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{g.name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>${g.price.toFixed(2)}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }} className="text-success">+{g.changePct.toFixed(2)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Watchlist Quick Access */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Eye size={18} style={{ color: 'var(--color-accent)' }} /> Active Watchlist
            </h3>
            {watchlist.length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                You aren't watching any tickers. Use the stock board to add.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {watchlist.map((ticker) => {
                  const price = currentPrices[ticker] || 0;
                  const stock = stocks.find(s => s.ticker === ticker);
                  const isUp = stock ? price >= stock.basePrice : true;
                  return (
                    <div
                      key={ticker}
                      onClick={() => viewChart(ticker)}
                      className="glass-panel"
                      style={{
                        padding: '12px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        background: 'rgba(255,255,255,0.01)',
                        borderColor: 'rgba(255,255,255,0.05)'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{ticker}</div>
                      <div style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 600, margin: '4px 0', color: '#ffffff' }}>
                        ${price.toFixed(2)}
                      </div>
                      <span style={{ fontSize: '0.7rem', padding: '1px 6px' }} className={isUp ? 'badge bg-success-subtle' : 'badge bg-error-subtle'}>
                        {isUp ? 'UP' : 'DN'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Activity Logs */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Activity size={18} style={{ color: 'var(--color-purple)' }} /> Recent Activity
            </h3>
            {transactions.length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No recent trades. Execute virtual orders in the simulator.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {transactions.slice(0, 3).map((tx) => (
                  <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <div>
                      <span className={tx.type === 'BUY' ? 'badge bg-success-subtle' : 'badge bg-error-subtle'} style={{ padding: '1px 4px', marginRight: '6px', fontSize: '0.65rem' }}>
                        {tx.type}
                      </span>
                      <span style={{ fontWeight: 600, color: '#ffffff' }}>{tx.ticker}</span>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '2px' }}>{new Date(tx.timestamp).toLocaleTimeString()}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600, color: '#ffffff' }}>{tx.shares} shares</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>@ ${tx.price.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
