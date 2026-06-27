import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { ShieldCheck, Printer, FileText, AlertTriangle, HelpCircle } from 'lucide-react';

export default function RiskReportsView() {
  const { token, API_BASE, getHeaders, portfolio } = useApp();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/reports/generate`, { headers: getHeaders() });
      const data = await res.json();
      if (res.ok) {
        setReport(data.report);
      }
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchReport();
    }
  }, [token, portfolio.holdings]); 

  const handlePrint = () => {
    window.print();
  };

  const getRiskColor = (level) => {
    if (level === 'High') return 'var(--color-error)';
    if (level === 'Medium') return 'var(--color-warning)';
    return 'var(--color-success)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', padding: '10px 0' }}>
      
      {/* Print styles */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          header, nav, button, .no-print {
            display: none !important;
          }
          .glass-panel {
            background: none !important;
            border: 1px solid #ddd !important;
            box-shadow: none !important;
            color: black !important;
          }
          h1, h2, h3, h4, text, span {
            color: black !important;
          }
          .print-container {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '6px' }}>Risk Analysis & Reports</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Review weighted portfolio betas, risk classifications, and print full PDF summaries.</p>
        </div>
        
        <button onClick={handlePrint} className="glass-btn glass-btn-primary" disabled={!report}>
          <Printer size={16} /> Print Report
        </button>
      </div>

      {loading && (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Compiling portfolio report metrics...
        </div>
      )}

      {!loading && !report && (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No report generated. Please perform some trades first to populate holdings.
        </div>
      )}

      {!loading && report && (
        <div className="print-container" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Main Risk Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }} className="no-print">
            
            {/* Portfolio Beta */}
            <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>PORTFOLIO BETA</span>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '10px 0 6px 0', fontFamily: 'var(--font-mono)' }}>
                {report.riskAnalysis.portfolioBeta}
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Volatility ratio compared to benchmark S&P 500 (Beta = 1.0)
              </p>
            </div>

            {/* Sharpe Ratio */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>SHARPE RATIO (EST)</span>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '10px 0 6px 0', fontFamily: 'var(--font-mono)' }}>
                {report.riskAnalysis.sharpeRatioEstimate}
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Estimate of risk-adjusted excess returns
              </p>
            </div>

            {/* Risk Class */}
            <div className="glass-panel" style={{ padding: '24px', borderLeft: `4px solid ${getRiskColor(report.riskAnalysis.riskLevel)}` }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>RISK CLASSIFICATION</span>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '10px 0 6px 0', color: getRiskColor(report.riskAnalysis.riskLevel) }}>
                {report.riskAnalysis.riskLevel}
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Calculated volatility tier based on beta score
              </p>
            </div>

          </div>

          {/* Allocation Alerts / Advice Card */}
          <div className="glass-panel no-print" style={{ padding: '24px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <AlertTriangle size={24} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontSize: '1rem', marginBottom: '8px' }}>Diversification Audit</h4>
              <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {report.riskAnalysis.diversificationSuggestions.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* The Printable Report Page */}
          <div className="glass-panel" style={{ padding: '40px' }}>
            
            {/* Report Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '20px', marginBottom: '30px' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={22} style={{ color: 'var(--color-accent)' }} /> INVESTMENT STATEMENT
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  ID: {report.id} | Generated: {new Date(report.generatedAt).toLocaleString()}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>AlphaCapital Simulators</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Account: {report.clientEmail}</div>
              </div>
            </div>

            {/* Financial Summary details */}
            <h4 style={{ fontSize: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', marginBottom: '16px' }}>FINANCIAL PERFORMANCE</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px', fontSize: '0.9rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Equities Portfolio Value:</span>
                <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '1.2rem', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                  ${report.financialSummary.equitiesValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Cash Balance:</span>
                <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '1.2rem', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                  ${report.financialSummary.availableCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Total Net Asset Value:</span>
                <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '1.2rem', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                  ${report.financialSummary.netAssetValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Allocation Grid */}
            <h4 style={{ fontSize: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', marginBottom: '16px' }}>ASSET WEIGHT ALLOCATIONS</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '40px', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <th style={{ padding: '8px' }}>TICKER</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>SHARES owned</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>COST BASIS</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>CURRENT PRICE</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>MARKET VALUE</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>WEIGHT %</th>
                </tr>
              </thead>
              <tbody>
                {report.allocations.map((a) => (
                  <tr key={a.ticker} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 700 }}>{a.ticker}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{a.ticker === 'CASH' ? '-' : a.shares}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>${(a.ticker === 'CASH' ? a.marketValue : (a.shares * a.averageCost)).toFixed(2)}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>${a.currentPrice.toFixed(2)}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>${a.marketValue.toFixed(2)}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{a.weight}%</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Signature Block */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '20px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <p>Audited by AlphaCapital AI Analyst</p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: 'var(--color-success)', fontWeight: 600 }}>
                  <ShieldCheck size={14} /> SECURE VERIFIED STATEMENT
                </div>
              </div>
              <div style={{ textAlign: 'right', width: '200px', fontSize: '0.85rem' }}>
                <div style={{ height: '30px' }} />
                <div style={{ borderBottom: '1px solid var(--text-muted)', marginBottom: '4px' }} />
                <span style={{ color: 'var(--text-muted)' }}>Authorized Account Owner</span>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
