import React from 'react';
import PixelCharacter from './PixelCharacter.jsx';

const CharacterIcon = ({
  type = 'hero',
  size = 44,
  level = 1,
  className = '',
  animated = true,
}) => {
  const normalizedLevel = Math.max(1, Number(level) || 1);
  const evolutionTier = normalizedLevel >= 15 ? 3 : normalizedLevel >= 10 ? 2 : normalizedLevel >= 5 ? 1 : 0;
  const isGoldEvolution = evolutionTier >= 3;
  const haloColor = isGoldEvolution ? 'rgba(250, 204, 21, 0.9)' : 'rgba(226, 232, 240, 0.88)';
  const sparkleColor = isGoldEvolution ? '#facc15' : '#ffffff';
  const sparkles = [
    { left: -0.04, top: 0.08, scale: 0.17, delay: '0s' },
    { left: 0.82, top: 0.04, scale: 0.14, delay: '0.32s' },
    { left: 0.92, top: 0.54, scale: 0.18, delay: '0.68s' },
    { left: 0.02, top: 0.66, scale: 0.13, delay: '0.94s' },
    { left: 0.68, top: 0.82, scale: 0.12, delay: '1.24s' },
    { left: 0.42, top: -0.08, scale: 0.1, delay: '1.52s' },
  ];
  const characterSize = Math.round(size * 0.94);

  return (
    <span
      className={`relative inline-flex shrink-0 items-end justify-center ${className}`}
      style={{
        width: size,
        height: size,
      }}
      aria-hidden="true"
    >
      {evolutionTier >= 2 && (
        <span
          className="character-icon-evolution-halo pointer-events-none absolute rounded-full"
          style={{
            width: size * 1.62,
            height: size * 1.62,
            left: -size * 0.31,
            top: -size * 0.31,
            zIndex: 0,
            background: `
              radial-gradient(circle, ${haloColor} 0 7%, transparent 8% 36%, ${haloColor} 37% 41%, transparent 42% 100%),
              repeating-conic-gradient(from 0deg, ${haloColor} 0deg 3deg, transparent 3deg 15deg)
            `,
            opacity: isGoldEvolution ? 0.92 : 0.72,
            filter: `drop-shadow(0 0 ${Math.max(3, size * 0.08)}px ${haloColor})`,
            maskImage: 'radial-gradient(circle, transparent 0 30%, black 42% 72%, transparent 78%)',
            WebkitMaskImage: 'radial-gradient(circle, transparent 0 30%, black 42% 72%, transparent 78%)',
          }}
        />
      )}
      <PixelCharacter
        type={type}
        size={characterSize}
        level={normalizedLevel}
        animated={animated}
        className="relative z-20"
      />
      {evolutionTier >= 1 && sparkles.map((sparkle, index) => (
        <span
          key={`evolution-sparkle-${index}`}
          className="character-icon-evolution-sparkle pointer-events-none absolute z-30"
          style={{
            width: size * sparkle.scale,
            height: size * sparkle.scale,
            left: size * sparkle.left,
            top: size * sparkle.top,
            animationDelay: sparkle.delay,
            clipPath: 'polygon(50% 0%, 61% 38%, 100% 50%, 61% 62%, 50% 100%, 39% 62%, 0% 50%, 39% 38%)',
            background: isGoldEvolution
              ? `radial-gradient(circle, #fff7ae 0 20%, ${sparkleColor} 42%, #d97706 100%)`
              : `radial-gradient(circle, #ffffff 0 24%, ${sparkleColor} 48%, #c4b5fd 100%)`,
            filter: `drop-shadow(0 0 ${Math.max(2, size * 0.045)}px ${isGoldEvolution ? '#fde047' : '#ffffff'})`,
          }}
        />
      ))}
    </span>
  );
};

export default CharacterIcon;
