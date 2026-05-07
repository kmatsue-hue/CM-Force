import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronRight,
  Filter,
  Plus,
  Search,
  TrendingUp,
  X,
} from 'lucide-react';
import { PHASES } from '../data/phases.js';
import { formatJPY, formatJPYShort } from '../utils/format.js';
import Card from '../ui/Card.jsx';
import RankBadge from '../ui/RankBadge.jsx';
import RankPieChart from '../ui/RankPieChart.jsx';
import MiniArrowDiagram from '../ui/MiniArrowDiagram.jsx';

// --- ダッシュボード ---
const Dashboard = ({ projects, onSelectProject, onAddProject, canViewProfit = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const filterMenuRef = React.useRef(null);
  const filterButtonRef = React.useRef(null);
  // ポップアップは Portal で body に出すため、ボタンの座標を保持して fixed 配置する
  const [filterMenuPos, setFilterMenuPos] = useState({ top: 0, right: 0 });
  const [filterConfig, setFilterConfig] = useState({ patterns: [], statuses: [], pics: [] });

  // ボタンの位置を計算してポップアップを開く
  const openFilterMenu = () => {
    if (filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      setFilterMenuPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setIsFilterMenuOpen((prev) => !prev);
  };

  // 絞り込みポップの外側クリック・スクロール・リサイズで閉じる
  useEffect(() => {
    if (!isFilterMenuOpen) return;
    const handleClickOutside = (e) => {
      if (
        filterMenuRef.current && !filterMenuRef.current.contains(e.target) &&
        filterButtonRef.current && !filterButtonRef.current.contains(e.target)
      ) {
        setIsFilterMenuOpen(false);
      }
    };
    const handleReposition = () => setIsFilterMenuOpen(false);
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
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
                <div>
                  <button
                    ref={filterButtonRef}
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
                      style={{ position: 'fixed', top: filterMenuPos.top, right: filterMenuPos.right, zIndex: 200 }}
                      className="w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 max-h-[70vh] overflow-y-auto"
                    >
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
                    </div>,
                    document.body
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


export default Dashboard;