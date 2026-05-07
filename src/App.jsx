import React, { useState, useMemo, useEffect } from 'react';
import KaientaiQuest from './KaientaiQuest.jsx';
import {
  BarChart3, Users, Building, FileText,
  ChevronRight, AlertCircle, Clock,
  CheckCircle2, Search, Filter, ArrowLeft,
  MessageSquare, Calendar, Download, Edit,
  Trash2, CheckSquare, Check, Plus, X, ArrowUpDown,
  Link as LinkIcon, ExternalLink,
  TrendingUp, Target, Award, PieChart, LogOut
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





// --- メインアプリ ---
export default function App() {
  const [projects, setProjects] = useState(mockProjects);
  const [staff, setStaff] = useState(initialStaff);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [currentRole, setCurrentRole] = useState(ROLES.KIKAKU);
  const [currentTab, setCurrentTab] = useState(() => window.location.hash === '#quest' ? 'quest' : 'dashboard'); // 'dashboard' | 'kpi' | 'staff' | 'quest'
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
                  <button
                    onClick={() => { setSelectedProjectId(null); setCurrentTab('quest'); }}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-colors flex items-center ${currentTab === 'quest' ? 'bg-slate-900 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <Award className={`w-4 h-4 mr-1.5 ${currentTab === 'quest' ? 'text-amber-300' : 'text-orange-500'}`} />
                    QUEST
                  </button>
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
        ) : currentTab === 'quest' && canSeeKaientaiQuest ? (
          <div className="-mx-6 -my-8 min-h-[calc(100vh-3.5rem)] bg-neutral-950">
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
          />
        )}
      </div>
    </div>
  );
}
