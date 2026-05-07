import React from 'react';
import { PIXEL_ARTS, CLASS_FEATURE_OVERLAYS } from '../data/pixelArt.js';

const PixelCharacter = ({ type = 'hero', size = 48, className = "" }) => {
  const art = PIXEL_ARTS[type] || PIXEL_ARTS.hero;
  const overlays = CLASS_FEATURE_OVERLAYS[type] || [];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${art.pixels[0].length} ${art.pixels.length}`} className={`pixel-art drop-shadow-md ${className}`} style={{ shapeRendering: 'crispEdges' }}>
      {art.pixels.map((rowStr, y) => rowStr.split('').map((char, x) => {
        if (art.colors[char] === 'transparent') return null;
        return <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={art.colors[char]} />;
      }))}
      {overlays.map((overlay, idx) => (
        <rect
          key={`overlay-${type}-${idx}`}
          x={overlay.x}
          y={overlay.y}
          width={overlay.w}
          height={overlay.h}
          fill={overlay.color}
        />
      ))}
    </svg>
  );
};

export default PixelCharacter;
