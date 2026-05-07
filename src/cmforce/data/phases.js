// --- フェーズ定義 ---
export const PHASES = [
  '案件発掘', '案件スクリーニング', 'EUとの商談', '現地調査',
  '設計', '提案書／見積書提出', '販売契約締結', '施工・納品', '一次保守'
];

// 介援隊サブフロー（パターン①/②で「提案書／見積書提出」の次にこちらを選択した場合のみ通る）
// 完了後は本流の「施工・納品」(index 7) に合流。
export const KAIENTAI_SUB = ['介援隊：見積書提出', '介援隊：納品'];
export const BRANCH_PHASE = '提案書／見積書提出';
export const MERGE_PHASE = '施工・納品';
export const isBranchablePattern = (pattern) => !!pattern && (pattern.includes('パターン1') || pattern.includes('パターン2'));

// マージン支払サブフロー（全パターンで「施工・納品」の上に分岐）
// パターン①/③: マージン支払 → 販売店へ支払 → 一次保守
// パターン②   : マージン支払 がゴール（販売店へ支払 なし → 一次保守へ合流）
export const MARGIN_BRANCH_PHASE = '施工・納品';
export const MARGIN_MERGE_PHASE  = '一次保守';
export const getMarginSteps = (pattern) =>
  pattern?.includes('パターン2') ? ['マージン支払'] : ['マージン支払', '販売店へ支払'];
export const isMarginBranchablePattern = (pattern) =>
  !!pattern && (pattern.includes('パターン1') || pattern.includes('パターン2') || pattern.includes('パターン3'));
