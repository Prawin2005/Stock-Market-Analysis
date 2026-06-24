-- ============================================================
-- Stock Market Analytics & Portfolio Management Platform
-- Database Initialization Script
-- Run this file in psql or pgAdmin after creating the database
-- ============================================================

-- Create the database (run this separately as superuser if needed)
-- CREATE DATABASE stock_market;
-- \c stock_market

-- Drop tables if they exist (for clean re-initialization) 
DROP TABLE IF EXISTS ai_recommendations CASCADE;
DROP TABLE IF EXISTS watchlists CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS portfolios CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- Users Table
-- ============================================================
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    balance     DECIMAL(15, 2) DEFAULT 100000.00,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Portfolios Table (open positions per user)
-- ============================================================
CREATE TABLE portfolios (
    id                SERIAL PRIMARY KEY,
    user_id           INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ticker            VARCHAR(10) NOT NULL,
    shares            DECIMAL(12, 4) DEFAULT 0.0000,
    average_buy_price DECIMAL(12, 2) DEFAULT 0.00,
    CONSTRAINT user_ticker_unique UNIQUE (user_id, ticker)
);

-- ============================================================
-- Transactions Table (order history ledger)
-- ============================================================
CREATE TABLE transactions (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ticker      VARCHAR(10) NOT NULL,
    type        VARCHAR(10) NOT NULL CHECK (type IN ('BUY', 'SELL')),
    shares      DECIMAL(12, 4) NOT NULL,
    price       DECIMAL(12, 2) NOT NULL,
    timestamp   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Watchlists Table
-- ============================================================
CREATE TABLE watchlists (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ticker      VARCHAR(10) NOT NULL,
    CONSTRAINT user_watchlist_ticker_unique UNIQUE (user_id, ticker)
);

-- ============================================================
-- AI Recommendations Table
-- ============================================================
CREATE TABLE ai_recommendations (
    id                SERIAL PRIMARY KEY,
    ticker            VARCHAR(10) UNIQUE NOT NULL,
    recommendation    VARCHAR(10) NOT NULL CHECK (recommendation IN ('BUY', 'SELL', 'HOLD')),
    score             INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
    rationale         TEXT NOT NULL,
    validation_status VARCHAR(50),
    consensus_score   INTEGER,
    consensus_details TEXT,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_watchlists_user_id ON watchlists(user_id);

-- ============================================================
-- Verification
-- ============================================================
SELECT 'Database initialized successfully!' AS status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
