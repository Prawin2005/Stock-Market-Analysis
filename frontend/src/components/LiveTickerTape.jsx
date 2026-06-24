import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function LiveTickerTape() {
  const { prices, stocks } = useApp();

  const getPriceColor = (ticker, currentPrice) => {
    const stock = stocks.find(s => s.ticker === ticker);
    return stock && currentPrice >= stock.basePrice ? 'text-success' : 'text-error';
  };

  const getPriceDiff = (ticker, currentPrice) => {
    const stock = stocks.find(s => s.ticker === ticker);
    if (!stock) return '0.00%';
    const diff = currentPrice - stock.basePrice;
    const sign = diff >= 0 ? '+' : '';
    return `${sign}${diff.toFixed(2)} (${sign}${((diff / stock.basePrice) * 100).toFixed(2)}%)`;
  };

  const items = [...stocks, ...stocks];

  return (
    <div className="ticker-tape">
      <div className="marquee-container">
        {items.map((stock, idx) => {
          const price = prices[stock.ticker] || stock.basePrice;
          const colorClass = getPriceColor(stock.ticker, price);
          const isUp = price >= stock.basePrice;

          return (
            <div key={idx} className="marquee-item">
              <span style={{ color: '#ffffff', fontWeight: 700 }}>{stock.ticker}</span>
              <span className={colorClass}>${price.toFixed(2)}</span>
              <span className={colorClass} style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.75rem', gap: '2px' }}>
                {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {getPriceDiff(stock.ticker, price)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
