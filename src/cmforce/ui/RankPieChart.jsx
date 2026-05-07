import React from 'react';

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


export default RankPieChart;