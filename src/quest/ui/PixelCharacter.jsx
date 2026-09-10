import React from 'react';
import { PIXEL_ARTS, CLASS_FEATURE_OVERLAYS, getCharacterEvolutionOverlays } from '../data/pixelArt.js';

const getEvolutionTierByLevel = (level = 1) => {
  const normalizedLevel = Math.max(1, Number(level) || 1);
  if (normalizedLevel >= 15) return 3;
  if (normalizedLevel >= 10) return 2;
  if (normalizedLevel >= 5) return 1;
  return 0;
};

const PixelCharacter = ({ type = 'hero', size = 48, className = "", animated = false, level = 1 }) => {
  const art = PIXEL_ARTS[type] || PIXEL_ARTS.hero;
  const evolutionTier = getEvolutionTierByLevel(level);
  const overlays = [
    ...(CLASS_FEATURE_OVERLAYS[type] || []),
    ...getCharacterEvolutionOverlays(type, evolutionTier),
  ];
  const legStartRow = Math.max(art.pixels.length - 5, Math.floor(art.pixels.length * 0.74));
  const legSplitX = Math.floor(art.pixels[0].length / 2);
  const bodyRects = [];
  const leftLegRects = [];
  const rightLegRects = [];

  art.pixels.forEach((rowStr, y) => {
    rowStr.split('').forEach((char, x) => {
      const fill = art.colors[char];
      if (fill === 'transparent') return;

      const rect = <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={fill} />;
      if (y < legStartRow) {
        bodyRects.push(rect);
        return;
      }

      if (x < legSplitX) {
        leftLegRects.push(rect);
      } else {
        rightLegRects.push(rect);
      }
    });
  });

  const overlayRects = overlays.map((overlay, idx) => (
    <rect
      key={`overlay-${type}-${idx}`}
      x={overlay.x}
      y={overlay.y}
      width={overlay.w}
      height={overlay.h}
      fill={overlay.color}
    />
  ));

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${art.pixels[0].length} ${art.pixels.length}`}
      className={`pixel-art drop-shadow-md ${className}`}
      data-evolution-tier={evolutionTier}
      style={{ shapeRendering: 'crispEdges' }}
    >
      <g
        className={animated ? 'character-icon-body' : ''}
        style={animated ? { transformBox: 'fill-box', transformOrigin: 'center bottom' } : undefined}
      >
        {bodyRects}
        {overlayRects}
      </g>
      <g
        className={animated ? 'character-icon-leg character-icon-leg--left' : ''}
        style={animated ? { transformBox: 'fill-box', transformOrigin: 'center top' } : undefined}
      >
        {leftLegRects}
      </g>
      <g
        className={animated ? 'character-icon-leg character-icon-leg--right' : ''}
        style={animated ? { transformBox: 'fill-box', transformOrigin: 'center top' } : undefined}
      >
        {rightLegRects}
      </g>
    </svg>
  );
};

export default PixelCharacter;
