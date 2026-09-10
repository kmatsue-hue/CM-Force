export const formatSalesPattern = (pattern = '') => {
  if (pattern.includes('パターン1')) return '①完全卸し';
  if (pattern.includes('パターン2')) return '②分離';
  if (pattern.includes('パターン3')) return '③完全紹介';
  return pattern || '—';
};

export const formatSalesPatternText = (text = '') =>
  String(text)
    .replaceAll('パターン1（完全卸し）', '①完全卸し')
    .replaceAll('パターン2（分離）', '②分離')
    .replaceAll('パターン3（完全紹介）', '③完全紹介');
