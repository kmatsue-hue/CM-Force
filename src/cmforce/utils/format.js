// --- 日本円フォーマット（億・万単位） ---
export const formatJPY = (n) => {
  const v = Math.round(Number(n) || 0);
  if (v === 0) return '0円';
  const oku = Math.floor(v / 100000000);
  const man = Math.floor((v % 100000000) / 10000);
  const yen = v % 10000;
  const parts = [];
  if (oku > 0) parts.push(`${oku.toLocaleString()}億`);
  if (man > 0) parts.push(`${man.toLocaleString()}万`);
  if (yen > 0 && oku === 0) parts.push(`${yen.toLocaleString()}`);
  return parts.join('') + '円';
};

// 短縮表記（KPI カード用、億/万のみ）
export const formatJPYShort = (n) => {
  const v = Math.round(Number(n) || 0);
  if (v === 0) return '0円';
  if (v >= 100000000) {
    return `${(v / 100000000).toFixed(2).replace(/\.?0+$/, '')}億円`;
  }
  if (v >= 10000) {
    return `${Math.round(v / 10000).toLocaleString()}万円`;
  }
  return `${v.toLocaleString()}円`;
};
