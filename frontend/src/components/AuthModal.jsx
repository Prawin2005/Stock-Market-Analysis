import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import {
  TrendingUp, Zap, BarChart2, ShieldCheck,
  Mail, Lock, Eye, EyeOff
} from 'lucide-react';

const FEATURES = [
  {
    icon: <TrendingUp size={16} />,
    title: 'AI-Powered Signals',
    desc: 'Real-time buy/sell predictions from trained models.',
    color: '#ffffff',
  },
  {
    icon: <BarChart2 size={16} />,
    title: 'Live Market Data',
    desc: 'Track 500+ stocks with charts & indicators.',
    color: '#ffffff',
  },
  {
    icon: <Zap size={16} />,
    title: 'Smart Portfolio',
    desc: 'Manage paper trades & track P&L instantly.',
    color: '#ffffff',
  },
  {
    icon: <ShieldCheck size={16} />,
    title: 'Secure & Private',
    desc: 'Encrypted sessions with JWT authentication.',
    color: '#ffffff',
  },
];

const STATS = [
  { value: '500+', label: 'Stocks Tracked' },
  { value: '98%',  label: 'Signal Accuracy' },
  { value: '10ms', label: 'Data Latency' },
  { value: '99.9%',label: 'Uptime' },
];

export default function AuthModal() {
  const { login, register } = useApp();
  const [isLogin, setIsLogin]           = useState(true);
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [loading, setLoading]           = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) return;
    setLoading(true);
    try {
      if (isLogin) {
        const result = await login(email, password);
        if (!result || !result.ok) {
          const errMsg = (result && result.error) ? String(result.error) : 'Login failed. Please try again.';
          console.error('[AuthModal] Login error:', errMsg);
          setError(errMsg);
        }
      } else {
        const result = await register(email, password);
        if (result && result.ok) {
          setIsLogin(true);
          setPassword('');
        } else {
          const errMsg = (result && result.error) ? String(result.error) : 'Registration failed. Please try again.';
          console.error('[AuthModal] Register error:', errMsg);
          setError(errMsg);
        }
      }
    } catch (err) {
      console.error('[AuthModal] Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    }
    setLoading(false);
  };

  const switchTab = (toLogin) => {
    setIsLogin(toLogin);
    setError('');
    setPassword('');
  };

  return (
    <div className="sp-screen">

      {/* ══ LEFT — Branding Panel ══ */}
      <div className="sp-left">

        {/* Background chart lines */}
        <svg className="sp-chart-bg" viewBox="0 0 600 400" fill="none" preserveAspectRatio="none">
          <path d="M0 320 Q100 290 200 230 Q300 170 400 110 Q500 50 600 20"
            stroke="rgba(255,255,255,0.03)" strokeWidth="1.5" fill="none" />
          <path d="M0 350 Q150 310 300 260 Q450 210 600 160"
            stroke="rgba(255,255,255,0.02)" strokeWidth="1" fill="none" />
          <path d="M0 320 Q100 290 200 230 Q300 170 400 110 Q500 50 600 20 L600 400 L0 400 Z"
            fill="url(#chartFill)" />
          <defs>
            <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.01)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Subtle ambient glow */}
        <div className="sp-left-glow-bw" />

        <div className="sp-left-inner">

          {/* Logo */}
          <div className="sp-logo">
            <div className="sp-logo-icon-bw">
              <TrendingUp size={18} strokeWidth={2.5} />
            </div>
            <span className="sp-logo-text">Alpha Capital</span>
          </div>

          {/* Headline */}
          <div className="sp-hero">
            <div className="sp-badge-bw">
              <span className="sp-badge-dot-bw" />
              AI-Powered Platform
            </div>
            <h1 className="sp-headline">
              Smarter investing<br />
              starts with <span className="sp-white">better data</span>
            </h1>
            <p className="sp-hero-desc">
              Alpha Capital combines real-time market data, AI-driven signals,
              and portfolio analytics to help you make confident investment decisions.
            </p>
          </div>

          {/* Stats row */}
          <div className="sp-stats">
            {STATS.map((s, i) => (
              <div className="sp-stat" key={i}>
                <div className="sp-stat-val-bw">{s.value}</div>
                <div className="sp-stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Feature list */}
          <div className="sp-features">
            {FEATURES.map((f, i) => (
              <div className="sp-feature" key={i}>
                <div className="sp-feature-icon-bw">
                  {f.icon}
                </div>
                <div>
                  <div className="sp-feature-title">{f.title}</div>
                  <div className="sp-feature-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="sp-left-footer">
            © {new Date().getFullYear()} Alpha Capital · All rights reserved
          </div>

        </div>
      </div>

      {/* ══ RIGHT — Auth Panel ══ */}
      <div className="sp-right">

        {/* Subtle grid pattern background on the right side */}
        <div className="sp-right-grid-overlay" />

        {/* Form area */}
        <div className="sp-form-wrap">
          <div className="sp-form-body larger-form">
            <h2 className="sp-form-title">
              {isLogin ? 'Sign in' : 'Create account'}
            </h2>
            <p className="sp-form-sub">
              {isLogin
                ? 'Access your virtual trading portfolio'
                : 'Start trading with $100,000 in paper money'}
            </p>

            {error && <div className="sp-error-bw">{error}</div>}

            <form onSubmit={handleSubmit} className="sp-form" noValidate>
              <div className="sp-field">
                <label htmlFor="sp-email">Email address</label>
                <div className="sp-input-wrap">
                  <Mail size={14} className="sp-input-icon" />
                  <input id="sp-email" type="email" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    required autoComplete="email" />
                </div>
              </div>

              <div className="sp-field">
                <div className="sp-field-row">
                  <label htmlFor="sp-password">Password</label>
                </div>
                <div className="sp-input-wrap">
                  <Lock size={14} className="sp-input-icon" />
                  <input id="sp-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)}
                    required autoComplete={isLogin ? 'current-password' : 'new-password'} />
                  <button type="button" className="sp-eye" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {!isLogin && <span className="sp-hint-bw">Minimum 8 characters</span>}
              </div>

              <button type="submit" className="sp-btn-bw" disabled={loading}>
                {loading
                  ? <span className="sp-spinner-bw" />
                  : isLogin ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <p className="sp-switch-prompt-bw">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button type="button" className="sp-switch-toggle-bw" onClick={() => switchTab(!isLogin)}>
                {isLogin ? 'Create one' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="sp-right-foot">
          <span className="sp-secure">🔒 Encrypted & secure</span>
        </div>

      </div>
    </div>
  );
}
