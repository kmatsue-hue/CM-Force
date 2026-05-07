import React from 'react';
import { ACTION_BADGE_ARTS } from '../data/pixelArt.js';

const PixelActionBadge = ({ type = 'default', size = 24, className = "" }) => {
  const art = ACTION_BADGE_ARTS[type] || ACTION_BADGE_ARTS.default;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${art.pixels[0].length} ${art.pixels.length}`} className={`pixel-art ${className}`} style={{ shapeRendering: 'crispEdges' }}>
      {art.pixels.map((rowStr, y) => rowStr.split('').map((char, x) => {
        if (art.colors[char] === 'transparent') return null;
        return <rect key={`badge-${x}-${y}`} x={x} y={y} width="1.05" height="1.05" fill={art.colors[char]} />;
      }))}
    </svg>
  );
};

export default PixelActionBadge;
