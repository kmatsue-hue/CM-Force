import React, { useState } from 'react';
import {
  Award,
  BarChart3,
  ChevronRight,
  Download,
  FileText,
  MessageSquare,
  PieChart,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { PHASES } from '../data/phases.js';
import { formatJPYShort } from '../utils/format.js';
import Card from '../ui/Card.jsx';
import KpiDetailView from './KpiDetailView.jsx';

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


export default KpiView;