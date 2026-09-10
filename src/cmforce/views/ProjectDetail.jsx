import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Building,
  Calendar,
  ChevronRight,
  Edit,
  FileText,
  MessageSquare,
  Trash2,
  X,
} from 'lucide-react';
import {
  PHASES,
  BRANCH_PHASE,
  MERGE_PHASE,
  KAIENTAI_SUB,
  MARGIN_BRANCH_PHASE,
  MARGIN_MERGE_PHASE,
  WEB_MEETING_PHASE,
  WEB_MEETING_LOG_TYPE,
  isBranchablePattern,
  isMarginBranchablePattern,
  getMarginSteps,
} from '../data/phases.js';
import { FACILITY_TYPE_OPTIONS, getFacilityTypeMeta, normalizeFacilityType } from '../data/facilityTypes.js';
import { PREFECTURE_OPTIONS, getProjectPrefecture, normalizePrefecture } from '../data/prefectures.js';
import { formatJPYShort } from '../utils/format.js';
import { formatSalesPattern, formatSalesPatternText } from '../utils/salesPattern.js';
import { ROLES } from '../data/roles.js';
import { validatePhaseAdvance } from '../data/phaseValidators.js';
import Card from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';
import RankBadge from '../ui/RankBadge.jsx';
import ArrowDiagram from '../ui/ArrowDiagram.jsx';
import PhaseDetailPanel from '../ui/PhaseDetailPanel.jsx';
import { AssistTip } from '../ui/AssistMode.jsx';
import ProjectName from '../ui/ProjectName.jsx';
import { stripProjectHonorific } from '../utils/projectName.js';

const TAB_HINTS = {
  endUser: 'エンドユーザー（導入先施設）情報。\n企業名・担当者名・連絡先・販売店を確認。\n編集は右上の「編集」ボタンから一括で行えます。',
  project: '案件情報。\n想定全体売上・担当者・案件ランク・開始日／クローズ予定・卸値／紹介料・ニーズ等を一覧。\n値が空の項目は表示されません。',
  log: '活動ログ。\n商談記録・次回アクション・アラートを時系列で表示。\n「EUとの商談」フェーズから次へ進めるには、最新ログに「次回アクション日付」が必要です。',
};

// 各データ項目の説明
const FIELD_HINTS = {
  '企業・施設名':  '導入先（エンドユーザー）の正式名称。\n社内システム検索のキーになるので正確に入れてください。',
  '都道府県':      '導入先施設が所在する都道府県。\n案件一覧の詳細ビューで地域を素早く確認できます。',
  '施設業態':      '導入先施設の業態区分。\n特養・老健・有料・グループホームなどを選択して、案件一覧でも見分けやすくします。',
  '担当者名':      '先方の窓口担当者名。\n例: 施設長 山田様、事務長 佐藤、IT担当 鈴木 など。',
  '連絡先':        '電話番号またはメールアドレス。\n緊急時の連絡先として使うので最新の値に保ちましょう。',
  '販売店':        '介在する販売店・代理店名。\n直販なら「直販」と入れます。',
  'SOMPOケアソリューションズ担当者': 'SOMPOケアソリューションズ側の責任者。\n担当者管理タブで登録された人を割り当てます。',
  'ケアマックス担当者': 'ケアマックス社内の窓口担当者。\n営業企画・KPI管理側のキーパーソンを指名します。',
  '案件ランク':    'A=確度高 / B=確度中 / C=確度低。\n月次レビューや優先順位付けの軸になります。',
  '開始日':        '案件着手日。\nダッシュボードのソート・KPI 集計に使用。',
  'クローズ予定':  '受注見込み日。\nリードタイムの目安として活用、月次予測にも反映されます。',
  '卸値':          'ケアマックスへの仕入れ値（税抜）。\n粗利計算に使用します。',
  '紹介料':        '紹介スキーム時の紹介料率(%) と金額。\n③完全紹介の案件で入力します。',
  'ニーズ・課題':  'エンドユーザーが解決したい課題や要望。\n提案書のストーリーラインの基礎になるので具体的に。',
  '想定全体売上':  'この案件で得られる想定売上総額（税抜）。\nダッシュボードのパイプライン金額に反映されます。',
};

const withRevenueBreakdown = (project) => {
  const financial = project.financial || {};
  const hasBreakdown = financial.equipmentRevenue != null || financial.constructionRevenue != null;
  const equipmentRevenue = hasBreakdown
    ? Number(financial.equipmentRevenue) || 0
    : Number(financial.expectedRevenue) || 0;
  const constructionRevenue = Number(financial.constructionRevenue) || 0;

  return {
    ...project,
    financial: {
      ...financial,
      equipmentRevenue,
      constructionRevenue,
      marginPaymentExpectedAmount: Number(financial.marginPaymentExpectedAmount) || 0,
      expectedRevenue: equipmentRevenue + constructionRevenue,
    },
  };
};

const prepareProjectForEdit = (project, staff = []) => {
  const normalized = withRevenueBreakdown(project);
  const assigned = staff.find(member =>
    member.staffNumber === normalized.picCaremaxStaffNumber
    || member.name === normalized.picCaremax
  );
  if (!assigned) {
    return {
      ...normalized,
      name: stripProjectHonorific(normalized.name),
      endUser: {
        ...(normalized.endUser || {}),
        prefecture: getProjectPrefecture(normalized),
      },
      facilityType: normalizeFacilityType(normalized.facilityType),
      hasIctHearingSheet: Boolean(normalized.hasIctHearingSheet),
    };
  }
  return {
    ...normalized,
    name: stripProjectHonorific(normalized.name),
    endUser: {
      ...(normalized.endUser || {}),
      prefecture: getProjectPrefecture(normalized),
    },
    picCaremax: assigned.name,
    picCaremaxStaffNumber: assigned.staffNumber,
    facilityType: normalizeFacilityType(normalized.facilityType),
    hasIctHearingSheet: Boolean(normalized.hasIctHearingSheet),
  };
};

const LOG_ACTOR_PATTERN = /[（(]\s*(変更者|実行者)\s*[:：]\s*([^）)]+)\s*[）)]/;
const replaceLegacySetupName = (value = '') =>
  String(value).replaceAll('セットアップ', 'SOMPOケアソリューションズ');

const inferLogPhase = (content = '') => {
  const phaseMatch = content.match(/(?:フェーズ進捗|フェーズ分岐):.*?「([^」]+)」/)
    || content.match(/サブフロー「([^」]+)」/);
  return phaseMatch?.[1] || '';
};

const getLogPresentation = (log) => {
  const actorMatch = (log.content || '').match(LOG_ACTOR_PATTERN);
  const isWebMeetingRequest = log.type === WEB_MEETING_LOG_TYPE;
  return {
    actor: log.actor || actorMatch?.[2]?.trim() || '',
    actorRole: log.actorRole || actorMatch?.[1] || '',
    content: isWebMeetingRequest
      ? (log.requestContent || log.content || '').trim()
      : formatSalesPatternText(replaceLegacySetupName((log.content || '').replace(LOG_ACTOR_PATTERN, '').trim())),
    phase: log.phase || log.phaseName || inferLogPhase(log.content) || 'フェーズ未記録',
  };
};

const PHASE_CIRCLE_LABELS = {
  '案件発掘': '案件\n発掘',
  '案件スクリーニング': 'スクリー\nニング',
  [WEB_MEETING_PHASE]: 'WEB\n面談',
  'EUとの商談': 'EU\n商談',
  '現地調査': '現地\n調査',
  '提案書／見積書提出': '提案／\n見積提出',
  '販売契約締結': '販売契約\n締結',
  '施工・納品': '施工／\n納品',
  '一次保守': '一次\n保守',
  '介援隊：見積書提出': '介援隊\n見積提出',
  '介援隊：納品': '介援隊\n納品',
  'マージン支払': 'マージン\n支払',
  '販売店へ支払': '販売店\n支払',
  'フェーズ未記録': 'フェーズ\n未記録',
};

const getPhaseProgress = (phase) => {
  const phaseIndex = PHASES.indexOf(phase);
  if (phaseIndex >= 0) return ((phaseIndex + 1) / PHASES.length) * 100;
  if (phase?.startsWith('介援隊')) return 72;
  if (phase === 'マージン支払' || phase === '販売店へ支払') return 94;
  return 0;
};

// --- 案件詳細 ---
const ProjectDetail = ({ project, onBack, onUpdateProject, onDeleteProject, canEdit = true, currentRole = ROLES.KIKAKU, staff = [] }) => {
  const [selectedPhase, setSelectedPhase] = useState(project.status);
  const [infoTab, setInfoTab] = useState('endUser'); // 'endUser' | 'project' | 'log'
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editInfo, setEditInfo] = useState(() => prepareProjectForEdit(project, staff));
  const [newLog, setNewLog] = useState({ content: '', nextAction: '', nextDate: '' });
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [logPhaseFilter, setLogPhaseFilter] = useState('all');
  const [showLostConfirm, setShowLostConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [lostForm, setLostForm] = useState({ reason: '', competitor: '' });
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showMarginBranchModal, setShowMarginBranchModal] = useState(false);
  const [branchSelectByName, setBranchSelectByName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  // パターン（販売スキーム）変更時の確認モーダル
  const [showPatternChangeConfirm, setShowPatternChangeConfirm] = useState(false);
  const [patternChangedByName, setPatternChangedByName] = useState('');
  const [pendingEditInfo, setPendingEditInfo] = useState(null);
  const isLost = project.isLost || false;
  // 営業部などの read-only ロール向け: 編集/削除/フェーズ操作を一括ロック。
  // PhaseDetailPanel 側は isLost を「書き込み禁止」フラグとして使っているので、
  // !canEdit のときも isLost と同じ扱いにして既存ロジックをそのまま再利用する。
  const isReadOnly = isLost || !canEdit;

  const kaientaiFlow = project.kaientaiFlow || { active: false, sub: 0 };
  const marginSteps  = getMarginSteps(project.salesPattern);
  const storedMarginFlow = project.marginFlow || { active: false, sub: 0 };
  // 旧仕様でパターン①が「販売店へ支払」まで進んでいた場合も、新しい1段階フローへ安全に寄せる。
  const marginFlow = {
    ...storedMarginFlow,
    sub: Math.min(Number(storedMarginFlow.sub) || 0, Math.max(0, marginSteps.length - 1)),
  };
  const isPatternOne = project.salesPattern?.includes('パターン1');
  const canViewMarginProfit = currentRole !== ROLES.SETUP;
  const marginFlowDisplayName = isPatternOne ? '利益計上サブフロー' : 'マージン支払サブフロー';
  const caremaxSalesStaff = staff.filter(member => member.department === ROLES.EIGYO);
  const logEntries = (project.logs || []).map(log => ({
    log,
    view: getLogPresentation(log),
  }));
  const logPhaseCounts = logEntries.reduce((counts, entry) => {
    counts.set(entry.view.phase, (counts.get(entry.view.phase) || 0) + 1);
    return counts;
  }, new Map());
  const preferredLogPhaseOrder = [...PHASES, ...KAIENTAI_SUB, ...marginSteps];
  const logPhaseOptions = [
    ...preferredLogPhaseOrder.filter((phase, index) =>
      logPhaseCounts.has(phase) && preferredLogPhaseOrder.indexOf(phase) === index
    ),
    ...[...logPhaseCounts.keys()].filter(phase => !preferredLogPhaseOrder.includes(phase)),
  ];
  const filteredLogEntries = logPhaseFilter === 'all'
    ? logEntries
    : logEntries.filter(entry => entry.view.phase === logPhaseFilter);
  // 表示・操作上の "現在フェーズ"
  const effectivePhase = kaientaiFlow.active
    ? KAIENTAI_SUB[kaientaiFlow.sub]
    : (marginFlow.active ? marginSteps[marginFlow.sub] : project.status);
  // 次に進むフェーズのラベル
  const computeNextPhaseLabel = () => {
    if (kaientaiFlow.active) {
      return kaientaiFlow.sub < KAIENTAI_SUB.length - 1 ? KAIENTAI_SUB[kaientaiFlow.sub + 1] : MERGE_PHASE;
    }
    if (marginFlow.active) {
      return marginFlow.sub < marginSteps.length - 1 ? marginSteps[marginFlow.sub + 1] : MARGIN_MERGE_PHASE;
    }
    const idx = PHASES.indexOf(project.status);
    if (idx < 0 || idx >= PHASES.length - 1) return null;
    return PHASES[idx + 1];
  };
  const nextPhaseLabel = computeNextPhaseLabel();

  // 一つ前のフェーズのラベル
  const computePrevPhaseLabel = () => {
    if (marginFlow.active) {
      return marginFlow.sub > 0 ? marginSteps[marginFlow.sub - 1] : MARGIN_BRANCH_PHASE;
    }
    if (kaientaiFlow.active) {
      return kaientaiFlow.sub > 0 ? KAIENTAI_SUB[kaientaiFlow.sub - 1] : BRANCH_PHASE;
    }
    const idx = PHASES.indexOf(project.status);
    if (idx <= 0) return null;
    return PHASES[idx - 1];
  };
  const prevPhaseLabel = computePrevPhaseLabel();

  // 進行バリデーション: 違反メッセージ配列。空なら進行可能。
  // サブフロー中は対象外（メインフェーズの進行ルールのみ適用）
  const advanceErrors = (kaientaiFlow.active || marginFlow.active)
    ? []
    : validatePhaseAdvance(project, project.status);

  React.useEffect(() => {
    setSelectedPhase(effectivePhase);
    setEditInfo(prepareProjectForEdit(project, staff));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  React.useEffect(() => {
    setLogPhaseFilter('all');
  }, [project.id]);

  const handleUpdatePhaseData = (phaseName, newPhaseData) => {
    onUpdateProject({
      ...project,
      phaseDetails: { ...project.phaseDetails, [phaseName]: newPhaseData },
      updatedAt: new Date().toISOString()
    });
  };

  // フェーズ進捗 変更ログを先頭追記するヘルパ
  const prependPhaseLog = (content) => {
    const now = new Date();
    const actorMatch = content.match(LOG_ACTOR_PATTERN);
    return [
      {
        id: now.getTime(),
        date: now.toISOString().split('T')[0],
        type: 'activity',
        source: 'system',
        content: content.replace(LOG_ACTOR_PATTERN, '').trim(),
        phase: inferLogPhase(content) || effectivePhase,
        actor: actorMatch?.[2]?.trim() || '',
        actorRole: actorMatch?.[1] || '',
        nextAction: '',
        nextDate: '',
      },
      ...(project.logs || []),
    ];
  };

  const handleAdvancePhase = (changedBy = '') => {
    const name = (changedBy || '').trim();
    const now = new Date().toISOString();
    const logFor = (fromLabel, toLabel) => prependPhaseLog(
      `フェーズ進捗: 「${fromLabel}」 → 「${toLabel}」 へ進めました${name ? `（実行者: ${name}）` : ''}`
    );

    // マージン支払サブフロー中
    if (marginFlow.active) {
      if (marginFlow.sub < marginSteps.length - 1) {
        const fromLabel = marginSteps[marginFlow.sub];
        const toLabel   = marginSteps[marginFlow.sub + 1];
        onUpdateProject({
          ...project,
          marginFlow: { active: true, sub: marginFlow.sub + 1 },
          logs: logFor(fromLabel, toLabel),
          updatedAt: now,
        });
      } else {
        // サブフロー完了 → 「一次保守」に合流
        const fromLabel = marginSteps[marginFlow.sub];
        onUpdateProject({
          ...project,
          status: MARGIN_MERGE_PHASE,
          marginFlow: { active: false, sub: 0, completed: true },
          logs: logFor(fromLabel, MARGIN_MERGE_PHASE),
          updatedAt: now,
        });
      }
      return;
    }

    // 「施工・納品」かつ全パターン → マージン分岐選択モーダル（ログはサブモーダルで記録）
    if (project.status === MARGIN_BRANCH_PHASE && isMarginBranchablePattern(project.salesPattern) && !marginFlow.completed) {
      setBranchSelectByName('');
      setShowMarginBranchModal(true);
      return;
    }

    // 介援隊サブフロー中
    if (kaientaiFlow.active) {
      if (kaientaiFlow.sub < KAIENTAI_SUB.length - 1) {
        const fromLabel = KAIENTAI_SUB[kaientaiFlow.sub];
        const toLabel   = KAIENTAI_SUB[kaientaiFlow.sub + 1];
        onUpdateProject({
          ...project,
          kaientaiFlow: { active: true, sub: kaientaiFlow.sub + 1 },
          logs: logFor(fromLabel, toLabel),
          updatedAt: now,
        });
      } else {
        // サブフロー完了 → 「施工・納品」に合流
        const fromLabel = KAIENTAI_SUB[kaientaiFlow.sub];
        onUpdateProject({
          ...project,
          status: MERGE_PHASE,
          kaientaiFlow: { active: false, sub: 0, completed: true },
          logs: logFor(fromLabel, MERGE_PHASE),
          updatedAt: now,
        });
      }
      return;
    }

    // 「提案書／見積書提出」かつパターン①/② → 分岐選択モーダル（ログはサブモーダルで記録）
    if (project.status === BRANCH_PHASE && isBranchablePattern(project.salesPattern)) {
      setBranchSelectByName('');
      setShowBranchModal(true);
      return;
    }

    // 通常進行
    const currentIndex = PHASES.indexOf(project.status);
    if (currentIndex < PHASES.length - 1) {
      const nextPhase = PHASES[currentIndex + 1];
      onUpdateProject({
        ...project,
        status: nextPhase,
        logs: logFor(project.status, nextPhase),
        updatedAt: now,
      });
    }
  };

  const handleRevertPhase = (changedBy = '') => {
    const name = (changedBy || '').trim();
    const now = new Date().toISOString();
    const logFor = (fromLabel, toLabel) => prependPhaseLog(
      `フェーズ進捗: 「${fromLabel}」 → 「${toLabel}」 へ戻しました${name ? `（実行者: ${name}）` : ''}`
    );

    // マージン支払サブフロー中
    if (marginFlow.active) {
      if (marginFlow.sub > 0) {
        const fromLabel = marginSteps[marginFlow.sub];
        const toLabel   = marginSteps[marginFlow.sub - 1];
        onUpdateProject({
          ...project,
          marginFlow: { active: true, sub: marginFlow.sub - 1 },
          logs: logFor(fromLabel, toLabel),
          updatedAt: now,
        });
      } else {
        // サブフロー先頭から戻る → サブフロー離脱して MARGIN_BRANCH_PHASE (施工・納品) へ
        const fromLabel = marginSteps[0];
        onUpdateProject({
          ...project,
          status: MARGIN_BRANCH_PHASE,
          marginFlow: { active: false, sub: 0 },
          logs: logFor(fromLabel, MARGIN_BRANCH_PHASE),
          updatedAt: now,
        });
      }
      return;
    }

    // 介援隊サブフロー中
    if (kaientaiFlow.active) {
      if (kaientaiFlow.sub > 0) {
        const fromLabel = KAIENTAI_SUB[kaientaiFlow.sub];
        const toLabel   = KAIENTAI_SUB[kaientaiFlow.sub - 1];
        onUpdateProject({
          ...project,
          kaientaiFlow: { active: true, sub: kaientaiFlow.sub - 1 },
          logs: logFor(fromLabel, toLabel),
          updatedAt: now,
        });
      } else {
        // サブフロー先頭から戻る → BRANCH_PHASE のままサブフローを離脱
        const fromLabel = KAIENTAI_SUB[0];
        onUpdateProject({
          ...project,
          kaientaiFlow: { active: false, sub: 0 },
          logs: logFor(fromLabel, BRANCH_PHASE),
          updatedAt: now,
        });
      }
      return;
    }

    // 通常進行
    const currentIndex = PHASES.indexOf(project.status);
    if (currentIndex > 0) {
      const prevPhase = PHASES[currentIndex - 1];
      onUpdateProject({
        ...project,
        status: prevPhase,
        logs: logFor(project.status, prevPhase),
        updatedAt: now,
      });
    }
  };

  // サブフロー中でも、本流（販売契約締結 / 一次保守）へ直接合流できる脱出口
  // - 介援隊サブフロー → 販売契約締結 (本流の次フェーズ)
  // - マージン支払サブフロー → 一次保守 (本流の合流先)
  const mainSkipTarget = kaientaiFlow.active ? '販売契約締結'
                       : marginFlow.active   ? MARGIN_MERGE_PHASE
                       : null;

  const handleSkipToMain = (changedBy = '') => {
    const name = (changedBy || '').trim();
    const now = new Date().toISOString();
    if (kaientaiFlow.active) {
      const fromLabel = KAIENTAI_SUB[kaientaiFlow.sub];
      onUpdateProject({
        ...project,
        status: '販売契約締結',
        kaientaiFlow: { active: false, sub: 0 },
        logs: prependPhaseLog(
          `フェーズ進捗: サブフロー「${fromLabel}」を抜けて本流「販売契約締結」へ合流しました${name ? `（実行者: ${name}）` : ''}`
        ),
        updatedAt: now,
      });
    } else if (marginFlow.active) {
      const fromLabel = marginSteps[marginFlow.sub];
      onUpdateProject({
        ...project,
        status: MARGIN_MERGE_PHASE,
        marginFlow: { active: false, sub: 0, completed: true },
        logs: prependPhaseLog(
          `フェーズ進捗: サブフロー「${fromLabel}」を抜けて本流「${MARGIN_MERGE_PHASE}」へ合流しました${name ? `（実行者: ${name}）` : ''}`
        ),
        updatedAt: now,
      });
    }
  };

  const handleSelectMarginBranch = (branch, changedBy = '') => {
    const name = (changedBy || '').trim();
    const now = new Date().toISOString();
    setShowMarginBranchModal(false);
    setBranchSelectByName('');
    if (branch === 'normal') {
      // 通常 → 一次保守
      onUpdateProject({
        ...project,
        status: MARGIN_MERGE_PHASE,
        logs: prependPhaseLog(
          `フェーズ分岐: 「${MARGIN_BRANCH_PHASE}」 から 「${MARGIN_MERGE_PHASE}」 へ進めました（マージン支払なし）${name ? `（実行者: ${name}）` : ''}`
        ),
        updatedAt: now,
      });
    } else if (branch === 'margin') {
      onUpdateProject({
        ...project,
        marginFlow: { active: true, sub: 0 },
        logs: prependPhaseLog(
          `フェーズ分岐: 「${MARGIN_BRANCH_PHASE}」 から${isPatternOne ? '利益計上' : 'マージン支払'}サブフローを開始しました${name ? `（実行者: ${name}）` : ''}`
        ),
        updatedAt: now,
      });
    }
  };

  const handleSelectBranch = (branch, changedBy = '') => {
    const name = (changedBy || '').trim();
    const now = new Date().toISOString();
    setShowBranchModal(false);
    setBranchSelectByName('');
    if (branch === 'setup') {
      // SOMPOケアソリューションズ → 通常通り「販売契約締結」へ
      onUpdateProject({
        ...project,
        status: '販売契約締結',
        logs: prependPhaseLog(
          `フェーズ分岐: 「${BRANCH_PHASE}」 から 「販売契約締結」 へ進めました（SOMPOケアソリューションズフロー選択）${name ? `（実行者: ${name}）` : ''}`
        ),
        updatedAt: now,
      });
    } else if (branch === 'kaientai') {
      // 介援隊サブフロー開始（statusは BRANCH_PHASE のままサブフラグで管理）
      onUpdateProject({
        ...project,
        kaientaiFlow: { active: true, sub: 0 },
        logs: prependPhaseLog(
          `フェーズ分岐: 「${BRANCH_PHASE}」 から介援隊サブフローを開始しました${name ? `（実行者: ${name}）` : ''}`
        ),
        updatedAt: now,
      });
    }
  };

  const handleSaveInfo = () => {
    const sanitizedEditInfo = {
      ...editInfo,
      name: stripProjectHonorific(editInfo.name),
      endUser: {
        ...(editInfo.endUser || {}),
        prefecture: normalizePrefecture(editInfo.endUser?.prefecture),
      },
    };
    // 販売スキームが変更されていれば、変更者名の入力ダイアログを挟む
    if (sanitizedEditInfo.salesPattern !== project.salesPattern) {
      setPendingEditInfo({ ...sanitizedEditInfo });
      setPatternChangedByName('');
      setShowPatternChangeConfirm(true);
      return;
    }
    onUpdateProject({ ...sanitizedEditInfo, updatedAt: new Date().toISOString() });
    setIsEditingInfo(false);
  };

  const handleRevenueFieldChange = (field, value) => {
    setEditInfo(current => {
      const financial = {
        ...current.financial,
        [field]: Number(value) || 0,
      };
      financial.expectedRevenue =
        (Number(financial.equipmentRevenue) || 0) +
        (Number(financial.constructionRevenue) || 0);
      return { ...current, financial };
    });
  };

  // パターン変更確認 → 確定: 活動ログに自動記載してから保存
  const handleConfirmPatternChange = () => {
    const name = patternChangedByName.trim();
    if (!name || !pendingEditInfo) return;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const logEntry = {
      id: now.getTime(),
      date: todayStr,
      type: 'activity',
      source: 'system',
      content: `販売スキームを「${formatSalesPattern(project.salesPattern)}」から「${formatSalesPattern(pendingEditInfo.salesPattern)}」に変更しました。`,
      phase: effectivePhase,
      actor: name,
      actorRole: '変更者',
      nextAction: '',
      nextDate: '',
    };
    onUpdateProject({
      ...pendingEditInfo,
      logs: [logEntry, ...(pendingEditInfo.logs || [])],
      updatedAt: now.toISOString(),
    });
    setShowPatternChangeConfirm(false);
    setIsEditingInfo(false);
    setPendingEditInfo(null);
    setPatternChangedByName('');
  };

  const handleAddLog = () => {
    if (!newLog.content.trim()) return;
    const logEntry = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      type: 'activity',
      source: 'manual',
      questRewardStaffNumber: project.picCaremaxStaffNumber || '',
      questRewardUserName: project.picCaremax || '',
      content: newLog.content,
      phase: effectivePhase,
      nextAction: newLog.nextAction,
      nextDate: newLog.nextDate
    };
    onUpdateProject({
      ...project,
      logs: [logEntry, ...project.logs],
      updatedAt: new Date().toISOString()
    });
    setNewLog({ content: '', nextAction: '', nextDate: '' });
    setIsAddingLog(false);
  };

  const handleMarkAsLost = () => {
    onUpdateProject({
      ...project,
      isLost: true,
      lostInfo: {
        reason: lostForm.reason,
        competitor: lostForm.competitor,
        date: new Date().toISOString().split('T')[0]
      },
      updatedAt: new Date().toISOString()
    });
    setShowLostConfirm(false);
    setLostForm({ reason: '', competitor: '' });
  };

  const handleRestore = () => {
    onUpdateProject({ ...project, isLost: false, updatedAt: new Date().toISOString() });
    setShowRestoreConfirm(false);
  };

  const patternColor = project.salesPattern?.includes('パターン1') ? 'sky' :
    project.salesPattern?.includes('パターン2') ? 'yellow' :
    project.salesPattern?.includes('パターン3') ? 'green' : 'gray';
  const facilityMeta = getFacilityTypeMeta(project.facilityType);
  const caremaxSalesName = project.picCaremax
    || staff.find(member => member.staffNumber === project.picCaremaxStaffNumber)?.name
    || '';

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* ヘッダー */}
      <div>
        <AssistTip text={"案件一覧（ダッシュボード）に戻ります。\n編集中の内容は保存済みなので失われません。"} side="bottom">
          <button
            onClick={onBack}
            className="flex items-center text-sm text-gray-500 hover:text-purple-600 transition-colors mb-4 font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Dashboard に戻る
          </button>
        </AssistTip>
        <div className="project-hero flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 rounded-[28px] border border-[#e4e4df] bg-white/80 px-5 py-7 sm:px-8 sm:py-10">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              {facilityMeta.label && (
                <span
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-200/80 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 shadow-sm shadow-slate-200/40"
                  title={`施設業態: ${facilityMeta.label}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${facilityMeta.markerClassName}`}
                    aria-hidden="true"
                  />
                  {facilityMeta.label}
                </span>
              )}
              <AssistTip text={"案件名。\n編集ボタンから変更可。社内検索のキーになるので分かりやすい命名を推奨。"} side="bottom">
                <h1 className="text-2xl sm:text-4xl font-black text-black tracking-[-0.04em] leading-tight">
                  <ProjectName name={project.name} honorificClassName="text-gray-400" />
                </h1>
              </AssistTip>
              {project.hasIctHearingSheet && (
                <span
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-500 ring-1 ring-inset ring-amber-200"
                  title="ICTヒアリングシート回収済み"
                  aria-label="ICTヒアリングシート回収済み"
                >
                  <FileText className="h-4 w-4" strokeWidth={1.8} />
                </span>
              )}
              {isLost && (
                <AssistTip text={"失注済み案件。\n進行操作は無効化されます。「案件を復活させる」ボタンで戻せます。"} side="bottom">
                  <Badge color="red">LOST</Badge>
                </AssistTip>
              )}
            </div>
            {caremaxSalesName && (
              <div className="mt-2 text-xs font-medium text-slate-400 sm:text-sm">
                担当者：<span className="font-semibold text-slate-600">{caremaxSalesName}</span>
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <AssistTip text={"販売スキーム。\n①=完全卸し / ②=分離 / ③=完全紹介。\n編集ボタンから変更できます。"} side="bottom">
                <Badge color={patternColor}>{formatSalesPattern(project.salesPattern)}</Badge>
              </AssistTip>
              <AssistTip text={"案件ID（自動採番）。\n社内連絡や請求書の参照番号として使用できます。"} side="bottom">
                <span className="text-xs font-mono text-gray-400">{project.id}</span>
              </AssistTip>
            </div>
            {project.summary && (
              <AssistTip text={"案件の要約。\n背景・狙い・特記事項などを1〜2文で。営業メンバー間の引き継ぎに有効。"} side="bottom">
                <p className="text-sm text-gray-500 mt-4 max-w-3xl leading-6">{project.summary}</p>
              </AssistTip>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-shrink-0">
            {!canEdit && (
              <AssistTip text={"営業部ロールは閲覧モードです。\n編集・新規追加・削除・フェーズ進行などの書き込み操作は無効化されています。"} side="bottom">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-3 py-1.5">
                  閲覧モード
                </span>
              </AssistTip>
            )}
            {canEdit && (
              <AssistTip text={"案件の基本情報を編集します。\n企業名・担当者・金額・スキーム等をモーダルで一括編集可。"} side="bottom">
                <button
                  onClick={() => { setEditInfo(prepareProjectForEdit(project, staff)); setIsEditingInfo(true); }}
                  className="px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-full hover:bg-gray-50 shadow-sm flex items-center"
                >
                  <Edit className="w-4 h-4 mr-1.5" /> 編集
                </button>
              </AssistTip>
            )}
            {canEdit && onDeleteProject && (
              <AssistTip text={"案件をシステムから完全に削除します。\nメモ・タスク・関連リンク・活動ログを含む全データが消失します。\n失注扱いにする方が安全なケースが多いのでご注意ください。"} side="bottom">
                <button
                  onClick={() => { setDeleteConfirmText(''); setShowDeleteConfirm(true); }}
                  className="px-4 py-2 text-sm font-bold text-red-700 bg-white border border-red-200 rounded-full hover:bg-red-50 shadow-sm flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" /> 削除
                </button>
              </AssistTip>
            )}
            {canEdit && (isLost ? (
              <AssistTip text={"失注扱いを解除して通常の進行案件に戻します。\nお詫び訪問→再提案などの再アタックフロー時に使用。"} side="bottom">
                <button
                  onClick={() => setShowRestoreConfirm(true)}
                  className="px-4 py-2 text-sm font-bold text-purple-600 bg-purple-50 border border-purple-100 rounded-full hover:bg-purple-100 shadow-sm"
                >
                  案件を復活させる
                </button>
              </AssistTip>
            ) : (
              <AssistTip text={"案件を「失注」として記録します。\n失注理由・競合先を入力するモーダルが開きます。\nKPI 集計の母数になるので必ず記録を。"} side="bottom">
                <button
                  onClick={() => setShowLostConfirm(true)}
                  className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-full hover:bg-red-100 shadow-sm"
                >
                  失注として記録
                </button>
              </AssistTip>
            ))}
          </div>
        </div>
      </div>

      {/* 情報タブ（クリックで詳細展開） */}
      <Card className="p-0 overflow-hidden">
        {/* タブヘッダー */}
        <div className="flex border-b border-gray-100 bg-gray-50/50">
          {[
            { key: 'endUser', label: 'エンドユーザー情報', mobileLabel: '顧客情報', icon: Building,      color: 'text-purple-600 border-purple-500' },
            { key: 'project', label: '案件情報',           mobileLabel: '案件情報', icon: FileText,      color: 'text-emerald-600 border-emerald-500' },
            { key: 'log',     label: '活動ログ',           mobileLabel: '活動ログ', icon: MessageSquare, color: 'text-orange-600 border-orange-500', badge: project.logs.length },
          ].map(tab => {
            const TabIcon = tab.icon;
            const active = infoTab === tab.key;
            return (
              <AssistTip key={tab.key} text={TAB_HINTS[tab.key] || tab.label} side="bottom" wrapClassName="flex-1">
                <button
                  onClick={() => setInfoTab(tab.key)}
                  className={`w-full px-4 py-3.5 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
                    active
                      ? `bg-white ${tab.color}`
                      : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-white/60'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  <span className="sm:hidden">{tab.mobileLabel}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.badge != null && tab.badge > 0 && (
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${active ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-600'}`}>{tab.badge}</span>
                  )}
                </button>
              </AssistTip>
              );
            })}
          {infoTab === 'log' && (
            <div className="hidden shrink-0 items-center border-l border-gray-100 bg-white px-3 sm:flex">
              <select
                value={logPhaseFilter}
                onChange={event => setLogPhaseFilter(event.target.value)}
                className="max-w-[190px] rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                aria-label="活動ログをフェーズで絞り込む"
              >
                <option value="all">すべてのフェーズ（{logEntries.length}）</option>
                {logPhaseOptions.map(phase => (
                  <option key={phase} value={phase}>
                    {phase}（{logPhaseCounts.get(phase)}）
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* タブ内容 */}
        <div className="p-4 sm:p-5">
          {infoTab === 'endUser' && (
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                {[
                  ['企業・施設名', project.endUser.companyName, true],
                  ['都道府県', getProjectPrefecture(project)],
                  ['施設業態', project.facilityType],
                  ['担当者名', project.endUser.department],
                  ['連絡先', project.endUser.contact],
                  ['販売店', project.endUser.retailerName],
              ].map(([label, value, bold]) => (
                <div key={label} className="grid grid-cols-[100px_1fr] gap-2 items-baseline">
                  <AssistTip text={FIELD_HINTS[label] || label} side="right">
                    <dt className="text-xs text-gray-400 font-semibold cursor-help">{label}</dt>
                  </AssistTip>
                  <dd className={`text-sm leading-snug ${bold ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>{value || <span className="text-gray-300 font-medium">—</span>}</dd>
                </div>
              ))}
            </dl>
          )}

          {infoTab === 'project' && (
            <div className="space-y-5">
              {/* 想定全体売上（強調表示） */}
              <AssistTip text={FIELD_HINTS['想定全体売上']} side="bottom">
                <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-4 cursor-help">
                  <p className="text-xs text-sky-700 font-bold uppercase tracking-wider">想定全体売上</p>
                  <p className="text-3xl font-extrabold text-gray-900 tabular-nums leading-tight mt-1">{formatJPYShort(project.financial?.expectedRevenue || 0)}</p>
                </div>
              </AssistTip>

              {/* 案件情報 + 財務情報 をフラットに */}
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <AssistTip text={FIELD_HINTS['SOMPOケアソリューションズ担当者']} side="right">
                    <dt className="text-xs text-gray-400 font-semibold pt-0.5 cursor-help">SOMPOケアソリューションズ担当者</dt>
                  </AssistTip>
                  <dd className="text-sm">
                    <span className="font-bold text-gray-900">{project.picSetup || <span className="text-gray-300 font-medium">—</span>}</span>
                    {project.picSetupContact && (
                      <span className="block mt-1 text-xs font-semibold text-purple-700">
                        <MessageSquare className="w-3 h-3 inline mr-1" />{project.picSetupContact}
                      </span>
                    )}
                  </dd>
                </div>
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <AssistTip text={FIELD_HINTS['ケアマックス担当者']} side="right">
                    <dt className="text-xs text-gray-400 font-semibold pt-0.5 cursor-help">ケアマックス担当者</dt>
                  </AssistTip>
                  <dd className="text-sm">
                    <span className="font-bold text-gray-900">{project.picCaremax || <span className="text-gray-300 font-medium">—</span>}</span>
                    {project.picCaremaxStaffNumber && (
                      <span className="block mt-1 font-mono text-[10px] font-bold text-purple-600">{project.picCaremaxStaffNumber}</span>
                    )}
                  </dd>
                </div>
                <div className="grid grid-cols-[140px_1fr] gap-2 items-center">
                  <AssistTip text={FIELD_HINTS['案件ランク']} side="right">
                    <dt className="text-xs text-gray-400 font-semibold cursor-help">案件ランク</dt>
                  </AssistTip>
                  <dd><RankBadge rank={project.rank} /></dd>
                </div>
                <div className="grid grid-cols-[140px_1fr] gap-2 items-baseline">
                  <AssistTip text={FIELD_HINTS['開始日']} side="right">
                    <dt className="text-xs text-gray-400 font-semibold cursor-help">開始日</dt>
                  </AssistTip>
                  <dd className="text-sm font-semibold text-gray-700 tabular-nums">{project.startDate || <span className="text-gray-300 font-medium">—</span>}</dd>
                </div>
                <div className="grid grid-cols-[140px_1fr] gap-2 items-baseline">
                  <AssistTip text={FIELD_HINTS['クローズ予定']} side="right">
                    <dt className="text-xs text-gray-400 font-semibold cursor-help">クローズ予定</dt>
                  </AssistTip>
                  <dd className="text-sm font-semibold text-gray-700 tabular-nums">{project.expectedCloseDate || <span className="text-gray-300 font-medium">—</span>}</dd>
                </div>
                {project.financial?.wholesalePriceSetup != null && (
                  <div className="grid grid-cols-[140px_1fr] gap-2 items-baseline">
                    <AssistTip text={FIELD_HINTS['卸値']} side="right">
                      <dt className="text-xs text-gray-400 font-semibold cursor-help">卸値</dt>
                    </AssistTip>
                    <dd className="text-sm font-semibold text-gray-700 tabular-nums">{formatJPYShort(project.financial.wholesalePriceSetup)}</dd>
                  </div>
                )}
                {project.financial?.referralFeeRate != null && (
                  <div className="grid grid-cols-[140px_1fr] gap-2 items-baseline">
                    <AssistTip text={FIELD_HINTS['紹介料']} side="right">
                      <dt className="text-xs text-gray-400 font-semibold cursor-help">紹介料</dt>
                    </AssistTip>
                    <dd className="text-sm font-semibold text-gray-700 tabular-nums">{project.financial.referralFeeRate}% / {formatJPYShort(project.financial.referralFeeAmount || 0)}</dd>
                  </div>
                )}
                {project.endUser.needsAndIssues && (
                  <div className="grid grid-cols-[140px_1fr] gap-2 md:col-span-2">
                    <AssistTip text={FIELD_HINTS['ニーズ・課題']} side="right">
                      <dt className="text-xs text-gray-400 font-semibold pt-0.5 cursor-help">ニーズ・課題</dt>
                    </AssistTip>
                    <dd className="text-sm font-semibold text-gray-700 leading-relaxed">{project.endUser.needsAndIssues}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {infoTab === 'log' && (
            <div>
              <div className="mb-3 flex justify-end sm:hidden">
                <select
                  value={logPhaseFilter}
                  onChange={event => setLogPhaseFilter(event.target.value)}
                  className="w-full rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  aria-label="活動ログをフェーズで絞り込む"
                >
                  <option value="all">すべてのフェーズ（{logEntries.length}）</option>
                  {logPhaseOptions.map(phase => (
                    <option key={phase} value={phase}>
                      {phase}（{logPhaseCounts.get(phase)}）
                    </option>
                  ))}
                </select>
              </div>
              <div className="overflow-y-auto pr-1 -mr-1 divide-y divide-gray-100" style={{ maxHeight: '420px' }}>
              {filteredLogEntries.map(({ log, view }) => {
                const isAlert = log.type === 'alert';
                const isWebMeetingRequest = log.type === WEB_MEETING_LOG_TYPE;
                const phaseProgress = getPhaseProgress(view.phase);
                return (
                  <div
                    key={log.id}
                    className={`group flex gap-3 px-2 py-4 transition-colors hover:bg-gray-50/80 ${isAlert ? 'bg-red-50/40' : isWebMeetingRequest ? 'bg-sky-50/50' : ''}`}
                  >
                    <div
                      className={`mt-0.5 h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 rounded-full p-[2px] shadow-[0_4px_14px_rgba(0,0,0,0.08)] ${
                        isAlert ? 'bg-red-200' : ''
                      }`}
                      style={!isAlert ? {
                        background: `conic-gradient(from -45deg, #5b21b6 0%, #8b5cf6 ${phaseProgress * 0.65}%, #c084fc ${phaseProgress}%, #ebe7f1 ${phaseProgress}% 100%)`,
                      } : undefined}
                      title={view.phase}
                    >
                      <div className={`flex h-full w-full items-center justify-center rounded-full border-2 border-white text-center text-[9px] font-black leading-[1.1] whitespace-pre-line ${
                        isAlert
                          ? 'bg-red-50 text-red-600'
                          : 'bg-gradient-to-br from-white to-purple-50 text-gray-900'
                      }`}>
                        {isAlert
                          ? <AlertCircle className="h-5 w-5" />
                          : (PHASE_CIRCLE_LABELS[view.phase] || view.phase)}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-xs font-bold text-gray-800">
                          {isWebMeetingRequest
                            ? 'WEB面談可否 依頼ログ'
                            : view.actor ? `${view.actorRole || '実行者'}: ${view.actor}` : (isAlert ? 'システムアラート' : '活動ログ')}
                        </span>
                        <span className="text-[11px] font-medium text-gray-400 tabular-nums">{log.date}</span>
                      </div>
                      {isWebMeetingRequest && (
                        <p className="mt-1.5 text-xs font-bold text-sky-700">依頼先：{log.requestedTo || '未記入'}</p>
                      )}
                      <p className="mt-1.5 whitespace-pre-wrap break-words text-sm font-medium leading-relaxed text-gray-800">{view.content}</p>
                      {log.nextAction && (
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          <span className="inline-flex items-center font-bold text-purple-700">
                            <ChevronRight className="mr-1 h-3.5 w-3.5" />
                            次のアクション: {replaceLegacySetupName(log.nextAction)}
                          </span>
                          {log.nextDate && (
                            <span className="inline-flex items-center font-semibold text-gray-500">
                              <Calendar className="mr-1 h-3.5 w-3.5" />{log.nextDate}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {logEntries.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-10 font-medium">活動ログがありません</p>
              )}
              {logEntries.length > 0 && filteredLogEntries.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-10 font-medium">選択したフェーズの活動ログはありません</p>
              )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* フェーズ進捗 */}
      <Card className="p-3 sm:p-6">
        <div className="flex items-center justify-between mb-2 gap-3">
          <h3 className="text-base font-bold text-gray-900">フェーズ進捗</h3>
          <span className="sm:hidden text-[10px] text-gray-400 font-semibold">← スワイプで全体表示 →</span>
        </div>

        {/* モバイル専用: 現在フェーズの大きな進捗インジケータ。スクロール不要で状況把握可 */}
        <div className="sm:hidden mb-4 p-3 rounded-xl bg-gradient-to-r from-purple-50 via-purple-50/40 to-transparent border border-purple-100">
          {(() => {
            const idx = PHASES.indexOf(effectivePhase);
            const showIdx = idx >= 0 ? idx : PHASES.indexOf(project.status);
            const safeIdx = showIdx >= 0 ? showIdx : 0;
            const pct = ((safeIdx + 1) / PHASES.length) * 100;
            return (
              <>
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <div className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">現在のフェーズ</div>
                    <div className="text-base font-extrabold text-gray-900 leading-tight mt-0.5">{effectivePhase}</div>
                  </div>
                  <div className="text-[11px] font-bold text-gray-500 tabular-nums">
                    <span className="text-purple-700 text-base">{safeIdx + 1}</span>
                    <span className="text-gray-400"> / {PHASES.length}</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-purple-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                {(kaientaiFlow.active || marginFlow.active) && (
                  <div className="mt-2 text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-200 inline-block px-2 py-0.5 rounded-full">
                    {kaientaiFlow.active ? '介援隊サブフロー進行中' : `${marginFlowDisplayName}進行中`}
                  </div>
                )}
              </>
            );
          })()}
        </div>

        <ArrowDiagram
          currentPhase={project.status}
          selectedPhase={selectedPhase}
          onSelectPhase={setSelectedPhase}
          phaseDetails={project.phaseDetails}
          kaientaiFlow={kaientaiFlow}
          marginFlow={marginFlow}
          marginSteps={marginSteps}
          salesPattern={project.salesPattern}
        />
        <PhaseDetailPanel
          phase={selectedPhase}
          data={project.phaseDetails?.[selectedPhase]}
          isLost={isReadOnly}
          onUpdate={handleUpdatePhaseData}
          currentProjectPhase={effectivePhase}
          onAdvancePhase={handleAdvancePhase}
          nextPhaseLabel={nextPhaseLabel}
          onRevertPhase={handleRevertPhase}
          prevPhaseLabel={prevPhaseLabel}
          advanceErrors={advanceErrors}
          mainSkipTarget={mainSkipTarget}
          onSkipToMain={handleSkipToMain}
          isAtBranchPoint={
            (!kaientaiFlow.active && project.status === BRANCH_PHASE && isBranchablePattern(project.salesPattern)) ||
            (!marginFlow.active && project.status === MARGIN_BRANCH_PHASE && isMarginBranchablePattern(project.salesPattern) && !marginFlow.completed)
          }
          canStartKaientaiHere={
            selectedPhase === BRANCH_PHASE
            && isBranchablePattern(project.salesPattern)
            && !kaientaiFlow.active
            && !kaientaiFlow.completed
            && PHASES.indexOf(project.status) > PHASES.indexOf(BRANCH_PHASE)
            && PHASES.indexOf(project.status) < PHASES.indexOf(MERGE_PHASE)
          }
          onStartKaientai={() => onUpdateProject({
            ...project,
            kaientaiFlow: { active: true, sub: 0 },
            updatedAt: new Date().toISOString(),
          })}
          canStartMarginHere={
            selectedPhase === MARGIN_BRANCH_PHASE
            && isMarginBranchablePattern(project.salesPattern)
            && !marginFlow.active
            && !marginFlow.completed
            && PHASES.indexOf(project.status) >= PHASES.indexOf(MARGIN_BRANCH_PHASE)
          }
          onStartMargin={() => onUpdateProject({
            ...project,
            marginFlow: { active: true, sub: 0 },
            updatedAt: new Date().toISOString(),
          })}
          onAddProjectLog={(logData) => {
            const logEntry = {
              id: Date.now(),
              date: new Date().toISOString().split('T')[0],
              type: 'activity',
              source: 'manual',
              questRewardStaffNumber: project.picCaremaxStaffNumber || '',
              questRewardUserName: project.picCaremax || '',
              content: logData.content,
              phase: selectedPhase,
              nextAction: logData.nextAction || '',
              nextDate: logData.nextDate || '',
            };
            onUpdateProject({
              ...project,
              logs: [logEntry, ...project.logs],
              updatedAt: new Date().toISOString(),
            });
          }}
          webMeetingLogs={(project.logs || []).filter(log => log.type === WEB_MEETING_LOG_TYPE)}
          onAddWebMeetingLog={({ requestedTo, requestContent }) => {
            const now = new Date();
            const logEntry = {
              id: now.getTime(),
              date: now.toISOString().split('T')[0],
              type: WEB_MEETING_LOG_TYPE,
              source: 'webMeeting',
              phase: WEB_MEETING_PHASE,
              requestedTo,
              requestContent,
              content: requestContent,
            };
            onUpdateProject({
              ...project,
              logs: [logEntry, ...(project.logs || [])],
              updatedAt: now.toISOString(),
            });
          }}
          salesPattern={project.salesPattern}
          canViewMarginProfit={canViewMarginProfit}
        />
      </Card>


      {/* 編集モーダル */}
      {isEditingInfo && (
        <div className="mobile-sheet fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">案件情報の編集</h3>
              <button onClick={() => setIsEditingInfo(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">案件ID <span className="ml-1 text-[10px] font-normal text-gray-400">（自動採番・変更不可）</span></label>
                <input
                  type="text"
                  value={editInfo.id || ''}
                  readOnly
                  className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm font-mono text-gray-600 cursor-not-allowed select-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">案件名</label>
                <input type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  value={editInfo.name} onChange={e => setEditInfo({ ...editInfo, name: e.target.value })} />
                <p className="mt-1 text-[11px] font-medium text-gray-400">
                  「様」は案件一覧・詳細画面で自動表示されます
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">概要</label>
                <textarea className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none h-20"
                  value={editInfo.summary || ''} onChange={e => setEditInfo({ ...editInfo, summary: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  販売スキーム
                  {editInfo.salesPattern !== project.salesPattern && (
                    <span className="ml-2 text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">変更あり（保存時に確認）</span>
                  )}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { v: 'パターン1（完全卸し）', label: '①完全卸し', activeCls: 'bg-sky-600 text-white border-sky-600 shadow', idleCls: 'bg-white text-sky-700 border-sky-200 hover:bg-sky-50' },
                    { v: 'パターン2（分離）',     label: '②分離',     activeCls: 'bg-yellow-500 text-white border-yellow-500 shadow', idleCls: 'bg-white text-yellow-700 border-yellow-200 hover:bg-yellow-50' },
                    { v: 'パターン3（完全紹介）', label: '③完全紹介', activeCls: 'bg-green-600 text-white border-green-600 shadow', idleCls: 'bg-white text-green-700 border-green-200 hover:bg-green-50' },
                  ].map(p => {
                    const selected = editInfo.salesPattern === p.v;
                    return (
                      <button
                        key={p.v}
                        type="button"
                        onClick={() => setEditInfo({ ...editInfo, salesPattern: p.v })}
                        className={`px-3 py-2.5 rounded-xl border-2 text-left transition-all ${selected ? p.activeCls : p.idleCls}`}
                      >
                        <div className="text-sm font-extrabold leading-tight">{p.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">案件ランク</label>
                <div className="grid grid-cols-3 gap-2 max-w-sm">
                  {[
                    { v: 'A', label: 'A ランク', active: 'bg-emerald-600 text-white border-emerald-600 shadow', idle: 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50' },
                    { v: 'B', label: 'B ランク', active: 'bg-amber-500 text-white border-amber-500 shadow',   idle: 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50' },
                    { v: 'C', label: 'C ランク', active: 'bg-gray-500 text-white border-gray-500 shadow',     idle: 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50' },
                  ].map(r => {
                    const selected = (editInfo.rank || 'B') === r.v;
                    return (
                      <button
                        key={r.v}
                        type="button"
                        onClick={() => setEditInfo({ ...editInfo, rank: r.v })}
                        className={`px-3 py-2.5 rounded-xl text-sm font-extrabold border-2 transition-all ${selected ? r.active : r.idle}`}
                      >
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">SOMPOケアソリューションズ担当者</label>
                  <input type="text" placeholder="例：山田 太郎" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    value={editInfo.picSetup || ''} onChange={e => setEditInfo({ ...editInfo, picSetup: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">ケアマックス営業担当者（QUESTキャラクター）</label>
                  <select
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    value={editInfo.picCaremaxStaffNumber || ''}
                    onChange={e => {
                      const assigned = caremaxSalesStaff.find(member => member.staffNumber === e.target.value);
                      setEditInfo({
                        ...editInfo,
                        picCaremaxStaffNumber: assigned?.staffNumber || '',
                        picCaremax: assigned?.name || '',
                      });
                    }}
                  >
                    <option value="">未割当</option>
                    {caremaxSalesStaff.map(member => (
                      <option key={member.staffNumber} value={member.staffNumber}>
                        {member.staffNumber}｜{member.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">SOMPOケアソリューションズ担当者 連絡先 <span className="ml-1 text-xs font-normal text-gray-400">（電話番号・メールなど）</span></label>
                <input type="text" placeholder="例：090-1234-5678 / yamada@example.com" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  value={editInfo.picSetupContact || ''} onChange={e => setEditInfo({ ...editInfo, picSetupContact: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">ICTヒアリングシート</label>
                <div className="grid grid-cols-2 gap-2 max-w-sm">
                  {[
                    { value: true, label: 'あり', active: 'bg-purple-600 text-white border-purple-600 shadow', idle: 'bg-white text-purple-700 border-purple-200 hover:bg-purple-50' },
                    { value: false, label: 'なし', active: 'bg-gray-700 text-white border-gray-700 shadow', idle: 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50' },
                  ].map(option => {
                    const selected = Boolean(editInfo.hasIctHearingSheet) === option.value;
                    return (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => setEditInfo({ ...editInfo, hasIctHearingSheet: option.value })}
                        className={`px-3 py-2.5 rounded-xl text-sm font-extrabold border-2 transition-all ${selected ? option.active : option.idle}`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1 text-[10px] font-medium text-gray-400">回収済みの案件は案件一覧で紙アイコン表示・絞り込み対象になります。</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">クローズ予定日</label>
                  <input type="date" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    value={editInfo.expectedCloseDate || ''} onChange={e => setEditInfo({ ...editInfo, expectedCloseDate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">想定全体売上</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">¥</span>
                    <input type="number" readOnly className="w-full pl-9 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 cursor-not-allowed"
                      value={editInfo.financial?.expectedRevenue || 0}
                      aria-label="想定全体売上（機器売上予定額と工事売上予定額の合計）" />
                  </div>
                  <p className="mt-1 text-[10px] font-medium text-gray-400">機器売上予定額 ＋ 工事売上予定額（自動計算）</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { key: 'equipmentRevenue', label: '機器売上予定額' },
                  { key: 'constructionRevenue', label: '工事売上予定額' },
                  ...(
                    isPatternOne && !canViewMarginProfit
                      ? []
                      : [{
                        key: 'marginPaymentExpectedAmount',
                        label: isPatternOne ? '当社上乗せ利益予定額' : 'マージン支払予定額',
                      }]
                  ),
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">{label}</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">¥</span>
                      <input
                        type="number"
                        min="0"
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        value={editInfo.financial?.[key] || 0}
                        onChange={e => handleRevenueFieldChange(key, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">エンドユーザー情報</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">企業・施設名</label>
                    <input type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      value={editInfo.endUser?.companyName || ''}
                      onChange={e => setEditInfo({ ...editInfo, endUser: { ...editInfo.endUser, companyName: e.target.value } })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">都道府県</label>
                    <select
                      value={editInfo.endUser?.prefecture || ''}
                      onChange={e => setEditInfo({ ...editInfo, endUser: { ...editInfo.endUser, prefecture: e.target.value } })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="">都道府県を選択してください</option>
                      {PREFECTURE_OPTIONS.map(prefecture => (
                        <option key={prefecture} value={prefecture}>
                          {prefecture}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">施設業態</label>
                    <select
                      value={editInfo.facilityType || ''}
                      onChange={e => setEditInfo({ ...editInfo, facilityType: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="">業態を選択してください</option>
                      {FACILITY_TYPE_OPTIONS.map(option => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">担当者名</label>
                    <input type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      value={editInfo.endUser?.department || ''}
                      onChange={e => setEditInfo({ ...editInfo, endUser: { ...editInfo.endUser, department: e.target.value } })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">連絡先</label>
                    <input type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      value={editInfo.endUser?.contact || ''}
                      onChange={e => setEditInfo({ ...editInfo, endUser: { ...editInfo.endUser, contact: e.target.value } })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">販売店</label>
                    <input type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      value={editInfo.endUser?.retailerName || ''}
                      onChange={e => setEditInfo({ ...editInfo, endUser: { ...editInfo.endUser, retailerName: e.target.value } })} />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">ニーズ・課題</label>
                  <textarea className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none h-20"
                    value={editInfo.endUser?.needsAndIssues || ''}
                    onChange={e => setEditInfo({ ...editInfo, endUser: { ...editInfo.endUser, needsAndIssues: e.target.value } })} />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 border-t border-gray-100 pt-4 mt-6">
              <button onClick={() => setIsEditingInfo(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-full">キャンセル</button>
              <button onClick={handleSaveInfo} className="px-6 py-2.5 text-sm font-bold bg-purple-600 text-white hover:bg-purple-700 rounded-full shadow-md">保存する</button>
            </div>
          </div>
        </div>
      )}

      {/* 失注確認 */}
      {showLostConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mr-3">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h4 className="text-lg font-bold text-gray-900">失注として記録</h4>
              </div>
              <button onClick={() => { setShowLostConfirm(false); setLostForm({ reason: '', competitor: '' }); }} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-5 ml-[52px]">
              案件は一覧に残りますが、KPI計算から除外されます。
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  失注理由
                </label>
                <textarea
                  className="w-full h-24 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-red-300 focus:border-red-300 focus:bg-white focus:outline-none resize-none transition-all"
                  placeholder="例：価格面での折り合いがつかなかった、競合製品に決定した 等"
                  value={lostForm.reason}
                  onChange={e => setLostForm({ ...lostForm, reason: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  競合情報
                  <span className="ml-2 text-xs font-normal text-gray-400">（競合製品・企業名など）</span>
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 font-semibold focus:ring-2 focus:ring-red-300 focus:border-red-300 focus:bg-white focus:outline-none transition-all"
                  placeholder="例：〇〇社製品、△△システム 等"
                  value={lostForm.competitor}
                  onChange={e => setLostForm({ ...lostForm, competitor: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 border-t border-gray-100 pt-4 mt-5">
              <button onClick={() => { setShowLostConfirm(false); setLostForm({ reason: '', competitor: '' }); }} className="px-5 py-2 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-100">キャンセル</button>
              <button onClick={handleMarkAsLost} className="px-5 py-2 rounded-full text-sm font-bold bg-red-600 text-white hover:bg-red-700 shadow-sm">失注として記録する</button>
            </div>
          </div>
        </div>
      )}

      {/* マージン分岐選択モーダル（施工・納品 → 次フェーズ） */}
      {showMarginBranchModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200">
            <div className="flex items-center mb-2">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center mr-3">
                <ChevronRight className="w-6 h-6 text-orange-600" />
              </div>
              <h4 className="text-lg font-bold text-gray-900">次フェーズの分岐選択</h4>
            </div>
            <p className="text-sm text-gray-500 mb-5 ml-[52px]">
              「施工・納品」の次に進むルートを選択してください。
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => { if (branchSelectByName.trim()) handleSelectMarginBranch('normal', branchSelectByName.trim()); }}
                disabled={branchSelectByName.trim() === ''}
                className="text-left p-5 rounded-2xl border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50/40 transition-all group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-transparent"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider text-purple-600 bg-purple-50 border border-purple-200">通常</span>
                </div>
                <p className="text-sm font-bold text-gray-900">そのまま「一次保守」へ</p>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  {isPatternOne ? '上乗せ利益を記録せずに次フェーズへ進みます。' : 'マージン処理を行わずに次フェーズへ進みます。'}
                </p>
              </button>
              <button
                onClick={() => { if (branchSelectByName.trim()) handleSelectMarginBranch('margin', branchSelectByName.trim()); }}
                disabled={branchSelectByName.trim() === ''}
                className="text-left p-5 rounded-2xl border-2 border-gray-200 hover:border-orange-400 hover:bg-orange-50/40 transition-all group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-transparent"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider text-orange-600 bg-orange-50 border border-orange-200">
                    {isPatternOne ? '利益' : 'マージン'}
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-900">{marginFlowDisplayName}</p>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  {isPatternOne
                    ? '当社が販売価格へ上乗せした利益額と利益確定日を記録し、その後「一次保守」に合流します。'
                    : marginSteps.length === 1
                    ? '「マージン支払」をゴールとし、その後「一次保守」に合流します。'
                    : '「マージン支払 → 販売店へ支払」を経由して「一次保守」に合流します。'}
                </p>
              </button>
            </div>
            <label className="block mt-5">
              <span className="text-xs font-semibold text-gray-700">
                実行者の名前 <span className="text-red-600">*</span>
              </span>
              <input
                type="text"
                value={branchSelectByName}
                onChange={(e) => setBranchSelectByName(e.target.value)}
                placeholder="例：山田 太郎"
                className="mt-1.5 w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
                autoFocus
              />
              <span className="block mt-1 text-[10px] text-gray-400">名前を入力後、選択したフローのカードをクリックすると確定します</span>
            </label>
            <div className="flex justify-end mt-5 pt-4 border-t border-gray-100">
              <button onClick={() => { setShowMarginBranchModal(false); setBranchSelectByName(''); }} className="px-5 py-2 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-100">キャンセル</button>
            </div>
          </div>
        </div>
      )}

      {/* 分岐選択モーダル（提案書／見積書提出 → 次フェーズ） */}
      {showBranchModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200">
            <div className="flex items-center mb-2">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center mr-3">
                <ChevronRight className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="text-lg font-bold text-gray-900">次フェーズの分岐選択</h4>
            </div>
            <p className="text-sm text-gray-500 mb-5 ml-[52px]">
              「提案書／見積書提出」の次に進むルートを選択してください。
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => { if (branchSelectByName.trim()) handleSelectBranch('setup', branchSelectByName.trim()); }}
                disabled={branchSelectByName.trim() === ''}
                className="text-left p-5 rounded-2xl border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50/40 transition-all group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-transparent"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider text-orange-600 bg-orange-50 border border-orange-200">SOMPOケアソリューションズ</span>
                </div>
                <p className="text-sm font-bold text-gray-900">通常フロー</p>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">そのまま「販売契約締結 → 施工・納品 → 一次保守」へ進みます。</p>
              </button>
              <button
                onClick={() => { if (branchSelectByName.trim()) handleSelectBranch('kaientai', branchSelectByName.trim()); }}
                disabled={branchSelectByName.trim() === ''}
                className="text-left p-5 rounded-2xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50/40 transition-all group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-transparent"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider text-blue-600 bg-blue-50 border border-blue-200">介援隊</span>
                </div>
                <p className="text-sm font-bold text-gray-900">サブフロー</p>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">「介援隊：見積書提出 → 介援隊：納品」を経由して「施工・納品」に合流します。</p>
              </button>
            </div>
            <label className="block mt-5">
              <span className="text-xs font-semibold text-gray-700">
                実行者の名前 <span className="text-red-600">*</span>
              </span>
              <input
                type="text"
                value={branchSelectByName}
                onChange={(e) => setBranchSelectByName(e.target.value)}
                placeholder="例：山田 太郎"
                className="mt-1.5 w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
                autoFocus
              />
              <span className="block mt-1 text-[10px] text-gray-400">名前を入力後、選択したフローのカードをクリックすると確定します</span>
            </label>
            <div className="flex justify-end mt-5 pt-4 border-t border-gray-100">
              <button onClick={() => { setShowBranchModal(false); setBranchSelectByName(''); }} className="px-5 py-2 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-100">キャンセル</button>
            </div>
          </div>
        </div>
      )}

      {/* 復活確認 */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-96">
            <h4 className="text-lg font-bold text-gray-900 mb-4">案件を復活させる</h4>
            <p className="text-sm text-gray-600 mb-6">この案件を進行中に戻しますか？</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowRestoreConfirm(false)} className="px-5 py-2 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-100">キャンセル</button>
              <button onClick={handleRestore} className="px-5 py-2 rounded-full text-sm font-bold bg-purple-600 text-white hover:bg-purple-700">復活させる</button>
            </div>
          </div>
        </div>
      )}

      {/* 販売スキーム変更 確認モーダル */}
      {showPatternChangeConfirm && pendingEditInfo && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex items-center mb-4 text-amber-600">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mr-3 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-gray-900">販売スキームを変更</h4>
            </div>

            <div className="mb-5 space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                途中で販売スキームを変更します。変更内容は活動ログに自動で記録されます。
              </p>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-semibold">変更前</span>
                  <span className="font-bold text-gray-700">{formatSalesPattern(project.salesPattern)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-semibold">変更後</span>
                  <span className="font-extrabold text-amber-700">{formatSalesPattern(pendingEditInfo.salesPattern)}</span>
                </div>
              </div>
              <label className="block">
                <span className="text-xs font-semibold text-gray-700">
                  変更者の名前 <span className="text-red-600">*</span>
                </span>
                <input
                  type="text"
                  value={patternChangedByName}
                  onChange={(e) => setPatternChangedByName(e.target.value)}
                  placeholder="例：山田 太郎"
                  className="mt-1.5 w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
                  autoFocus
                />
                <span className="block mt-1 text-[10px] text-gray-400">入力した名前は活動ログに残ります（取り消しできません）</span>
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowPatternChangeConfirm(false);
                  setPendingEditInfo(null);
                  setPatternChangedByName('');
                }}
                className="px-5 py-2 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmPatternChange}
                disabled={patternChangedByName.trim() === ''}
                className="px-5 py-2 rounded-full text-sm font-bold bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center"
              >
                確定して保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認モーダル */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex items-center mb-4 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mr-3 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-gray-900">案件を削除しますか？</h4>
            </div>

            <div className="mb-5 space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                以下の案件を <span className="font-bold text-red-700">完全に削除</span> します。<br />
                操作は取り消せません。
              </p>
              <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2.5">
                <div className="text-[11px] text-gray-400 font-semibold">{project.id}</div>
                <div className="text-sm font-bold text-gray-900 mt-0.5 leading-tight">
                  <ProjectName name={project.name} />
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{project.endUser?.companyName}</div>
              </div>
              <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside leading-relaxed">
                <li>メモ・タスク・関連リンクすべて</li>
                <li>活動ログ {project.logs?.length || 0} 件</li>
                <li>フェーズ詳細データすべて</li>
              </ul>
              <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  💡 失注扱いにすれば KPI 集計には残しつつ進行を止められます。本当に履歴を残したくない場合のみ削除を選んでください。
                </p>
              </div>
              <label className="block">
                <span className="text-xs font-semibold text-gray-600">
                  確認のため <code className="px-1.5 py-0.5 rounded bg-gray-100 text-red-700 font-mono">削除</code> と入力してください
                </span>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="mt-1.5 w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
                  autoFocus
                />
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-5 py-2 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  if (deleteConfirmText.trim() !== '削除') return;
                  setShowDeleteConfirm(false);
                  onDeleteProject && onDeleteProject(project.id);
                  onBack && onBack();
                }}
                disabled={deleteConfirmText.trim() !== '削除'}
                className="px-5 py-2 rounded-full text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                完全に削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default ProjectDetail;
