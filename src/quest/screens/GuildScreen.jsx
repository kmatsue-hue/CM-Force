import React from 'react';
import { formatG, getActionBadgeType } from '../utils/format.js';
import { getBgColorByLevel, getBorderClassByLevel, getCharInfo } from '../utils/userLevel.js';
import DqWindow from '../ui/DqWindow.jsx';
import PixelCharacter from '../ui/PixelCharacter.jsx';
import PixelActionBadge from '../ui/PixelActionBadge.jsx';

const GuildScreen = ({
  guildTab,
  setGuildTab,
  profitRankingUsers,
  user,
  setSelectedUserProfile,
  logs,
}) => (
  <div className="space-y-4 animate-fadeIn p-4 pb-20">
    <div className="flex gap-2 mb-2">
      <button
        onClick={() => setGuildTab('sales')}
        className={`flex-1 py-2 border-[3px] rounded-[4px] text-[14px] sm:text-[15px] font-bold transition-colors ${guildTab === 'sales' ? 'bg-white text-black border-white' : 'bg-black text-white border-gray-500 hover:border-white'}`}
      >
        ランキング
      </button>
      <button
        onClick={() => setGuildTab('logs')}
        className={`flex-1 py-2 border-[3px] rounded-[4px] text-[14px] sm:text-[15px] font-bold transition-colors ${guildTab === 'logs' ? 'bg-white text-black border-white' : 'bg-black text-white border-gray-500 hover:border-white'}`}
      >
        ぼうけんのきろく
      </button>
    </div>

    {guildTab === 'sales' ? (
      <DqWindow title="うりあげ・こうけんしゃ" className="mt-4">
        <div className="space-y-3 mt-2">
          {profitRankingUsers.length > 0 ? profitRankingUsers.map(([userName, data], index) => {
            const charInfo = getCharInfo(userName, user);
            const rank = index + 1;
            const rankColor = rank === 1 ? 'text-yellow-300' : rank === 2 ? 'text-gray-300' : rank === 3 ? 'text-orange-400' : 'text-white';

            return (
              <div key={userName}
                className={`flex items-center gap-3 p-2 rounded-[4px] border-[2px] cursor-pointer hover:bg-white/10 transition-colors ${userName === user.name ? 'border-yellow-300 bg-white/5' : 'border-gray-700'}`}
                onClick={() => setSelectedUserProfile(userName)}
              >
                <div className={`text-[19px] font-bold w-6 text-center ${rankColor}`}>{rank}</div>
                <div className={`p-1 rounded-[4px] ${getBgColorByLevel(charInfo.level)} ${getBorderClassByLevel(charInfo.level)}`}>
                  <PixelCharacter type={charInfo.charType} size={32} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-bold truncate">{userName}</div>
                  <div className="text-[12px] text-gray-400">Lv.{charInfo.level} {charInfo.className}</div>
                </div>
                <div className="text-right text-[14px]">
                  <div className="text-yellow-200">{formatG(data.profit)}</div>
                  <div className="text-gray-400 text-[11px]">売上 {formatG(data.sales)}</div>
                </div>
              </div>
            );
          }) : (
            <div className="text-[13px] text-gray-300 border-[2px] border-white/30 bg-black/25 rounded-[4px] p-3">
              利益が記録されるとランキングに表示されます
            </div>
          )}
        </div>
      </DqWindow>
    ) : (
      <DqWindow title="さいきんの できごと" className="mt-4">
        <div className="space-y-4 mt-2">
          {logs.map((log) => {
            const charInfo = getCharInfo(log.userName, user);
            return (
              <div key={log.id} className="border-b-[2px] border-dashed border-gray-700 pb-3 last:border-0">
                <div className="flex justify-between text-[13px] text-gray-400 mb-1">
                  <span>{log.date}</span>
                  <span>◆ {log.area}</span>
                </div>
                <div className="flex gap-3 items-start">
                  <div
                    className={`relative cursor-pointer hover:opacity-80 transition-opacity mt-5 p-1 rounded border border-gray-600 ${getBgColorByLevel(charInfo.level)}`}
                    onClick={() => setSelectedUserProfile(log.userName)}
                  >
                    <PixelCharacter type={charInfo.charType} size={28} />
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-10 p-[2px] border-[2px] border-white bg-[#0d218b] animate-bounce-slow">
                      <PixelActionBadge type={getActionBadgeType(log.actionType)} size={24} />
                    </div>
                  </div>
                  <div className="flex-1 text-[14px] sm:text-[15px] leading-relaxed">
                    <span className="font-bold text-yellow-200 cursor-pointer hover:underline" onClick={() => setSelectedUserProfile(log.userName)}>
                      {log.userName}
                    </span>
                    は<br/>
                    {log.clientName}で<br/>
                    <span className="text-green-300">「{log.actionType}」</span> を ほうこく！
                    {log.profit > 0 && (
                      <div className="text-yellow-300 mt-1 animate-pulse font-bold">
                        + {formatG(log.profit)} の りえき
                      </div>
                    )}
                    {log.profit < 0 && (
                      <div className="text-red-400 mt-1 font-bold">
                        {formatG(log.profit)} の へんどうが ありました
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DqWindow>
    )}
  </div>
);

export default GuildScreen;
