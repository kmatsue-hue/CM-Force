import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Building,
  Calendar,
  CheckCircle2,
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
  isBranchablePattern,
  isMarginBranchablePattern,
  getMarginSteps,
} from '../data/phases.js';
import { formatJPYShort } from '../utils/format.js';
import { validatePhaseAdvance } from '../data/phaseValidators.js';
import Card from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';
import RankBadge from '../ui/RankBadge.jsx';
import ArrowDiagram from '../ui/ArrowDiagram.jsx';
import PhaseDetailPanel from '../ui/PhaseDetailPanel.jsx';
import { AssistTip } from '../ui/AssistMode.jsx';

const TAB_HINTS = {
  endUser: 'エンドユーザー（導入先施設）情報。\n企業名・担当者名・連絡先・販売店を確認。\n編集は右上の「編集」ボタンから一括で行えます。',
  project: '案件情報。\n想定全体売上・担当者・案件ランク・開始日／クローズ予定・卸値／紹介料・ニーズ等を一覧。\n値が空の項目は表示されません。',
  log: '活動ログ。\n商談記録・次回アクション・アラートを時系列で表示。\n「EUとの商談」フェーズから次へ進めるには、最新ログに「次回アクション日付」が必要です。',
};

// 各データ項目の説明
const FIELD_HINTS = {
  '企業・施設名':  '導入先（エンドユーザー）の正式名称。\n社内システム検索のキーになるので正確に入れてください。',
  '担当者名':      '先方の窓口担当者名。\n例: 施設長 山田様、事務長 佐藤、IT担当 鈴木 など。',
  '連絡先':        '電話番号またはメールアドレス。\n緊急時の連絡先として使うので最新の値に保ちましょう。',
  '販売店':        '介在する販売店・代理店名。\n直販なら「直販」と入れます。',
  '担当者':        '社内のセットアップ責任者。\n担当者管理タブで登録された人を割り当てます。',
  '案件ランク':    'A=確度高 / B=確度中 / C=確度低。\n月次レビューや優先順位付けの軸になります。',
  '開始日':        '案件着手日。\nダッシュボードのソート・KPI 集計に使用。',
  'クローズ予定':  '受注見込み日。\nリードタイムの目安として活用、月次予測にも反映されます。',
  '卸値':          'ケアマックスへの仕入れ値（税抜）。\n粗利計算に使用します。',
  '紹介料':        '紹介スキーム時の紹介料率(%) と金額。\nパターン3（完全紹介）案件で入力します。',
  'ニーズ・課題':  'エンドユーザーが解決したい課題や要望。\n提案書のストーリーラインの基礎になるので具体的に。',
  '想定全体売上':  'この案件で得られる想定売上総額（税抜）。\nダッシュボードのパイプライン金額に反映されます。',
};

// --- 案件詳細 ---
const ProjectDetail = ({ project, onBack, onUpdateProject, onDeleteProject }) => {
  const [selectedPhase, setSelectedPhase] = useState(project.status);
  const [infoTab, setInfoTab] = useState('endUser'); // 'endUser' | 'project' | 'log'
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editInfo, setEditInfo] = useState({ ...project });
  const [newLog, setNewLog] = useState({ content: '', nextAction: '', nextDate: '' });
  const [isAddingLog, setIsAddingLog] = useState(false);
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

  const kaientaiFlow = project.kaientaiFlow || { active: false, sub: 0 };
  const marginFlow   = project.marginFlow   || { active: false, sub: 0 };
  const marginSteps  = getMarginSteps(project.salesPattern);
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
    setEditInfo({ ...project });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

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
    return [
      {
        id: now.getTime(),
        date: now.toISOString().split('T')[0],
        type: 'activity',
        content,
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
          `フェーズ分岐: 「${MARGIN_BRANCH_PHASE}」 からマージン支払サブフローを開始しました${name ? `（実行者: ${name}）` : ''}`
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
      // セットアップ → 通常通り「販売契約締結」へ
      onUpdateProject({
        ...project,
        status: '販売契約締結',
        logs: prependPhaseLog(
          `フェーズ分岐: 「${BRANCH_PHASE}」 から 「販売契約締結」 へ進めました（セットアップフロー選択）${name ? `（実行者: ${name}）` : ''}`
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
    // 販売スキームが変更されていれば、変更者名の入力ダイアログを挟む
    if (editInfo.salesPattern !== project.salesPattern) {
      setPendingEditInfo({ ...editInfo });
      setPatternChangedByName('');
      setShowPatternChangeConfirm(true);
      return;
    }
    onUpdateProject({ ...editInfo, updatedAt: new Date().toISOString() });
    setIsEditingInfo(false);
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
      content: `販売スキームを「${project.salesPattern}」から「${pendingEditInfo.salesPattern}」に変更しました。（変更者: ${name}）`,
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
      content: newLog.content,
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
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <AssistTip text={"販売スキーム。\nパターン1=完全卸し / パターン2=分離 / パターン3=完全紹介。\n編集ボタンから変更できます。"} side="bottom">
                <Badge color={patternColor}>{project.salesPattern}</Badge>
              </AssistTip>
              {isLost && (
                <AssistTip text={"失注済み案件。\n進行操作は無効化されます。「案件を復活させる」ボタンで戻せます。"} side="bottom">
                  <Badge color="red">LOST</Badge>
                </AssistTip>
              )}
              <AssistTip text={"案件ID（自動採番）。\n社内連絡や請求書の参照番号として使用できます。"} side="bottom">
                <span className="text-xs font-mono text-gray-400">{project.id}</span>
              </AssistTip>
            </div>
            <AssistTip text={"案件名。\n編集ボタンから変更可。社内検索のキーになるので分かりやすい命名を推奨。"} side="bottom">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight leading-tight">{project.name}</h1>
            </AssistTip>
            {project.summary && (
              <AssistTip text={"案件の要約。\n背景・狙い・特記事項などを1〜2文で。営業メンバー間の引き継ぎに有効。"} side="bottom">
                <p className="text-sm text-gray-500 mt-1.5">{project.summary}</p>
              </AssistTip>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <AssistTip text={"案件の基本情報を編集します。\n企業名・担当者・金額・スキーム等をモーダルで一括編集可。"} side="bottom">
              <button
                onClick={() => { setEditInfo({ ...project }); setIsEditingInfo(true); }}
                className="px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-full hover:bg-gray-50 shadow-sm flex items-center"
              >
                <Edit className="w-4 h-4 mr-1.5" /> 編集
              </button>
            </AssistTip>
            {onDeleteProject && (
              <AssistTip text={"案件をシステムから完全に削除します。\nメモ・タスク・関連リンク・活動ログを含む全データが消失します。\n失注扱いにする方が安全なケースが多いのでご注意ください。"} side="bottom">
                <button
                  onClick={() => { setDeleteConfirmText(''); setShowDeleteConfirm(true); }}
                  className="px-4 py-2 text-sm font-bold text-red-700 bg-white border border-red-200 rounded-full hover:bg-red-50 shadow-sm flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" /> 削除
                </button>
              </AssistTip>
            )}
            {isLost ? (
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
            )}
          </div>
        </div>
      </div>

      {/* 情報タブ（クリックで詳細展開） */}
      <Card className="p-0 overflow-hidden">
        {/* タブヘッダー */}
        <div className="flex border-b border-gray-100 bg-gray-50/50">
          {[
            { key: 'endUser', label: 'エンドユーザー情報', icon: Building,      color: 'text-purple-600 border-purple-500' },
            { key: 'project', label: '案件情報',           icon: FileText,      color: 'text-emerald-600 border-emerald-500' },
            { key: 'log',     label: '活動ログ',           icon: MessageSquare, color: 'text-orange-600 border-orange-500', badge: project.logs.length },
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
                  {tab.label}
                  {tab.badge != null && tab.badge > 0 && (
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${active ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-600'}`}>{tab.badge}</span>
                  )}
                </button>
              </AssistTip>
            );
          })}
        </div>

        {/* タブ内容 */}
        <div className="p-5">
          {infoTab === 'endUser' && (
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              {[
                ['企業・施設名', project.endUser.companyName, true],
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
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <AssistTip text={FIELD_HINTS['担当者']} side="right">
                    <dt className="text-xs text-gray-400 font-semibold pt-0.5 cursor-help">担当者</dt>
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
                <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                  <AssistTip text={FIELD_HINTS['案件ランク']} side="right">
                    <dt className="text-xs text-gray-400 font-semibold cursor-help">案件ランク</dt>
                  </AssistTip>
                  <dd><RankBadge rank={project.rank} /></dd>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2 items-baseline">
                  <AssistTip text={FIELD_HINTS['開始日']} side="right">
                    <dt className="text-xs text-gray-400 font-semibold cursor-help">開始日</dt>
                  </AssistTip>
                  <dd className="text-sm font-semibold text-gray-700 tabular-nums">{project.startDate || <span className="text-gray-300 font-medium">—</span>}</dd>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2 items-baseline">
                  <AssistTip text={FIELD_HINTS['クローズ予定']} side="right">
                    <dt className="text-xs text-gray-400 font-semibold cursor-help">クローズ予定</dt>
                  </AssistTip>
                  <dd className="text-sm font-semibold text-gray-700 tabular-nums">{project.expectedCloseDate || <span className="text-gray-300 font-medium">—</span>}</dd>
                </div>
                {project.financial?.wholesalePriceSetup != null && (
                  <div className="grid grid-cols-[100px_1fr] gap-2 items-baseline">
                    <AssistTip text={FIELD_HINTS['卸値']} side="right">
                      <dt className="text-xs text-gray-400 font-semibold cursor-help">卸値</dt>
                    </AssistTip>
                    <dd className="text-sm font-semibold text-gray-700 tabular-nums">{formatJPYShort(project.financial.wholesalePriceSetup)}</dd>
                  </div>
                )}
                {project.financial?.referralFeeRate != null && (
                  <div className="grid grid-cols-[100px_1fr] gap-2 items-baseline">
                    <AssistTip text={FIELD_HINTS['紹介料']} side="right">
                      <dt className="text-xs text-gray-400 font-semibold cursor-help">紹介料</dt>
                    </AssistTip>
                    <dd className="text-sm font-semibold text-gray-700 tabular-nums">{project.financial.referralFeeRate}% / {formatJPYShort(project.financial.referralFeeAmount || 0)}</dd>
                  </div>
                )}
                {project.endUser.needsAndIssues && (
                  <div className="grid grid-cols-[100px_1fr] gap-2 md:col-span-2">
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
            <div className="overflow-y-auto pr-1 -mr-1 space-y-4" style={{ maxHeight: '420px' }}>
              {project.logs.map(log => (
                <div key={log.id} className={`flex gap-3 ${log.type === 'alert' ? 'bg-red-50/60 p-3 rounded-lg border border-red-100' : ''}`}>
                  <div className="flex-shrink-0 mt-0.5">
                    {log.type === 'alert'
                      ? <AlertCircle className="w-5 h-5 text-red-600" />
                      : <div className="w-7 h-7 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-purple-600" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-500 tabular-nums">{log.date}</p>
                    <p className="text-sm text-gray-800 font-medium leading-relaxed mt-1 break-words">{log.content}</p>
                    {log.nextAction && (
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="bg-purple-50 px-2.5 py-1 rounded-full text-purple-700 font-bold border border-purple-100 inline-flex items-center">
                          <ChevronRight className="w-3 h-3 mr-1" />{log.nextAction}
                        </span>
                        {log.nextDate && (
                          <span className="bg-gray-50 px-2.5 py-1 rounded-full text-gray-600 font-semibold border border-gray-100 inline-flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />{log.nextDate}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {project.logs.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-10 font-medium">活動ログがありません</p>
              )}
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
                    {kaientaiFlow.active ? '介援隊サブフロー進行中' : 'マージン支払サブフロー進行中'}
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
          isLost={isLost}
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
              content: logData.content,
              nextAction: logData.nextAction || '',
              nextDate: logData.nextDate || '',
            };
            onUpdateProject({
              ...project,
              logs: [logEntry, ...project.logs],
              updatedAt: new Date().toISOString(),
            });
          }}
        />
      </Card>


      {/* 編集モーダル */}
      {isEditingInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">案件情報の編集</h3>
              <button onClick={() => setIsEditingInfo(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">案件名</label>
                <input type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  value={editInfo.name} onChange={e => setEditInfo({ ...editInfo, name: e.target.value })} />
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
                    { v: 'パターン1（完全卸し）', label: 'パターン①', sub: '完全卸し', activeCls: 'bg-sky-600 text-white border-sky-600 shadow', idleCls: 'bg-white text-sky-700 border-sky-200 hover:bg-sky-50' },
                    { v: 'パターン2（分離）',     label: 'パターン②', sub: '分離',     activeCls: 'bg-yellow-500 text-white border-yellow-500 shadow', idleCls: 'bg-white text-yellow-700 border-yellow-200 hover:bg-yellow-50' },
                    { v: 'パターン3（完全紹介）', label: 'パターン③', sub: '完全紹介', activeCls: 'bg-green-600 text-white border-green-600 shadow', idleCls: 'bg-white text-green-700 border-green-200 hover:bg-green-50' },
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
                        <div className="text-[10px] font-semibold opacity-80 mt-0.5">{p.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">案件ランク</label>
                  <div className="grid grid-cols-3 gap-2">
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
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">セットアップ担当者</label>
                  <input type="text" placeholder="例：山田 太郎" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    value={editInfo.picSetup || ''} onChange={e => setEditInfo({ ...editInfo, picSetup: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">セットアップ担当者 連絡先 <span className="ml-1 text-xs font-normal text-gray-400">（電話番号・メールなど）</span></label>
                <input type="text" placeholder="例：090-1234-5678 / yamada@example.com" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  value={editInfo.picSetupContact || ''} onChange={e => setEditInfo({ ...editInfo, picSetupContact: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">クローズ予定日</label>
                  <input type="date" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    value={editInfo.expectedCloseDate || ''} onChange={e => setEditInfo({ ...editInfo, expectedCloseDate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">想定全体売上</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">¥</span>
                    <input type="number" className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      value={editInfo.financial?.expectedRevenue || 0}
                      onChange={e => setEditInfo({ ...editInfo, financial: { ...editInfo.financial, expectedRevenue: Number(e.target.value) } })} />
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">エンドユーザー情報</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">企業・施設名</label>
                    <input type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      value={editInfo.endUser?.companyName || ''}
                      onChange={e => setEditInfo({ ...editInfo, endUser: { ...editInfo.endUser, companyName: e.target.value } })} />
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
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">マージン処理を行わずに次フェーズへ進みます。</p>
              </button>
              <button
                onClick={() => { if (branchSelectByName.trim()) handleSelectMarginBranch('margin', branchSelectByName.trim()); }}
                disabled={branchSelectByName.trim() === ''}
                className="text-left p-5 rounded-2xl border-2 border-gray-200 hover:border-orange-400 hover:bg-orange-50/40 transition-all group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-transparent"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider text-orange-600 bg-orange-50 border border-orange-200">マージン</span>
                </div>
                <p className="text-sm font-bold text-gray-900">マージン支払サブフロー</p>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  {marginSteps.length === 1
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
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider text-orange-600 bg-orange-50 border border-orange-200">セットアップ</span>
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
                  <span className="font-bold text-gray-700">{project.salesPattern}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-semibold">変更後</span>
                  <span className="font-extrabold text-amber-700">{pendingEditInfo.salesPattern}</span>
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
                <div className="text-sm font-bold text-gray-900 mt-0.5 leading-tight">{project.name}</div>
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