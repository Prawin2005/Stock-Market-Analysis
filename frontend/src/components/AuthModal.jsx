import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { KeyRound, Mail, Lock } from 'lucide-react';

export default function AuthModal() {
  const { login, register } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="glass-panel" style={{
      maxWidth: '420px',
      margin: '80px auto',
      padding: '40px 30px',
      textAlign: 'center',
      border: '1px solid rgba(255, 255, 255, 0.08)'
    }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: 'var(--color-accent-glow)',
        color: 'var(--color-accent)',
        marginBottom: '20px',
      }}>
        <Lock size={28} />
      </div>

      <h2 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>
        {isLogin ? 'Welcome Back' : 'Create Simulator Portfolio'}
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '30px' }}>
        {isLogin ? 'Sign in to access real-time trading dashboard' : 'Open a simulator account with $100,000 cash'}
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>EMAIL ADDRESS</label>
          <div style={{ position: 'relative' }}>
            <Mail size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
            <input
              id="auth-email-input"
              type="email"
              className="glass-input"
              style={{ width: '100%', paddingLeft: '40px' }}
              placeholder="name@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>PASSWORD</label>
          <div style={{ position: 'relative' }}>
            <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
            <input
              id="auth-password-input"
              type="password"
              className="glass-input"
              style={{ width: '100%', paddingLeft: '40px' }}
              placeholder="enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button
          id="auth-submit-btn"
          type="submit"
          className="glass-btn glass-btn-primary"
          style={{ width: '100%', marginTop: '10px', height: '45px' }}
          disabled={loading}
        >
          {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Get Started'}
        </button>
      </form>

      <div style={{ marginTop: '25px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          {isLogin ? "Don't have an account?" : "Already have a simulator account?"}{' '}
          <span
            id="auth-switch-mode"
            onClick={() => setIsLogin(!isLogin)}
            style={{ color: 'var(--color-accent)', cursor: 'pointer', fontWeight: 600 }}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </span>
        </p>
      </div>
    </div>
  );
}
