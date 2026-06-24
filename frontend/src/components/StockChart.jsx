import React, { useState, useRef } from 'react';

export default function StockChart({ history, ticker }) {
  if (!history || history.length === 0) {
    return (
      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        No historical data available.
      </div>
    );
  }

  const [hoverIndex, setHoverIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // SVG dimensions
  const width = 600;
  const height = 300;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  // Chart area dimensions
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Extract prices and find bounds
  const prices = history.map((h) => h.close);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const priceRange = maxPrice - minPrice || 1;

  // Cushion margins (10% padding top/bottom)
  const yMax = maxPrice + priceRange * 0.05;
  const yMin = Math.max(0, minPrice - priceRange * 0.05);
  const yRange = yMax - yMin;

  // Coordinates helper
  const getCoords = (index, value) => {
    const x = paddingLeft + (index / (history.length - 1)) * chartWidth;
    // In SVG, y=0 is at the top
    const y = paddingTop + (1 - (value - yMin) / yRange) * chartHeight;
    return { x, y };
  };

  // Build the line path and area path
  let pathD = '';
  let areaD = '';

  history.forEach((point, i) => {
    const { x, y } = getCoords(i, point.close);
    if (i === 0) {
      pathD = `M ${x} ${y}`;
      areaD = `M ${x} ${paddingTop + chartHeight} L ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
      if (i === history.length - 1) {
        areaD += ` L ${x} ${y} L ${x} ${paddingTop + chartHeight} Z`;
      } else {
        areaD += ` L ${x} ${y}`;
      }
    }
  });

  // Calculate coordinates for grid lines
  const gridLines = [];
  const gridCount = 5;
  for (let i = 0; i < gridCount; i++) {
    const value = yMin + (i / (gridCount - 1)) * yRange;
    const y = paddingTop + (1 - i / (gridCount - 1)) * chartHeight;
    gridLines.push({ value, y });
  }

  // Handle interaction
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    // Convert client X to SVG local coordinate space
    const clientX = e.clientX - rect.left;
    const svgX = (clientX / rect.width) * width;
    
    // Find index of closest data point
    const relativeX = svgX - paddingLeft;
    const fraction = relativeX / chartWidth;
    let idx = Math.round(fraction * (history.length - 1));
    idx = Math.max(0, Math.min(history.length - 1, idx));

    setHoverIndex(idx);

    // Tooltip position
    const { x, y } = getCoords(idx, history[idx].close);
    setTooltipPos({ x, y });
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  // Color theme: check if price trend is positive overall
  const firstPrice = history[0].close;
  const lastPrice = history[history.length - 1].close;
  const isPositive = lastPrice >= firstPrice;
  const strokeColor = isPositive ? 'var(--color-success)' : 'var(--color-error)';
  const gradientId = `chart-gradient-${ticker}`;

  return (
    <div style={{ position: 'relative', width: '100%' }} ref={containerRef}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ overflow: 'visible', cursor: 'crosshair' }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal Gridlines & Y-Axis Labels */}
        {gridLines.map((line, idx) => (
          <g key={idx}>
            <line
              x1={paddingLeft}
              y1={line.y}
              x2={width - paddingRight}
              y2={line.y}
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="1"
            />
            <text
              x={paddingLeft - 10}
              y={line.y + 4}
              fill="var(--text-muted)"
              fontSize="10"
              fontFamily="var(--font-mono)"
              textAnchor="end"
            >
              ${line.value.toFixed(2)}
            </text>
          </g>
        ))}

        {/* X-Axis labels (dates at beginning, middle, end) */}
        {[0, Math.floor(history.length / 2), history.length - 1].map((idx) => {
          const point = history[idx];
          if (!point) return null;
          const { x } = getCoords(idx, point.close);
          return (
            <text
              key={idx}
              x={x}
              y={height - 15}
              fill="var(--text-muted)"
              fontSize="10"
              fontFamily="var(--font-sans)"
              textAnchor={idx === 0 ? 'start' : idx === history.length - 1 ? 'end' : 'middle'}
            >
              {point.date}
            </text>
          );
        })}

        {/* Gradient Area */}
        <path d={areaD} fill={`url(#${gradientId})`} />

        {/* Main Line */}
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Interactivity Highlights */}
        {hoverIndex !== null && (
          <g>
            {/* Vertical crosshair line */}
            <line
              x1={tooltipPos.x}
              y1={paddingTop}
              x2={tooltipPos.x}
              y2={paddingTop + chartHeight}
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            {/* Value circle indicator */}
            <circle
              cx={tooltipPos.x}
              cy={tooltipPos.y}
              r="6"
              fill={strokeColor}
              stroke="#ffffff"
              strokeWidth="2"
              style={{ boxShadow: '0 0 10px rgba(0,0,0,0.5)' }}
            />
          </g>
        )}
      </svg>

      {/* Tooltip Overlay */}
      {hoverIndex !== null && history[hoverIndex] && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            left: `${(tooltipPos.x / width) * 100}%`,
            top: `${(tooltipPos.y / height) * 100 - 65}%`,
            transform: 'translateX(-50%)',
            padding: '6px 10px',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)',
            zIndex: 10,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            borderColor: strokeColor,
          }}
        >
          <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
            ${history[hoverIndex].close.toFixed(2)}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
            {history[hoverIndex].date}
          </span>
        </div>
      )}
    </div>
  );
}
