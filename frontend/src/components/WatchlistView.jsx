import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { Star, StarOff, BarChart2, TrendingUp, TrendingDown } from 'lucide-react';

export default function WatchlistView() {
  const { stocks, prices, watchlist, toggleWatchlist, setActiveTab } = useApp();
  const [search, setSearch] = useState('');

  const allStocks = stocks.map(s => ({
    ...s,
    price: prices[s.ticker] || s.basePrice,
    change: (prices[s.ticker] || s.basePrice) - s.basePrice,
    changePct: (((prices[s.ticker] || s.basePrice) - s.basePrice) / s.basePrice) * 100,
    isWatched: watchlist.includes(s.ticker),
  }));

  const filteredStocks = allStocks.filter(s =>
    s.ticker.toLowerCase().includes(search.toLowerCase()) ||
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const watchedStocks = allStocks.filter(s => s.isWatched);

  const viewChart = (ticker) => {
    localStorage.setItem('selectedTicker', ticker);
    setActiveTab('market');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', padding: '10px 0' }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '6px' }}>Watchlists</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Monitor your saved tickers and add new symbols to track in real-time.
        </p>
      </div>

      {/* Watched Tickers grid */}
      {watchedStocks.length > 0 && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Star size={18} style={{ color: 'var(--color-warning)' }} />
            Tracking ({watchedStocks.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {watchedStocks.map(s => {
              const isUp = s.change >= 0;
              return (
                <div
                  key={s.ticker}
                  className="glass-panel"
                  style={{
                    padding: '20px',
                    cursor: 'pointer',
                    background: 'rgba(255,255,255,0.02)',
                    borderColor: 'rgba(255,255,255,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>{s.ticker}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{s.name}</div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleWatchlist(s.ticker); }}
                      className="glass-btn"
                      style={{ padding: '4px', border: 'none', background: 'transparent', color: 'var(--color-warning)' }}
                      title="Remove from watchlist"
                    >
                      <StarOff size={16} />
                    </button>
                  </div>

                  <div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#fff' }}>
                      ${s.price.toFixed(2)}
                    </div>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}
                      className={isUp ? 'text-success' : 'text-error'}
                    >
                      {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {isUp ? '+' : ''}{s.change.toFixed(2)} ({isUp ? '+' : ''}{s.changePct.toFixed(2)}%)
                    </div>
                  </div>

                  <button
                    onClick={() => viewChart(s.ticker)}
                    className="glass-btn"
                    style={{ width: '100%', padding: '7px 0', fontSize: '0.8rem', marginTop: '4px' }}
                  >
                    <BarChart2 size={14} /> View Chart
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Stocks Browser */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '1.25rem' }}>All Available Data</h3>
          <input
            type="text"
            className="glass-input"
            placeholder="Search by ticker or name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ minWidth: '220px' }}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                <th style={{ padding: '12px 8px' }}>TICKER</th>
                <th style={{ padding: '12px 8px' }}>COMPANY</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>LIVE PRICE</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>CHANGE</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>WATCH</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>CHART</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.map(s => {
                const isUp = s.change >= 0;
                return (
                  <tr key={s.ticker} className="table-row-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.9rem' }}>
                    <td style={{ padding: '14px 8px', fontWeight: 700, color: '#fff' }}>{s.ticker}</td>
                    <td style={{ padding: '14px 8px', color: 'var(--text-secondary)' }}>{s.name}</td>
                    <td style={{ padding: '14px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      ${s.price.toFixed(2)}
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }} className={isUp ? 'text-success' : 'text-error'}>
                      {isUp ? '+' : ''}{s.change.toFixed(2)} ({isUp ? '+' : ''}{s.changePct.toFixed(2)}%)
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                      <button
                        onClick={() => toggleWatchlist(s.ticker)}
                        className="glass-btn"
                        style={{
                          padding: '5px 14px',
                          fontSize: '0.78rem',
                          color: s.isWatched ? 'var(--color-warning)' : 'var(--text-secondary)',
                          borderColor: s.isWatched ? 'rgba(245,158,11,0.4)' : 'var(--card-border)',
                        }}
                      >
                        {s.isWatched ? <StarOff size={13} /> : <Star size={13} />}
                        {s.isWatched ? 'Unwatch' : 'Watch'}
                      </button>
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                      <button
                        onClick={() => viewChart(s.ticker)}
                        className="glass-btn"
                        style={{ padding: '5px 14px', fontSize: '0.78rem' }}
                      >
                        <BarChart2 size={13} /> Chart
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
