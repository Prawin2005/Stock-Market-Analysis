import pg from 'pg';

const { Pool } = pg;

const createTablesSQL = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 100000.00 CHECK (balance >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS portfolios (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ticker VARCHAR(10) NOT NULL,
    shares DECIMAL(12, 4) DEFAULT 0.0000,
    average_buy_price DECIMAL(12, 2) DEFAULT 0.00,
    CONSTRAINT user_ticker_unique UNIQUE (user_id, ticker)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ticker VARCHAR(10) NOT NULL,
    type VARCHAR(10) NOT NULL,
    shares DECIMAL(12, 4) NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS watchlists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ticker VARCHAR(10) NOT NULL,
    CONSTRAINT user_watchlist_ticker_unique UNIQUE (user_id, ticker)
  );

  CREATE TABLE IF NOT EXISTS ai_recommendations (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(10) UNIQUE NOT NULL,
    recommendation VARCHAR(10) NOT NULL,
    score INTEGER NOT NULL,
    rationale TEXT NOT NULL,
    validation_status VARCHAR(50),
    consensus_score INTEGER,
    consensus_details TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

let pool = null;
let useMock = false;

const mockDb = {
  users: [],
  portfolios: [],
  transactions: [],
  watchlists: [],
  ai_recommendations: [],
  userIdCounter: 1,
  portfolioIdCounter: 1,
  transactionIdCounter: 1,
  watchlistIdCounter: 1,
  aiRecIdCounter: 1,
};

try {
  pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    connectionTimeoutMillis: 5000,
  });
} catch {
  console.warn('[DB] Failed to initialize PostgreSQL pool. Falling back to in-memory store.');
  useMock = true;
}

export async function initDb() {
  if (useMock) return;

  try {
    const client = await pool.connect();
    console.log('[DB] Connected to PostgreSQL.');
    await client.query(createTablesSQL);
    
    // Safety migrations for existing database installations
    await client.query(`
      ALTER TABLE ai_recommendations ADD COLUMN IF NOT EXISTS validation_status VARCHAR(50);
      ALTER TABLE ai_recommendations ADD COLUMN IF NOT EXISTS consensus_score INTEGER;
      ALTER TABLE ai_recommendations ADD COLUMN IF NOT EXISTS consensus_details TEXT;
    `);
    
    console.log('[DB] Schema verified.');
    client.release();
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    console.warn('[DB] Switching to in-memory store. Data will not persist across restarts.');
    useMock = true;
  }
}

export const db = {
  // Users
  createUser: async (email, passwordHash) => {
    if (!useMock) {
      const res = await pool.query(
        'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, balance, created_at',
        [email, passwordHash]
      );
      return res.rows[0];
    }

    if (mockDb.users.some(u => u.email === email)) {
      throw new Error('duplicate key value violates unique constraint');
    }
    const user = {
      id: mockDb.userIdCounter++,
      email,
      password: passwordHash,
      balance: 100000.00,
      created_at: new Date(),
    };
    mockDb.users.push(user);
    return { id: user.id, email: user.email, balance: user.balance, created_at: user.created_at };
  },

  getUserByEmail: async (email) => {
    if (!useMock) {
      const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      return res.rows[0] || null;
    }
    return mockDb.users.find(u => u.email === email) || null;
  },

  getUserById: async (id) => {
    if (!useMock) {
      const res = await pool.query(
        'SELECT id, email, balance, created_at FROM users WHERE id = $1',
        [id]
      );
      return res.rows[0] || null;
    }
    const user = mockDb.users.find(u => u.id === parseInt(id));
    if (!user) return null;
    return { id: user.id, email: user.email, balance: Number(user.balance), created_at: user.created_at };
  },

  getAllUsers: async () => {
    if (!useMock) {
      const res = await pool.query(
        'SELECT id, email, balance, created_at FROM users ORDER BY created_at DESC'
      );
      return res.rows.map(u => ({ ...u, balance: Number(u.balance) }));
    }
    return mockDb.users.map(u => ({
      id: u.id, email: u.email, balance: Number(u.balance), created_at: u.created_at,
    }));
  },

  updateUserBalance: async (id, newBalance) => {
    if (!useMock) {
      const res = await pool.query(
        'UPDATE users SET balance = $1 WHERE id = $2 RETURNING balance',
        [newBalance, id]
      );
      return Number(res.rows[0].balance);
    }
    const user = mockDb.users.find(u => u.id === parseInt(id));
    if (!user) throw new Error('User not found');
    user.balance = Number(newBalance);
    return user.balance;
  },

  /**
   * Atomically deducts `amount` from a user's balance only if sufficient funds exist.
   * Returns the new balance on success, or null if funds are insufficient.
   * This prevents TOCTOU race conditions in concurrent buy orders.
   */
  deductBalance: async (id, amount) => {
    if (!useMock) {
      const res = await pool.query(
        `UPDATE users SET balance = balance - $1
         WHERE id = $2 AND balance >= $1
         RETURNING balance`,
        [amount, id]
      );
      if (res.rows.length === 0) return null;
      return Number(res.rows[0].balance);
    }
    const user = mockDb.users.find(u => u.id === parseInt(id));
    if (!user || Number(user.balance) < amount) return null;
    user.balance = Number((Number(user.balance) - amount).toFixed(2));
    return user.balance;
  },

  // Portfolio
  getPortfolio: async (userId) => {
    if (!useMock) {
      const res = await pool.query(
        'SELECT * FROM portfolios WHERE user_id = $1 AND shares > 0',
        [userId]
      );
      return res.rows.map(r => ({ ...r, shares: Number(r.shares), average_buy_price: Number(r.average_buy_price) }));
    }
    return mockDb.portfolios
      .filter(p => p.user_id === parseInt(userId) && p.shares > 0)
      .map(p => ({ ...p, shares: Number(p.shares), average_buy_price: Number(p.average_buy_price) }));
  },

  getPortfolioHolding: async (userId, ticker) => {
    if (!useMock) {
      const res = await pool.query(
        'SELECT * FROM portfolios WHERE user_id = $1 AND ticker = $2',
        [userId, ticker]
      );
      if (res.rows.length === 0) return null;
      const r = res.rows[0];
      return { ...r, shares: Number(r.shares), average_buy_price: Number(r.average_buy_price) };
    }
    const p = mockDb.portfolios.find(p => p.user_id === parseInt(userId) && p.ticker === ticker);
    if (!p) return null;
    return { ...p, shares: Number(p.shares), average_buy_price: Number(p.average_buy_price) };
  },

  upsertPortfolioHolding: async (userId, ticker, shares, averageBuyPrice) => {
    if (!useMock) {
      const res = await pool.query(
        `INSERT INTO portfolios (user_id, ticker, shares, average_buy_price)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, ticker)
         DO UPDATE SET shares = $3, average_buy_price = $4
         RETURNING *`,
        [userId, ticker, shares, averageBuyPrice]
      );
      const r = res.rows[0];
      return { ...r, shares: Number(r.shares), average_buy_price: Number(r.average_buy_price) };
    }
    let p = mockDb.portfolios.find(p => p.user_id === parseInt(userId) && p.ticker === ticker);
    if (p) {
      p.shares = Number(shares);
      p.average_buy_price = Number(averageBuyPrice);
    } else {
      p = {
        id: mockDb.portfolioIdCounter++,
        user_id: parseInt(userId),
        ticker,
        shares: Number(shares),
        average_buy_price: Number(averageBuyPrice),
      };
      mockDb.portfolios.push(p);
    }
    return { ...p };
  },

  // Transactions
  createTransaction: async (userId, ticker, type, shares, price) => {
    if (!useMock) {
      const res = await pool.query(
        'INSERT INTO transactions (user_id, ticker, type, shares, price) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [userId, ticker, type, shares, price]
      );
      const r = res.rows[0];
      return { ...r, shares: Number(r.shares), price: Number(r.price) };
    }
    const tx = {
      id: mockDb.transactionIdCounter++,
      user_id: parseInt(userId),
      ticker,
      type,
      shares: Number(shares),
      price: Number(price),
      timestamp: new Date(),
    };
    mockDb.transactions.push(tx);
    return { ...tx };
  },

  getTransactions: async (userId) => {
    if (!useMock) {
      const res = await pool.query(
        'SELECT * FROM transactions WHERE user_id = $1 ORDER BY timestamp DESC',
        [userId]
      );
      return res.rows.map(r => ({ ...r, shares: Number(r.shares), price: Number(r.price) }));
    }
    return mockDb.transactions
      .filter(t => t.user_id === parseInt(userId))
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(t => ({ ...t, shares: Number(t.shares), price: Number(t.price) }));
  },

  // Watchlist
  getWatchlist: async (userId) => {
    if (!useMock) {
      const res = await pool.query('SELECT ticker FROM watchlists WHERE user_id = $1', [userId]);
      return res.rows.map(r => r.ticker);
    }
    return mockDb.watchlists.filter(w => w.user_id === parseInt(userId)).map(w => w.ticker);
  },

  addToWatchlist: async (userId, ticker) => {
    if (!useMock) {
      await pool.query(
        'INSERT INTO watchlists (user_id, ticker) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, ticker]
      );
      return true;
    }
    const exists = mockDb.watchlists.some(w => w.user_id === parseInt(userId) && w.ticker === ticker);
    if (!exists) {
      mockDb.watchlists.push({ id: mockDb.watchlistIdCounter++, user_id: parseInt(userId), ticker });
    }
    return true;
  },

  removeFromWatchlist: async (userId, ticker) => {
    if (!useMock) {
      await pool.query('DELETE FROM watchlists WHERE user_id = $1 AND ticker = $2', [userId, ticker]);
      return true;
    }
    mockDb.watchlists = mockDb.watchlists.filter(
      w => !(w.user_id === parseInt(userId) && w.ticker === ticker)
    );
    return true;
  },

  // AI Recommendations
  getAiRecommendations: async () => {
    if (!useMock) {
      const res = await pool.query('SELECT * FROM ai_recommendations');
      return res.rows;
    }
    return mockDb.ai_recommendations;
  },

  upsertAiRecommendation: async (ticker, recommendation, score, rationale, validation_status = null, consensus_score = null, consensus_details = null) => {
    if (!useMock) {
      const res = await pool.query(
        `INSERT INTO ai_recommendations (ticker, recommendation, score, rationale, validation_status, consensus_score, consensus_details, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (ticker)
         DO UPDATE SET recommendation = $2, score = $3, rationale = $4, validation_status = $5, consensus_score = $6, consensus_details = $7, updated_at = NOW()
         RETURNING *`,
        [ticker, recommendation, score, rationale, validation_status, consensus_score, consensus_details]
      );
      return res.rows[0];
    }
    let rec = mockDb.ai_recommendations.find(r => r.ticker === ticker);
    if (rec) {
      Object.assign(rec, { recommendation, score, rationale, validation_status, consensus_score, consensus_details, updated_at: new Date() });
    } else {
      rec = {
        id: mockDb.aiRecIdCounter++,
        ticker,
        recommendation,
        score,
        rationale,
        validation_status,
        consensus_score,
        consensus_details,
        updated_at: new Date(),
      };
      mockDb.ai_recommendations.push(rec);
    }
    return rec;
  },
};
