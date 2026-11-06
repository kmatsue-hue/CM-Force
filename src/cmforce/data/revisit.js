// --- 失注の区分と「来季再挑戦」（再浮上）のルール ---
// 失注案件は lostInfo に区分を持つ。
//   category: 'revisit' = 来季再挑戦 / 'final' = 完全失注 / '' = 未分類（区分導入前の失注）
// 来季再挑戦の案件は、再浮上時期の REVISIT_LEAD_DAYS 日前からダッシュボードの「再浮上リスト」に出る。
// 再アタック開始で「案件発掘」から再スタートし、そのときの失注情報は lostHistory に残す。

export const LOST_CATEGORY_REVISIT = 'revisit';
export const LOST_CATEGORY_FINAL = 'final';

export const LOST_CATEGORY_OPTIONS = [
  {
    value: LOST_CATEGORY_REVISIT,
    label: '来季再挑戦',
    description: '予算・補助金・時期の都合で今季は見送り。時期が来たら再浮上リストに出します。',
  },
  {
    value: LOST_CATEGORY_FINAL,
    label: '完全失注',
    description: '他社に決定・ニーズがなくなったなど。再浮上リストには出しません。',
  },
];

export const getLostCategoryLabel = (category) => {
  if (category === LOST_CATEGORY_REVISIT) return '来季再挑戦';
  if (category === LOST_CATEGORY_FINAL) return '完全失注';
  return '未分類';
};

export const REVISIT_TRIGGER_OPTIONS = ['新年度予算', '補助金公募', '建替・開設', '競合の契約更新', 'その他'];

// 再浮上時期の何日前から再浮上リストに出すか
export const REVISIT_LEAD_DAYS = 30;

// 再アタック開始時に戻すフェーズ
export const REATTACK_START_PHASE = '案件発掘';

const pad2 = (n) => String(n).padStart(2, '0');

// ローカル日付の YYYY-MM-DD（toISOString は UTC なので朝9時前に前日になるのを避ける）
export const toLocalDateString = (date = new Date()) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

// 施設の新年度（4月1日）のうち、基準日より後で最も近い日
export const getNextFiscalYearStart = (base = new Date()) => {
  const year = base.getMonth() >= 3 ? base.getFullYear() + 1 : base.getFullYear();
  return `${year}-04-01`;
};

export const formatRevisitDate = (value) => (value ? String(value).replaceAll('-', '/') : '未設定');

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

// 来季再挑戦の案件について、再浮上の状態を返す。対象外なら null。
//   due     : 再浮上時期を過ぎた（当日を含む）
//   soon    : REVISIT_LEAD_DAYS 日以内
//   waiting : まだ先
//   nodate  : 時期が未設定・不正
export const getRevisitStatus = (project, today = new Date()) => {
  if (!project?.isLost || project?.lostInfo?.category !== LOST_CATEGORY_REVISIT) return null;
  const value = project.lostInfo.revisitDate;
  const target = value ? new Date(`${value}T00:00:00`) : null;
  if (!target || Number.isNaN(target.getTime())) return { state: 'nodate', daysLeft: null };
  const daysLeft = Math.round((startOfDay(target) - startOfDay(today)) / 86400000);
  if (daysLeft <= 0) return { state: 'due', daysLeft };
  if (daysLeft <= REVISIT_LEAD_DAYS) return { state: 'soon', daysLeft };
  return { state: 'waiting', daysLeft };
};

export const isRevisitSurfaced = (status) =>
  Boolean(status) && ['due', 'soon', 'nodate'].includes(status.state);

export const getRevisitStatusLabel = (status) => {
  if (!status) return '';
  if (status.state === 'nodate') return '時期未設定';
  if (status.state === 'due') return status.daysLeft === 0 ? '今日が再浮上日' : `再浮上日から${-status.daysLeft}日経過`;
  return `あと${status.daysLeft}日`;
};

// 再アタック開始で終わった失注の件数（過去の失注）
export const getPastLostCount = (project) =>
  (project?.lostHistory || []).filter((entry) => entry?.endType === 'reattack').length;

// 失注の延べ件数（現在の失注 ＋ 再アタックで復活した過去の失注）
export const getLostEventCount = (project) => (project?.isLost ? 1 : 0) + getPastLostCount(project);

const buildSystemLog = (project, content, actor, phase) => {
  const now = new Date();
  return {
    id: now.getTime(),
    date: toLocalDateString(now),
    type: 'activity',
    source: 'system',
    content,
    phase: phase || project.status || '',
    actor: actor || '',
    actorRole: actor ? '実行者' : '',
    nextAction: '',
    nextDate: '',
  };
};

// 失注情報（区分・再浮上欄）を整える。来季再挑戦以外では再浮上欄を空にする。
export const normalizeLostForm = (form = {}) => {
  const category = form.category === LOST_CATEGORY_REVISIT || form.category === LOST_CATEGORY_FINAL
    ? form.category
    : '';
  const isRevisit = category === LOST_CATEGORY_REVISIT;
  return {
    reason: form.reason || '',
    competitor: form.competitor || '',
    category,
    revisitDate: isRevisit ? (form.revisitDate || '') : '',
    revisitTrigger: isRevisit ? (form.revisitTrigger || '') : '',
    revisitNote: isRevisit ? (form.revisitNote || '') : '',
  };
};

// 失注として記録
export const buildLostProject = (project, form) => {
  const info = normalizeLostForm(form);
  const now = new Date();
  const label = getLostCategoryLabel(info.category);
  const detail = info.category === LOST_CATEGORY_REVISIT
    ? `（再浮上時期: ${formatRevisitDate(info.revisitDate)}${info.revisitTrigger ? `・${info.revisitTrigger}` : ''}）`
    : '';
  return {
    ...project,
    isLost: true,
    lostInfo: { ...info, date: toLocalDateString(now) },
    logs: [buildSystemLog(project, `失注として記録: ${label}${detail}`, ''), ...(project.logs || [])],
    updatedAt: now.toISOString(),
  };
};

// 失注の区分・再浮上欄を編集（失注日は変えない）
export const buildLostInfoEditedProject = (project, form) => {
  const info = normalizeLostForm(form);
  const before = project.lostInfo || {};
  const changes = [];
  if ((before.category || '') !== info.category) {
    changes.push(`区分 ${getLostCategoryLabel(before.category)} → ${getLostCategoryLabel(info.category)}`);
  }
  if ((before.revisitDate || '') !== info.revisitDate && info.category === LOST_CATEGORY_REVISIT) {
    changes.push(`再浮上時期 ${formatRevisitDate(before.revisitDate)} → ${formatRevisitDate(info.revisitDate)}`);
  }
  const logs = changes.length > 0
    ? [buildSystemLog(project, `失注情報を変更: ${changes.join('、')}`, ''), ...(project.logs || [])]
    : (project.logs || []);
  return {
    ...project,
    lostInfo: { ...before, ...info, date: before.date || toLocalDateString() },
    logs,
    updatedAt: new Date().toISOString(),
  };
};

// 再浮上時期だけを変更（「時期を延ばす」）
export const buildRevisitPostponedProject = (project, revisitDate, actor = '') => {
  const before = project.lostInfo || {};
  return {
    ...project,
    lostInfo: { ...before, revisitDate },
    logs: [
      buildSystemLog(project, `再浮上時期を変更: ${formatRevisitDate(before.revisitDate)} → ${formatRevisitDate(revisitDate)}`, actor),
      ...(project.logs || []),
    ],
    updatedAt: new Date().toISOString(),
  };
};

// 完全失注に切り替え
export const buildFinalLostProject = (project, actor = '') => {
  const before = project.lostInfo || {};
  return {
    ...project,
    lostInfo: { ...before, category: LOST_CATEGORY_FINAL, revisitDate: '', revisitTrigger: '', revisitNote: '' },
    logs: [
      buildSystemLog(project, `失注の区分を変更: ${getLostCategoryLabel(before.category)} → 完全失注`, actor),
      ...(project.logs || []),
    ],
    updatedAt: new Date().toISOString(),
  };
};

// 再アタック開始: 「案件発掘」から再スタート。案件の中身（施設情報・メモ・ログなど）は残す。
export const buildReattackProject = (project, actor = '') => {
  const now = new Date();
  const before = project.lostInfo || {};
  const historyEntry = {
    ...before,
    endType: 'reattack',
    endedAt: now.toISOString(),
    endedBy: actor,
    statusAtLost: project.status || '',
  };
  const lostSummary = [before.date ? `失注日 ${formatRevisitDate(before.date)}` : '', getLostCategoryLabel(before.category)]
    .filter(Boolean)
    .join('・');
  const startLog = {
    ...buildSystemLog(
      project,
      `再アタック開始: 「${project.status || '—'}」で失注（${lostSummary}）した案件を「${REATTACK_START_PHASE}」から再スタートしました`,
      actor,
      REATTACK_START_PHASE,
    ),
    nextAction: before.revisitNote || '',
  };
  return {
    ...project,
    isLost: false,
    status: REATTACK_START_PHASE,
    kaientaiFlow: { active: false, sub: 0 },
    marginFlow: { active: false, sub: 0 },
    lostInfo: null,
    lostHistory: [historyEntry, ...(project.lostHistory || [])],
    logs: [startLog, ...(project.logs || [])],
    updatedAt: now.toISOString(),
  };
};

// 失注の取り消し（誤って失注にした場合の訂正）。元のフェーズのまま進行中に戻す。
export const buildLostCanceledProject = (project, actor = '') => ({
  ...project,
  isLost: false,
  lostInfo: null,
  logs: [buildSystemLog(project, '失注を取り消し、元のフェーズのまま進行中に戻しました', actor), ...(project.logs || [])],
  updatedAt: new Date().toISOString(),
});
