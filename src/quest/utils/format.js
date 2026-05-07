export const formatG = (num) => new Intl.NumberFormat('ja-JP').format(num) + " G";

export const formatId = (id) => "No." + String(id || 999).padStart(3, '0');

export const getActionBadgeType = (actionType) => {
  if (actionType.includes("契約")) return "contract";
  if (actionType.includes("見積もり")) return "estimate";
  if (actionType.includes("ヒアリング")) return "hearing";
  return "default";
};
