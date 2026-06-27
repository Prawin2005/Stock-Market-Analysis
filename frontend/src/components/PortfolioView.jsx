import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import { TrendingUp, TrendingDown, Wallet, ArrowRightLeft } from 'lucide-react';

export default function PortfolioView() {
  const { portfolio, prices, setActiveTab } = useApp();

  const summary = portfolio.summary || { cash: 100000.00, holdingsValue: 0.00, totalValue: 100000.00, totalProfitLoss: 0.00, totalProfitLossPct: 0.00 };
  const holdings = portfolio.holdings || [];


  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#14b8a6', '#f43f5e', '#6366f1'];


  const netAssets = summary.totalValue || 100000.00;


  const slices = holdings.map((h, i) => ({
    label: h.ticker,
    value: h.marketValue,
    percentage: netAssets > 0 ? (h.marketValue / netAssets) * 100 : 0,
    color: COLORS[i % COLORS.length]
  }));

  if (summary.cash > 0) {
    slices.push({
      label: 'CASH',
      value: summary.cash,
      percentage: netAssets > 0 ? (summary.cash / netAssets) * 100 : 0,
      color: '#4b5563' // Gray for cash
    });
  }

  // Calculate circle dash offsets
  let accumulatedPercent = 0;
  const radius = 50;
  const circumference = 2 * Math.PI * radius; // ~314.16

  const donutSlices = slices.filter(s => s.percentage > 0).map(slice => {
    const dashOffset = circumference - (slice.percentage / 100) * circumference;
    const rotationAngle = (accumulatedPercent / 100) * 360;
    accumulatedPercent += slice.percentage;
    return { ...slice, dashOffset, rotationAngle };
  });

  const triggerTradingTab = () => {
    setActiveTab('simulator');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', padding: '10px 0' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '6px' }}>Portfolio Tracking</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Detailed overview of your virtual asset allocations and holdings.</p>
        </div>
        <button onClick={triggerTradingTab} className="glass-btn glass-btn-primary">
          <ArrowRightLeft size={16} /> Execute Trade
        </button>
      </div>

      {/* Stats Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>PORTFOLIO VALUATION</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>${summary.totalValue?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>TOTAL COST BASIS</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>${summary.totalCostBasis?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>TOTAL PROFIT / LOSS</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }} className={summary.totalProfitLoss >= 0 ? 'text-success' : 'text-error'}>
            {summary.totalProfitLoss >= 0 ? '+' : ''}${summary.totalProfitLoss?.toFixed(2)}
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>RETURN RATE</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }} className={summary.totalProfitLoss >= 0 ? 'text-success' : 'text-error'}>
            {summary.totalProfitLoss >= 0 ? '+' : ''}{summary.totalProfitLossPct?.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Core Split Layout: Grid positions & Allocation Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: holdings.length > 0 ? '3fr 2fr' : '1fr', gap: '30px' }}>

        {/* Positions Table */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>Open Positions</h3>

          {holdings.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ marginBottom: '16px' }}>You do not own any equities yet.</p>
              <button onClick={triggerTradingTab} className="glass-btn" style={{ fontSize: '0.85rem' }}>
                Open Trading Simulator
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    <th style={{ padding: '12px 8px' }}>ASSET</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>SHARES</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>AVG PRICE</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>MARKET PRICE</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>MARKET VALUE</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((hold) => {
                    const isGain = hold.profitLoss >= 0;
                    return (
                      <tr key={hold.ticker} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.9rem' }}>
                        <td style={{ padding: '16px 8px', fontWeight: 700, color: '#ffffff' }}>{hold.ticker}</td>
                        <td style={{ padding: '16px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{hold.shares}</td>
                        <td style={{ padding: '16px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>${hold.averageBuyPrice.toFixed(2)}</td>
                        <td style={{ padding: '16px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>${hold.currentPrice.toFixed(2)}</td>
                        <td style={{ padding: '16px 8px', textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>${hold.marketValue.toFixed(2)}</td>
                        <td style={{ padding: '16px 8px', textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-mono)' }} className={isGain ? 'text-success' : 'text-error'}>
                          {isGain ? '+' : ''}${hold.profitLoss.toFixed(2)} ({isGain ? '+' : ''}{hold.profitLossPct.toFixed(2)}%)
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Allocation Donut Card */}
        {holdings.length > 0 && (
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', alignSelf: 'flex-start' }}>Asset Allocation</h3>

            {/* SVG Donut Chart */}
            <div style={{ position: 'relative', width: '200px', height: '200px', marginBottom: '30px' }}>
              <svg viewBox="0 0 120 120" width="100%" height="100%" style={{ transform: 'rotate(-90deg)' }}>
                {donutSlices.map((slice, idx) => (
                  <circle
                    key={idx}
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth="14"
                    strokeDasharray={`${circumference}`}
                    strokeDashoffset={slice.dashOffset}
                    style={{
                      transformOrigin: '50% 50%',
                      transform: `rotate(${slice.rotationAngle}deg)`,
                      transition: 'stroke-dashoffset 0.5s ease'
                    }}
                  />
                ))}
              </svg>
              {/* Inner Label */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                fontFamily: 'var(--font-sans)',
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                  ${(summary.totalValue || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {slices.map((slice, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: slice.color }} />
                    <span style={{ fontWeight: 700, color: '#ffffff' }}>{slice.label}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    ${slice.value.toFixed(2)} ({slice.percentage.toFixed(1)}%)
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
