import React from 'react';
import {
  ArrowLeft,
  Building,
  ChevronRight,
} from 'lucide-react';
import { PHASES } from '../data/phases.js';
import { formatJPY, formatJPYShort } from '../utils/format.js';
import Card from '../ui/Card.jsx';
import RankBadge from '../ui/RankBadge.jsx';

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


export default KpiDetailView;