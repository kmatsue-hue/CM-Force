import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  ArrowUpDown,
  Calendar,
  Check,
  ChevronRight,
  CircleDot,
  FileText,
  Download,
  Filter,
  JapaneseYen,
  Plus,
  Search,
  TrendingUp,
  X,
} from 'lucide-react';
import { PHASES } from '../data/phases.js';
import { FACILITY_TYPE_OPTIONS, getFacilityTypeMeta } from '../data/facilityTypes.js';
import { PREFECTURE_OPTIONS, getProjectPrefecture, normalizePrefecture } from '../data/prefectures.js';
import { formatJPY, formatJPYShort } from '../utils/format.js';
import { formatSalesPattern } from '../utils/salesPattern.js';
import { rowsToCsv, downloadCsv, todayStamp } from '../utils/csv.js';
import Card from '../ui/Card.jsx';
import RankBadge from '../ui/RankBadge.jsx';
import RankPieChart from '../ui/RankPieChart.jsx';
import MiniArrowDiagram from '../ui/MiniArrowDiagram.jsx';
import { AssistTip } from '../ui/AssistMode.jsx';
import ProjectName from '../ui/ProjectName.jsx';
import { getProjectDisplayName, stripProjectHonorific } from '../utils/projectName.js';
import { getBallOwnerLabel, getBallOwnerTone, normalizeBallOwner } from '../data/ballOwners.js';

const formatCloseDate = value => value ? String(value).replaceAll('-', '/') : '未設定';
const getDashboardBallOwnerLabel = owner =>
  getBallOwnerLabel(owner).replace('SOMPOケアソリューションズ', 'SOMPOケア');

const getCloseDateTone = (project) => {
  if (!project?.expectedCloseDate) return 'bg-gray-100 text-gray-500 ring-gray-200';
  if (project.isLost || ['販売契約締結', '施工・納品', '一次保守'].includes(project.status)) {
    return 'bg-slate-100 text-slate-600 ring-slate-200';
  }
  const target = new Date(`${project.expectedCloseDate}T23:59:59`);
  if (Number.isNaN(target.getTime())) return 'bg-gray-100 text-gray-500 ring-gray-200';
  const remainingDays = Math.ceil((target.getTime() - Date.now()) / 86400000);
  if (remainingDays < 0) return 'bg-red-50 text-red-700 ring-red-200';
  if (remainingDays <= 7) return 'bg-amber-50 text-amber-700 ring-amber-200';
  return 'bg-blue-50 text-blue-700 ring-blue-200';
};

const DASHBOARD_MODE_STORAGE_KEY = 'cm-force-dashboard-mode-v1';
const HEARING_SHEET_FILTER_OPTIONS = ['あり', 'なし'];
const getHearingSheetLabel = (project) => (project?.hasIctHearingSheet ? 'あり' : 'なし');
const createEmptyFilterConfig = () => ({
  patterns: [],
  statuses: [],
  pics: [],
  caremaxPics: [],
  facilityTypes: [],
  hearingSheets: [],
  lostOnly: false,
});
const cloneFilterConfig = (config) => ({
  patterns: [...config.patterns],
  statuses: [...config.statuses],
  pics: [...config.pics],
  caremaxPics: [...config.caremaxPics],
  facilityTypes: [...config.facilityTypes],
  hearingSheets: [...config.hearingSheets],
  lostOnly: Boolean(config.lostOnly),
});

// --- ダッシュボード ---
const Dashboard = ({ projects, staff = [], onSelectProject, onAddProject, canViewProfit = false, canExportCsv = false, canEdit = true, canSwitchDashboardMode = false }) => {
  // 企画部のみ表示する SOMPOケアソリューションズ / テクノスジャパン 切替スイッチ
  // モードは localStorage に保持しておきリロード後も復元される
  const [dashboardMode, setDashboardMode] = useState(() => {
    if (!canSwitchDashboardMode) return 'setup';
    try {
      const saved = localStorage.getItem(DASHBOARD_MODE_STORAGE_KEY);
      return saved === 'technos' ? 'technos' : 'setup';
    } catch { return 'setup'; }
  });
  useEffect(() => {
    if (!canSwitchDashboardMode) return;
    try { localStorage.setItem(DASHBOARD_MODE_STORAGE_KEY, dashboardMode); } catch { /* ignore */ }
  }, [dashboardMode, canSwitchDashboardMode]);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('updatedAtDesc');
  const [isDetailView, setIsDetailView] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const filterMenuRef = React.useRef(null);
  // ポップアップは Portal で body に出し、画面中央へ固定表示する
  const [filterMenuWidth, setFilterMenuWidth] = useState(720);
  const [filterConfig, setFilterConfig] = useState(createEmptyFilterConfig);
  const [draftFilterConfig, setDraftFilterConfig] = useState(createEmptyFilterConfig);

  // 画面幅に合わせて横幅を調整し、中央配置でポップアップを開く
  const FILTER_MENU_WIDTH = 880;
  const FILTER_MENU_MARGIN = 8;
  const openFilterMenu = () => {
    if (isFilterMenuOpen) return;
    const availableWidth = window.innerWidth - FILTER_MENU_MARGIN * 2;
    setFilterMenuWidth(Math.min(FILTER_MENU_WIDTH, availableWidth));
    setDraftFilterConfig(cloneFilterConfig(filterConfig));
    setIsFilterMenuOpen(true);
  };
  const [lostInfoModal, setLostInfoModal] = useState(null); // 表示中の失注情報案件
  const [newProject, setNewProject] = useState({
    name: '',
    companyName: '',
    prefecture: '',
    salesPattern: 'パターン1（完全卸し）',
    facilityType: '',
    expectedRevenue: '',
    picCaremaxStaffNumber: '',
  });
  const caremaxSalesStaff = useMemo(
    () => staff.filter(member => member.department === '営業部'),
    [staff]
  );
  const caremaxStaffByNumber = useMemo(
    () => new Map(caremaxSalesStaff.map(member => [member.staffNumber, member])),
    [caremaxSalesStaff]
  );
  const caremaxStaffNumberByName = useMemo(
    () => new Map(caremaxSalesStaff.map(member => [member.name, member.staffNumber])),
    [caremaxSalesStaff]
  );

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
    const sanitizedProjectName = stripProjectHonorific(newProject.name);
    if (!sanitizedProjectName || !newProject.companyName.trim() || !newProject.picCaremaxStaffNumber) return;
    const assigned = caremaxSalesStaff.find(
      member => member.staffNumber === newProject.picCaremaxStaffNumber
    );
    if (!assigned) return;
    onAddProject({
      ...newProject,
      name: sanitizedProjectName,
      prefecture: normalizePrefecture(newProject.prefecture),
      expectedRevenue: Number(newProject.expectedRevenue) || 0,
      picCaremax: assigned.name,
    });
    setIsModalOpen(false);
    setNewProject({
      name: '',
      companyName: '',
      prefecture: '',
      salesPattern: 'パターン1（完全卸し）',
      facilityType: '',
      expectedRevenue: '',
      picCaremaxStaffNumber: '',
    });
  };

  const allPics = useMemo(() => {
    const pics = projects.map(p => p.picSetup).filter(Boolean);
    return [...new Set(pics)];
  }, [projects]);

  const allCaremaxPics = useMemo(() => {
    const assignees = new Map();
    projects.forEach((project) => {
      const key = project.picCaremaxStaffNumber
        || caremaxStaffNumberByName.get(project.picCaremax)
        || project.picCaremax
        || '';
      if (!key) return;
      const member = caremaxStaffByNumber.get(key);
      const label = member
        ? `${member.staffNumber}｜${member.name}`
        : (project.picCaremax || key);
      assignees.set(key, label);
    });
    return [...assignees.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'ja'));
  }, [projects, caremaxStaffByNumber, caremaxStaffNumberByName]);

  const toggleFilter = (category, value) => {
    setDraftFilterConfig(prev => {
      const current = prev[category];
      return current.includes(value)
        ? { ...prev, [category]: current.filter(v => v !== value) }
        : { ...prev, [category]: [...current, value] };
    });
  };

  const clearFilters = () => setDraftFilterConfig(createEmptyFilterConfig());
  const applyFilters = () => setFilterConfig(cloneFilterConfig(draftFilterConfig));

  const filteredProjects = useMemo(() => {
    // 通常は進行中案件だけを表示し、明示的に選択した場合のみ失注案件へ切り替える。
    let result = projects.filter(p => filterConfig.lostOnly ? p.isLost : !p.isLost);
    if (searchTerm) {
      const normalizedSearchTerm = searchTerm.trim();
      result = result.filter(p =>
        p.name.includes(normalizedSearchTerm)
        || getProjectDisplayName(p.name).includes(normalizedSearchTerm)
        || getProjectPrefecture(p).includes(normalizedSearchTerm)
        || p.endUser.companyName.includes(normalizedSearchTerm)
      );
    }
    if (filterConfig.patterns.length > 0) result = result.filter(p => filterConfig.patterns.includes(p.salesPattern));
    if (filterConfig.statuses.length > 0) result = result.filter(p => filterConfig.statuses.includes(p.status));
    if (filterConfig.pics.length > 0) result = result.filter(p => filterConfig.pics.includes(p.picSetup));
    if (filterConfig.caremaxPics.length > 0) {
      result = result.filter((p) => {
        const key = p.picCaremaxStaffNumber
          || caremaxStaffNumberByName.get(p.picCaremax)
          || p.picCaremax
          || '';
        return filterConfig.caremaxPics.includes(key);
      });
    }
    if (filterConfig.facilityTypes.length > 0) {
      result = result.filter(p => filterConfig.facilityTypes.includes(p.facilityType));
    }
    if (filterConfig.hearingSheets.length > 0) {
      result = result.filter(p => filterConfig.hearingSheets.includes(getHearingSheetLabel(p)));
    }
    result.sort((a, b) => {
      if (sortOption === 'hearingSheetDesc') {
        const diff = Number(Boolean(b.hasIctHearingSheet)) - Number(Boolean(a.hasIctHearingSheet));
        if (diff !== 0) return diff;
      }
      if (sortOption === 'hearingSheetAsc') {
        const diff = Number(Boolean(a.hasIctHearingSheet)) - Number(Boolean(b.hasIctHearingSheet));
        if (diff !== 0) return diff;
      }
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
    return result;
  }, [projects, searchTerm, filterConfig, sortOption, caremaxStaffNumberByName]);

  const activeFilterCount = filterConfig.patterns.length
    + filterConfig.statuses.length
    + filterConfig.pics.length
    + filterConfig.caremaxPics.length
    + filterConfig.facilityTypes.length
    + filterConfig.hearingSheets.length
    + (filterConfig.lostOnly ? 1 : 0);

  // 案件情報を CSV 出力（絞り込み・検索が反映された結果をそのまま出力）
  // カラムはセクション順に整理:
  //   [案件基本] [進行状況] [担当・期間] [金額] [エンドユーザー] [その他] [失注情報] [メタ]
  const handleExportCsv = () => {
    const header = [
      // 案件基本
      '案件ID',
      '案件名',
      '案件概要',
      '販売スキーム',
      '案件ランク',
      // 進行状況
      'ステータス',
      // 担当・期間
      'SOMPOケアソリューションズ担当者',
      'ケアマックス担当者',
      '現在のボール',
      '開始日',
      'クローズ予定日',
      // 金額
      '想定全体売上(円)',
      '卸値(円)',
      '紹介料率(%)',
      '紹介料(円)',
      '直販価格(円)',
      // エンドユーザー情報
      'エンドユーザー企業名',
      '都道府県',
      'エンドユーザー担当者名',
      'エンドユーザー連絡先',
      'エンドユーザー住所',
      '販売店',
      // その他
      'ニーズ・課題',
      '活動ログ',
      // 失注情報
      '失注フラグ',
      '失注理由',
      '失注時の競合先',
      '失注日',
      // メタ
      '更新日時',
      'ICTヒアリングシート',
    ];
    const rows = filteredProjects.map((p) => [
      // 案件基本
      p.id,
      p.name,
      p.summary ?? '',
      p.salesPattern,
      p.rank,
      // 進行状況
      p.status,
      // 担当・期間
      p.picSetup ?? '',
      p.picCaremax ?? '',
      getBallOwnerLabel(p.ballOwner),
      p.startDate ?? '',
      p.expectedCloseDate ?? '',
      // 金額
      p.financial?.expectedRevenue ?? '',
      p.financial?.wholesalePriceSetup ?? '',
      p.financial?.referralFeeRate ?? '',
      p.financial?.referralFeeAmount ?? '',
      p.financial?.directSalesPrice ?? '',
      // エンドユーザー情報
      p.endUser?.companyName ?? '',
      getProjectPrefecture(p),
      p.endUser?.department ?? '',
      p.endUser?.contact ?? '',
      p.endUser?.address ?? '',
      p.endUser?.retailerName ?? '',
      // その他
      p.endUser?.needsAndIssues ?? '',
      p.logs?.map(log => {
        const next = [log.nextAction, log.nextDate].filter(Boolean).join(' / ');
        return `${log.date || ''} ${log.content || ''}${next ? ` (${next})` : ''}`.trim();
      }).join('\n') ?? '',
      // 失注情報
      p.isLost ? '失注' : '',
      p.lostInfo?.reason ?? '',
      p.lostInfo?.competitor ?? '',
      p.lostInfo?.date ?? '',
      // メタ
      p.updatedAt ?? '',
      getHearingSheetLabel(p),
    ]);
    const csv = rowsToCsv([header, ...rows]);
    downloadCsv(`cm-force-projects-${todayStamp()}.csv`, csv);
  };

  // パターン別売上計算
  const patternRevenue = useMemo(() => {
    const p1 = activeProjects.filter(p => p.salesPattern?.includes('パターン1')).reduce((s, p) => s + (p.financial?.expectedRevenue || 0), 0);
    const p2 = activeProjects.filter(p => p.salesPattern?.includes('パターン2')).reduce((s, p) => s + (p.financial?.expectedRevenue || 0), 0);
    const p3 = activeProjects.filter(p => p.salesPattern?.includes('パターン3')).reduce((s, p) => s + (p.financial?.expectedRevenue || 0), 0);
    const max = Math.max(p1, p2, p3, 1);
    return [
      { label: '①完全卸し', value: p1, color: 'bg-sky-500', pct: (p1 / max) * 100 },
      { label: '②分離', value: p2, color: 'bg-yellow-500', pct: (p2 / max) * 100 },
      { label: '③完全紹介', value: p3, color: 'bg-green-500', pct: (p3 / max) * 100 },
    ];
  }, [activeProjects]);

  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][today.getDay()];
  const wonProjects = activeProjects.filter(p => ['販売契約締結', '施工・納品', '一次保守'].includes(p.status));
  const wonRevenue = wonProjects.reduce((s, p) => s + (p.financial?.expectedRevenue || 0), 0);
  const cumulativeProfit = wonProjects.reduce((s, p) => s + ((p.financial?.expectedRevenue || 0) - (p.financial?.wholesalePriceSetup || 0)), 0);

  return (
    <div className="space-y-5 sm:space-y-8 relative">
      {/* 企画部のみ: SOMPOケアソリューションズ / テクノスジャパン モード切替 */}
      {canSwitchDashboardMode && (
        <div className="flex justify-center">
          <AssistTip
            text={"SOMPOケアソリューションズ案件と テクノスジャパン案件の管理ビューを切り替えます。\nテクノスジャパンビューは現在準備中です。"}
            side="bottom"
          >
            <div className="inline-flex p-1 bg-gray-100 rounded-full border border-gray-200 shadow-sm">
              <button
                type="button"
                onClick={() => setDashboardMode('setup')}
                className={`px-5 py-1.5 rounded-full text-sm font-bold transition-all ${
                  dashboardMode === 'setup'
                    ? 'bg-white text-purple-700 shadow-sm border border-purple-100'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
                aria-pressed={dashboardMode === 'setup'}
              >
                SOMPOケアソリューションズ
              </button>
              <button
                type="button"
                onClick={() => setDashboardMode('technos')}
                className={`px-5 py-1.5 rounded-full text-sm font-bold transition-all ${
                  dashboardMode === 'technos'
                    ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
                aria-pressed={dashboardMode === 'technos'}
              >
                テクノスジャパン
              </button>
            </div>
          </AssistTip>
        </div>
      )}

      {dashboardMode === 'setup' && (
        <section className="dashboard-hero flex items-end">
          <div className="relative z-10 max-w-3xl">
            <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-gray-400">
              Sales command center · {dateStr}（{weekday}）
            </p>
            <h1 className="text-[clamp(2.05rem,4.7vw,4.45rem)] font-black leading-[.94] tracking-[-0.06em] text-black">
              案件の現在地を、<br />ひと目で。
            </h1>
            <p className="mt-3 max-w-xl text-xs sm:text-sm font-medium leading-5 text-gray-500">
              営業の進捗、売上見込み、次に動くべき案件をひとつの画面に集約しています。
            </p>
          </div>
        </section>
      )}

      {/* テクノスジャパン モード（プレースホルダー枠） */}
      {dashboardMode === 'technos' ? (
        <div className="space-y-4">
          <Card className="p-8 sm:p-12 text-center bg-gradient-to-br from-emerald-50/40 via-white to-emerald-50/20 border-emerald-100">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 mb-4">
              <span className="text-xl font-extrabold">T</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">テクノスジャパン 案件管理</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed max-w-md mx-auto">
              テクノスジャパン専用の案件管理フローを構築中です。<br />
              フェーズ・項目・KPI の要件が確定したら、こちらに新しい管理ビューを実装します。
            </p>
            <div className="mt-6 inline-flex items-center gap-2 text-[11px] font-semibold text-emerald-700 bg-white border border-emerald-200 rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              実装予定
            </div>
          </Card>
        </div>
      ) : (
      <>
      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 hover:border-gray-200 transition-colors">
          <p className="text-xs sm:text-sm font-bold text-gray-700">進行中案件</p>
          <p className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-1.5 sm:mt-2 tabular-nums">
            {activeProjects.length}<span className="text-sm font-bold text-gray-400 ml-1">件</span>
          </p>
          <p className="text-[10px] sm:text-xs text-gray-500 font-semibold mt-1.5">受注済み {wonProjects.length} 件</p>
        </Card>

        <Card className="p-3 sm:p-4 hover:border-gray-200 transition-colors">
          <p className="text-xs sm:text-sm font-bold text-gray-700">想定売上合計</p>
          <p className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-1.5 sm:mt-2 tabular-nums">{revenueJPY}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 font-semibold mt-1.5">全パイプライン</p>
        </Card>

        <Card className="p-3 sm:p-4 hover:border-gray-200 transition-colors">
          <p className="text-xs sm:text-sm font-bold text-gray-700">売上実績</p>
          <p className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-1.5 sm:mt-2 tabular-nums">{formatJPYShort(wonRevenue)}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 font-semibold mt-1.5">受注 {wonProjects.length} 件</p>
          {canViewProfit && (
            <p className="text-[10px] sm:text-xs font-bold text-emerald-700 mt-2 pt-2 border-t border-emerald-100 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              累積利益 <span className="ml-auto tabular-nums">{formatJPYShort(cumulativeProfit)}</span>
            </p>
          )}
        </Card>

        <Card className="p-3 sm:p-4 hover:border-gray-200 transition-colors">
          <p className="text-xs sm:text-sm font-bold text-gray-700 mb-2">案件ランク分布</p>
          <RankPieChart rankCounts={rankCounts} />
        </Card>
      </div>

      <div className="space-y-6">
        {/* 案件一覧 */}
        <div className="space-y-6">
          <Card>
            <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 sm:justify-between sm:items-center bg-white relative z-20">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  案件一覧
                  <span className="text-xs font-semibold text-gray-400 tabular-nums">{filteredProjects.length}件</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setIsDetailView(prev => !prev)}
                  aria-pressed={isDetailView}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                    isDetailView
                      ? 'border-purple-300 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-600 text-white shadow-[0_0_16px_rgba(168,85,247,0.72),0_0_32px_rgba(217,70,239,0.38)] ring-2 ring-purple-300/60'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  詳細ビュー
                </button>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
                <AssistTip text={"案件名・エンドユーザー企業名で部分一致検索。\n複数キーワードは未対応です。"} side="bottom" wrapClassName="flex-1 sm:flex-initial min-w-0">
                  <div className="relative w-full sm:w-auto">
                    <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="案件・企業名で検索..."
                      className="w-full sm:w-56 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </AssistTip>
                <AssistTip text={"最新更新順に加えて、ICTヒアリングシート有無でも並び替えできます。"} side="bottom">
                  <div className="relative">
                    <ArrowUpDown className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <select
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value)}
                      className="rounded-full border border-gray-200 bg-white py-2 pl-10 pr-9 text-sm font-bold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="updatedAtDesc">最新更新順</option>
                      <option value="hearingSheetDesc">ヒアリングシート有り優先</option>
                      <option value="hearingSheetAsc">ヒアリングシート無し優先</option>
                    </select>
                  </div>
                </AssistTip>
                <AssistTip text={"案件状態 / 販売スキーム / ステータス / 担当者 / 施設業態 / ヒアリングシートで絞り込み。\n設定した条件は CSV 出力にも反映されます。"} side="bottom">
                <div>
                  <button
                    onClick={openFilterMenu}
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
                  {isFilterMenuOpen && createPortal(
                    <div
                      ref={filterMenuRef}
                      style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        width: filterMenuWidth,
                        maxWidth: 'calc(100vw - 16px)',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 200,
                      }}
                      className="bg-white rounded-xl shadow-xl border border-gray-100 max-h-[80vh] overflow-y-auto"
                    >
                      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-white px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gray-700">絞り込み条件</span>
                          <button onClick={clearFilters} className="text-xs text-purple-600 hover:underline font-semibold">選択をクリア</button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={applyFilters}
                            className="rounded-full bg-purple-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-purple-700"
                          >
                            絞り込む
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsFilterMenuOpen(false)}
                            className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-50"
                            aria-label="絞り込み条件を閉じる"
                          >
                            <X className="mr-1 h-3.5 w-3.5" />
                            閉じる
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="px-4 py-3">
                          <span className="text-xs font-bold text-gray-800 mb-2 block">案件状態</span>
                          <label
                            onClick={() => setDraftFilterConfig(prev => ({ ...prev, lostOnly: !prev.lostOnly }))}
                            className="flex items-center space-x-2 py-1.5 cursor-pointer group select-none"
                          >
                            <div className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors ${draftFilterConfig.lostOnly ? 'bg-red-500 border-red-500' : 'border-gray-300 group-hover:border-red-400'}`}>
                              {draftFilterConfig.lostOnly && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-sm text-gray-600 group-hover:text-gray-900">失注案件のみ表示</span>
                          </label>
                          <p className="mt-1 text-[11px] leading-relaxed text-gray-400">
                            未選択時は進行中案件のみ表示します
                          </p>
                        </div>
                        <div className="px-4 py-3">
                          <span className="text-xs font-bold text-gray-800 mb-2 block">販売スキーム</span>
                          {['パターン1（完全卸し）', 'パターン2（分離）', 'パターン3（完全紹介）'].map(pattern => (
                            <label
                              key={pattern}
                              onClick={() => toggleFilter('patterns', pattern)}
                              className="flex items-center space-x-2 py-1.5 cursor-pointer group select-none"
                            >
                              <div className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors ${draftFilterConfig.patterns.includes(pattern) ? 'bg-purple-600 border-purple-600' : 'border-gray-300 group-hover:border-purple-400'}`}>
                                {draftFilterConfig.patterns.includes(pattern) && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span className="text-sm text-gray-600 group-hover:text-gray-900">{formatSalesPattern(pattern)}</span>
                            </label>
                          ))}
                        </div>
                        <div className="px-4 py-3">
                          <span className="text-xs font-bold text-gray-800 mb-2 block">ステータス</span>
                          {PHASES.map(phase => (
                            <label
                              key={phase}
                              onClick={() => toggleFilter('statuses', phase)}
                              className="flex items-center space-x-2 py-1.5 cursor-pointer group select-none"
                            >
                              <div className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors ${draftFilterConfig.statuses.includes(phase) ? 'bg-purple-600 border-purple-600' : 'border-gray-300 group-hover:border-purple-400'}`}>
                                {draftFilterConfig.statuses.includes(phase) && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span className="text-sm text-gray-600 group-hover:text-gray-900">{phase}</span>
                            </label>
                          ))}
                        </div>
                        <div className="px-4 py-3">
                          <span className="text-xs font-bold text-gray-800 mb-2 block">SOMPOケアソリューションズ担当者</span>
                          {allPics.length === 0 && (
                            <span className="text-xs text-gray-400 italic">担当者未設定の案件のみです</span>
                          )}
                          {allPics.map(pic => (
                            <label
                              key={pic}
                              onClick={() => toggleFilter('pics', pic)}
                              className="flex items-center space-x-2 py-1.5 cursor-pointer group select-none"
                            >
                              <div className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors ${draftFilterConfig.pics.includes(pic) ? 'bg-purple-600 border-purple-600' : 'border-gray-300 group-hover:border-purple-400'}`}>
                                {draftFilterConfig.pics.includes(pic) && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span className="text-sm text-gray-600 group-hover:text-gray-900 break-all">{pic}</span>
                            </label>
                          ))}
                        </div>
                        <div className="px-4 py-3">
                          <span className="text-xs font-bold text-gray-800 mb-2 block">ケアマックス営業担当</span>
                          {allCaremaxPics.length === 0 && (
                            <span className="text-xs text-gray-400 italic">担当営業者が設定されていません</span>
                          )}
                          {allCaremaxPics.map(option => (
                            <label
                              key={option.value}
                              onClick={() => toggleFilter('caremaxPics', option.value)}
                              className="flex items-center space-x-2 py-1.5 cursor-pointer group select-none"
                            >
                              <div className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors ${draftFilterConfig.caremaxPics.includes(option.value) ? 'bg-purple-600 border-purple-600' : 'border-gray-300 group-hover:border-purple-400'}`}>
                                {draftFilterConfig.caremaxPics.includes(option.value) && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span className="text-sm text-gray-600 group-hover:text-gray-900 break-all">{option.label}</span>
                            </label>
                          ))}
                        </div>
                        <div className="px-4 py-3">
                          <span className="text-xs font-bold text-gray-800 mb-2 block">施設業態</span>
                          {FACILITY_TYPE_OPTIONS.map(option => (
                            <label
                              key={option}
                              onClick={() => toggleFilter('facilityTypes', option)}
                              className="flex items-center space-x-2 py-1.5 cursor-pointer group select-none"
                            >
                              <div className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors ${draftFilterConfig.facilityTypes.includes(option) ? 'bg-purple-600 border-purple-600' : 'border-gray-300 group-hover:border-purple-400'}`}>
                                {draftFilterConfig.facilityTypes.includes(option) && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span className="text-sm text-gray-600 group-hover:text-gray-900">{option}</span>
                            </label>
                          ))}
                        </div>
                        <div className="px-4 py-3">
                          <span className="text-xs font-bold text-gray-800 mb-2 block">ICTヒアリングシート</span>
                          {HEARING_SHEET_FILTER_OPTIONS.map(option => (
                            <label
                              key={option}
                              onClick={() => toggleFilter('hearingSheets', option)}
                              className="flex items-center space-x-2 py-1.5 cursor-pointer group select-none"
                            >
                              <div className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors ${draftFilterConfig.hearingSheets.includes(option) ? 'bg-purple-600 border-purple-600' : 'border-gray-300 group-hover:border-purple-400'}`}>
                                {draftFilterConfig.hearingSheets.includes(option) && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span className="text-sm text-gray-600 group-hover:text-gray-900">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>,
                    document.body
                  )}
                </div>
                </AssistTip>
                {canExportCsv && (
                  <AssistTip text={"現在の絞り込み結果を CSV ダウンロード。\nExcel で開いても日本語が文字化けしません（UTF-8 BOM 付与）。"} side="bottom">
                    <button
                      onClick={handleExportCsv}
                      disabled={filteredProjects.length === 0}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center shadow-sm"
                    >
                      <Download className="w-4 h-4 mr-2 text-gray-500" />
                      CSV出力
                    </button>
                  </AssistTip>
                )}
                {canEdit && (
                  <AssistTip text={"新しい案件を起こします。\n企業名・案件名・想定売上・販売スキームの最低限を入れて作成 → 詳細画面でフェーズを進めていきます。"} side="bottom">
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-bold flex items-center shadow-md hover:bg-purple-700 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-1.5" /> 新規案件
                    </button>
                  </AssistTip>
                )}
              </div>
            </div>
            <div className="overflow-x-auto overscroll-x-contain">
              <table className={`w-full text-left text-sm ${isDetailView ? 'min-w-[1740px]' : ''}`}>
                <thead className="border-b border-gray-100 text-gray-400">
                  <tr>
                    <th className={`min-w-[280px] whitespace-nowrap px-3 py-3 text-xs font-semibold sm:px-5 ${isDetailView ? 'sticky left-0 z-20 bg-[#f7f7f8] shadow-[8px_0_14px_-14px_rgba(15,23,42,0.6)]' : ''}`}>案件名</th>
                    {isDetailView && (
                      <th className="min-w-[110px] whitespace-nowrap px-5 py-3 text-xs font-semibold">都道府県</th>
                    )}
                    {isDetailView && (
                      <th className="min-w-[150px] whitespace-nowrap px-5 py-3 text-xs font-semibold">販売スキーム</th>
                    )}
                    <th className={`${isDetailView ? 'table-cell' : 'hidden md:table-cell'} min-w-[300px] whitespace-nowrap px-5 py-3 text-xs font-semibold`}>ステータス</th>
                    <th className={`${isDetailView ? 'table-cell' : 'hidden lg:table-cell'} min-w-[180px] whitespace-nowrap px-5 py-3 text-xs font-semibold`}>現在のボール</th>
                    <th className={`${isDetailView ? 'table-cell' : 'hidden xl:table-cell'} min-w-[160px] whitespace-nowrap px-5 py-3 text-xs font-semibold`}>クローズ予定</th>
                    <th className={`${isDetailView ? 'table-cell' : 'hidden lg:table-cell'} min-w-[140px] whitespace-nowrap px-5 py-3 text-xs font-semibold`}>ヒアリング</th>
                    <th className={`${isDetailView ? 'table-cell' : 'hidden sm:table-cell'} min-w-[170px] whitespace-nowrap px-5 py-3 text-xs font-semibold`}>想定金額</th>
                    {isDetailView && (
                      <th className="min-w-[90px] whitespace-nowrap px-3 py-3 text-xs font-semibold sm:px-5">ランク</th>
                    )}
                    <th className="min-w-[64px] px-3 py-3 sm:px-5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredProjects.length === 0 && (
                    <tr>
                      <td colSpan={isDetailView ? 10 : 7} className="px-5 py-12 text-center text-sm text-gray-400 font-medium">
                        条件に一致する案件がありません
                      </td>
                    </tr>
                  )}
                  {filteredProjects.map((project, index) => {
                    const phaseIdx = PHASES.indexOf(project.status);
                    const progressPct = ((phaseIdx + 1) / PHASES.length) * 100;
                    const facilityMeta = getFacilityTypeMeta(project.facilityType);
                    const prefecture = getProjectPrefecture(project);
                    const caremaxSalesName = project.picCaremax
                      || caremaxStaffByNumber.get(project.picCaremaxStaffNumber)?.name
                      || '';
                    const ballOwner = normalizeBallOwner(project.ballOwner);
                    return (
                      <tr
                        key={`${project.id}-${project.updatedAt || index}`}
                        className={`group cursor-pointer transition-colors ${
                          project.isLost ? 'opacity-60 hover:opacity-80' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => onSelectProject(project.id)}
                      >
                        <td className={`min-w-[280px] px-3 py-4 sm:px-5 ${isDetailView ? 'sticky left-0 z-10 bg-white shadow-[8px_0_14px_-14px_rgba(15,23,42,0.6)] group-hover:bg-gray-50' : ''}`}>
                          <div className="flex items-center gap-2 whitespace-nowrap text-sm font-bold leading-tight text-gray-900 sm:text-base">
                            {isDetailView && facilityMeta.label && (
                              <span
                                className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-200/80 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 shadow-sm shadow-slate-200/40"
                                title={`施設業態: ${facilityMeta.label}`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${facilityMeta.markerClassName}`}
                                  aria-hidden="true"
                                />
                                {facilityMeta.label}
                              </span>
                            )}
                            <ProjectName name={project.name} className="whitespace-nowrap" />
                            {project.isLost && <span className="ml-1 text-[10px] font-bold text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">LOST</span>}
                          </div>
                          {caremaxSalesName && (
                            <div className="mt-1 whitespace-nowrap text-[11px] font-medium text-slate-400 sm:text-xs">
                              担当者：<span className="font-semibold text-slate-600">{caremaxSalesName}</span>
                            </div>
                          )}
                          {/* モバイル時のみ補助情報を行内に表示 */}
                          <div className={`${isDetailView ? 'hidden' : 'sm:hidden'} mt-2 space-y-1.5`}>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                              {isDetailView && (() => {
                                  const projectPrefecture = getProjectPrefecture(project);
                                  const p = project.salesPattern || '';
                                  const cfg = p.includes('パターン1') ? { dot: 'bg-sky-500', text: 'text-sky-700', short: '①完全卸し' }
                                            : p.includes('パターン2') ? { dot: 'bg-yellow-500', text: 'text-yellow-700', short: '②分離' }
                                            : p.includes('パターン3') ? { dot: 'bg-green-500', text: 'text-green-700', short: '③完全紹介' }
                                            : { dot: 'bg-gray-300', text: 'text-gray-500', short: '—' };
                                  return (
                                    <span className="inline-flex items-center gap-1 font-bold">
                                      {projectPrefecture && (
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                                          {projectPrefecture}
                                        </span>
                                      )}
                                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                      <span className={cfg.text}>{cfg.short}</span>
                                    </span>
                                  );
                                })()}
                              <span className="font-semibold text-purple-700">
                                {project.status}
                                <span className="ml-1 text-gray-400 tabular-nums">{phaseIdx + 1}/{PHASES.length}</span>
                              </span>
                              <span className="ml-auto font-semibold text-gray-700 tabular-nums">{formatJPY(project.financial.expectedRevenue || 0)}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-bold ring-1 ring-inset ${getBallOwnerTone(ballOwner.type)}`}>
                                <CircleDot className="h-3.5 w-3.5" />ボール: {getDashboardBallOwnerLabel(ballOwner)}
                              </span>
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-bold ring-1 ring-inset ${getCloseDateTone(project)}`}>
                                <Calendar className="h-3.5 w-3.5" />{formatCloseDate(project.expectedCloseDate)}
                              </span>
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-bold ring-1 ring-inset ${project.hasIctHearingSheet ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-gray-100 text-gray-500 ring-gray-200'}`}>
                                <FileText className="h-3.5 w-3.5" />ヒアリング {project.hasIctHearingSheet ? 'あり' : 'なし'}
                              </span>
                            </div>
                            {/* モバイル用 進捗バー */}
                            <MiniArrowDiagram currentPhase={project.status} />
                          </div>
                        </td>
                        {isDetailView && (
                          <td className="min-w-[110px] whitespace-nowrap px-5 py-4">
                            {prefecture ? (
                              <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-inset ring-slate-200">
                                {prefecture}
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-gray-300">—</span>
                            )}
                          </td>
                        )}
                        {isDetailView && (
                          <td className="min-w-[150px] whitespace-nowrap px-5 py-4">
                            {(() => {
                              const p = project.salesPattern || '';
                              const cfg = p.includes('パターン1') ? { dot: 'bg-sky-500',    text: 'text-sky-700',    short: '①完全卸し' }
                                        : p.includes('パターン2') ? { dot: 'bg-yellow-500', text: 'text-yellow-700', short: '②分離' }
                                        : p.includes('パターン3') ? { dot: 'bg-green-500',  text: 'text-green-700',  short: '③完全紹介' }
                                        : { dot: 'bg-gray-300', text: 'text-gray-500', short: '—' };
                              return (
                                <div className="flex items-center gap-2">
                                  <span className={`inline-block w-2 h-2 rounded-full ${cfg.dot}`} />
                                  <div className={`text-xs font-bold ${cfg.text}`}>{cfg.short}</div>
                                </div>
                              );
                            })()}
                          </td>
                        )}
                        <td className={`${isDetailView ? 'table-cell' : 'hidden md:table-cell'} min-w-[300px] px-5 py-4`}>
                          <div className={`mb-1.5 text-sm font-extrabold tracking-tight ${project.isLost ? 'text-gray-500' : 'text-gray-900'}`}>
                            {project.status} <span className="ml-1 text-xs font-bold tabular-nums text-gray-400">{phaseIdx + 1}/{PHASES.length}</span>
                          </div>
                          <MiniArrowDiagram currentPhase={project.status} />
                        </td>
                        <td className={`${isDetailView ? 'table-cell' : 'hidden lg:table-cell'} min-w-[180px] px-5 py-4`}>
                          <span className={`inline-flex max-w-[150px] items-center gap-1.5 truncate rounded-full px-3 py-1.5 text-xs font-extrabold ring-1 ring-inset ${getBallOwnerTone(ballOwner.type)}`} title={getBallOwnerLabel(ballOwner)}>
                            <CircleDot className="h-4 w-4 shrink-0" strokeWidth={2.2} />
                            <span className="truncate">{getDashboardBallOwnerLabel(ballOwner)}</span>
                          </span>
                        </td>
                        <td className={`${isDetailView ? 'table-cell' : 'hidden xl:table-cell'} min-w-[160px] px-5 py-4`}>
                          <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-extrabold tabular-nums ring-1 ring-inset ${getCloseDateTone(project)}`}>
                            <Calendar className="h-4 w-4" strokeWidth={2.2} />
                            {formatCloseDate(project.expectedCloseDate)}
                          </span>
                        </td>
                        <td className={`${isDetailView ? 'table-cell' : 'hidden lg:table-cell'} min-w-[140px] px-5 py-4`}>
                          <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-extrabold ring-1 ring-inset ${project.hasIctHearingSheet ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-gray-100 text-gray-500 ring-gray-200'}`}>
                            <FileText className="h-4 w-4" strokeWidth={2.2} />{project.hasIctHearingSheet ? 'あり' : 'なし'}
                          </span>
                        </td>
                        <td className={`${isDetailView ? 'table-cell' : 'hidden sm:table-cell'} min-w-[170px] px-5 py-4`}>
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-slate-50 px-3 py-1.5 text-sm font-extrabold tabular-nums text-slate-700 ring-1 ring-inset ring-slate-100">
                            <JapaneseYen className="h-4 w-4 text-slate-400" strokeWidth={2.3} />
                            {formatJPY(project.financial.expectedRevenue || 0)}
                          </span>
                        </td>
                        {isDetailView && (
                          <td className="min-w-[90px] whitespace-nowrap px-3 py-4 sm:px-5">
                            <RankBadge rank={project.rank} />
                          </td>
                        )}
                        <td className="px-5 py-4 text-right">
                          {project.isLost ? (
                            <button
                              onClick={e => { e.stopPropagation(); setLostInfoModal(project); }}
                              className="px-2.5 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50 rounded-full"
                            >
                              失注情報
                            </button>
                          ) : (
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 ring-1 ring-inset ring-slate-200 transition-all group-hover:bg-purple-50 group-hover:text-purple-700 group-hover:ring-purple-200">
                              <ChevronRight className="h-5 w-5" strokeWidth={2.3} />
                            </span>
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
      </>
      )}

      {/* 失注情報モーダル */}
      {lostInfoModal && (
        <div className="mobile-sheet fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm" onClick={() => setLostInfoModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-red-500 uppercase tracking-wider">LOST</p>
                  <h4 className="text-base font-bold text-gray-900 leading-tight">
                    <ProjectName name={lostInfoModal.name} />
                  </h4>
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
        <div className="mobile-sheet fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
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
                <p className="mt-1 text-[11px] font-medium text-gray-400">
                  「様」は一覧・詳細画面で自動表示されます
                </p>
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
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">都道府県</label>
                <select
                  value={newProject.prefecture}
                  onChange={(e) => setNewProject({ ...newProject, prefecture: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none appearance-none cursor-pointer"
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
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  ケアマックス営業担当者 <span className="text-red-500">*</span>
                  <span className="ml-2 text-[10px] font-normal text-purple-600">案件追加で25 EXP</span>
                </label>
                <select
                  required
                  value={newProject.picCaremaxStaffNumber}
                  onChange={(e) => setNewProject({ ...newProject, picCaremaxStaffNumber: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="">担当営業者を選択してください</option>
                  {caremaxSalesStaff.map(member => (
                    <option key={member.staffNumber} value={member.staffNumber}>
                      {member.staffNumber}｜{member.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">販売スキーム</label>
                  <select
                    value={newProject.salesPattern}
                    onChange={(e) => setNewProject({ ...newProject, salesPattern: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="パターン1（完全卸し）">①完全卸し</option>
                    <option value="パターン2（分離）">②分離</option>
                    <option value="パターン3（完全紹介）">③完全紹介</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">施設業態</label>
                  <select
                    value={newProject.facilityType}
                    onChange={(e) => setNewProject({ ...newProject, facilityType: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none appearance-none cursor-pointer"
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


export default Dashboard;
