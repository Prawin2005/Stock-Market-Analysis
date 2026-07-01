import React, { useState } from 'react';
import { useApp } from './context/AppContext.jsx';
import LiveTickerTape from './components/LiveTickerTape.jsx';
import DashboardView from './components/DashboardView.jsx';
import PortfolioView from './components/PortfolioView.jsx';
import MarketDataView from './components/MarketDataView.jsx';
import WatchlistView from './components/WatchlistView.jsx';
import AiRecommendationsView from './components/AiRecommendationsView.jsx';
import RiskReportsView from './components/RiskReportsView.jsx';
import TradingSimulatorView from './components/TradingSimulatorView.jsx';
import AuthModal from './components/AuthModal.jsx';
import ToastNotification from './components/ToastNotification.jsx';

import {
  LayoutDashboard,
  Briefcase,
  LineChart,
  Star,
  BrainCircuit,
  ShieldAlert,
  ArrowRightLeft,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', name: 'Dashboard',    icon: <LayoutDashboard size={18} /> },
  { id: 'portfolio', name: 'Portfolio',    icon: <Briefcase size={18} /> },
  { id: 'market',    name: 'Market Data',  icon: <LineChart size={18} /> },
  { id: 'watchlist', name: 'Watchlist',    icon: <Star size={18} /> },
  { id: 'ai',        name: 'AI Insights',  icon: <BrainCircuit size={18} /> },
  { id: 'reports',   name: 'Risk & Reports', icon: <ShieldAlert size={18} /> },
  { id: 'simulator', name: 'Simulator',    icon: <ArrowRightLeft size={18} /> },
];

const VIEWS = {
  dashboard: <DashboardView />,
  portfolio: <PortfolioView />,
  market:    <MarketDataView />,
  watchlist: <WatchlistView />,
  ai:        <AiRecommendationsView />,
  reports:   <RiskReportsView />,
  simulator: <TradingSimulatorView />,
};

export default function App() {
  const { token, activeTab, setActiveTab, logout, user } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!token) {
    return (
      <>
        <AuthModal />
        <ToastNotification />
      </>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <LiveTickerTape />

      <div className="app-layout">
        <aside className={`app-sidebar no-print${sidebarOpen ? '' : ' collapsed'}`}>

          <div className="sidebar-toggle-row">
            {sidebarOpen && (
              <div
                id="nav-logo"
                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', overflow: 'hidden' }}
                onClick={() => setActiveTab('dashboard')}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '6px', flexShrink: 0,
                  background: '#ffffff', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: '#09090b', fontWeight: 700,
                }}>α</div>
                <span className="app-sidebar-logo-text" style={{
                  fontSize: '1.05rem', fontWeight: 600, letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap', color: '#ffffff',
                }}>AlphaCapital</span>
              </div>
            )}

            <button
              id="sidebar-toggle-btn"
              className="hamburger-btn"
              onClick={() => setSidebarOpen(open => !open)}
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {!sidebarOpen && (
            <div
              style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', cursor: 'pointer' }}
              onClick={() => setActiveTab('dashboard')}
              title="AlphaCapital"
            >
              <div style={{
                width: '32px', height: '32px', borderRadius: '6px',
                background: '#ffffff', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#09090b', fontWeight: 700,
              }}>α</div>
            </div>
          )}

          <div className="app-sidebar-section" style={{ flexGrow: 1 }}>
            <nav className="app-sidebar-nav">
              {NAV_ITEMS.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    id={`nav-btn-${item.id}`}
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className="glass-btn"
                    title={!sidebarOpen ? item.name : ''}
                    style={{
                      border: 'none',
                      background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
                      color: isActive ? 'var(--color-accent)' : 'var(--text-secondary)',
                      padding: '10px 14px',
                      fontSize: '0.85rem',
                      fontWeight: isActive ? 600 : 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      justifyContent: 'flex-start',
                      width: '100%',
                      textAlign: 'left',
                      borderRadius: '6px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                    }}
                  >
                    <span style={{ flexShrink: 0 }}>{item.icon}</span>
                    <span className="sidebar-label">{item.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {user && (
            <div className="app-sidebar-user">
              <div className="app-sidebar-user-balance">
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', wordBreak: 'break-all', lineHeight: 1.4 }}>
                  {user.email}
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-success)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  ${Number(user.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <button
                id="nav-logout-btn"
                onClick={logout}
                className="glass-btn app-sidebar-logout-btn"
                title="Log Out"
                style={{
                  width: '100%',
                  padding: '8px',
                  color: 'var(--color-error)',
                  border: '1px solid rgba(244,63,94,0.12)',
                  background: 'rgba(244,63,94,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  borderRadius: '6px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
              >
                <LogOut size={16} style={{ flexShrink: 0 }} />
                <span className="logout-label">Log Out</span>
              </button>
            </div>
          )}
        </aside>

        <div className="app-main-container">
          <main className="app-main-content">
            {VIEWS[activeTab] ?? VIEWS.dashboard}
          </main>

          <footer className="no-print" style={{
            background: 'rgba(9, 13, 22, 0.95)',
            borderTop: '1px solid rgba(255, 255, 255, 0.03)',
            padding: '24px 0',
            textAlign: 'center',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            marginTop: 'auto',
          }}>
            <div className="container">
              <p>© {new Date().getFullYear()} AlphaCapital Portfolio Analytics. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </div>

      <ToastNotification />
    </div>
  );
}
