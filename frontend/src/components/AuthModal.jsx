import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { KeyRound, Mail, Eye, EyeOff } from 'lucide-react';

export default function AuthModal() {
  const { login, register } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    let success = false;
    if (isLogin) {
      success = await login(email, password);
      if (success) {
        setEmail('');
        setPassword('');
      }
    } else {
      success = await register(email, password);
      if (success) {
        setIsLogin(true);
        setPassword('');
      }
    }
    setLoading(false);
  };

  return (
    <div className="auth-wrapper">
      {/* Dynamic Background Glows */}
      <div className="auth-bg-glows">
        <div className="auth-glow-orb auth-glow-orb-1"></div>
        <div className="auth-glow-orb auth-glow-orb-2"></div>
      </div>

      <div className="auth-card">
        {/* Logo Badge */}
        <div className="auth-logo-badge">α</div>

        {/* Header */}
        <div className="auth-header" style={{ textAlign: 'center' }}>
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p>
            {isLogin 
              ? 'Sign in to access your simulator portfolio' 
              : 'Get $100,000 in virtual cash to start trading'}
          </p>
        </div>

        {/* Toggle Tabs */}
        <div className="auth-toggle-tabs">
          <button 
            type="button" 
            className={`auth-tab-btn ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Sign In
          </button>
          <button 
            type="button" 
            className={`auth-tab-btn ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="auth-input-container">
            <label htmlFor="auth-email-input">Email Address</label>
            <div className="auth-input-field-wrapper">
              <Mail size={18} className="auth-input-icon" />
              <input
                id="auth-email-input"
                type="email"
                className="auth-input-text"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-input-container">
            <label htmlFor="auth-password-input">Password</label>
            <div className="auth-input-field-wrapper">
              <KeyRound size={18} className="auth-input-icon" />
              <input
                id="auth-password-input"
                type={showPassword ? 'text' : 'password'}
                className="auth-input-text"
                style={{ paddingRight: '44px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                title={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: showPassword ? '#ffffff' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                  borderRadius: '4px',
                  transition: 'color 0.1s ease',
                }}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            className="auth-submit-button"
            disabled={loading}
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Get Started'}
          </button>
        </form>

        {/* Switch Link Footer */}
        <div className="auth-footer">
          <p className="auth-footer-text">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <span
              id="auth-switch-mode"
              className="auth-switch-link"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
