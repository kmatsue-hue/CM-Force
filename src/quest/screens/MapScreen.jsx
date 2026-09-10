import React from 'react';
import { getCharInfo } from '../utils/userLevel.js';
import DqWindow from '../ui/DqWindow.jsx';
import CharacterIcon from '../ui/CharacterIcon.jsx';

const STATUS_STYLES = {
  未着手: 'border-slate-400 bg-slate-800 text-slate-100',
  ヒアリング中: 'border-cyan-300 bg-cyan-950 text-cyan-100',
  見積もり中: 'border-yellow-300 bg-yellow-950 text-yellow-100',
  契約済み: 'border-emerald-300 bg-emerald-950 text-emerald-100',
};

const formatYen = value => `${Math.max(0, Number(value) || 0).toLocaleString('ja-JP')}円`;

const MapScreen = ({
  clients,
  user,
  sortClientsByMode,
  resolveClientOwnerName,
}) => {
  const listedClients = sortClientsByMode(clients, 'all');

  return (
    <div className="animate-fadeIn p-3 pb-20">
      <DqWindow title={`案件一覧　${listedClients.length}件`} className="relative">
        <div className="mt-2 space-y-2.5">
          {listedClients.length === 0 && (
            <div className="border-[2px] border-dashed border-white/50 px-4 py-10 text-center">
              <div className="text-[16px]">案件がありません</div>
            </div>
          )}

          {listedClients.map(client => {
            const ownerName = resolveClientOwnerName(client);
            const ownerChar = getCharInfo(ownerName, user);
            const phasePct = client.phaseCount
              ? Math.min(100, Math.max(0, (client.phaseProgress / client.phaseCount) * 100))
              : client.status === '契約済み'
                ? 100
                : client.status === '見積もり中'
                  ? 66
                  : client.status === 'ヒアリング中'
                    ? 33
                    : 8;

            return (
              <article
                key={client.id}
                className="w-full border-[2px] border-white/70 bg-blue-950/70 p-3 text-left"
              >
                <div className="flex items-start gap-3">
              <CharacterIcon type={ownerChar.charType} level={ownerChar.level} size={40} className="mt-0.5" />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-[15px] font-bold leading-snug">
                          {client.projectName || client.name}
                        </div>
                        {client.projectName && client.name && client.projectName !== client.name && (
                          <div className="mt-0.5 truncate text-[11px] text-blue-100">{client.name}</div>
                        )}
                      </div>
                      <span className={`shrink-0 border px-1.5 py-0.5 text-[10px] font-bold ${STATUS_STYLES[client.status] || STATUS_STYLES['未着手']}`}>
                        {client.status}
                      </span>
                    </div>

                    <div className="mt-2 flex min-w-0 items-center gap-2 text-[11px] text-blue-100">
                      <span className="truncate">{ownerName}</span>
                      {client.ownerStaffNumber && (
                        <span className="ml-auto shrink-0 text-[10px] text-purple-200">
                          {client.ownerStaffNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px]">
                    <span className="truncate font-bold text-yellow-200">{client.phase || client.status}</span>
                    {client.phaseCount > 0 && (
                      <span className="shrink-0 text-blue-200">{client.phaseProgress}/{client.phaseCount}</span>
                    )}
                  </div>
                  <div className="h-1.5 overflow-hidden border border-white/70 bg-blue-950">
                    <div
                      className="h-full bg-gradient-to-r from-purple-400 via-fuchsia-300 to-yellow-300"
                      style={{ width: `${phasePct}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-end justify-between border-t border-white/20 pt-2">
                  <div>
                    <div className="text-[9px] text-blue-200">想定売上</div>
                    <div className="text-[13px] font-bold tabular-nums">{formatYen(client.sales)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] text-blue-200">獲得EXP</div>
                    <div className="text-[13px] font-bold text-yellow-200 tabular-nums">
                      +{client.earnedExp || 0} EXP
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </DqWindow>
    </div>
  );
};

export default MapScreen;
