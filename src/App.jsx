import React, { useState, useMemo, useEffect } from 'react';
import KaientaiQuest from './KaientaiQuest.jsx';
import {
  BarChart3, Users, Building, FileText,
  ChevronRight, AlertCircle, Clock,
  CheckCircle2, Search, Filter, ArrowLeft,
  MessageSquare, Calendar, Download, Edit,
  Trash2, CheckSquare, Check, Plus, X, ArrowUpDown,
  Link as LinkIcon, ExternalLink,
  TrendingUp, Target, Award, PieChart, LogOut,
  Sparkles
} from 'lucide-react';
import {
  ROLES,
  ROLE_LIST,
  KPI_ALLOWED_ROLES,
  STAFF_ADMIN_ROLES,
  KAIENTAI_QUEST_ROLES,
  normalizeRole,
} from './cmforce/data/roles.js';
import {
  PHASES,
  KAIENTAI_SUB,
  BRANCH_PHASE,
  MERGE_PHASE,
  MARGIN_BRANCH_PHASE,
  MARGIN_MERGE_PHASE,
  isBranchablePattern,
  getMarginSteps,
  isMarginBranchablePattern,
} from './cmforce/data/phases.js';
import { mockProjects } from './cmforce/data/mockProjects.js';
import { DEPARTMENT_OPTIONS, initialStaff, normalizeStaffMembers } from './cmforce/data/staff.js';
import { formatJPY, formatJPYShort } from './cmforce/utils/format.js';
import Card from './cmforce/ui/Card.jsx';
import Badge from './cmforce/ui/Badge.jsx';
import RankBadge, { RANK_STYLES } from './cmforce/ui/RankBadge.jsx';
import MiniArrowDiagram from './cmforce/ui/MiniArrowDiagram.jsx';
import ArrowDiagram from './cmforce/ui/ArrowDiagram.jsx';
import PhaseDetailPanel from './cmforce/ui/PhaseDetailPanel.jsx';
import RankPieChart from './cmforce/ui/RankPieChart.jsx';
import Dashboard from './cmforce/views/Dashboard.jsx';
import ProjectDetail from './cmforce/views/ProjectDetail.jsx';
import KpiView from './cmforce/views/KpiView.jsx';
import StaffView from './cmforce/views/StaffView.jsx';
import LoginScreen from './cmforce/views/LoginScreen.jsx';
import { AUTH_STORAGE_KEY } from './cmforce/data/auth.js';
import { normalizeFacilityType } from './cmforce/data/facilityTypes.js';
import { extractPrefectureFromAddress, normalizePrefecture } from './cmforce/data/prefectures.js';
import { ToastProvider } from './cmforce/ui/Toast.jsx';
import Logo from './cmforce/ui/Logo.jsx';
import { AssistProvider, AssistTip } from './cmforce/ui/AssistMode.jsx';
import { stripProjectHonorific } from './cmforce/utils/projectName.js';
import { normalizeBallOwner } from './cmforce/data/ballOwners.js';

const ASSIST_STORAGE_KEY = 'cm-force-assist-v1';
import {
  PROJECTS_STORAGE_KEY,
  PROJECTS_HISTORY_STORAGE_KEY,
  STAFF_STORAGE_KEY,
  loadJson,
  saveJson,
  appendJsonHistory,
} from './cmforce/data/storage.js';
import {
  PROJECTS_COLLECTION,
  STAFF_COLLECTION,
  subscribeToCollection,
  createProjectDocument,
  saveProjectDocument,
  deleteProjectDocument,
  saveDocument,
  deleteDocument,
  seedIfEmpty,
} from './cmforce/data/firestoreSync.js';

const normalizeProjectRecord = (project = {}) => ({
  ...project,
  name: stripProjectHonorific(project?.name || ''),
  facilityType: normalizeFacilityType(project?.facilityType),
  hasIctHearingSheet: Boolean(project?.hasIctHearingSheet),
  ballOwner: normalizeBallOwner(project?.ballOwner),
  endUser: {
    ...(project?.endUser || {}),
    prefecture: normalizePrefecture(project?.endUser?.prefecture)
      || extractPrefectureFromAddress(project?.endUser?.address),
  },
});

const normalizeProjects = (items = []) =>
  Array.isArray(items) ? items.map(normalizeProjectRecord) : [];





// --- メインアプリ ---
export default function App() {
  // 初期値: localStorage（オフラインバックアップ）→ mock の順でフォールバック
  const [projects, setProjects] = useState(() => normalizeProjects(loadJson(PROJECTS_STORAGE_KEY, mockProjects)));
  const [staff, setStaff] = useState(() => normalizeStaffMembers(loadJson(STAFF_STORAGE_KEY, initialStaff)));

  // localStorage バックアップ（Firestore 不通時の保険）
  useEffect(() => {
    saveJson(PROJECTS_STORAGE_KEY, projects);
    appendJsonHistory(PROJECTS_HISTORY_STORAGE_KEY, projects, 8);
  }, [projects]);
  useEffect(() => { saveJson(STAFF_STORAGE_KEY, staff); }, [staff]);

  // Firestore リアルタイム同期: マウント時に空コレクションをシード→ 購読開始
  useEffect(() => {
    let canceled = false;
    let unsub = null;
    (async () => {
      // 初回起動時、Firestore が空なら現在の (localStorage or mock) データを移行
      await seedIfEmpty(PROJECTS_COLLECTION, projects);
      if (canceled) return;
      unsub = subscribeToCollection(PROJECTS_COLLECTION, (items) => {
        if (!canceled && items.length > 0) setProjects(normalizeProjects(items));
      });
    })();
    return () => { canceled = true; if (unsub) unsub(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let canceled = false;
    let unsub = null;
    (async () => {
      await seedIfEmpty(STAFF_COLLECTION, staff);
      if (canceled) return;
      unsub = subscribeToCollection(STAFF_COLLECTION, (items) => {
        if (!canceled && items.length > 0) setStaff(normalizeStaffMembers(items));
      });
    })();
    return () => { canceled = true; if (unsub) unsub(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  // 認証状態は localStorage から復元
  const [authedRole, setAuthedRole] = useState(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const normalizedRole = normalizeRole(parsed?.role);
      return ROLE_LIST.includes(normalizedRole) ? normalizedRole : null;
    } catch {
      return null;
    }
  });
  const [currentRole, setCurrentRole] = useState(authedRole || ROLES.KIKAKU);
  const [currentTab, setCurrentTab] = useState(() => window.location.hash === '#quest' ? 'quest' : 'dashboard'); // 'dashboard' | 'kpi' | 'staff' | 'quest'
  // アシストモード: ON でホバー時にヒントを出す。localStorage 永続化。
  const [assistMode, setAssistMode] = useState(() => {
    try { return localStorage.getItem(ASSIST_STORAGE_KEY) === 'on'; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem(ASSIST_STORAGE_KEY, assistMode ? 'on' : 'off'); } catch { /* ignore */ }
  }, [assistMode]);

  const handleLogin = (role) => {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ role, at: Date.now() }));
    } catch {
      // ignore storage errors
    }
    setAuthedRole(role);
    setCurrentRole(role);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
    setAuthedRole(null);
    setSelectedProjectId(null);
    setCurrentTab('dashboard');
  };
  const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null;

  // 営業部は閲覧専用。新規追加 / 編集 / 削除 / 失注 / フェーズ進行などの書き込み操作は不可。
  const canEdit = currentRole !== ROLES.EIGYO;
  const canViewKpi = KPI_ALLOWED_ROLES.includes(currentRole);
  const canManageStaff = STAFF_ADMIN_ROLES.includes(currentRole);
  const canSeeKaientaiQuest = KAIENTAI_QUEST_ROLES.includes(currentRole);
  const isQuestView = currentTab === 'quest' && canSeeKaientaiQuest && !selectedProject;
  // ロール切替時にアクセス権がないタブはダッシュボードに戻す
  React.useEffect(() => {
    if (!canViewKpi && currentTab === 'kpi') setCurrentTab('dashboard');
    if (!canManageStaff && currentTab === 'staff') setCurrentTab('dashboard');
    if (!canSeeKaientaiQuest && currentTab === 'quest') setCurrentTab('dashboard');
  }, [currentRole, canViewKpi, canManageStaff, canSeeKaientaiQuest, currentTab]);

  React.useEffect(() => {
    const hash = currentTab === 'quest' ? '#quest' : '';
    if (window.location.hash !== hash) {
      window.history.replaceState(null, '', `${window.location.pathname}${hash}`);
    }
  }, [currentTab]);

  const handleSaveStaff = (s) => {
    // 楽観的更新: UI を即反映 → Firestore へ書き込み (onSnapshot で再同期)
    setStaff(prev => prev.some(x => x.id === s.id) ? prev.map(x => x.id === s.id ? s : x) : [...prev, s]);
    saveDocument(STAFF_COLLECTION, s.id, s);
  };
  const handleDeleteStaff = (id) => {
    setStaff(prev => prev.filter(s => s.id !== id));
    deleteDocument(STAFF_COLLECTION, id);
  };

  const handleAddProject = async (projectData) => {
    const baseProject = {
      name: stripProjectHonorific(projectData.name),
      status: '案件発掘',
      startDate: new Date().toISOString().split('T')[0],
      expectedCloseDate: '',
      rank: 'B',
      salesPattern: projectData.salesPattern,
      facilityType: normalizeFacilityType(projectData.facilityType),
      hasIctHearingSheet: false,
      ballOwner: { type: '', name: '', updatedAt: '' },
      updatedAt: new Date().toISOString(),
      summary: '',
      picSetup: '',
      picCaremax: projectData.picCaremax,
      picCaremaxStaffNumber: projectData.picCaremaxStaffNumber,
      endUser: {
        companyName: projectData.companyName,
        prefecture: normalizePrefecture(projectData.prefecture),
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
    const createdProject = await createProjectDocument(baseProject, projects);
    if (!createdProject) return;

    setProjects(prev => (
      prev.some((project) => project.id === createdProject.id)
        ? prev.map((project) => project.id === createdProject.id ? createdProject : project)
        : [...prev, createdProject]
    ));
  };

  const handleUpdateProject = async (updatedProject) => {
    const normalizedProject = normalizeProjectRecord(updatedProject);
    const previousProject = projects.find((project) => project.id === updatedProject.id);
    setProjects(prev => prev.map(p => p.id === normalizedProject.id ? normalizedProject : p));
    const savedProject = await saveProjectDocument(normalizedProject.id, normalizedProject);
    if (!savedProject && previousProject) {
      setProjects(prev => prev.map((project) => (
        project.id === previousProject.id ? previousProject : project
      )));
      return;
    }

    if (savedProject) {
      setProjects(prev => prev.map((project) => (
        project.id === savedProject.id ? savedProject : project
      )));
    }
  };

  const handleDeleteProject = async (projectId) => {
    const previousProjects = projects;
    setProjects(prev => prev.filter(p => p.id !== projectId));
    const deleted = await deleteProjectDocument(projectId);
    if (!deleted) {
      setProjects(previousProjects);
      return;
    }
    // 削除した案件が選択中なら詳細を閉じてダッシュボードへ戻る
    if (selectedProjectId === projectId) setSelectedProjectId(null);
  };

  if (!authedRole) {
    return (
      <ToastProvider>
        <LoginScreen onLogin={handleLogin} />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
    <AssistProvider enabled={assistMode}>
    <div className="cm-app min-h-screen">
      {/* トップナビゲーション */}
      <div className={`cm-topbar border-b sticky top-0 z-40 ${isQuestView ? 'hidden sm:block' : ''}`}>
        <div className="cm-topbar-inner max-w-[1440px] mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
          <div className="cm-topbar-leading flex items-center space-x-1 min-w-0 flex-1 overflow-x-auto no-scrollbar">
            <AssistTip text={"クリックでダッシュボード（案件一覧）に戻ります。\nどの画面からでもホームへ。"} side="bottom">
              <button
                onClick={() => { setSelectedProjectId(null); setCurrentTab('dashboard'); }}
                className="cm-logo-button shrink-0 mr-2 sm:mr-7 hover:opacity-70 transition-opacity focus:outline-none"
                aria-label="CM Force ホームへ"
              >
                <Logo className="h-9 sm:h-11 w-auto" />
              </button>
            </AssistTip>
            {!selectedProject && (
              <div className="cm-nav-tabs hidden sm:flex items-center space-x-1">
                <AssistTip text={"案件一覧・絞り込み・新規追加の起点。\nまずはここから案件全体の状況を確認しましょう。"} side="bottom">
                  <button
                    onClick={() => setCurrentTab('dashboard')}
                    className={`cm-nav-button shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-colors ${currentTab === 'dashboard' ? 'is-active bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <span className="sm:hidden">ホーム</span>
                    <span className="hidden sm:inline">ダッシュボード</span>
                  </button>
                </AssistTip>
                {canViewKpi && (
                  <AssistTip text={"全社/担当者別の数字（受注・売上・進捗ファネル）を一覧。\n月次レビューや戦略会議の前に開いてください。"} side="bottom">
                    <button
                      onClick={() => setCurrentTab('kpi')}
                      className={`cm-nav-button shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-colors flex items-center ${currentTab === 'kpi' ? 'is-active bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                      aria-label="ケアマックス KPI"
                    >
                      <BarChart3 className="w-4 h-4 sm:mr-1.5" />
                      <span className="hidden sm:inline">ケアマックス KPI</span>
                    </button>
                  </AssistTip>
                )}
                {canManageStaff && (
                  <AssistTip text={"営業企画専用。担当者の追加・編集・部署変更ができます。\n新メンバー入社時に登録してください。"} side="bottom">
                    <button
                      onClick={() => setCurrentTab('staff')}
                      className={`cm-nav-button shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-colors flex items-center ${currentTab === 'staff' ? 'is-active bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                      aria-label="担当者管理"
                    >
                      <Users className="w-4 h-4 sm:mr-1.5" />
                      <span className="hidden sm:inline">担当者管理</span>
                    </button>
                  </AssistTip>
                )}
                {canSeeKaientaiQuest && (
                  <AssistTip text={"営業活動を RPG 風に可視化。チームの稼働や貢献度をゲーム感覚で確認できます。"} side="bottom">
                    <button
                      onClick={() => { setSelectedProjectId(null); setCurrentTab('quest'); }}
                      className={`cm-nav-button shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-colors flex items-center ${currentTab === 'quest' ? 'is-active bg-slate-900 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                      aria-label="QUEST"
                    >
                      <Award className={`w-4 h-4 sm:mr-1.5 ${currentTab === 'quest' ? 'text-amber-300' : 'text-orange-500'}`} />
                      <span className="hidden sm:inline">QUEST</span>
                    </button>
                  </AssistTip>
                )}
              </div>
            )}
          </div>
          <div className="cm-toolbar-actions flex items-center gap-1 sm:gap-2 shrink-0">
            <AssistTip text={assistMode
              ? "アシストモード: ON\nボタンやタブにマウスを乗せると説明と次の行動アドバイスが表示されます。クリックで OFF。"
              : "アシストモードを ON にすると、各ボタン・タブの説明と次の行動アドバイスがホバーで表示されます。"
            } side="bottom">
              <button
                type="button"
                onClick={() => setAssistMode((v) => !v)}
                className={`inline-flex items-center gap-1 text-xs font-bold rounded-full px-2.5 sm:px-3 py-1.5 border transition-colors ${
                  assistMode
                    ? 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
                aria-pressed={assistMode}
                title="アシストモード"
              >
                <Sparkles className={`w-3.5 h-3.5 ${assistMode ? 'text-amber-600' : 'text-gray-400'}`} />
                <span className="hidden sm:inline">アシスト{assistMode ? 'ON' : 'OFF'}</span>
              </button>
            </AssistTip>
            <span className="hidden md:inline text-xs font-semibold text-gray-400">ロール</span>
            <AssistTip text={"現在のログインロール。閲覧/編集できる範囲が決まります。\n変更にはログアウトが必要です。"} side="bottom" wrapClassName="hidden sm:inline-flex">
              <span className="cm-role-pill text-xs sm:text-sm font-bold text-gray-800 bg-white border border-gray-200 rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 whitespace-nowrap">
                {currentRole}
              </span>
            </AssistTip>
            <AssistTip text={"ログアウトしてログイン画面に戻ります。\n入力中のデータは保存済みなので失われません。"} side="bottom">
              <button
                type="button"
                onClick={handleLogout}
                className="cm-signout-button inline-flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full px-2.5 sm:px-3 py-1.5 transition-colors"
                aria-label="ログアウト"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ログアウト</span>
              </button>
            </AssistTip>
          </div>
        </div>
      </div>

      <div className={`cm-main cm-content max-w-[1440px] mx-auto ${
        isQuestView
          ? 'h-[100dvh] overflow-hidden p-0 sm:h-auto sm:overflow-visible sm:px-6 sm:py-10'
          : 'px-3 pt-4 pb-24 sm:px-6 sm:py-10'
      }`}>
        {selectedProject ? (
          <ProjectDetail
            project={selectedProject}
            onBack={() => setSelectedProjectId(null)}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={canEdit ? handleDeleteProject : undefined}
            canEdit={canEdit}
            currentRole={currentRole}
            staff={staff}
          />
        ) : currentTab === 'quest' && canSeeKaientaiQuest ? (
          <div className="quest-app-host h-full min-h-[100dvh] bg-neutral-950 sm:-mx-6 sm:-my-8 sm:h-auto sm:min-h-[calc(100vh-4rem)]">
            <KaientaiQuest projects={projects} staff={staff} />
          </div>
        ) : currentTab === 'kpi' && canViewKpi ? (
          <KpiView projects={projects} onSelectProject={setSelectedProjectId} />
        ) : currentTab === 'staff' && canManageStaff ? (
          <StaffView staff={staff} onSave={handleSaveStaff} onDelete={handleDeleteStaff} />
        ) : (
          <Dashboard
            projects={projects}
            staff={staff}
            onSelectProject={setSelectedProjectId}
            onAddProject={handleAddProject}
            canViewProfit={canViewKpi}
            canExportCsv={currentRole === ROLES.KIKAKU || currentRole === ROLES.SETUP}
            canEdit={canEdit}
            canSwitchDashboardMode={currentRole === ROLES.KIKAKU}
          />
        )}
      </div>

      {currentTab !== 'quest' && (
      <nav className="mobile-bottom-nav cm-mobile-nav fixed inset-x-3 bottom-3 z-50 flex items-center gap-1 rounded-[20px] border border-black/10 bg-white/95 p-1.5 shadow-[0_14px_40px_rgba(0,0,0,0.16)] backdrop-blur-xl sm:hidden">
        <button
          type="button"
          onClick={() => { setSelectedProjectId(null); setCurrentTab('dashboard'); }}
          className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-2xl py-2 text-[9px] font-bold ${
            currentTab === 'dashboard' ? 'bg-black text-white' : 'text-gray-500'
          }`}
        >
          <Building className="mb-1 h-4 w-4" />
          案件
        </button>
        {canViewKpi && (
          <button
            type="button"
            onClick={() => { setSelectedProjectId(null); setCurrentTab('kpi'); }}
            className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-2xl py-2 text-[9px] font-bold ${
              !selectedProject && currentTab === 'kpi' ? 'bg-black text-white' : 'text-gray-500'
            }`}
          >
            <BarChart3 className="mb-1 h-4 w-4" />
            KPI
          </button>
        )}
        {canManageStaff && (
          <button
            type="button"
            onClick={() => { setSelectedProjectId(null); setCurrentTab('staff'); }}
            className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-2xl py-2 text-[9px] font-bold ${
              !selectedProject && currentTab === 'staff' ? 'bg-black text-white' : 'text-gray-500'
            }`}
          >
            <Users className="mb-1 h-4 w-4" />
            担当者
          </button>
        )}
        {canSeeKaientaiQuest && (
          <button
            type="button"
            onClick={() => { setSelectedProjectId(null); setCurrentTab('quest'); }}
            className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-2xl py-2 text-[9px] font-bold ${
              !selectedProject && currentTab === 'quest' ? 'bg-black text-white' : 'text-gray-500'
            }`}
          >
            <Award className="mb-1 h-4 w-4" />
            QUEST
          </button>
        )}
      </nav>
      )}
    </div>
    </AssistProvider>
    </ToastProvider>
  );
}
