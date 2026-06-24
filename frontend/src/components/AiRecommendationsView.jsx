import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import { Sparkles, TrendingUp, TrendingDown, RefreshCw, Cpu } from 'lucide-react';

export default function AiRecommendationsView() {
  const { aiRecs, retrainAi, prices } = useApp();

  const getBadgeClass = (rec) => {
    if (rec === 'BUY') return 'badge bg-success-subtle';
    if (rec === 'SELL') return 'badge bg-error-subtle';
    return 'badge bg-warning-subtle';
  };

  const getConfidenceColor = (score) => {
    if (score >= 80) return 'var(--color-success)';
    if (score >= 50) return 'var(--color-warning)';
    return 'var(--color-error)';
  };

  const getValidationBadge = (status) => {
    switch (status) {
      case 'VALIDATED':
        return (
          <span className="badge bg-success-subtle" style={{ 
            fontSize: '0.75rem', 
            padding: '4px 10px', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '5px',
            color: 'var(--color-success)',
            border: '1px solid rgba(16, 185, 129, 0.15)'
          }}>
            ✓ Validated
          </span>
        );
      case 'DIVERGENT':
        return (
          <span className="badge bg-warning-subtle" style={{ 
            fontSize: '0.75rem', 
            padding: '4px 10px', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '5px',
            color: 'var(--color-warning)',
            border: '1px solid rgba(245, 158, 11, 0.15)'
          }}>
            ⚠ Divergent
          </span>
        );
      case 'NO KEY':
        return (
          <span className="badge bg-info-subtle" style={{ 
            fontSize: '0.75rem', 
            padding: '4px 10px', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '5px',
            color: 'var(--color-info, #3b82f6)',
            border: '1px solid rgba(59, 130, 246, 0.15)'
          }}>
            ℹ Simulated
          </span>
        );
      default:
        return (
          <span className="badge bg-secondary-subtle" style={{ 
            fontSize: '0.75rem', 
            padding: '4px 10px', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '5px',
            color: 'var(--text-muted)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            No Data
          </span>
        );
    }
  };

  const hasNoKey = aiRecs.some(rec => rec.validation_status === 'NO KEY');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', padding: '10px 0' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={28} style={{ color: 'var(--color-purple)' }} /> AI Recommendations
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Advanced ML consensus models and buy/sell/hold rationales for your watchlist.</p>
        </div>
        
        <button onClick={retrainAi} className="glass-btn glass-btn-purple">
          <RefreshCw size={16} /> Retrain Model
        </button>
      </div>

      {/* Intro info box */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '15px', alignItems: 'center', borderLeft: '4px solid var(--color-purple)' }}>
        <Cpu size={28} style={{ color: 'var(--color-purple)', flexShrink: 0 }} />
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
          Our neural networks continuously analyze pricing drift, historic volatilities, and mock fundamental reports. Click <strong>Retrain Model</strong> to re-calibrate predictions against real-time WebSocket ticker changes and check Wall Street consensus.
        </p>
      </div>

      {/* API Key Banner */}
      {hasNoKey && (
        <div className="glass-panel" style={{ 
          padding: '16px 20px', 
          background: 'rgba(59, 130, 246, 0.05)', 
          border: '1px solid rgba(59, 130, 246, 0.15)',
          borderRadius: '12px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px' 
        }}>
          <div style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            background: 'var(--color-info, #3b82f6)',
            boxShadow: '0 0 10px var(--color-info, #3b82f6)' 
          }} />
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            <strong>Real-World Validation:</strong> Add your <code>FINNHUB_API_KEY</code> to the backend <code>.env</code> file to enable live Wall Street analyst consensus checking. (Showing simulated consensus below).
          </p>
        </div>
      )}

      {/* Grid of cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {aiRecs.map((rec) => {
          const price = prices[rec.ticker] || 0;
          let consensus = null;
          try {
            if (rec.consensus_details) {
              consensus = JSON.parse(rec.consensus_details);
            }
          } catch (e) {
            console.error(e);
          }

          return (
            <div key={rec.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', borderTop: `2px solid ${getConfidenceColor(rec.score)}` }}>
              
              {/* Card Header: Ticker, Rating badge, Confidence */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{rec.ticker}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Market: ${price.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <span className={getBadgeClass(rec.recommendation)} style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                    {rec.recommendation}
                  </span>
                </div>
              </div>

              {/* Confidence Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                  <span>CONFIDENCE RATING</span>
                  <span style={{ color: getConfidenceColor(rec.score) }}>{rec.score}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ width: `${rec.score}%`, height: '100%', background: getConfidenceColor(rec.score), borderRadius: '9999px', transition: 'width 0.5s ease' }} />
                </div>
              </div>

              {/* Rationale text */}
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', flexGrow: 1, padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                {rec.rationale}
              </div>

              {/* Validation/Consensus Section */}
              <div style={{ 
                borderTop: '1px solid rgba(255, 255, 255, 0.05)', 
                paddingTop: '16px', 
                marginTop: 'auto',
                display: 'flex', 
                flexDirection: 'column', 
                gap: '10px' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>WALL STREET CONSENSUS</span>
                  {getValidationBadge(rec.validation_status)}
                </div>
                
                {consensus ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        Score: <strong style={{ color: getConfidenceColor(rec.consensus_score) }}>{rec.consensus_score}%</strong>
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        Ratings: {consensus.strongBuy + consensus.buy} Buy / {consensus.hold} Hold / {consensus.sell + consensus.strongSell} Sell
                      </span>
                    </div>
                    {/* Tiny breakdown visualization bar */}
                    <div style={{ 
                      width: '100%', 
                      height: '4px', 
                      background: 'rgba(255,255,255,0.02)', 
                      borderRadius: '999px', 
                      display: 'flex', 
                      overflow: 'hidden' 
                    }}>
                      <div style={{ 
                        width: `${((consensus.strongBuy + consensus.buy) / (consensus.strongBuy + consensus.buy + consensus.hold + consensus.sell + consensus.strongSell)) * 100}%`, 
                        background: 'var(--color-success)', 
                        height: '100%' 
                      }} />
                      <div style={{ 
                        width: `${(consensus.hold / (consensus.strongBuy + consensus.buy + consensus.hold + consensus.sell + consensus.strongSell)) * 100}%`, 
                        background: 'var(--color-warning)', 
                        height: '100%' 
                      }} />
                      <div style={{ 
                        width: `${((consensus.sell + consensus.strongSell) / (consensus.strongBuy + consensus.buy + consensus.hold + consensus.sell + consensus.strongSell)) * 100}%`, 
                        background: 'var(--color-error)', 
                        height: '100%' 
                      }} />
                    </div>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No Finnhub consensus data loaded.</span>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}

