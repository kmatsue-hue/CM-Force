// 施工・納品 フェーズのデフォルトサブタスク
// 案件詳細で初回アクセスされた時点でこの配列が複製されて
// project.phaseDetails['施工・納品'].subTasks に展開される。
export const CONSTRUCTION_SUBTASK_TEMPLATE = [
  { id: 'tpl-wiring',  label: '配線工事',           completed: false, completedAt: null },
  { id: 'tpl-install', label: '機器設置',           completed: false, completedAt: null },
  { id: 'tpl-network', label: 'ネットワーク設定',   completed: false, completedAt: null },
  { id: 'tpl-test',    label: 'テスト',             completed: false, completedAt: null },
];

export const CONSTRUCTION_PHASE = '施工・納品';
