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
import { DEPARTMENT_OPTIONS, initialStaff } from './cmforce/data/staff.js';
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
import { ToastProvider } from './cmforce/ui/Toast.jsx';
import Logo from './cmforce/ui/Logo.jsx';
import { AssistProvider, AssistTip } from './cmforce/ui/AssistMode.jsx';

const ASSIST_STORAGE_KEY = 'cm-force-assist-v1';
import {
  PROJECTS_STORAGE_KEY,
  STAFF_STORAGE_KEY,
  loadJson,
  saveJson,
} from './cmforce/data/storage.js';
import {
  PROJECTS_COLLECTION,
  STAFF_COLLECTION,
  subscribeToCollection,
  saveDocument,
  deleteDocument,
  seedIfEmpty,
} from './cmforce/data/firestoreSync.js';





// --- メインアプリ ---
export default function App() {
  // 初期値: localStorage（オフラインバックアップ）→ mock の順でフォールバック
  const [projects, setProjects] = useState(() => loadJson(PROJECTS_STORAGE_KEY, mockProjects));
  const [staff, setStaff] = useState(() => loadJson(STAFF_STORAGE_KEY, initialStaff));

  // localStorage バックアップ（Firestore 不通時の保険）
  useEffect(() => { saveJson(PROJECTS_STORAGE_KEY, projects); }, [projects]);
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
        if (!canceled && items.length > 0) setProjects(items);
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
        if (!canceled && items.length > 0) setStaff(items);
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
      return ROLE_LIST.includes(parsed?.role) ? parsed.role : null;
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

  const canViewKpi = KPI_ALLOWED_ROLES.includes(currentRole);
  const canManageStaff = STAFF_ADMIN_ROLES.includes(currentRole);
  const canSeeKaientaiQuest = KAIENTAI_QUEST_ROLES.includes(currentRole);
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
    saveDocument(PROJECTS_COLLECTION, newProject.id, newProject);
  };

  const handleUpdateProject = (updatedProject) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    saveDocument(PROJECTS_COLLECTION, updatedProject.id, updatedProject);
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
    <div className="min-h-screen bg-gray-50/80">
      {/* トップナビゲーション */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <AssistTip text={"クリックでダッシュボード（案件一覧）に戻ります。\nどの画面からでもホームへ。"} side="bottom">
              <button
                onClick={() => { setSelectedProjectId(null); setCurrentTab('dashboard'); }}
                className="mr-6 -mt-3 hover:opacity-80 transition-opacity focus:outline-none"
                aria-label="CM Force ホームへ"
              >
                <Logo className="h-14 w-auto" />
              </button>
            </AssistTip>
            {!selectedProject && (
              <>
                <AssistTip text={"案件一覧・絞り込み・新規追加の起点。\nまずはここから案件全体の状況を確認しましょう。"} side="bottom">
                  <button
                    onClick={() => setCurrentTab('dashboard')}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${currentTab === 'dashboard' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    ダッシュボード
                  </button>
                </AssistTip>
                {canViewKpi && (
                  <AssistTip text={"全社/担当者別の数字（受注・売上・進捗ファネル）を一覧。\n月次レビューや戦略会議の前に開いてください。"} side="bottom">
                    <button
                      onClick={() => setCurrentTab('kpi')}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition-colors flex items-center ${currentTab === 'kpi' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      <BarChart3 className="w-4 h-4 mr-1.5" />
                      ケアマックス KPI
                    </button>
                  </AssistTip>
                )}
                {canManageStaff && (
                  <AssistTip text={"営業企画専用。担当者の追加・編集・部署変更ができます。\n新メンバー入社時に登録してください。"} side="bottom">
                    <button
                      onClick={() => setCurrentTab('staff')}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition-colors flex items-center ${currentTab === 'staff' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      <Users className="w-4 h-4 mr-1.5" />
                      担当者管理
                    </button>
                  </AssistTip>
                )}
                {canSeeKaientaiQuest && (
                  <AssistTip text={"営業活動を RPG 風に可視化。チームの稼働や貢献度をゲーム感覚で確認できます。"} side="bottom">
                    <button
                      onClick={() => { setSelectedProjectId(null); setCurrentTab('quest'); }}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition-colors flex items-center ${currentTab === 'quest' ? 'bg-slate-900 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      <Award className={`w-4 h-4 mr-1.5 ${currentTab === 'quest' ? 'text-amber-300' : 'text-orange-500'}`} />
                      QUEST
                    </button>
                  </AssistTip>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <AssistTip text={assistMode
              ? "アシストモード: ON\nボタンやタブにマウスを乗せると説明と次の行動アドバイスが表示されます。クリックで OFF。"
              : "アシストモードを ON にすると、各ボタン・タブの説明と次の行動アドバイスがホバーで表示されます。"
            } side="bottom">
              <button
                type="button"
                onClick={() => setAssistMode((v) => !v)}
                className={`inline-flex items-center gap-1 text-xs font-bold rounded-full px-3 py-1.5 border transition-colors ${
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
            <span className="hidden sm:inline text-xs font-semibold text-gray-400">ロール</span>
            <AssistTip text={"現在のログインロール。閲覧/編集できる範囲が決まります。\n変更にはログアウトが必要です。"} side="bottom">
              <span className="text-sm font-bold text-purple-700 bg-purple-50 border border-purple-100 rounded-full px-3 py-1.5">
                {currentRole}
              </span>
            </AssistTip>
            <AssistTip text={"ログアウトしてログイン画面に戻ります。\n入力中のデータは保存済みなので失われません。"} side="bottom">
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full px-3 py-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ログアウト</span>
              </button>
            </AssistTip>
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
        ) : currentTab === 'quest' && canSeeKaientaiQuest ? (
          <div className="-mx-6 -my-8 min-h-[calc(100vh-4rem)] bg-neutral-950">
            <KaientaiQuest />
          </div>
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
            canExportCsv={currentRole === ROLES.KIKAKU || currentRole === ROLES.SETUP}
          />
        )}
      </div>
    </div>
    </AssistProvider>
    </ToastProvider>
  );
}
