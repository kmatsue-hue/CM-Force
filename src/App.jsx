import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart3, Users, Building, FileText,
  ChevronRight, AlertCircle, Clock,
  CheckCircle2, Search, Filter, ArrowLeft,
  MessageSquare, Calendar, Download, Edit,
  Trash2, CheckSquare, Check, Plus, X, ArrowUpDown,
  Link as LinkIcon, ExternalLink,
  TrendingUp, Target, Award, PieChart, LogOut
} from 'lucide-react';

// --- 権限ロール定義 ---
const ROLES = {
  KIKAKU: '企画部',
  SETUP: 'セットアップ',
  EIGYO: '営業部',
};
const ROLE_LIST = [ROLES.KIKAKU, ROLES.SETUP, ROLES.EIGYO];
// KPI タブを閲覧できるロール（セットアップは不可）
const KPI_ALLOWED_ROLES = [ROLES.KIKAKU, ROLES.EIGYO];
// 担当者管理を閲覧・編集できるロール（営業企画 = 企画部のみ）
const STAFF_ADMIN_ROLES = [ROLES.KIKAKU];
// 介援隊クエスト（外部リンク）を表示できるロール
const KAIENTAI_QUEST_ROLES = [ROLES.KIKAKU, ROLES.EIGYO];
const KAIENTAI_QUEST_URL = 'https://kmatsue-hue.github.io/kaientai-quest-app/';

// --- 日本円フォーマット（億・万単位） ---
const formatJPY = (n) => {
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
const formatJPYShort = (n) => {
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

// --- フェーズ定義 ---
const PHASES = [
  '案件発掘', '案件スクリーニング', 'EUとの商談', '現地調査',
  '設計', '提案書／見積書提出', '販売契約締結', '施工・納品', '一次保守'
];

// 介援隊サブフロー（パターン①/②で「提案書／見積書提出」の次にこちらを選択した場合のみ通る）
// 完了後は本流の「施工・納品」(index 7) に合流。
const KAIENTAI_SUB = ['介援隊：見積書提出', '介援隊：納品'];
const BRANCH_PHASE = '提案書／見積書提出';
const MERGE_PHASE = '施工・納品';
const isBranchablePattern = (pattern) => !!pattern && (pattern.includes('パターン1') || pattern.includes('パターン2'));

// マージン支払サブフロー（全パターンで「施工・納品」の上に分岐）
// パターン①/③: マージン支払 → 販売店へ支払 → 一次保守
// パターン②   : マージン支払 がゴール（販売店へ支払 なし → 一次保守へ合流）
const MARGIN_BRANCH_PHASE = '施工・納品';
const MARGIN_MERGE_PHASE  = '一次保守';
const getMarginSteps = (pattern) =>
  pattern?.includes('パターン2') ? ['マージン支払'] : ['マージン支払', '販売店へ支払'];
const isMarginBranchablePattern = (pattern) =>
  !!pattern && (pattern.includes('パターン1') || pattern.includes('パターン2') || pattern.includes('パターン3'));

// --- モックデータ ---
const mockProjects = [
  {
    id: 'PRJ-2026-001',
    name: '特別養護老人ホーム 陽だまり 介護システム導入',
    status: '提案書／見積書提出',
    startDate: '2026-03-01',
    expectedCloseDate: '2026-05-15',
    rank: 'A',
    salesPattern: 'パターン2（分離）',
    updatedAt: '2026-04-09T10:00:00',
    summary: '新規開設に伴う、ベッドセンサーおよびナースコール連動システムの全面導入。',
    picSetup: '山田 太郎',
    endUser: {
      companyName: '社会福祉法人 陽だまり会',
      retailerName: '〇〇事務機株式会社',
      department: '施設長',
      contact: '03-1234-5678',
      address: '東京都世田谷区...',
      needsAndIssues: '夜間のスタッフ負担軽減、見守り品質の向上'
    },
    financial: {
      expectedRevenue: 4500000,
      wholesalePriceSetup: 3000000,
      retailPrice: 4500000
    },
    phaseDetails: {
      '案件スクリーニング': { notes: '初回ヒアリング完了。予算感は合う。', links: [], tasks: [] },
      'EUとの商談': { notes: '製品デモ実施。反応良好。', links: [{ id: 'l1', title: 'デモ時ヒアリングシート', url: 'https://example.com/demo' }], tasks: [{ id: 1, text: '次回アポイントの調整', completed: true }] },
      '現地調査': { notes: '配線ルートの確認。一部天井裏のアクセスが悪い箇所あり。', links: [{ id: 'l2', title: '現地調査報告書', url: 'https://example.com/report' }], tasks: [{ id: 1, text: '施設の図面受領', completed: true }, { id: 2, text: '工事業者との日程調整', completed: true }] },
      '設計': { notes: '配線ルート図、システム構成図作成。', links: [{ id: 'l3', title: 'システム構成図_v1', url: 'https://example.com/design' }], tasks: [{ id: 1, text: '機器構成リストの作成', completed: true }, { id: 2, text: 'ネットワーク要件の定義', completed: false }] },
      '提案書／見積書提出': {
        notes: '最終見積書の提出完了。来週火曜日に先方理事会にて決裁予定。\n分離発注パターンでの契約書案も並行して準備中。',
        links: [
          { id: 'l4', title: '陽だまり様_御見積書_最終版', url: 'https://example.com/quote' },
          { id: 'l5', title: '導入提案書_陽だまり様', url: 'https://example.com/proposal' },
          { id: 'l6', title: '分離発注_契約書ドラフト', url: 'https://example.com/contract' }
        ],
        tasks: [
          { id: 1, text: '見積書の社内稟議通過', completed: true },
          { id: 2, text: '契約書ドラフトの法務チェック依頼', completed: true },
          { id: 3, text: '理事会決裁結果の確認連絡', completed: false },
          { id: 4, text: '分離発注用契約書の正式版作成', completed: false }
        ]
      },
    },
    logs: [
      { id: 1, date: '2026-04-09', type: 'activity', content: '最終見積書の提出完了。来週火曜日に先方理事会にて決裁予定。', nextAction: '決裁結果の確認', nextDate: '2026-04-14' },
      { id: 2, date: '2026-03-25', type: 'activity', content: '現地調査実施。配線ルートの確認完了。', nextAction: 'システム構成図の作成', nextDate: '2026-03-30' },
      { id: 3, date: '2026-03-10', type: 'activity', content: '初回のオンライン商談。ニーズのヒアリングを実施。', nextAction: '概算見積の提示', nextDate: '2026-03-15' },
    ]
  },
  {
    id: 'PRJ-2026-002',
    name: '株式会社CareTech 卸売基本契約',
    status: 'EUとの商談',
    startDate: '2026-04-01',
    expectedCloseDate: '2026-06-30',
    rank: 'B',
    salesPattern: 'パターン1（完全卸し）',
    updatedAt: '2026-04-10T09:30:00',
    summary: '新規代理店開拓。複数施設への展開を想定。',
    picSetup: '佐藤 次郎',
    endUser: {
      companyName: '株式会社CareTech',
      retailerName: '直販（代理店開拓）',
      department: '営業推進部',
      contact: 'caretech@example.com',
      address: '大阪府大阪市...',
      needsAndIssues: '取扱商材の拡充、利益率の改善'
    },
    financial: {
      expectedRevenue: 12000000,
      wholesalePriceSetup: 8000000,
    },
    phaseDetails: {
      '案件発掘': { notes: '展示会での名刺交換。後日アポ取得。', links: [], tasks: [] },
      '案件スクリーニング': { notes: '先方の主要顧客層が当社のターゲットと合致。卸売契約の前向きな検討。', links: [], tasks: [] },
      'EUとの商談': {
        notes: 'CareTech社の営業部門向けに製品デモを実施。高い関心を寄せていただいた。\nまずは基本契約（NDA含む）の締結を進める。',
        links: [
          { id: 'l1', title: 'CareTech_会社案内', url: 'https://example.com/caretech-info' },
          { id: 'l2', title: '卸売基本契約書_案', url: 'https://example.com/wholesale-contract' }
        ],
        tasks: [
          { id: 1, text: 'NDAの締結', completed: false },
          { id: 2, text: '卸条件の提示', completed: false }
        ]
      },
    },
    logs: [
      { id: 1, date: '2026-04-10', type: 'alert', content: 'NDAの締結期限が迫っています。', nextAction: '法務部へ契約書のリーガルチェック催促', nextDate: '2026-04-11' },
      { id: 2, date: '2026-04-05', type: 'activity', content: '製品デモ実施。非常に高い関心を寄せていただいた。', nextAction: 'NDA締結・卸条件の提示', nextDate: '2026-04-12' },
    ]
  },
  {
    id: 'PRJ-2026-003',
    name: '〇〇クリニック 紹介案件',
    status: '一次保守',
    startDate: '2025-12-01',
    expectedCloseDate: '2026-02-28',
    rank: 'A',
    salesPattern: 'パターン3（完全紹介）',
    updatedAt: '2026-04-01T15:00:00',
    summary: '紹介による直接販売。納品完了し保守フェーズへ移行。',
    picSetup: '鈴木 花子',
    endUser: {
      companyName: '医療法人 〇〇クリニック',
      retailerName: 'メディカルサプライ株式会社',
      department: '院長',
      contact: '06-9876-5432',
      address: '兵庫県神戸市...',
      needsAndIssues: '受付業務の効率化'
    },
    financial: {
      expectedRevenue: 800000,
      directSalesPrice: 800000,
      referralFeeRate: 15,
      referralFeeAmount: 120000
    },
    phaseDetails: {
      '施工・納品': { notes: '現地への納品、ネットワーク設定完了。受付スタッフへの操作説明実施。', links: [{ id: 'l1', title: '納品受領書_サイン済', url: 'https://example.com/receipt' }], tasks: [{ id: 1, text: '検収書の回収', completed: true }] },
      '一次保守': {
        notes: '運用開始後1ヶ月のフォローアップ。順調に稼働中。\n一部設定の微調整依頼あり、リモートにて対応済み。',
        links: [
          { id: 'l2', title: '保守手順書', url: 'https://example.com/maintenance' }
        ],
        tasks: [
          { id: 1, text: '3ヶ月点検のスケジュール調整', completed: false }
        ]
      },
    },
    logs: [
      { id: 1, date: '2026-04-01', type: 'activity', content: '運用開始後1ヶ月のフォローアップミーティング。順調に稼働中。', nextAction: '3ヶ月点検のスケジュール調整', nextDate: '2026-06-01' },
      { id: 2, date: '2026-02-28', type: 'activity', content: 'システム納品・初期設定完了。', nextAction: '請求書の発行', nextDate: '2026-03-05' },
    ]
  }
];

// --- 共通コンポーネント ---
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, color = 'purple' }) => {
  const colors = {
    purple: 'bg-purple-100 text-purple-800',
    blue: 'bg-blue-100 text-blue-800',
    sky: 'bg-sky-100 text-sky-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-800',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${colors[color] || colors.purple}`}>
      {children}
    </span>
  );
};

const RANK_STYLES = {
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

// 一覧表示用のミニマイルストーン
const MiniArrowDiagram = ({ currentPhase }) => {
  const currentIndex = PHASES.indexOf(currentPhase);
  return (
    <div className="flex items-center w-full min-w-[140px] mt-2 py-1">
      {PHASES.map((phase, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        return (
          <React.Fragment key={phase}>
            <div
              className={`flex-shrink-0 rounded-full transition-all duration-300 ${
                isCompleted ? 'w-2 h-2 bg-purple-600' :
                isActive ? 'w-3.5 h-3.5 bg-purple-600 ring-[4px] ring-purple-100 z-10 relative' :
                'w-2 h-2 bg-gray-200'
              }`}
              title={phase}
            />
            {index < PHASES.length - 1 && (
              <div
                className={`flex-1 h-[2px] mx-[2px] transition-all duration-300 rounded-full ${
                  index < currentIndex ? 'bg-purple-600' : 'bg-gray-100'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// アローダイヤグラム（詳細画面用）
// グループ定義:
//   介援隊      → PHASES[0..1]  (案件発掘・案件スクリーニング)  青枠
//   セットアップ → PHASES[2..8]  (EUとの商談〜一次保守)          朱色枠
const PHASE_GROUPS = [
  { label: '介援隊',      from: 0, to: 1, border: 'rgba(59,130,246,0.4)',  color: '#6b9fd4' },
  { label: 'セットアップ', from: 2, to: 8, border: 'rgba(224,90,43,0.4)',   color: '#d4845a' },
];

const ArrowDiagram = ({ currentPhase, selectedPhase, onSelectPhase, phaseDetails, kaientaiFlow, marginFlow, marginSteps = [], salesPattern }) => {
  const currentIndex = PHASES.indexOf(currentPhase);
  const N = PHASES.length; // 9
  const subActive = !!kaientaiFlow?.active;
  const subCompleted = !!kaientaiFlow?.completed;
  const branchableHere = isBranchablePattern(salesPattern);
  const branchPhaseIdx = PHASES.indexOf(BRANCH_PHASE);
  const showSubRow = branchableHere && (subActive || subCompleted || currentIndex >= branchPhaseIdx);

  // マージン支払サブフロー（上方向の分岐・全パターン対応）
  const marginBranchable = isMarginBranchablePattern(salesPattern);
  const marginActive    = !!marginFlow?.active;
  const marginCompleted = !!marginFlow?.completed;
  const marginBranchIdx = PHASES.indexOf(MARGIN_BRANCH_PHASE);
  const marginMergeIdx  = PHASES.indexOf(MARGIN_MERGE_PHASE);
  const showMarginRow   = marginBranchable && marginSteps.length > 0 && (marginActive || marginCompleted || currentIndex >= marginBranchIdx);

  const halfPct   = 100 / (2 * N);
  const progressW = (currentIndex / N) * 100;
  const overallPct = Math.round(((currentIndex + 1) / N) * 100);

  // 完了/合計（本流のみカウント。サブ中は本流カウントは branchPhaseIdx まで完了扱い）
  const doneCount = subActive ? branchPhaseIdx + 1 : currentIndex;
  const groupStyle = (from, to) => ({
    left:  `${(from / N) * 100}%`,
    right: `${((N - 1 - to) / N) * 100}%`,
  });

  return (
    <div className="w-full">
      <div className="w-full overflow-x-auto pb-4">
        <div className="relative min-w-[1020px] w-full pb-3">

          {/* ── マージン支払サブフロー（上方向の分岐） ── */}
          {showMarginRow && (() => {
            const startPct = (marginBranchIdx + 0.5) / N * 100;
            const endPct   = (marginMergeIdx + 0.5) / N * 100;
            const isPair   = marginSteps.length > 1;
            const midPct   = isPair ? (startPct + endPct) / 2 : startPct;
            const branchOn = marginActive || marginCompleted;
            const NODE_R = 28;
            const CONTAINER_H = 130;
            const NODE_CY = 106;       // 円下端を容器下端に合わせる（CONTAINER_H - NODE_R）
            return (
              <div className="relative" style={{ height: CONTAINER_H, marginBottom: -52 /* 上部ラベル領域とちょうど接続する程度に詰める */ }}>
                {/* 分岐ラベル（サブノードの上部） */}
                <div className="absolute z-10 flex items-center gap-1.5 text-[11px] font-extrabold tracking-widest uppercase whitespace-nowrap"
                     style={{
                       left: `${midPct}%`,
                       top: 8,
                       transform: 'translateX(-50%)',
                       color: branchOn ? '#c2410c' : '#94a3b8',
                     }}>
                  <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: branchOn ? '#f97316' : '#fed7aa' }} />
                  マージン支払サブフロー
                  {!isPair && <span className="ml-1 text-[9px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full">パターン②: ゴール</span>}
                </div>

                {/* 水平線（pair の場合のみ。サブノード中心を貫通） */}
                {isPair && (
                  <div
                    className="absolute pointer-events-none rounded-full"
                    style={{
                      top: NODE_CY - 1.5,
                      left: `${startPct}%`,
                      right: `${100 - endPct}%`,
                      height: 3,
                      zIndex: 0,
                      opacity: 0.45,
                      background: branchOn
                        ? 'linear-gradient(to right, #f97316, #fb923c)'
                        : 'repeating-linear-gradient(to right, #fed7aa 0 4px, transparent 4px 8px)',
                    }}
                  />
                )}

                {/* サブフェーズ（各ノードの中心を縦パイプ位置=横線の角に揃える） */}
                {marginSteps.map((mPh, i) => {
                  const xPct = isPair ? (i === 0 ? startPct : endPct) : startPct;
                  const isCurrentM = marginActive && marginFlow.sub === i;
                  const isDoneM    = marginCompleted || (marginActive && i < marginFlow.sub);
                  const isSelM     = selectedPhase === mPh;
                  const incomplete = (phaseDetails?.[mPh]?.tasks || []).filter(t => !t.completed).length;
                  return (
                    <button
                      key={mPh}
                      onClick={() => onSelectPhase(mPh)}
                      className="absolute flex flex-col items-center group focus:outline-none"
                      style={{ bottom: CONTAINER_H - (NODE_CY + NODE_R), left: `${xPct}%`, transform: 'translateX(-50%)', zIndex: 10 }}
                    >
                      <div className="mt-1 h-4 mb-2">
                        {isCurrentM && (
                          <span className="text-[9px] font-extrabold text-orange-700 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full">進行中</span>
                        )}
                        {!isDoneM && !isCurrentM && incomplete > 0 && (
                          <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-md">未完 {incomplete}</span>
                        )}
                      </div>
                      <div className={[
                        'mb-2 text-[11px] text-center px-2 py-1 rounded-md leading-snug whitespace-nowrap',
                        isSelM     ? 'bg-orange-100 text-orange-900 font-extrabold ring-1 ring-orange-300/60' :
                        isCurrentM ? 'text-orange-700 font-bold' :
                        isDoneM    ? 'text-gray-700 font-semibold' : 'text-orange-400 font-medium',
                      ].join(' ')}>
                        {mPh}
                      </div>
                      <div className="relative w-12 h-12 flex items-center justify-center">
                        {isCurrentM && (
                          <>
                            <span className="absolute inset-0 rounded-full bg-orange-400 opacity-60 animate-ping" />
                            <span className="absolute inset-0 rounded-full bg-orange-500 opacity-30 animate-ping" style={{ animationDelay: '0.6s' }} />
                          </>
                        )}
                        <div className={[
                          'relative z-10 flex items-center justify-center rounded-full font-extrabold transition-all duration-300',
                          'w-12 h-12 text-sm',
                          isDoneM    ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-200' : '',
                          isCurrentM ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-2xl shadow-orange-300 ring-4 ring-white outline outline-2 outline-orange-300 scale-110' : '',
                          (!isDoneM && !isCurrentM) ? 'bg-white text-orange-400 border-2 border-orange-200 group-hover:border-orange-400' : '',
                        ].join(' ')}>
                          {isDoneM
                            ? <Check className="w-5 h-5 text-emerald-300 drop-shadow-[0_0_6px_rgba(52,211,153,1)]" strokeWidth={3.5} />
                            : <span className="text-xs">M.{i + 1}</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })()}

          <div className="relative pt-7">

          {/* ── フェーズ ── */}
          <div className="relative flex items-start w-full pt-6 pb-2">
            {/* 背景線（円中心 = pt-6(24) + 上部ラベル領域(96) + 円半径(26) = 146） */}
            <div className="absolute h-1 bg-gray-100 rounded-full pointer-events-none"
                 style={{ top: 24 + 96 + 16 + 32 - 2, left: `${halfPct}%`, right: `${halfPct}%`, opacity: 0.6 }} />
            {/* 進捗線（グラデーション） */}
            {currentIndex > 0 && (
              <div className="absolute h-1 bg-gradient-to-r from-purple-400 via-purple-600 to-indigo-600 rounded-full pointer-events-none transition-all duration-700"
                   style={{ top: 24 + 96 + 16 + 32 - 2, left: `${halfPct}%`, width: `${progressW}%`, opacity: 0.5 }} />
            )}

            {PHASES.map((phase, index) => {
              const isCompleted = index < currentIndex;
              const isActive    = index === currentIndex;
              const isPending   = index > currentIndex;
              const isSelected  = selectedPhase === phase;
              const incomplete  = (phaseDetails?.[phase]?.tasks || []).filter(t => !t.completed).length;
              const taskTotal   = (phaseDetails?.[phase]?.tasks || []).length;
              const isBranchAnchor = showSubRow && (index === branchPhaseIdx || index === PHASES.indexOf(MERGE_PHASE));
              // マージン縦パイプは「施工・納品」のみから上へ伸ばす（一次保守には繋げない）
              const isMarginAnchor = showMarginRow && index === marginBranchIdx;

              return (
                <button
                  key={phase}
                  onClick={() => onSelectPhase(phase)}
                  className="relative flex flex-col items-center flex-1 group focus:outline-none px-1"
                >
                  {/* 上部ラベル領域（タスク → ステータス → フェーズ名 / 下端を円に揃える） */}
                  <div className="flex flex-col items-center justify-end h-[96px] w-full mb-4">
                    {/* 未完了タスク */}
                    <div className="h-5 mb-1">
                      {incomplete > 0 && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5" />未完 {incomplete}
                        </span>
                      )}
                    </div>
                    {/* ステータス */}
                    <div className="h-5 mb-1.5 flex items-center">
                      {isActive && (
                        <span className="text-[10px] font-extrabold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">進行中</span>
                      )}
                      {isPending && incomplete === 0 && taskTotal === 0 && (
                        <span className="text-[10px] font-bold text-gray-400">—</span>
                      )}
                    </div>
                    {/* フェーズ名 */}
                    <div className={[
                      'text-xs text-center px-2 py-1 rounded-lg leading-snug max-w-[110px] transition-all',
                      isSelected  ? 'bg-purple-100 text-purple-900 font-extrabold ring-1 ring-purple-300/60 shadow-sm' :
                      isActive    ? 'text-purple-700 font-bold' :
                      isCompleted ? 'text-gray-700 font-semibold' :
                                    'text-gray-400 font-medium',
                    ].join(' ')}>
                      {phase}
                    </div>
                  </div>

                  {/* 円ノード（ラッパーに pipe を相対配置） */}
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    {/* 進行中の波紋（ノード全体から拡散） */}
                    {isActive && (
                      <>
                        <span className="absolute inset-0 rounded-full bg-purple-400 opacity-60 animate-ping" />
                        <span className="absolute inset-0 rounded-full bg-purple-500 opacity-30 animate-ping" style={{ animationDelay: '0.6s' }} />
                      </>
                    )}
                    <div className={[
                      'relative z-10 flex items-center justify-center rounded-full font-extrabold transition-all duration-300',
                      'w-16 h-16 text-base',
                      isCompleted ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-200' : '',
                      isActive    ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-2xl shadow-purple-300 ring-4 ring-white outline outline-2 outline-purple-300 scale-110' : '',
                      isPending   ? 'bg-white text-gray-400 border-2 border-gray-200 group-hover:border-purple-300 group-hover:text-purple-500 group-hover:scale-105' : '',
                    ].join(' ')}>
                      {isCompleted
                        ? <Check className="w-6 h-6 text-emerald-300 drop-shadow-[0_0_6px_rgba(52,211,153,1)]" strokeWidth={3.5} />
                        : <span>{index + 1}</span>}
                    </div>

                    {/* 介援隊サブフローへの縦パイプ（円下端から下に伸ばす） */}
                    {isBranchAnchor && (
                      <div
                        className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                        style={{
                          top: '100%',  // 円の直下から開始
                          width: 3,
                          height: 80,
                          zIndex: 0,
                          opacity: 0.45,
                          background: subActive || subCompleted
                            ? 'linear-gradient(to bottom, #3b82f6, #6366f1)'
                            : 'repeating-linear-gradient(to bottom, #cbd5e1 0 4px, transparent 4px 8px)',
                          borderRadius: 9999,
                        }}
                      />
                    )}

                    {/* マージン支払サブフローへの縦パイプ（円上端から上に伸ばす・オレンジ） */}
                    {isMarginAnchor && (
                      <div
                        className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                        style={{
                          bottom: '100%',
                          width: 3,
                          height: 130, // 本流円上端 → マージン水平線まで（コンパクト化）

                          zIndex: 0,
                          opacity: 0.45,
                          background: marginActive || marginCompleted
                            ? 'linear-gradient(to top, #f97316, #fb923c)'
                            : 'repeating-linear-gradient(to top, #fed7aa 0 4px, transparent 4px 8px)',
                          borderRadius: 9999,
                        }}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── 介援隊サブフロー ── */}
          {showSubRow && (() => {
            const startPct = (branchPhaseIdx + 0.5) / N * 100;
            const endPct   = (PHASES.indexOf(MERGE_PHASE) + 0.5) / N * 100;
            const midPct   = (startPct + endPct) / 2;
            const branchActive = subActive || subCompleted;
            const stroke = branchActive ? '#2563eb' : '#cbd5e1';
            // ノード中心の Y 位置（px）。本流ノードから垂直パイプで降りた先で水平線と接続。
            const NODE_R  = 28;          // 円半径 (w-12 = 48px)
            const NODE_CY = 80;          // サブ行内のノード中心 Y
            const CONTAINER_H = 220;     // ノード下のラベル + 分岐ラベル領域
            return (
              <div className="relative" style={{ height: CONTAINER_H, marginTop: -6 /* 縦パイプ下端と水平線をぴったり接続 */ }}>
                {/* 水平線（サブノード中心を貫通し、本流からの縦パイプと接続） */}
                <div
                  className="absolute pointer-events-none rounded-full"
                  style={{
                    top: NODE_CY - 1.5,
                    left: `${startPct}%`,
                    right: `${100 - endPct}%`,
                    height: 3,
                    zIndex: 0,
                    opacity: 0.45,
                    background: branchActive
                      ? 'linear-gradient(to right, #3b82f6, #6366f1)'
                      : 'repeating-linear-gradient(to right, #cbd5e1 0 4px, transparent 4px 8px)',
                  }}
                />

                {/* サブフェーズ（円中心が NODE_CY に来るよう top で揃える） */}
                <div className="absolute inset-x-0 flex" style={{ top: NODE_CY - NODE_R, paddingLeft: `${startPct}%`, paddingRight: `${100 - endPct}%` }}>
                  <div className="flex items-start w-full justify-around gap-4">
                    {KAIENTAI_SUB.map((subPh, i) => {
                      const isCurrentSub = subActive && kaientaiFlow.sub === i;
                      const isDoneSub = subCompleted || (subActive && i < kaientaiFlow.sub);
                      const isSelectedSub = selectedPhase === subPh;
                      const incomplete = (phaseDetails?.[subPh]?.tasks || []).filter(t => !t.completed).length;
                      return (
                        <button
                          key={subPh}
                          onClick={() => onSelectPhase(subPh)}
                          className="relative flex flex-col items-center group focus:outline-none"
                        >
                          <div className="relative w-12 h-12 flex items-center justify-center">
                            {/* 進行中の波紋（ノード全体から拡散） */}
                            {isCurrentSub && (
                              <>
                                <span className="absolute inset-0 rounded-full bg-blue-400 opacity-60 animate-ping" />
                                <span className="absolute inset-0 rounded-full bg-blue-500 opacity-30 animate-ping" style={{ animationDelay: '0.6s' }} />
                              </>
                            )}
                            <div className={[
                              'relative z-10 flex items-center justify-center rounded-full font-extrabold transition-all duration-300',
                              'w-12 h-12 text-sm',
                              isDoneSub    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200' : '',
                              isCurrentSub ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-2xl shadow-blue-300 ring-4 ring-white outline outline-2 outline-blue-300 scale-110' : '',
                              (!isDoneSub && !isCurrentSub) ? 'bg-white text-blue-400 border-2 border-blue-200 group-hover:border-blue-400' : '',
                            ].join(' ')}>
                              {isDoneSub
                                ? <Check className="w-5 h-5 text-emerald-300 drop-shadow-[0_0_6px_rgba(52,211,153,1)]" strokeWidth={3.5} />
                                : <span className="text-xs">6.{i + 1}</span>}
                            </div>
                          </div>
                          <div className={[
                            'mt-2 text-[11px] text-center px-2 py-1 rounded-md leading-snug whitespace-nowrap',
                            isSelectedSub ? 'bg-blue-100 text-blue-900 font-extrabold ring-1 ring-blue-300/60' :
                            isCurrentSub  ? 'text-blue-700 font-bold' :
                            isDoneSub     ? 'text-gray-700 font-semibold' : 'text-blue-400 font-medium',
                          ].join(' ')}>
                            {subPh.replace('介援隊：', '')}
                          </div>
                          <div className="mt-1 h-4">
                            {isCurrentSub && (
                              <span className="text-[9px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">進行中</span>
                            )}
                            {!isDoneSub && !isCurrentSub && incomplete > 0 && (
                              <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-md">未完 {incomplete}</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 分岐ラベル（サブノードの下部に配置・枠なし） */}
                <div className="absolute z-10 flex items-center gap-1.5 text-[11px] font-extrabold tracking-widest uppercase whitespace-nowrap"
                     style={{
                       left: `${midPct}%`,
                       top: NODE_CY + NODE_R + 84,
                       transform: 'translateX(-50%)',
                       color: branchActive ? '#1d4ed8' : '#94a3b8',
                     }}>
                  <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: branchActive ? '#3b82f6' : '#cbd5e1' }} />
                  介援隊サブフロー
                </div>
              </div>
            );
          })()}
          </div>
        </div>
      </div>
    </div>
  );
};

// フェーズ詳細パネル
const PhaseDetailPanel = ({ phase, data, isLost, onUpdate, currentProjectPhase, onAdvancePhase, nextPhaseLabel, isAtBranchPoint, canStartKaientaiHere, onStartKaientai, canStartMarginHere, onStartMargin, onAddProjectLog }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(data?.notes || '');
  const [tasks, setTasks] = useState(data?.tasks || []);
  const [newTaskText, setNewTaskText] = useState('');
  const [links, setLinks] = useState(data?.links || []);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [marginAmount, setMarginAmount] = useState(data?.marginAmount ?? '');
  const [marginScheduledDate, setMarginScheduledDate] = useState(data?.marginScheduledDate || '');
  const isMarginPaymentPhase = phase === 'マージン支払';
  // 活動ログのインライン入力
  const [quickLog, setQuickLog] = useState({ content: '', nextAction: '', nextDate: '' });
  const submitQuickLog = () => {
    if (!quickLog.content.trim() || !onAddProjectLog) return;
    onAddProjectLog({ ...quickLog });
    setQuickLog({ content: '', nextAction: '', nextDate: '' });
  };

  const currentPhaseIndex = PHASES.indexOf(currentProjectPhase);
  const isCurrentPhase = phase === currentProjectPhase;
  // 一次保守 (PHASES 末尾) のみ最終。介援隊サブフェーズ中は常に進める対象あり。
  const isLastPhase = currentProjectPhase === PHASES[PHASES.length - 1];
  const hasIncompleteTasks = tasks.some(t => !t.completed);

  React.useEffect(() => {
    setNotes(data?.notes || '');
    setTasks(data?.tasks || []);
    setLinks(data?.links || []);
    setMarginAmount(data?.marginAmount ?? '');
    setMarginScheduledDate(data?.marginScheduledDate || '');
    setIsEditing(false);
    setNewTaskText('');
    setNewLinkUrl('');
    setNewLinkTitle('');
  }, [phase, data]);

  const toggleTask = (taskId) => {
    if (isLost) return;
    const newTasks = tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    setTasks(newTasks);
    onUpdate && onUpdate(phase, { ...data, notes, links, tasks: newTasks });
  };

  const addTask = () => {
    if (!newTaskText.trim() || isLost) return;
    const newTask = { id: Date.now(), text: newTaskText, completed: false };
    const newTasks = [...tasks, newTask];
    setTasks(newTasks);
    setNewTaskText('');
    onUpdate && onUpdate(phase, { ...data, notes, links, tasks: newTasks });
  };

  const deleteTask = (taskId) => {
    const newTasks = tasks.filter(t => t.id !== taskId);
    setTasks(newTasks);
    onUpdate && onUpdate(phase, { ...data, notes, links, tasks: newTasks });
  };

  const addLink = () => {
    if (!newLinkUrl.trim() || isLost) return;
    const newLink = { id: Date.now(), url: newLinkUrl, title: newLinkTitle.trim() || newLinkUrl };
    const newLinks = [...links, newLink];
    setLinks(newLinks);
    setNewLinkUrl('');
    setNewLinkTitle('');
    onUpdate && onUpdate(phase, { ...data, notes, links: newLinks, tasks });
  };

  const deleteLink = (linkId) => {
    const newLinks = links.filter(l => l.id !== linkId);
    setLinks(newLinks);
    onUpdate && onUpdate(phase, { ...data, notes, links: newLinks, tasks });
  };

  const handleSave = () => {
    const payload = { ...data, notes, links, tasks };
    if (isMarginPaymentPhase) {
      payload.marginAmount = marginAmount === '' ? '' : Number(marginAmount);
      payload.marginScheduledDate = marginScheduledDate;
    }
    onUpdate && onUpdate(phase, payload);
    setIsEditing(false);
  };

  return (
    <div className="mt-10 border-t border-gray-100 pt-8 animate-in fade-in slide-in-from-top-4 duration-500 relative">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center tracking-tight">
          <div className="w-1.5 h-6 bg-purple-600 rounded-full mr-3"></div>
          {phase} <span className="ml-2 text-sm font-semibold text-gray-400 uppercase tracking-wider">Details</span>
        </h3>
        <div className="flex items-center space-x-3">
          {canStartKaientaiHere && !isLost && (
            <button
              onClick={onStartKaientai}
              className="px-5 py-2 rounded-full text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md border border-blue-600 flex items-center transition-all"
            >
              介援隊サブフローを開始
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          )}
          {canStartMarginHere && !isLost && (
            <button
              onClick={onStartMargin}
              className="px-5 py-2 rounded-full text-sm font-bold bg-orange-600 text-white hover:bg-orange-700 shadow-md border border-orange-600 flex items-center transition-all"
            >
              マージン支払サブフローを開始
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          )}
          {isCurrentPhase && !isLastPhase && (
            <div className="relative group">
              <button
                onClick={() => {
                  if (hasIncompleteTasks || isLost) return;
                  // 分岐ポイントでは確認ダイアログを挟まず直接モーダルへ
                  if (isAtBranchPoint) { onAdvancePhase(); return; }
                  setShowConfirm(true);
                }}
                disabled={isLost || hasIncompleteTasks}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all shadow-sm flex items-center ${
                  isLost || hasIncompleteTasks
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                    : 'bg-green-600 text-white hover:bg-green-700 shadow-md border border-green-600'
                }`}
              >
                {isAtBranchPoint ? '次フェーズへ進める（分岐選択）' : '次フェーズへ進める'}
                {!hasIncompleteTasks && !isLost && <ChevronRight className="w-4 h-4 ml-1" />}
              </button>
              {hasIncompleteTasks && !isLost && (
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-max bg-gray-800 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-lg pointer-events-none z-50">
                  未完了のタスクがあるため進めません
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={isLost}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all shadow-sm ${
              isLost ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none border border-gray-200' :
              isEditing ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-md' : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-100'
            }`}
          >
            {isEditing ? '保存する' : '編集する'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col space-y-6">
          {/* マージン支払専用フィールド */}
          {isMarginPaymentPhase && (
            <div className="bg-orange-50/60 border border-orange-100 rounded-xl p-5">
              <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-orange-500" />
                ケアマックスへの支払
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 支払額（税抜） */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    支払額（税抜）
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">¥</span>
                      <input
                        type="number"
                        min="0"
                        value={marginAmount}
                        onChange={e => setMarginAmount(e.target.value)}
                        placeholder="0"
                        className="w-full pl-8 pr-3 py-2.5 bg-white border-2 border-orange-200 rounded-lg text-sm font-semibold text-gray-900 focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-300 transition-all"
                      />
                    </div>
                  ) : (
                    <p className="text-base font-bold text-gray-900 tabular-nums px-1 py-2">
                      {marginAmount !== '' && marginAmount != null
                        ? `¥${Number(marginAmount).toLocaleString()}`
                        : <span className="text-gray-400 font-medium">未入力</span>}
                    </p>
                  )}
                  {/* 税込み自動表示 */}
                  {marginAmount !== '' && !isNaN(Number(marginAmount)) && (
                    <p className="text-xs font-bold text-gray-500 mt-2 tabular-nums">
                      税込（10%）<span className="ml-2 text-orange-700">¥{Math.floor(Number(marginAmount) * 1.10).toLocaleString()}</span>
                    </p>
                  )}
                </div>

                {/* 支払予定日 */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    支払予定日
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={marginScheduledDate}
                      onChange={e => setMarginScheduledDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border-2 border-orange-200 rounded-lg text-sm font-semibold text-gray-900 focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-300 transition-all"
                    />
                  ) : (
                    <p className="text-base font-bold text-gray-900 px-1 py-2 flex items-center gap-2">
                      {marginScheduledDate
                        ? <><Calendar className="w-4 h-4 text-orange-500" />{marginScheduledDate}</>
                        : <span className="text-gray-400 font-medium">未設定</span>}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 活動ログ クイック入力（コンパクト） */}
          <div className="bg-purple-50/40 border border-purple-100 rounded-xl p-3">
            <h4 className="text-xs font-bold text-gray-600 mb-2 flex items-center">
              <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-purple-500" />
              活動ログをすばやく追加
            </h4>
            <textarea
              rows={2}
              disabled={isLost}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none disabled:bg-gray-100"
              placeholder="例：先方理事会で承認、契約締結に向けて準備中"
              value={quickLog.content}
              onChange={e => setQuickLog({ ...quickLog, content: e.target.value })}
            />
            <div className="mt-2 grid grid-cols-[1fr_140px_auto] gap-2 items-center">
              <input
                type="text"
                disabled={isLost}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:bg-gray-100"
                placeholder="次のアクション（任意）"
                value={quickLog.nextAction}
                onChange={e => setQuickLog({ ...quickLog, nextAction: e.target.value })}
              />
              <input
                type="date"
                disabled={isLost}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:bg-gray-100"
                value={quickLog.nextDate}
                onChange={e => setQuickLog({ ...quickLog, nextDate: e.target.value })}
              />
              <button
                onClick={submitQuickLog}
                disabled={isLost || !quickLog.content.trim()}
                className="px-4 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center"
              >
                <Plus className="w-3 h-3 mr-1" />追加
              </button>
            </div>
          </div>

          {/* タスクリスト */}
          <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-100 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-gray-700 flex items-center">
                <CheckSquare className="w-4 h-4 mr-2 text-purple-500" />
                タスクリスト
              </h4>
              <span className="text-xs font-bold text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-200">
                {tasks.filter(t => t.completed).length} / {tasks.length}
              </span>
            </div>
            <div className="space-y-2 mb-4">
              {tasks.map(task => (
                <div key={task.id} className="flex items-start group bg-white p-3 rounded-lg border border-gray-100 shadow-sm transition-all hover:border-purple-200">
                  <button
                    onClick={() => toggleTask(task.id)}
                    disabled={isLost}
                    className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-all ${
                      task.completed ? 'bg-purple-600 text-white border border-purple-600' : 'bg-white border-2 border-gray-300 hover:border-purple-400'
                    } ${isLost ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                  >
                    {task.completed && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <span className={`ml-3 text-sm flex-1 leading-snug transition-all ${
                    task.completed ? 'text-gray-400 line-through' : 'text-gray-800 font-medium'
                  }`}>
                    {task.text}
                  </span>
                  {isEditing && (
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 ml-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-sm text-gray-400 font-medium py-2">タスクはありません</p>
              )}
            </div>
            {isEditing && (
              <div className="flex items-center bg-white p-2 rounded-lg border-2 border-purple-100 focus-within:border-purple-300 transition-all">
                <input
                  type="text"
                  className="flex-1 bg-transparent px-2 py-1 text-sm outline-none text-gray-800 placeholder-gray-400"
                  placeholder="新しいタスクを入力..."
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addTask(); }}
                />
                <button
                  onClick={addTask}
                  disabled={!newTaskText.trim()}
                  className="ml-2 px-4 py-1.5 bg-purple-100 text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-xs font-bold hover:bg-purple-200 transition-colors"
                >
                  追加
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 関連リンク */}
        <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-5 flex flex-col h-full min-h-[16rem]">
          <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
            <LinkIcon className="w-4 h-4 mr-2 text-purple-500" />
            関連リンク ({links.length})
          </h4>
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
            {links.map(link => (
              <div
                key={link.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg group hover:border-purple-300 hover:shadow-md transition-all shadow-sm"
              >
                <div className="flex items-center space-x-3 overflow-hidden flex-1">
                  <div className="p-2 rounded-md flex-shrink-0 bg-blue-50 text-blue-600">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <div className="truncate flex-1">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-gray-800 hover:text-purple-600 hover:underline truncate block"
                    >
                      {link.title}
                    </a>
                    <p className="text-xs font-medium text-gray-500 truncate">{link.url}</p>
                  </div>
                </div>
                {isEditing ? (
                  <button
                    onClick={() => deleteLink(link.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors flex-shrink-0 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-md transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 ml-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}
            {links.length === 0 && (
              <div className="h-full flex items-center justify-center py-6">
                <p className="text-xs font-semibold text-gray-400">リンクがありません</p>
              </div>
            )}
          </div>
          {isEditing && (
            <div className="flex flex-col space-y-2 mt-auto bg-white p-3 rounded-lg border-2 border-purple-100 transition-all">
              <input
                type="text"
                className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-sm outline-none text-gray-800 placeholder-gray-400 focus:border-purple-300 focus:bg-white"
                placeholder="表示名（省略時はURLを表示）"
                value={newLinkTitle}
                onChange={(e) => setNewLinkTitle(e.target.value)}
              />
              <input
                type="url"
                className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-sm outline-none text-gray-800 placeholder-gray-400 focus:border-purple-300 focus:bg-white"
                placeholder="URL (https://...)"
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addLink(); }}
              />
              <button
                onClick={addLink}
                disabled={!newLinkUrl.trim()}
                className="w-full mt-1 py-2 bg-purple-100 text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-xs font-bold hover:bg-purple-200 transition-colors flex items-center justify-center"
              >
                <Plus className="w-3 h-3 mr-1" /> 追加
              </button>
            </div>
          )}
        </div>
      </div>

      {/* メモ・特記事項（画面下部に移動） */}
      <div className="mt-8">
        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
          <FileText className="w-4 h-4 mr-2 text-purple-500" />
          メモ・特記事項
        </h4>
        {isEditing ? (
          <textarea
            className="w-full h-32 p-5 bg-white border-2 border-purple-200 rounded-xl text-gray-800 text-sm focus:outline-none focus:ring-4 focus:ring-purple-50 transition-all resize-none leading-relaxed shadow-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="このフェーズに関するメモや申し送り事項を入力..."
          />
        ) : (
          <div className="w-full min-h-[8rem] p-5 bg-gray-50/80 border border-gray-100 rounded-xl text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
            {notes || <span className="text-gray-400 font-medium">メモはありません。</span>}
          </div>
        )}
      </div>

      {/* 次フェーズ確認ダイアログ */}
      {showConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-96 animate-in zoom-in-95 duration-200">
            <div className="flex items-center mb-4 text-purple-600">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center mr-3">
                <ChevronRight className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-gray-900">フェーズの進行</h4>
            </div>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              登録されているタスクが全て完了しています。<br /><br />
              ステータスを次のフェーズ「<span className="font-bold text-purple-700">{nextPhaseLabel || ''}</span>」へ進めてよろしいですか？
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-5 py-2 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => { setShowConfirm(false); onAdvancePhase(); }}
                className="px-5 py-2 rounded-full text-sm font-bold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm flex items-center"
              >
                はい、進める
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- ランク分布 円グラフ（ドーナツ） ---
const RankPieChart = ({ rankCounts }) => {
  const data = [
    { label: 'A', count: rankCounts.A, bar: 'bg-emerald-500', text: 'text-emerald-700', soft: 'bg-emerald-50' },
    { label: 'B', count: rankCounts.B, bar: 'bg-amber-500',   text: 'text-amber-700',   soft: 'bg-amber-50' },
    { label: 'C', count: rankCounts.C, bar: 'bg-gray-400',    text: 'text-gray-600',    soft: 'bg-gray-50' },
  ];
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div>
      {/* スタックド水平バー */}
      <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-gray-100">
        {total === 0 ? null : data.map(d => {
          const pct = (d.count / total) * 100;
          if (pct === 0) return null;
          return <div key={d.label} className={`${d.bar} h-full transition-all duration-700`} style={{ width: `${pct}%` }} />;
        })}
      </div>

      {/* ランク別カード（アルファベットを大きく＆色付き） */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        {data.map(d => {
          const pct = total === 0 ? 0 : Math.round((d.count / total) * 100);
          return (
            <div key={d.label} className="rounded-lg px-2 py-2 bg-gray-50/60">
              <div className="flex items-baseline justify-between">
                <span className={`text-2xl font-black leading-none ${d.text}`}>{d.label}</span>
                <span className="text-[10px] font-bold text-gray-400 tabular-nums">{pct}%</span>
              </div>
              <p className="text-base font-extrabold text-gray-900 tabular-nums leading-tight mt-1">
                {d.count}<span className="text-[10px] font-bold text-gray-400 ml-0.5">件</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- ダッシュボード ---
const Dashboard = ({ projects, onSelectProject, onAddProject, canViewProfit = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const filterMenuRef = React.useRef(null);
  const [filterConfig, setFilterConfig] = useState({ patterns: [], statuses: [], pics: [] });

  // 絞り込みポップの外側クリックで閉じる
  useEffect(() => {
    if (!isFilterMenuOpen) return;
    const handleClickOutside = (e) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target)) {
        setIsFilterMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterMenuOpen]);
  const [lostInfoModal, setLostInfoModal] = useState(null); // 表示中の失注情報案件
  const [newProject, setNewProject] = useState({
    name: '',
    companyName: '',
    salesPattern: 'パターン1（完全卸し）',
    expectedRevenue: '',
  });

  const activeProjects = projects.filter(p => !p.isLost);
  const alerts = activeProjects.flatMap(p =>
    p.logs.filter(l => l.type === 'alert').map(l => ({ ...l, projectName: p.name, projectId: p.id }))
  );

  const totalRevenue = activeProjects.reduce((sum, p) => sum + (p.financial?.expectedRevenue || 0), 0);
  const revenueJPY = formatJPYShort(totalRevenue);
  const rankCounts = {
    A: activeProjects.filter(p => p.rank === 'A').length,
    B: activeProjects.filter(p => p.rank === 'B').length,
    C: activeProjects.filter(p => p.rank === 'C').length,
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newProject.name.trim() || !newProject.companyName.trim()) return;
    onAddProject({ ...newProject, expectedRevenue: Number(newProject.expectedRevenue) || 0 });
    setIsModalOpen(false);
    setNewProject({ name: '', companyName: '', salesPattern: 'パターン1（完全卸し）', expectedRevenue: '' });
  };

  const allPics = useMemo(() => {
    const pics = projects.map(p => p.picSetup).filter(Boolean);
    return [...new Set(pics)];
  }, [projects]);

  const toggleFilter = (category, value) => {
    setFilterConfig(prev => {
      const current = prev[category];
      return current.includes(value)
        ? { ...prev, [category]: current.filter(v => v !== value) }
        : { ...prev, [category]: [...current, value] };
    });
  };

  const clearFilters = () => setFilterConfig({ patterns: [], statuses: [], pics: [] });

  const filteredProjects = useMemo(() => {
    let result = [...projects];
    if (searchTerm) {
      result = result.filter(p =>
        p.name.includes(searchTerm) || p.endUser.companyName.includes(searchTerm)
      );
    }
    if (filterConfig.patterns.length > 0) result = result.filter(p => filterConfig.patterns.includes(p.salesPattern));
    if (filterConfig.statuses.length > 0) result = result.filter(p => filterConfig.statuses.includes(p.status));
    if (filterConfig.pics.length > 0) result = result.filter(p => filterConfig.pics.includes(p.picSetup));
    result.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    return result;
  }, [projects, searchTerm, filterConfig]);

  const activeFilterCount = filterConfig.patterns.length + filterConfig.statuses.length + filterConfig.pics.length;

  // パターン別売上計算
  const patternRevenue = useMemo(() => {
    const p1 = activeProjects.filter(p => p.salesPattern?.includes('パターン1')).reduce((s, p) => s + (p.financial?.expectedRevenue || 0), 0);
    const p2 = activeProjects.filter(p => p.salesPattern?.includes('パターン2')).reduce((s, p) => s + (p.financial?.expectedRevenue || 0), 0);
    const p3 = activeProjects.filter(p => p.salesPattern?.includes('パターン3')).reduce((s, p) => s + (p.financial?.expectedRevenue || 0), 0);
    const max = Math.max(p1, p2, p3, 1);
    return [
      { label: 'パターン1 (卸)', value: p1, color: 'bg-sky-500', pct: (p1 / max) * 100 },
      { label: 'パターン2 (分離)', value: p2, color: 'bg-yellow-500', pct: (p2 / max) * 100 },
      { label: 'パターン3 (紹介)', value: p3, color: 'bg-green-500', pct: (p3 / max) * 100 },
    ];
  }, [activeProjects]);

  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][today.getDay()];
  const wonProjects = activeProjects.filter(p => ['販売契約締結', '施工・納品', '一次保守'].includes(p.status));
  const wonRevenue = wonProjects.reduce((s, p) => s + (p.financial?.expectedRevenue || 0), 0);
  const cumulativeProfit = wonProjects.reduce((s, p) => s + ((p.financial?.expectedRevenue || 0) - (p.financial?.wholesalePriceSetup || 0)), 0);

  return (
    <div className="space-y-8 relative">
      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 hover:border-gray-200 transition-colors">
          <p className="text-sm font-bold text-gray-700">進行中案件</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-2 tabular-nums">
            {activeProjects.length}<span className="text-sm font-bold text-gray-400 ml-1">件</span>
          </p>
          <p className="text-xs text-gray-500 font-semibold mt-1.5">受注済み {wonProjects.length} 件</p>
        </Card>

        <Card className="p-4 hover:border-gray-200 transition-colors">
          <p className="text-sm font-bold text-gray-700">想定売上合計</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-2 tabular-nums">{revenueJPY}</p>
          <p className="text-xs text-gray-500 font-semibold mt-1.5">全パイプライン</p>
        </Card>

        <Card className="p-4 hover:border-gray-200 transition-colors">
          <p className="text-sm font-bold text-gray-700">売上実績</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-2 tabular-nums">{formatJPYShort(wonRevenue)}</p>
          <p className="text-xs text-gray-500 font-semibold mt-1.5">受注 {wonProjects.length} 件</p>
          {canViewProfit && (
            <p className="text-xs font-bold text-emerald-700 mt-2 pt-2 border-t border-emerald-100 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              累積利益 <span className="ml-auto tabular-nums">{formatJPYShort(cumulativeProfit)}</span>
            </p>
          )}
        </Card>

        <Card className="p-4 hover:border-gray-200 transition-colors">
          <p className="text-sm font-bold text-gray-700 mb-2">案件ランク分布</p>
          <RankPieChart rankCounts={rankCounts} />
        </Card>
      </div>

      <div className="space-y-6">
        {/* 案件一覧 */}
        <div className="space-y-6">
          <Card>
            <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap gap-3 justify-between items-center bg-white relative z-20">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                案件一覧
                <span className="text-xs font-semibold text-gray-400 tabular-nums">{filteredProjects.length}件</span>
              </h2>
              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="案件・企業名で検索..."
                    className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all w-56"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="relative" ref={filterMenuRef}>
                  <button
                    onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors flex items-center shadow-sm"
                  >
                    <Filter className="w-4 h-4 mr-2 text-gray-500" />
                    絞り込み
                    {activeFilterCount > 0 && (
                      <span className="ml-2 bg-purple-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                  {isFilterMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 max-h-[70vh] overflow-y-auto">
                      <div className="px-4 pb-2 mb-2 border-b border-gray-50 flex justify-between items-center sticky top-0 bg-white z-10 pt-1">
                        <span className="text-xs font-bold text-gray-400">絞り込み条件</span>
                        <button onClick={clearFilters} className="text-xs text-purple-600 hover:underline">クリア</button>
                      </div>
                      <div className="px-4 py-2">
                        <span className="text-xs font-bold text-gray-800 mb-2 block">販売スキーム</span>
                        {['パターン1（完全卸し）', 'パターン2（分離）', 'パターン3（完全紹介）'].map(pattern => (
                          <label
                            key={pattern}
                            onClick={() => toggleFilter('patterns', pattern)}
                            className="flex items-center space-x-2 py-1.5 cursor-pointer group select-none"
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${filterConfig.patterns.includes(pattern) ? 'bg-purple-600 border-purple-600' : 'border-gray-300 group-hover:border-purple-400'}`}>
                              {filterConfig.patterns.includes(pattern) && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-sm text-gray-600 group-hover:text-gray-900">{pattern}</span>
                          </label>
                        ))}
                      </div>
                      <div className="px-4 py-2 border-t border-gray-50">
                        <span className="text-xs font-bold text-gray-800 mb-2 block">ステータス</span>
                        {PHASES.map(phase => (
                          <label
                            key={phase}
                            onClick={() => toggleFilter('statuses', phase)}
                            className="flex items-center space-x-2 py-1.5 cursor-pointer group select-none"
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${filterConfig.statuses.includes(phase) ? 'bg-purple-600 border-purple-600' : 'border-gray-300 group-hover:border-purple-400'}`}>
                              {filterConfig.statuses.includes(phase) && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-sm text-gray-600 group-hover:text-gray-900">{phase}</span>
                          </label>
                        ))}
                      </div>
                      <div className="px-4 py-2 border-t border-gray-50">
                        <span className="text-xs font-bold text-gray-800 mb-2 block">セットアップ担当者</span>
                        {allPics.length === 0 && (
                          <span className="text-xs text-gray-400 italic">担当者未設定の案件のみです</span>
                        )}
                        {allPics.map(pic => (
                          <label
                            key={pic}
                            onClick={() => toggleFilter('pics', pic)}
                            className="flex items-center space-x-2 py-1.5 cursor-pointer group select-none"
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${filterConfig.pics.includes(pic) ? 'bg-purple-600 border-purple-600' : 'border-gray-300 group-hover:border-purple-400'}`}>
                              {filterConfig.pics.includes(pic) && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-sm text-gray-600 group-hover:text-gray-900">{pic}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-bold flex items-center shadow-md hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> 新規案件
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 text-gray-400">
                  <tr>
                    <th className="px-5 py-3 font-semibold text-xs">案件名 / エンドユーザー</th>
                    <th className="px-5 py-3 font-semibold text-xs">販売スキーム</th>
                    <th className="px-5 py-3 font-semibold text-xs">ステータス</th>
                    <th className="px-5 py-3 font-semibold text-xs">想定金額</th>
                    <th className="px-5 py-3 font-semibold text-xs">ランク</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredProjects.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400 font-medium">
                        条件に一致する案件がありません
                      </td>
                    </tr>
                  )}
                  {filteredProjects.map(project => {
                    const phaseIdx = PHASES.indexOf(project.status);
                    const progressPct = ((phaseIdx + 1) / PHASES.length) * 100;
                    return (
                      <tr
                        key={project.id}
                        className={`group cursor-pointer transition-colors ${
                          project.isLost ? 'opacity-60 hover:opacity-80' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => onSelectProject(project.id)}
                      >
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-gray-900 leading-tight">
                            {project.name}
                            {project.isLost && <span className="ml-2 text-[10px] font-bold text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">LOST</span>}
                          </div>
                          <div className="text-gray-500 text-xs mt-1">
                            {project.endUser.companyName}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {(() => {
                            const p = project.salesPattern || '';
                            const cfg = p.includes('パターン1') ? { dot: 'bg-sky-500',    text: 'text-sky-700',    short: 'パターン①', sub: '完全卸し' }
                                      : p.includes('パターン2') ? { dot: 'bg-yellow-500', text: 'text-yellow-700', short: 'パターン②', sub: '分離' }
                                      : p.includes('パターン3') ? { dot: 'bg-green-500',  text: 'text-green-700',  short: 'パターン③', sub: '完全紹介' }
                                      : { dot: 'bg-gray-300', text: 'text-gray-500', short: '—', sub: '' };
                            return (
                              <div className="flex items-center gap-2">
                                <span className={`inline-block w-2 h-2 rounded-full ${cfg.dot}`} />
                                <div>
                                  <div className={`text-xs font-bold ${cfg.text}`}>{cfg.short}</div>
                                  {cfg.sub && <div className="text-[10px] text-gray-400 font-semibold">{cfg.sub}</div>}
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-5 py-3.5 min-w-[200px]">
                          <div className={`text-xs font-bold mb-1.5 ${project.isLost ? 'text-gray-500' : 'text-gray-900'}`}>
                            {project.status} <span className="text-gray-400 font-semibold tabular-nums ml-1">{phaseIdx + 1}/{PHASES.length}</span>
                          </div>
                          <MiniArrowDiagram currentPhase={project.status} />
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-gray-700 tabular-nums">
                          {formatJPY(project.financial.expectedRevenue || 0)}
                        </td>
                        <td className="px-5 py-3.5">
                          <RankBadge rank={project.rank} />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {project.isLost ? (
                            <button
                              onClick={e => { e.stopPropagation(); setLostInfoModal(project); }}
                              className="px-2.5 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50 rounded-full"
                            >
                              失注情報
                            </button>
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-600 inline" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

      </div>

      {/* 失注情報モーダル */}
      {lostInfoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm" onClick={() => setLostInfoModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-red-500 uppercase tracking-wider">LOST</p>
                  <h4 className="text-base font-bold text-gray-900 leading-tight">{lostInfoModal.name}</h4>
                </div>
              </div>
              <button onClick={() => setLostInfoModal(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* 本文 */}
            <div className="px-6 py-5 space-y-5">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> 失注日
                </p>
                <p className="text-sm font-semibold text-gray-700">
                  {lostInfoModal.lostInfo?.date || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">失注理由</p>
                {lostInfoModal.lostInfo?.reason ? (
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                    {lostInfoModal.lostInfo.reason}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 italic">未記入</p>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">競合情報</p>
                {lostInfoModal.lostInfo?.competitor ? (
                  <p className="text-sm font-semibold text-gray-800 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                    {lostInfoModal.lostInfo.competitor}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 italic">未記入</p>
                )}
              </div>
            </div>
            <div className="px-6 pb-5 flex justify-end">
              <button
                onClick={() => { setLostInfoModal(null); onSelectProject(lostInfoModal.id); }}
                className="px-5 py-2 text-sm font-bold text-purple-600 bg-purple-50 border border-purple-100 rounded-full hover:bg-purple-100 transition-colors"
              >
                案件詳細を開く
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新規案件モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">新規案件の追加</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">案件名 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none"
                  placeholder="例：〇〇施設 介護システム導入"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">エンドユーザー（企業名/施設名） <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={newProject.companyName}
                  onChange={(e) => setNewProject({ ...newProject, companyName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none"
                  placeholder="例：社会福祉法人 〇〇会"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">販売スキーム</label>
                  <select
                    value={newProject.salesPattern}
                    onChange={(e) => setNewProject({ ...newProject, salesPattern: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="パターン1（完全卸し）">パターン①（完全卸し）</option>
                    <option value="パターン2（分離）">パターン②（分離）</option>
                    <option value="パターン3（完全紹介）">パターン③（完全紹介）</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">想定全体売上（定価）</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">¥</span>
                    <input
                      type="number"
                      value={newProject.expectedRevenue}
                      onChange={(e) => setNewProject({ ...newProject, expectedRevenue: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
              <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-full">
                  キャンセル
                </button>
                <button type="submit" className="px-6 py-2.5 text-sm font-bold bg-purple-600 text-white hover:bg-purple-700 rounded-full shadow-md">
                  追加する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- 案件詳細 ---
const ProjectDetail = ({ project, onBack, onUpdateProject }) => {
  const [selectedPhase, setSelectedPhase] = useState(project.status);
  const [infoTab, setInfoTab] = useState('endUser'); // 'endUser' | 'financial' | 'project' | 'log'
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editInfo, setEditInfo] = useState({ ...project });
  const [newLog, setNewLog] = useState({ content: '', nextAction: '', nextDate: '' });
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [showLostConfirm, setShowLostConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [lostForm, setLostForm] = useState({ reason: '', competitor: '' });
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showMarginBranchModal, setShowMarginBranchModal] = useState(false);
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

  const handleAdvancePhase = () => {
    // マージン支払サブフロー中
    if (marginFlow.active) {
      if (marginFlow.sub < marginSteps.length - 1) {
        onUpdateProject({
          ...project,
          marginFlow: { active: true, sub: marginFlow.sub + 1 },
          updatedAt: new Date().toISOString(),
        });
      } else {
        // サブフロー完了 → 「一次保守」に合流
        onUpdateProject({
          ...project,
          status: MARGIN_MERGE_PHASE,
          marginFlow: { active: false, sub: 0, completed: true },
          updatedAt: new Date().toISOString(),
        });
      }
      return;
    }

    // 「施工・納品」かつ全パターン → マージン分岐選択モーダル
    if (project.status === MARGIN_BRANCH_PHASE && isMarginBranchablePattern(project.salesPattern) && !marginFlow.completed) {
      setShowMarginBranchModal(true);
      return;
    }

    // 介援隊サブフロー中
    if (kaientaiFlow.active) {
      if (kaientaiFlow.sub < KAIENTAI_SUB.length - 1) {
        onUpdateProject({
          ...project,
          kaientaiFlow: { active: true, sub: kaientaiFlow.sub + 1 },
          updatedAt: new Date().toISOString(),
        });
      } else {
        // サブフロー完了 → 「施工・納品」に合流
        onUpdateProject({
          ...project,
          status: MERGE_PHASE,
          kaientaiFlow: { active: false, sub: 0, completed: true },
          updatedAt: new Date().toISOString(),
        });
      }
      return;
    }

    // 「提案書／見積書提出」かつパターン①/② → 分岐選択モーダル
    if (project.status === BRANCH_PHASE && isBranchablePattern(project.salesPattern)) {
      setShowBranchModal(true);
      return;
    }

    // 通常進行
    const currentIndex = PHASES.indexOf(project.status);
    if (currentIndex < PHASES.length - 1) {
      const nextPhase = PHASES[currentIndex + 1];
      onUpdateProject({ ...project, status: nextPhase, updatedAt: new Date().toISOString() });
    }
  };

  const handleSelectMarginBranch = (branch) => {
    setShowMarginBranchModal(false);
    if (branch === 'normal') {
      // 通常 → 一次保守
      onUpdateProject({ ...project, status: MARGIN_MERGE_PHASE, updatedAt: new Date().toISOString() });
    } else if (branch === 'margin') {
      onUpdateProject({
        ...project,
        marginFlow: { active: true, sub: 0 },
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleSelectBranch = (branch) => {
    setShowBranchModal(false);
    if (branch === 'setup') {
      // セットアップ → 通常通り「販売契約締結」へ
      onUpdateProject({ ...project, status: '販売契約締結', updatedAt: new Date().toISOString() });
    } else if (branch === 'kaientai') {
      // 介援隊サブフロー開始（statusは BRANCH_PHASE のままサブフラグで管理）
      onUpdateProject({
        ...project,
        kaientaiFlow: { active: true, sub: 0 },
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleSaveInfo = () => {
    onUpdateProject({ ...editInfo, updatedAt: new Date().toISOString() });
    setIsEditingInfo(false);
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
    <div className="space-y-8">
      {/* ヘッダー */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center text-sm text-gray-500 hover:text-purple-600 transition-colors mb-4 font-semibold"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Dashboard に戻る
        </button>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge color={patternColor}>{project.salesPattern}</Badge>
              {isLost && <Badge color="red">LOST</Badge>}
              <span className="text-xs font-mono text-gray-400">{project.id}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{project.name}</h1>
            {project.summary && <p className="text-sm text-gray-500 mt-1.5">{project.summary}</p>}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => { setEditInfo({ ...project }); setIsEditingInfo(true); }}
              className="px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-full hover:bg-gray-50 shadow-sm flex items-center"
            >
              <Edit className="w-4 h-4 mr-1.5" /> 編集
            </button>
            {isLost ? (
              <button
                onClick={() => setShowRestoreConfirm(true)}
                className="px-4 py-2 text-sm font-bold text-purple-600 bg-purple-50 border border-purple-100 rounded-full hover:bg-purple-100 shadow-sm"
              >
                案件を復活させる
              </button>
            ) : (
              <button
                onClick={() => setShowLostConfirm(true)}
                className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-full hover:bg-red-100 shadow-sm"
              >
                失注として記録
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 情報タブ（クリックで詳細展開） */}
      <Card className="p-0 overflow-hidden">
        {/* タブヘッダー */}
        <div className="flex border-b border-gray-100 bg-gray-50/50">
          {[
            { key: 'endUser',   label: 'エンドユーザー', icon: Building,       color: 'text-purple-600 border-purple-500' },
            { key: 'financial', label: '財務情報',       icon: BarChart3,      color: 'text-sky-600 border-sky-500' },
            { key: 'project',   label: '案件情報',       icon: FileText,       color: 'text-emerald-600 border-emerald-500' },
            { key: 'log',       label: '活動ログ',       icon: MessageSquare,  color: 'text-orange-600 border-orange-500', badge: project.logs.length },
          ].map(tab => {
            const TabIcon = tab.icon;
            const active = infoTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setInfoTab(tab.key)}
                className={`flex-1 px-4 py-3.5 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
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
            );
          })}
        </div>

        {/* タブ内容 */}
        <div className="p-5">
          {infoTab === 'endUser' && (
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              {[
                ['企業・施設名', project.endUser.companyName, true],
                ['担当部署', project.endUser.department],
                ['連絡先', project.endUser.contact],
                ['販売店', project.endUser.retailerName],
              ].map(([label, value, bold]) => (
                <div key={label} className="grid grid-cols-[100px_1fr] gap-2 items-baseline">
                  <dt className="text-xs text-gray-400 font-semibold">{label}</dt>
                  <dd className={`text-sm leading-snug ${bold ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>{value || <span className="text-gray-300 font-medium">—</span>}</dd>
                </div>
              ))}
            </dl>
          )}

          {infoTab === 'financial' && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">想定全体売上</p>
                <p className="text-3xl font-extrabold text-gray-900 tabular-nums leading-tight mt-1">{formatJPYShort(project.financial.expectedRevenue || 0)}</p>
              </div>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                {project.financial.wholesalePriceSetup && (
                  <div className="grid grid-cols-[100px_1fr] gap-2 items-baseline">
                    <dt className="text-xs text-gray-400 font-semibold">卸値</dt>
                    <dd className="text-sm font-semibold text-gray-700 tabular-nums">{formatJPYShort(project.financial.wholesalePriceSetup)}</dd>
                  </div>
                )}
                {project.financial.referralFeeRate && (
                  <div className="grid grid-cols-[100px_1fr] gap-2 items-baseline">
                    <dt className="text-xs text-gray-400 font-semibold">紹介料</dt>
                    <dd className="text-sm font-semibold text-gray-700 tabular-nums">{project.financial.referralFeeRate}% / {formatJPYShort(project.financial.referralFeeAmount || 0)}</dd>
                  </div>
                )}
                <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                  <dt className="text-xs text-gray-400 font-semibold">案件ランク</dt>
                  <dd><RankBadge rank={project.rank} /></dd>
                </div>
              </dl>
            </div>
          )}

          {infoTab === 'project' && (
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <dt className="text-xs text-gray-400 font-semibold pt-0.5">担当者</dt>
                <dd className="text-sm">
                  <span className="font-bold text-gray-900">{project.picSetup || <span className="text-gray-300 font-medium">—</span>}</span>
                  {project.picSetupContact && (
                    <span className="block mt-1 text-xs font-semibold text-purple-700">
                      <MessageSquare className="w-3 h-3 inline mr-1" />{project.picSetupContact}
                    </span>
                  )}
                </dd>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2 items-baseline">
                <dt className="text-xs text-gray-400 font-semibold">開始日</dt>
                <dd className="text-sm font-semibold text-gray-700 tabular-nums">{project.startDate || <span className="text-gray-300 font-medium">—</span>}</dd>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2 items-baseline">
                <dt className="text-xs text-gray-400 font-semibold">クローズ予定</dt>
                <dd className="text-sm font-semibold text-gray-700 tabular-nums">{project.expectedCloseDate || <span className="text-gray-300 font-medium">—</span>}</dd>
              </div>
              {project.endUser.needsAndIssues && (
                <div className="grid grid-cols-[100px_1fr] gap-2 md:col-span-2">
                  <dt className="text-xs text-gray-400 font-semibold pt-0.5">ニーズ・課題</dt>
                  <dd className="text-sm font-semibold text-gray-700 leading-relaxed">{project.endUser.needsAndIssues}</dd>
                </div>
              )}
            </dl>
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
      <Card className="p-6">
        <h3 className="text-base font-bold text-gray-900 mb-2">フェーズ進捗</h3>
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
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">担当部署</label>
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
                onClick={() => handleSelectMarginBranch('normal')}
                className="text-left p-5 rounded-2xl border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50/40 transition-all group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider text-purple-600 bg-purple-50 border border-purple-200">通常</span>
                </div>
                <p className="text-sm font-bold text-gray-900">そのまま「一次保守」へ</p>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">マージン処理を行わずに次フェーズへ進みます。</p>
              </button>
              <button
                onClick={() => handleSelectMarginBranch('margin')}
                className="text-left p-5 rounded-2xl border-2 border-gray-200 hover:border-orange-400 hover:bg-orange-50/40 transition-all group"
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
            <div className="flex justify-end mt-5 pt-4 border-t border-gray-100">
              <button onClick={() => setShowMarginBranchModal(false)} className="px-5 py-2 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-100">キャンセル</button>
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
                onClick={() => handleSelectBranch('setup')}
                className="text-left p-5 rounded-2xl border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50/40 transition-all group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider text-orange-600 bg-orange-50 border border-orange-200">セットアップ</span>
                </div>
                <p className="text-sm font-bold text-gray-900">通常フロー</p>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">そのまま「販売契約締結 → 施工・納品 → 一次保守」へ進みます。</p>
              </button>
              <button
                onClick={() => handleSelectBranch('kaientai')}
                className="text-left p-5 rounded-2xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50/40 transition-all group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider text-blue-600 bg-blue-50 border border-blue-200">介援隊</span>
                </div>
                <p className="text-sm font-bold text-gray-900">サブフロー</p>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">「介援隊：見積書提出 → 介援隊：納品」を経由して「施工・納品」に合流します。</p>
              </button>
            </div>
            <div className="flex justify-end mt-5 pt-4 border-t border-gray-100">
              <button onClick={() => setShowBranchModal(false)} className="px-5 py-2 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-100">キャンセル</button>
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
    </div>
  );
};

// --- ケアマックス KPI 詳細ビュー ---
const KpiDetailView = ({ kpi, colorMap, projects, onBack, onSelectProject }) => {
  const c = colorMap[kpi.color];
  const matched = projects.filter(kpi.filter);
  const pct = Math.min(100, (kpi.actual / kpi.target) * 100);
  const remaining = Math.max(0, kpi.target - kpi.actual);

  // フェーズ別件数
  const phaseBreakdown = PHASES.map(ph => ({
    phase: ph,
    count: matched.filter(p => p.status === ph).length,
  })).filter(r => r.count > 0);
  const maxPhase = Math.max(...phaseBreakdown.map(r => r.count), 1);

  // 担当者別件数
  const picMap = {};
  matched.forEach(p => {
    const k = p.picSetup || '未割当';
    picMap[k] = (picMap[k] || 0) + 1;
  });
  const picStats = Object.entries(picMap).sort((a, b) => b[1] - a[1]);

  // 想定売上合計
  const totalRevenue = matched.reduce((s, p) => s + (p.financial?.expectedRevenue || 0), 0);

  const Icon = kpi.icon;
  const size = 140, stroke = 14, r = (size - stroke) / 2, circ = 2 * Math.PI * r;

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div>
        <button onClick={onBack} className="flex items-center text-sm font-bold text-gray-500 hover:text-purple-600 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> KPI ダッシュボードに戻る
        </button>
        <div className={`relative overflow-hidden rounded-3xl ${c.heroBg} border-t-4 ${c.border} p-7 shadow-sm`}>
          <div className="flex flex-wrap items-center gap-6">
            <div className={`p-4 bg-gradient-to-br ${c.iconBg} rounded-2xl shadow-sm`}>
              <Icon className={`w-8 h-8 ${c.ring}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-400 tracking-widest uppercase">{kpi.isKgi ? 'KGI' : 'KPI'} 詳細</p>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight mt-1">{kpi.label}</h1>
              <p className="text-sm text-gray-500 mt-2">{kpi.description}</p>
            </div>
            <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
              <svg width={size} height={size} className="-rotate-90">
                <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
                <circle
                  cx={size/2} cy={size/2} r={r}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={stroke}
                  strokeDasharray={`${(pct/100) * circ} ${circ}`}
                  strokeLinecap="round"
                  className={`${c.ring} transition-all duration-700`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-extrabold ${c.text} leading-none tabular-nums`}>{pct.toFixed(0)}<span className="text-base ml-0.5">%</span></span>
                <span className="text-[10px] font-bold text-gray-400 mt-1 tracking-wider">達成率</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* サマリ KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <Card className="p-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">実績</p>
          <p className={`text-3xl font-extrabold mt-3 tabular-nums ${c.text}`}>{kpi.actual.toLocaleString()}<span className="text-base font-bold text-gray-400 ml-1">件</span></p>
        </Card>
        <Card className="p-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">目標</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-3 tabular-nums">{kpi.target.toLocaleString()}<span className="text-base font-bold text-gray-400 ml-1">件</span></p>
        </Card>
        <Card className="p-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">残り</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-3 tabular-nums">{remaining.toLocaleString()}<span className="text-base font-bold text-gray-400 ml-1">件</span></p>
        </Card>
        <Card className="p-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">想定売上合計</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-3 tabular-nums">{formatJPYShort(totalRevenue)}</p>
        </Card>
      </div>

      {/* フェーズ別 + 担当者別 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
            <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full" />
            フェーズ別 内訳
          </h2>
          {phaseBreakdown.length === 0 ? (
            <p className="text-sm text-gray-400">該当データなし</p>
          ) : (
            <div className="space-y-2.5">
              {phaseBreakdown.map(({ phase, count }) => (
                <div key={phase} className="flex items-center text-sm">
                  <div className="w-36 font-semibold text-gray-700 truncate">{phase}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5 mx-3 overflow-hidden">
                    <div className={`bg-gradient-to-r ${c.bar} h-full rounded-full`} style={{ width: `${(count / maxPhase) * 100}%` }} />
                  </div>
                  <div className="w-12 text-right font-bold text-gray-900 tabular-nums">{count}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-6">
          <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
            <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full" />
            担当者別 内訳
          </h2>
          {picStats.length === 0 ? (
            <p className="text-sm text-gray-400">該当データなし</p>
          ) : (
            <div className="space-y-2">
              {picStats.map(([name, count]) => (
                <div key={name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full ${c.bg} ${c.text} flex items-center justify-center text-xs font-extrabold`}>
                      {name.charAt(0)}
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 tabular-nums">{count} 件</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 該当案件一覧 */}
      <Card>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full" />
            該当案件一覧
            <span className="ml-2 text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{matched.length}</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-semibold">案件名 / エンドユーザー</th>
                <th className="px-6 py-3 font-semibold">ステータス</th>
                <th className="px-6 py-3 font-semibold">想定金額</th>
                <th className="px-6 py-3 font-semibold">ランク</th>
                <th className="px-6 py-3 font-semibold">担当</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {matched.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400 font-medium">該当案件がありません</td></tr>
              )}
              {matched.map(p => (
                <tr key={p.id} className={`group cursor-pointer transition-colors ${p.isLost ? 'bg-gray-50/40 opacity-75' : 'hover:bg-purple-50/50'}`} onClick={() => onSelectProject && onSelectProject(p.id)}>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{p.name}{p.isLost && <span className="ml-2 text-xs font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded">LOST</span>}</div>
                    <div className="text-gray-500 text-xs mt-1 flex items-center"><Building className="w-3.5 h-3.5 mr-1.5" />{p.endUser?.companyName}</div>
                  </td>
                  <td className="px-6 py-4"><span className="text-xs font-bold text-purple-700">{p.status}</span></td>
                  <td className="px-6 py-4 font-medium text-gray-700 tabular-nums">{formatJPY(p.financial?.expectedRevenue || 0)}</td>
                  <td className="px-6 py-4"><RankBadge rank={p.rank} /></td>
                  <td className="px-6 py-4 text-gray-600 text-xs font-semibold">{p.picSetup || '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <ChevronRight className="w-5 h-5 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// --- ケアマックス KPI ビュー（企画部・営業部のみ閲覧可） ---
const KpiView = ({ projects, onSelectProject }) => {
  const [selectedKpi, setSelectedKpi] = useState(null);
  const active = projects.filter(p => !p.isLost);
  const lost = projects.filter(p => p.isLost);

  const handleExportCsv = () => {
    const esc = (v) => {
      if (v === null || v === undefined) return '';
      const s = String(v).replace(/"/g, '""').replace(/\r?\n/g, ' ');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const headers = [
      '案件ID', '案件名', 'ステータス', '状態', 'ランク', '販売パターン',
      '開始日', '想定クローズ日', '最終更新',
      'エンドユーザー', '販売店', '部署', '連絡先', '住所', 'ニーズ・課題',
      '想定売上', 'セットアップ卸価格', '小売価格', '獲得利益額',
      'セットアップ担当', '概要',
      '失注日', '失注理由', '競合情報',
    ];
    const rows = projects.map(p => [
      p.id, p.name, p.status, p.isLost ? '失注' : '進行中', p.rank, p.salesPattern,
      p.startDate, p.expectedCloseDate, p.updatedAt,
      p.endUser?.companyName, p.endUser?.retailerName, p.endUser?.department,
      p.endUser?.contact, p.endUser?.address, p.endUser?.needsAndIssues,
      p.financial?.expectedRevenue ?? '', p.financial?.wholesalePriceSetup ?? '', p.financial?.retailPrice ?? '',
      (p.financial?.expectedRevenue || 0) - (p.financial?.wholesalePriceSetup || 0),
      p.picSetup, p.summary,
      p.lostInfo?.date ?? '', p.lostInfo?.reason ?? '', p.lostInfo?.competitor ?? '',
    ].map(esc).join(','));
    const csv = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `caremax_projects_${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const totalRevenue = active.reduce((s, p) => s + (p.financial?.expectedRevenue || 0), 0);
  const wonPhases = ['販売契約締結', '施工・納品', '一次保守'];
  const won = active.filter(p => wonPhases.includes(p.status));
  const wonRevenue = won.reduce((s, p) => s + (p.financial?.expectedRevenue || 0), 0);
  const winRate = (active.length + lost.length) > 0
    ? ((won.length / (won.length + lost.length)) * 100 || 0).toFixed(1)
    : '0.0';
  // 累積利益額 = 受注済案件の (想定売上 − セットアップ卸価格)
  const cumulativeProfit = won.reduce((s, p) => {
    const rev = p.financial?.expectedRevenue || 0;
    const cost = p.financial?.wholesalePriceSetup || 0;
    return s + (rev - cost);
  }, 0);
  const profitMargin = wonRevenue > 0 ? ((cumulativeProfit / wonRevenue) * 100).toFixed(1) : '0.0';

  const phaseCounts = PHASES.map(ph => ({
    phase: ph,
    count: active.filter(p => p.status === ph).length,
  }));
  const maxPhaseCount = Math.max(...phaseCounts.map(p => p.count), 1);

  const rankCounts = {
    A: active.filter(p => p.rank === 'A').length,
    B: active.filter(p => p.rank === 'B').length,
    C: active.filter(p => p.rank === 'C').length,
  };

  const p1 = active.filter(p => p.salesPattern?.includes('パターン1')).reduce((s, p) => s + (p.financial?.expectedRevenue || 0), 0);
  const p2 = active.filter(p => p.salesPattern?.includes('パターン2')).reduce((s, p) => s + (p.financial?.expectedRevenue || 0), 0);
  const p3 = active.filter(p => p.salesPattern?.includes('パターン3')).reduce((s, p) => s + (p.financial?.expectedRevenue || 0), 0);
  const patternTotal = Math.max(p1 + p2 + p3, 1);

  const picMap = {};
  active.forEach(p => {
    const k = p.picSetup || '未割当';
    picMap[k] = (picMap[k] || 0) + 1;
  });
  const picStats = Object.entries(picMap).sort((a, b) => b[1] - a[1]);

  const fmt = (n) => formatJPYShort(n);

  // --- ケアマックス KPI 目標 ---
  const phaseIdx = (ph) => PHASES.indexOf(ph);
  const reachedPhase = (p, ph) => phaseIdx(p.status) >= phaseIdx(ph);
  const kpiTargets = [
    {
      key: 'approach',
      label: '提案・声掛け数',
      sub: '全アプローチ案件',
      target: 1000,
      filter: (p) => true,
      color: 'sky',
      icon: MessageSquare,
      description: 'これまでに声掛け・提案を行ったすべての案件です。',
    },
    {
      key: 'hearing',
      label: 'ヒアリングシート回収',
      sub: 'EUとの商談 到達',
      target: 400,
      filter: (p) => reachedPhase(p, 'EUとの商談'),
      color: 'indigo',
      icon: FileText,
      description: 'EUとの商談フェーズ以降に到達し、ヒアリングが完了した案件です。',
    },
    {
      key: 'tossup',
      label: 'トスアップ（見積提出）',
      sub: '提案書／見積書提出 到達',
      target: 200,
      filter: (p) => reachedPhase(p, '提案書／見積書提出'),
      color: 'amber',
      icon: Target,
      description: '見積書を提出済みの案件（受注確度が高いトスアップ案件）です。',
    },
    {
      key: 'kgi',
      label: 'KGI: 成約数',
      sub: '販売契約締結 以降',
      target: 30,
      filter: (p) => !p.isLost && wonPhases.includes(p.status),
      color: 'emerald',
      icon: Award,
      isKgi: true,
      description: '販売契約締結以降のフェーズに到達した成約案件です。',
    },
  ].map(k => ({ ...k, actual: projects.filter(k.filter).length }));
  const colorMap = {
    sky:     { bar: 'from-sky-400 to-sky-600',         text: 'text-sky-700',     bg: 'bg-sky-50',     iconBg: 'from-sky-100 to-sky-50',         border: 'border-t-sky-500',     ring: 'text-sky-500',     heroBg: 'bg-gradient-to-br from-white to-sky-50/60' },
    indigo:  { bar: 'from-indigo-400 to-indigo-600',   text: 'text-indigo-700',  bg: 'bg-indigo-50',  iconBg: 'from-indigo-100 to-indigo-50',   border: 'border-t-indigo-500',  ring: 'text-indigo-500',  heroBg: 'bg-gradient-to-br from-white to-indigo-50/60' },
    amber:   { bar: 'from-amber-400 to-amber-500',     text: 'text-amber-700',   bg: 'bg-amber-50',   iconBg: 'from-amber-100 to-amber-50',     border: 'border-t-amber-500',   ring: 'text-amber-500',   heroBg: 'bg-gradient-to-br from-white to-amber-50/60' },
    emerald: { bar: 'from-emerald-400 to-emerald-600', text: 'text-emerald-700', bg: 'bg-emerald-50', iconBg: 'from-emerald-100 to-emerald-50', border: 'border-t-emerald-500', ring: 'text-emerald-500', heroBg: 'bg-gradient-to-br from-white to-emerald-50/60' },
  };

  // KPI 詳細ビューに切替
  if (selectedKpi) {
    const kpi = kpiTargets.find(k => k.key === selectedKpi);
    if (kpi) {
      return (
        <KpiDetailView
          kpi={kpi}
          colorMap={colorMap}
          projects={projects}
          onBack={() => setSelectedKpi(null)}
          onSelectProject={onSelectProject}
        />
      );
    }
  }

  return (
    <div className="space-y-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">ケアマックス KPI</h1>
          <p className="text-gray-500 text-sm mt-2">全社の営業パフォーマンス指標</p>
        </div>
        <button
          onClick={handleExportCsv}
          className="px-5 py-2.5 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full text-sm font-bold flex items-center shadow-md hover:shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all"
        >
          <Download className="w-4 h-4 mr-2" />
          案件詳細をCSV出力
          <span className="ml-2 text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">{projects.length}件</span>
        </button>
      </header>

      {/* ケアマックス KPI 目標 */}
      <Card className="p-6 bg-gradient-to-br from-white to-purple-50/30">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full" />
            年間 KPI 目標 <span className="text-xs font-bold text-gray-400 ml-1">／ 達成状況</span>
          </h2>
          <span className="text-xs font-bold text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-200">{new Date().getFullYear()}年度</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {kpiTargets.map((k, i) => {
            const c = colorMap[k.color];
            const pct = Math.min(100, (k.actual / k.target) * 100);
            const remaining = Math.max(0, k.target - k.actual);
            const Icon = k.icon;
            const isAchieved = k.actual >= k.target;
            return (
              <button
                type="button"
                key={k.key}
                onClick={() => setSelectedKpi(k.key)}
                className={`group relative text-left bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-gray-200 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-300 ${k.isKgi ? 'ring-2 ring-emerald-300/60' : ''}`}
              >
                {/* 上部カラーバンド */}
                <div className={`h-1.5 bg-gradient-to-r ${c.bar}`} />

                <div className="p-5 pb-14">
                  {/* KGI バッジ（KGI のみ） */}
                  {k.isKgi && (
                    <div className="flex justify-end mb-2">
                      <span className="text-[10px] font-extrabold tracking-widest text-white bg-gradient-to-br from-emerald-500 to-emerald-600 px-2 py-0.5 rounded-full shadow-sm">KGI</span>
                    </div>
                  )}

                  {/* タイトル */}
                  <h3 className="text-[15px] font-extrabold text-gray-900 leading-tight tracking-tight">{k.label}</h3>

                  {/* 主役の数値 */}
                  <div className="flex items-baseline gap-2 mt-4">
                    <span className={`text-4xl font-black tabular-nums leading-none ${c.text}`}>
                      {k.actual.toLocaleString()}
                    </span>
                    <span className="text-sm font-bold text-gray-400">/ {k.target.toLocaleString()} 件</span>
                  </div>

                  {/* 進捗バー */}
                  <div className="mt-4">
                    <div className="flex items-center justify-end mb-1.5">
                      <span className={`text-xs font-extrabold tabular-nums ${isAchieved ? 'text-emerald-600' : c.text}`}>
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="relative w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className={`absolute inset-y-0 left-0 bg-gradient-to-r ${c.bar} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>

                {/* フッター: 詳細リンク */}
                <div className={`absolute bottom-0 inset-x-0 px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-gray-500 group-hover:${c.text} ${c.bg} bg-opacity-30 transition-colors`}>
                  <span>詳細を見る</span>
                  <ChevronRight className={`w-4 h-4 ${c.ring} group-hover:translate-x-0.5 transition-transform`} />
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">進行中案件</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{active.length}<span className="text-sm font-medium text-gray-500 ml-1">件</span></p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl"><FileText className="w-6 h-6 text-purple-600" /></div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">パイプライン総額</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{fmt(totalRevenue)}</p>
            </div>
            <div className="p-3 bg-sky-50 rounded-xl"><TrendingUp className="w-6 h-6 text-sky-600" /></div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">受注金額</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{fmt(wonRevenue)}</p>
              <p className="text-xs text-gray-400 mt-1">{won.length}件</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl"><Award className="w-6 h-6 text-green-600" /></div>
          </div>
        </Card>
        <Card className="p-6 border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50/40 to-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">累積利益額</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{fmt(cumulativeProfit)}</p>
              <p className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                利益率 {profitMargin}%
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl"><TrendingUp className="w-6 h-6 text-emerald-600" /></div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">受注率</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{winRate}<span className="text-sm font-medium text-gray-500 ml-1">%</span></p>
              <p className="text-xs text-gray-400 mt-1">失注 {lost.length}件</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl"><Target className="w-6 h-6 text-amber-600" /></div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center"><BarChart3 className="w-5 h-5 mr-2 text-purple-600" />フェーズ別 案件分布</h2>
        <div className="space-y-3">
          {phaseCounts.map(({ phase, count }) => (
            <div key={phase} className="flex items-center">
              <div className="w-40 text-sm font-semibold text-gray-700">{phase}</div>
              <div className="flex-1 bg-gray-100 rounded-full h-3 mx-3 overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: `${(count / maxPhaseCount) * 100}%` }} />
              </div>
              <div className="w-12 text-right text-sm font-bold text-gray-900">{count}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center"><PieChart className="w-5 h-5 mr-2 text-sky-600" />販売パターン別 想定売上</h2>
          <div className="space-y-4">
            {[
              { label: 'パターン1 (完全卸し)', value: p1, color: 'bg-sky-500' },
              { label: 'パターン2 (分離)', value: p2, color: 'bg-yellow-500' },
              { label: 'パターン3 (紹介)', value: p3, color: 'bg-green-500' },
            ].map(row => (
              <div key={row.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-semibold text-gray-700">{row.label}</span>
                  <span className="font-bold text-gray-900">{fmt(row.value)} <span className="text-xs text-gray-400 ml-1">({((row.value / patternTotal) * 100).toFixed(0)}%)</span></span>
                </div>
                <div className="bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div className={`${row.color} h-full rounded-full`} style={{ width: `${(row.value / patternTotal) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center"><Award className="w-5 h-5 mr-2 text-amber-600" />ランク別 案件数</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { rank: 'A', count: rankCounts.A, color: 'bg-red-50 text-red-600' },
              { rank: 'B', count: rankCounts.B, color: 'bg-amber-50 text-amber-600' },
              { rank: 'C', count: rankCounts.C, color: 'bg-sky-50 text-sky-600' },
            ].map(r => (
              <div key={r.rank} className={`${r.color} rounded-2xl p-5 text-center`}>
                <p className="text-xs font-bold">ランク {r.rank}</p>
                <p className="text-3xl font-bold mt-2">{r.count}</p>
                <p className="text-xs font-medium mt-1">件</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center"><Users className="w-5 h-5 mr-2 text-purple-600" />担当者別 案件数</h2>
        {picStats.length === 0 ? (
          <p className="text-sm text-gray-400">データなし</p>
        ) : (
          <div className="space-y-2">
            {picStats.map(([name, count]) => (
              <div key={name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm font-semibold text-gray-700">{name}</span>
                <span className="text-sm font-bold text-gray-900">{count} 件</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

// --- 担当者管理ビュー（営業企画専用） ---
const DEPARTMENT_OPTIONS = [ROLES.KIKAKU, ROLES.SETUP, ROLES.EIGYO];
const initialStaff = [
  { id: 'STF-001', name: '山田 太郎', department: ROLES.SETUP, phone: '03-1234-5678', email: 'yamada@caremax.example.jp', note: '介護機器セットアップ全般' },
  { id: 'STF-002', name: '佐藤 次郎', department: ROLES.EIGYO, phone: '090-2345-6789', email: 'sato@caremax.example.jp', note: '関東エリア営業' },
  { id: 'STF-003', name: '鈴木 花子', department: ROLES.KIKAKU, phone: '03-9876-5432', email: 'suzuki@caremax.example.jp', note: '営業企画・KPI管理' },
];

const StaffView = ({ staff, onSave, onDelete }) => {
  const [editing, setEditing] = useState(null); // 編集中の id（'new' なら新規）
  const [draft, setDraft] = useState({ name: '', department: ROLES.SETUP, phone: '', email: '', note: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const startNew = () => {
    setDraft({ name: '', department: ROLES.SETUP, phone: '', email: '', note: '' });
    setEditing('new');
  };
  const startEdit = (s) => {
    setDraft({ name: s.name, department: s.department, phone: s.phone || '', email: s.email || '', note: s.note || '' });
    setEditing(s.id);
  };
  const cancel = () => { setEditing(null); };
  const submit = (e) => {
    e?.preventDefault();
    if (!draft.name.trim()) return;
    const id = editing === 'new' ? `STF-${String(Date.now()).slice(-6)}` : editing;
    onSave({ id, ...draft });
    setEditing(null);
  };

  const filtered = useMemo(() => {
    return staff.filter(s => {
      if (deptFilter && s.department !== deptFilter) return false;
      if (searchTerm) {
        const t = searchTerm.toLowerCase();
        return [s.name, s.phone, s.email, s.note].some(v => (v || '').toLowerCase().includes(t));
      }
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name, 'ja'));
  }, [staff, searchTerm, deptFilter]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">担当者管理</h1>
          <p className="text-gray-500 text-sm mt-1">営業企画専用 ・ 全担当者の連絡先と所属を管理します。</p>
        </div>
        <button
          onClick={startNew}
          className="px-5 py-2.5 bg-purple-600 text-white rounded-full text-sm font-bold flex items-center shadow-sm hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" /> 担当者を追加
        </button>
      </header>

      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="名前・連絡先・メモで検索..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-300"
          >
            <option value="">すべての部署</option>
            {DEPARTMENT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <span className="text-xs font-semibold text-gray-400 ml-1 tabular-nums">{filtered.length} 名</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/60 border-y border-gray-100 text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">名前</th>
                <th className="px-4 py-3 font-semibold">所属</th>
                <th className="px-4 py-3 font-semibold">電話</th>
                <th className="px-4 py-3 font-semibold">メール</th>
                <th className="px-4 py-3 font-semibold">メモ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400 font-medium">担当者が登録されていません</td></tr>
              )}
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-purple-50/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center text-xs font-extrabold">
                        {s.name.charAt(0)}
                      </div>
                      <span className="font-bold text-gray-900">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full">{s.department}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 tabular-nums">{s.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{s.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{s.note || '—'}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => startEdit(s)} className="px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 border border-purple-100 rounded-full hover:bg-purple-100 mr-1.5">
                      <Edit className="w-3 h-3 inline mr-1" />編集
                    </button>
                    <button onClick={() => { if (window.confirm(`${s.name} を削除しますか？`)) onDelete(s.id); }} className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-full hover:bg-red-100">
                      <Trash2 className="w-3 h-3 inline mr-1" />削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 編集モーダル */}
      {editing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
          <form onSubmit={submit} className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">{editing === 'new' ? '担当者を追加' : '担当者を編集'}</h3>
              <button type="button" onClick={cancel} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">名前 <span className="text-red-500">*</span></label>
                <input required type="text" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}
                  placeholder="例：山田 太郎"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">所属</label>
                <select value={draft.department} onChange={e => setDraft({ ...draft, department: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-300">
                  {DEPARTMENT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">電話番号</label>
                  <input type="text" value={draft.phone} onChange={e => setDraft({ ...draft, phone: e.target.value })}
                    placeholder="例：090-1234-5678"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">メール</label>
                  <input type="email" value={draft.email} onChange={e => setDraft({ ...draft, email: e.target.value })}
                    placeholder="例：yamada@example.com"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">メモ</label>
                <textarea rows={2} value={draft.note} onChange={e => setDraft({ ...draft, note: e.target.value })}
                  placeholder="担当範囲・備考など"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button type="button" onClick={cancel} className="px-5 py-2 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-100">キャンセル</button>
              <button type="submit" className="px-5 py-2 rounded-full text-sm font-bold bg-purple-600 text-white hover:bg-purple-700 shadow-sm">保存する</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// --- メインアプリ ---
export default function App() {
  const [projects, setProjects] = useState(mockProjects);
  const [staff, setStaff] = useState(initialStaff);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [currentRole, setCurrentRole] = useState(ROLES.KIKAKU);
  const [currentTab, setCurrentTab] = useState('dashboard'); // 'dashboard' | 'kpi' | 'staff'
  const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null;

  const canViewKpi = KPI_ALLOWED_ROLES.includes(currentRole);
  const canManageStaff = STAFF_ADMIN_ROLES.includes(currentRole);
  const canSeeKaientaiQuest = KAIENTAI_QUEST_ROLES.includes(currentRole);
  // ロール切替時にアクセス権がないタブはダッシュボードに戻す
  React.useEffect(() => {
    if (!canViewKpi && currentTab === 'kpi') setCurrentTab('dashboard');
    if (!canManageStaff && currentTab === 'staff') setCurrentTab('dashboard');
  }, [currentRole, canViewKpi, canManageStaff, currentTab]);

  const handleSaveStaff = (s) => {
    setStaff(prev => prev.some(x => x.id === s.id) ? prev.map(x => x.id === s.id ? s : x) : [...prev, s]);
  };
  const handleDeleteStaff = (id) => {
    setStaff(prev => prev.filter(s => s.id !== id));
  };

  const handleAddProject = (projectData) => {
    const newProject = {
      id: `PRJ-${new Date().getFullYear()}-${String(projects.length + 1).padStart(3, '0')}`,
      name: projectData.name,
      status: '案件発掘',
      startDate: new Date().toISOString().split('T')[0],
      expectedCloseDate: '',
      rank: 'B',
      salesPattern: projectData.salesPattern,
      updatedAt: new Date().toISOString(),
      summary: '',
      picSetup: '',
      endUser: {
        companyName: projectData.companyName,
        retailerName: '',
        department: '',
        contact: '',
        address: '',
        needsAndIssues: ''
      },
      financial: { expectedRevenue: projectData.expectedRevenue },
      phaseDetails: {},
      logs: []
    };
    setProjects(prev => [...prev, newProject]);
  };

  const handleUpdateProject = (updatedProject) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  return (
    <div className="min-h-screen bg-gray-50/80">
      {/* トップナビゲーション */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => { setSelectedProjectId(null); setCurrentTab('dashboard'); }}
              className="text-base font-bold text-gray-900 mr-6 hover:text-purple-700 transition-colors focus:outline-none"
            >
              CM Force
            </button>
            {!selectedProject && (
              <>
                <button
                  onClick={() => setCurrentTab('dashboard')}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${currentTab === 'dashboard' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  ダッシュボード
                </button>
                {canViewKpi && (
                  <button
                    onClick={() => setCurrentTab('kpi')}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-colors flex items-center ${currentTab === 'kpi' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <BarChart3 className="w-4 h-4 mr-1.5" />
                    ケアマックス KPI
                  </button>
                )}
                {canManageStaff && (
                  <button
                    onClick={() => setCurrentTab('staff')}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-colors flex items-center ${currentTab === 'staff' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <Users className="w-4 h-4 mr-1.5" />
                    担当者管理
                  </button>
                )}
                {canSeeKaientaiQuest && (
                  <a
                    href={KAIENTAI_QUEST_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-full text-sm font-bold transition-colors flex items-center text-gray-600 hover:bg-gray-100"
                  >
                    <Award className="w-4 h-4 mr-1.5 text-orange-500" />
                    介援隊クエスト
                    <ExternalLink className="w-3 h-3 ml-1.5 text-gray-400" />
                  </a>
                )}
              </>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-gray-400">ロール</span>
            <select
              value={currentRole}
              onChange={e => setCurrentRole(e.target.value)}
              className="text-sm font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              {ROLE_LIST.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {selectedProject ? (
          <ProjectDetail
            project={selectedProject}
            onBack={() => setSelectedProjectId(null)}
            onUpdateProject={handleUpdateProject}
          />
        ) : currentTab === 'kpi' && canViewKpi ? (
          <KpiView projects={projects} onSelectProject={setSelectedProjectId} />
        ) : currentTab === 'staff' && canManageStaff ? (
          <StaffView staff={staff} onSave={handleSaveStaff} onDelete={handleDeleteStaff} />
        ) : (
          <Dashboard
            projects={projects}
            onSelectProject={setSelectedProjectId}
            onAddProject={handleAddProject}
            canViewProfit={canViewKpi}
          />
        )}
      </div>
    </div>
  );
}
