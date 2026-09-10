import { PHASES } from '../../cmforce/data/phases.js';

const PREFECTURE_TO_AREA = {
  北海道: '北海道',
  青森県: '東北', 岩手県: '東北', 宮城県: '東北', 秋田県: '東北', 山形県: '東北', 福島県: '東北',
  茨城県: '関東', 栃木県: '関東', 群馬県: '関東', 埼玉県: '関東', 千葉県: '関東', 東京都: '関東', 神奈川県: '関東',
  新潟県: '中部', 富山県: '中部', 石川県: '中部', 福井県: '中部', 山梨県: '中部', 長野県: '中部', 岐阜県: '中部', 静岡県: '中部', 愛知県: '中部',
  三重県: '関西', 滋賀県: '関西', 京都府: '関西', 大阪府: '関西', 兵庫県: '関西', 奈良県: '関西', 和歌山県: '関西',
  鳥取県: '中国', 島根県: '中国', 岡山県: '中国', 広島県: '中国', 山口県: '中国',
  徳島県: '四国', 香川県: '四国', 愛媛県: '四国', 高知県: '四国',
  福岡県: '九州', 佐賀県: '九州', 長崎県: '九州', 熊本県: '九州', 大分県: '九州', 宮崎県: '九州', 鹿児島県: '九州', 沖縄県: '九州',
};

const resolveArea = (address = '') => {
  const prefecture = Object.keys(PREFECTURE_TO_AREA).find(name => address.includes(name));
  return prefecture ? PREFECTURE_TO_AREA[prefecture] : '関東';
};

const reachedPhase = (status, target) => PHASES.indexOf(status) >= PHASES.indexOf(target);
const PHASE_ADVANCE_EXP = 10;
export const MANUAL_ACTIVITY_LOG_PROFIT_G = 5000;

const SYSTEM_ACTIVITY_LOG_PREFIXES = [
  'フェーズ分析',
  'フェーズ進捗',
  'フェーズ分岐',
  '販売スキームを',
];

// source 未保存の旧データも集計するため、自動生成ログだけを除外する。
export const isManualActivityLog = (log = {}) => {
  if (log.type !== 'activity') return false;
  if (log.source === 'manual') return true;
  if (log.source === 'system') return false;

  const content = String(log.content || '').trim();
  if (!content) return false;
  if (SYSTEM_ACTIVITY_LOG_PREFIXES.some(prefix => content.startsWith(prefix))) return false;
  return true;
};

const getForwardPhaseProgressKey = (log = {}) => {
  const content = String(log.content || '').trim();
  if (!content.startsWith('フェーズ進捗:') && !content.startsWith('フェーズ分岐:')) return '';
  if (content.includes('へ戻しました')) return '';
  if (
    !content.includes('へ進めました')
    && !content.includes('サブフローを開始しました')
    && !content.includes('へ合流しました')
  ) return '';

  const directTransition = content.match(/「([^」]+)」\s*(?:→|から)\s*「([^」]+)」\s*へ進めました/);
  if (directTransition) return `${directTransition[1]}->${directTransition[2]}`;

  const mergeTransition = content.match(/サブフロー「([^」]+)」を抜けて本流「([^」]+)」へ合流しました/);
  if (mergeTransition) return `${mergeTransition[1]}->${mergeTransition[2]}`;

  const branchStart = content.match(/「([^」]+)」\s*から\s*(介援隊|マージン支払|利益計上)サブフローを開始しました/);
  if (branchStart) {
    const firstSubPhase = branchStart[2] === '介援隊' ? '介援隊：見積書提出' : 'マージン支払';
    return `${branchStart[1]}->${firstSubPhase}`;
  }

  // 表記揺れがある旧ログも、実行者表記を除いた本文単位で一度だけ加算する。
  return content
    .replace(/[（(]\s*実行者\s*[:：][^）)]+[）)]/g, '')
    .replace(/\s+/g, '');
};

const getPhaseProgressExperience = (project) => {
  const uniqueForwardSteps = new Set(
    (project.logs || [])
      .map(getForwardPhaseProgressKey)
      .filter(Boolean)
  );
  return {
    count: uniqueForwardSteps.size,
    exp: uniqueForwardSteps.size * PHASE_ADVANCE_EXP,
  };
};

const formatQuestLogDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
};

const getConfirmedMarginPayment = (project) => {
  const marginPayment = project.phaseDetails?.['マージン支払'] || {};
  const marginPaymentDate =
    marginPayment.marginScheduledDate
    || marginPayment.marginPaymentDate
    || marginPayment.paymentDate
    || '';
  const rawMarginAmount =
    marginPayment.marginAmount
    ?? marginPayment.marginPaymentAmount
    ?? '';
  const marginAmount = Number(String(rawMarginAmount).replaceAll(',', '')) || 0;
  return {
    // 金額と支払日が保存されていれば、後からサブフローを抜けた案件でも利益として確定する。
    amount: marginPaymentDate && marginAmount > 0 ? marginAmount : 0,
    date: marginPaymentDate,
  };
};

export const mapCmForceProjectsToQuest = (projects = [], staff = []) => {
  const staffByNumber = new Map(staff.map(member => [member.staffNumber, member]));
  const staffByName = new Map(staff.map(member => [member.name, member]));

  return projects
    .filter(project => !project.isLost)
    .map((project) => {
      const owner = staffByNumber.get(project.picCaremaxStaffNumber)
        || staffByName.get(project.picCaremax);
      const hearing = reachedPhase(project.status, 'EUとの商談') ? 1 : 0;
      const estimate = reachedPhase(project.status, '提案書／見積書提出') ? 1 : 0;
      const contract = reachedPhase(project.status, '販売契約締結') ? 1 : 0;
      const expectedRevenue = Number(project.financial?.expectedRevenue) || 0;
      const confirmedMarginPayment = getConfirmedMarginPayment(project);
      const phaseProgressExperience = getPhaseProgressExperience(project);

      return {
        id: project.id,
        projectId: project.id,
        projectName: project.name || '案件名未設定',
        name: project.endUser?.companyName || project.name,
        companyName: project.endUser?.companyName || '',
        dealerName: project.endUser?.retailerName || '',
        status: contract ? '契約済み' : estimate ? '見積もり中' : hearing ? 'ヒアリング中' : '未着手',
        phase: project.status || '',
        phaseProgress: Math.max(0, PHASES.indexOf(project.status) + 1),
        phaseCount: PHASES.length,
        owner: owner?.name || project.picCaremax || '担当者未設定',
        ownerStaffNumber: owner?.staffNumber || project.picCaremaxStaffNumber || '',
        area: resolveArea(project.endUser?.address || ''),
        salesPattern: project.salesPattern || '',
        rank: project.rank || '',
        progress: { hearing, estimate, contract },
        sales: expectedRevenue,
        profit: confirmedMarginPayment.amount,
        marginPaymentDate: confirmedMarginPayment.date,
        updatedAt: project.updatedAt || project.startDate || '',
        phaseProgressCount: phaseProgressExperience.count,
        phaseProgressExp: phaseProgressExperience.exp,
        earnedExp:
          25
          + (expectedRevenue > 0 ? 50 : 0)
          + (confirmedMarginPayment.amount > 0 ? 150 : 0)
          + phaseProgressExperience.exp,
      };
    });
};

export const mapCmForceProjectsToQuestLogs = (projects = [], staff = []) => {
  const staffByNumber = new Map(staff.map(member => [member.staffNumber, member]));
  const staffByName = new Map(staff.map(member => [member.name, member]));
  const clients = mapCmForceProjectsToQuest(projects, staff);
  const projectLogs = clients.map((client, index) => {
    const actionType = client.progress.contract
      ? '契約'
      : client.progress.estimate
        ? '見積もり'
        : client.progress.hearing
          ? 'ヒアリング'
          : 'クエスト追加';
    return {
      id: `cm-${client.projectId}-${index}`,
      projectId: client.projectId,
      date: formatQuestLogDate(client.updatedAt),
      userName: client.owner,
      userStaffNumber: client.ownerStaffNumber,
      clientName: client.name,
      area: client.area,
      actionType,
      earnedExp: client.earnedExp,
      // 見積もり段階の想定売上は実績に含めず、販売契約締結後だけ計上する。
      sales: client.progress.contract ? client.sales : 0,
      profit: client.progress.contract ? client.profit : 0,
    };
  });

  // 手入力の活動ログ報酬は、案件が失注しても残る独立した収益履歴として扱う。
  const activityRewardLogs = projects.flatMap((project) => {
    const projectOwner = staffByNumber.get(project.picCaremaxStaffNumber)
      || staffByName.get(project.picCaremax);

    return (project.logs || []).flatMap((log, index) => {
      if (!isManualActivityLog(log)) return [];

      const rewardOwner = staffByNumber.get(log.questRewardStaffNumber)
        || staffByName.get(log.questRewardUserName)
        || projectOwner;
      const userName = rewardOwner?.name || log.questRewardUserName || project.picCaremax || '担当者未設定';
      const userStaffNumber = rewardOwner?.staffNumber || log.questRewardStaffNumber || project.picCaremaxStaffNumber || '';

      return [{
        id: `cm-activity-${project.id}-${log.id ?? index}`,
        projectId: project.id,
        sourceLogId: log.id ?? '',
        date: formatQuestLogDate(log.date || project.updatedAt),
        userName,
        userStaffNumber,
        clientName: project.endUser?.companyName || project.name || '案件名未設定',
        area: resolveArea(project.endUser?.address || ''),
        actionType: '活動ログ',
        earnedExp: 0,
        sales: 0,
        profit: MANUAL_ACTIVITY_LOG_PROFIT_G,
        isActivityLogReward: true,
      }];
    });
  });

  return [...activityRewardLogs, ...projectLogs];
};

export const calculateQuestExperienceByStaff = (projects = [], staff = []) => {
  const staffByNumber = new Map(staff.map(member => [member.staffNumber, member]));
  const staffByName = new Map(staff.map(member => [member.name, member]));
  const expByStaffNumber = new Map(staff.map(member => [member.staffNumber, 0]));

  projects.forEach((project) => {
    const owner = staffByNumber.get(project.picCaremaxStaffNumber)
      || staffByName.get(project.picCaremax);
    if (!owner?.staffNumber) return;

    const expectedRevenue = Number(project.financial?.expectedRevenue) || 0;
    const confirmedMarginPayment = getConfirmedMarginPayment(project);
    const phaseProgressExperience = getPhaseProgressExperience(project);
    const earnedExp =
      25
      + (expectedRevenue > 0 ? 50 : 0)
      + (confirmedMarginPayment.amount > 0 ? 150 : 0)
      + phaseProgressExperience.exp;

    expByStaffNumber.set(
      owner.staffNumber,
      (expByStaffNumber.get(owner.staffNumber) || 0) + earnedExp
    );
  });

  return expByStaffNumber;
};
