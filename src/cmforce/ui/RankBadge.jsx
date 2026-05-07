import React from 'react';

export const RANK_STYLES = {
  A: { text: 'text-emerald-600', label: 'A ランク' },
  B: { text: 'text-amber-600',   label: 'B ランク' },
  C: { text: 'text-gray-500',    label: 'C ランク' },
};

const RankBadge = ({ rank, large = false }) => {
  const s = RANK_STYLES[rank] || RANK_STYLES['C'];
  return large ? (
    <span className="inline-flex items-baseline gap-2">
      <span className={`text-3xl font-black leading-none ${s.text}`}>{rank || '—'}</span>
      <span className="text-xs font-semibold text-gray-400">ランク</span>
    </span>
  ) : (
    <span className={`text-2xl font-black leading-none ${s.text}`}>{rank || '—'}</span>
  );
};

export default RankBadge;
