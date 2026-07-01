import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const AppContext = createContext();

const getBackendUrl = () => {
  let url = import.meta.env.VITE_API_URL;
  if (!url) {
    if (typeof window !== 'undefined' && window.location) {
      const { hostname } = window.location;
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        url = 'https://stock-market-analysis-b2sk.onrender.com';
      }
    }
  }
  if (!url) {
    url = 'http://localhost:5000';
  }

  // Sanitize url: remove trailing slashes and /api suffix
  url = url.replace(/\/+$/, '');
  if (url.endsWith('/api')) {
    url = url.slice(0, -4);
  }
  return url;
};

const API_URL = getBackendUrl();
const API_BASE = `${API_URL}/api`;
const WS_BASE = API_URL.startsWith('https') 
  ? API_URL.replace('https://', 'wss://') + '/ws'
  : API_URL.replace('http://', 'ws://') + '/ws';

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem('token');
    return (savedToken && savedToken !== 'undefined' && savedToken !== 'null') ? savedToken : '';
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [prices, setPrices] = useState({});
  const [stocks, setStocks] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [portfolio, setPortfolio] = useState({ summary: {}, holdings: [] });
  const [transactions, setTransactions] = useState([]);
  const [aiRecs, setAiRecs] = useState([]);
  const [toast, setToast] = useState(null);
  const wsRef = useRef(null);

  
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  
  const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  
  const fetchStocks = async () => {
    try {
      const res = await fetch(`${API_BASE}/stocks`);
      const data = await res.json();
      if (res.ok) setStocks(data.stocks || []);
    } catch (err) {
      console.error('Failed to fetch stocks list:', err);
    }
  };

  
  const fetchPortfolio = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/portfolio/overview`, { headers: getHeaders() });
      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setPortfolio(data);
        if (data.summary && data.summary.cash !== undefined) {
          setUser(prev => prev ? { ...prev, balance: Number(data.summary.cash) } : null);
        }
      }
    } catch (err) {
      console.error('Failed to load portfolio:', err);
    }
  };

  
  const fetchTransactions = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/trading/transactions`, { headers: getHeaders() });
      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }
      const data = await res.json();
      if (res.ok) setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    }
  };

  
  const fetchWatchlist = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/stocks/watchlist/list`, { headers: getHeaders() });
      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }
      const data = await res.json();
      if (res.ok) setWatchlist(data.watchlist || []);
    } catch (err) {
      console.error('Failed to fetch watchlist:', err);
    }
  };

  
  const fetchAiRecommendations = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/ai/recommendations`, { headers: getHeaders() });
      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }
      const data = await res.json();
      if (res.ok) setAiRecs(data.recommendations || []);
    } catch (err) {
      console.error('Failed to fetch AI recs:', err);
    }
  };


  
  const fetchUserProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        logout();
        return;
      }
      const data = await res.json();
      if (res.ok && data.user) {
        data.user.balance = Number(data.user.balance);
        setUser(data.user);
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  };

  
  const loadUserData = () => {
    fetchUserProfile();
    fetchPortfolio();
    fetchTransactions();
    fetchWatchlist();
    fetchAiRecommendations();
  };

  
  useEffect(() => {
    fetchStocks();
    if (token) {
      loadUserData();
    }
  }, [token]);

  
  useEffect(() => {
    
    const connectWS = () => {
      console.log('📡 [WebSocket] Trying to establish WebSocket connection...');
      const ws = new WebSocket(WS_BASE);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('📡 [WebSocket] Connection established successfully!');
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'INITIAL_PRICES') {
          setPrices(msg.prices);
        } else if (msg.type === 'PRICE_UPDATES') {
          setPrices(prev => ({ ...prev, ...msg.prices }));
        }
      };

      ws.onclose = () => {
        console.log('📡 [WebSocket] Connection closed. Retrying in 5 seconds...');
        setTimeout(connectWS, 5000);
      };

      ws.onerror = (err) => {
        console.error('📡 [WebSocket] Connection error:', err);
      };
    };

    connectWS();

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  
  useEffect(() => {
    let interval;
    if (token) {
      interval = setInterval(() => {
        fetchPortfolio();
      }, 5000); 
    }
    return () => clearInterval(interval);
  }, [token]);

  
  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        showToast('Login successful! Welcome back.', 'success');
        return true;
      } else {
        showToast(data.error || 'Login failed.', 'error');
        return false;
      }
    } catch (err) {
      showToast('Connection error. Server is offline.', 'error');
      return false;
    }
  };

  
  const register = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        
        showToast('Account created! Please sign in with your credentials.', 'success');
        return true;
      } else {
        showToast(data.error || 'Registration failed.', 'error');
        return false;
      }
    } catch (err) {
      showToast('Connection error. Server is offline.', 'error');
      return false;
    }
  };

  
  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setPortfolio({ summary: {}, holdings: [] });
    setTransactions([]);
    setWatchlist([]);
    showToast('Logged out successfully.', 'info');
  };

  
  const toggleWatchlist = async (ticker) => {
    if (!token) {
      showToast('Please log in to manage your watchlist.', 'warning');
      return;
    }
    const isWatched = watchlist.includes(ticker);
    const endpoint = isWatched ? `remove/${ticker}` : 'add';
    const method = isWatched ? 'DELETE' : 'POST';

    try {
      const res = await fetch(`${API_BASE}/stocks/watchlist/${endpoint}`, {
        method,
        headers: getHeaders(),
        body: !isWatched ? JSON.stringify({ ticker }) : undefined
      });
      if (res.ok) {
        setWatchlist(prev => 
          isWatched ? prev.filter(t => t !== ticker) : [...prev, ticker]
        );
        showToast(`${ticker} ${isWatched ? 'removed from' : 'added to'} watchlist.`, 'success');
      } else {
        const d = await res.json();
        showToast(d.error || 'Failed to update watchlist.', 'error');
      }
    } catch (err) {
      showToast('Network error.', 'error');
    }
  };

  
  const executeTrade = async (ticker, type, shares) => {
    if (!token) {
      showToast('Please log in to trade.', 'warning');
      return false;
    }
    try {
      const res = await fetch(`${API_BASE}/trading/order`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ ticker, type, shares: Number(shares) })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        fetchPortfolio(); 
        fetchTransactions(); 
        return true;
      } else {
        showToast(data.error || 'Order execution failed.', 'error');
        return false;
      }
    } catch (err) {
      showToast('Trade execution failed.', 'error');
      return false;
    }
  };

  
  const retrainAi = async () => {
    try {
      const res = await fetch(`${API_BASE}/ai/recalculate`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setAiRecs(data.recommendations);
        showToast(data.message, 'success');
      } else {
        showToast(data.error || 'Failed to retrain models.', 'error');
      }
    } catch (err) {
      showToast('API network error.', 'error');
    }
  };

  return (
    <AppContext.Provider value={{
      user,
      token,
      activeTab,
      setActiveTab,
      prices,
      stocks,
      watchlist,
      portfolio,
      transactions,
      aiRecs,
      toast,
      showToast,
      login,
      register,
      logout,
      toggleWatchlist,
      executeTrade,
      retrainAi,
      API_BASE,
      getHeaders
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
