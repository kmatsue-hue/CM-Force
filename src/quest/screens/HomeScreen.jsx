import React from 'react';
import { TREASURE_VAULT_ART } from '../data/pixelArt.js';
import { CHAR_CLASSES } from '../data/users.js';
import { formatG, formatId } from '../utils/format.js';
import { getBgColorByLevel, getBorderClassByLevel } from '../utils/userLevel.js';
import DqWindow from '../ui/DqWindow.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';
import PixelCharacter from '../ui/PixelCharacter.jsx';

const HomeScreen = ({
  user,
  kpi,
  currentUserTotalProfit,
  profitBundleSlots,
  profitCoinSlots,
  profitBundleCount,
  profitLooseCoinCount,
  isEditingProfile,
  setIsEditingProfile,
  editName,
  setEditName,
  editCharType,
  setEditCharType,
  handleSaveProfile,
}) => (
  <div className="space-y-4 animate-fadeIn p-4 pb-20">
    <DqWindow title="じょうたい">
      {isEditingProfile ? (
        <div className="space-y-4 animate-fadeIn mt-2">
          <div>
            <div className="text-[15px] mb-2">▼ なまえ</div>
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full bg-black border-[3px] border-white rounded-[4px] p-2 text-white font-dq focus:outline-none focus:border-yellow-300 text-[17px]"
              maxLength={10}
            />
          </div>
          <div>
            <div className="text-[15px] mb-2 mt-4">▼ しょくぎょう</div>
            <div className="grid grid-cols-3 gap-2">
              {CHAR_CLASSES.map(c => (
                 <div
                   key={c.type}
                   onClick={() => setEditCharType(c.type)}
                   className={`border-[3px] rounded-[4px] p-2 flex flex-col items-center cursor-pointer transition-colors ${editCharType === c.type ? 'border-yellow-300 bg-white/20' : 'border-white bg-black hover:bg-gray-800'}`}
                 >
                   <PixelCharacter type={c.type} size={48} />
                   <div className="text-[12px] sm:text-[14px] text-center mt-3">{c.name}</div>
                 </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/30">
            <button onClick={() => setIsEditingProfile(false)} className="px-4 py-2 text-[15px] hover:text-gray-300">もどる</button>
            <button onClick={handleSaveProfile} className="px-6 py-2 border-[3px] border-white rounded-[4px] text-white hover:bg-white hover:text-black transition-colors">けってい</button>
          </div>
        </div>
      ) : (
        <div className="mt-2">
          <div className="flex gap-4 items-start mb-4">
            <div className={`p-2 shrink-0 rounded-[6px] transition-all duration-500 ${getBgColorByLevel(user.level)} ${getBorderClassByLevel(user.level)}`}>
               <PixelCharacter type={user.charType} size={72} className="animate-bounce-slow" />
            </div>
            <div className="flex-1 text-[15px] sm:text-[17px] leading-loose pt-1">
              <div className="text-yellow-200 text-[13px] leading-none mb-1">{formatId(user.id)}</div>
              <div>なまえ: {user.name}</div>
              <div>しょくぎょう: {user.className}</div>
              <div>レベル: <span className="text-white">{user.level}</span></div>
            </div>
          </div>
          <div className="text-right mt-4">
            <button
              onClick={() => { setEditName(user.name); setEditCharType(user.charType); setIsEditingProfile(true); }}
              className="text-[14px] text-gray-300 hover:text-white border-b border-gray-400 hover:border-white transition-colors pb-0.5"
            >
              すがたを かえる ▶
            </button>
          </div>
        </div>
      )}
    </DqWindow>

    <div className="grid grid-cols-2 gap-4">
      <DqWindow>
        <div className="text-[15px]">けいけんち</div>
        <div className="text-right text-[17px] mb-3">{user.exp}</div>
        <div className="text-[15px]">つぎのレベル</div>
        <div className="text-right text-[17px]">{100 - (user.exp % 100)}</div>
        <ProgressBar current={user.exp % 100} target={100} colorClass="bg-blue-500" />
      </DqWindow>

      <DqWindow className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/12 via-yellow-200/4 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute left-1/2 -translate-x-1/2 bottom-[3%] z-[1] w-[78%] max-w-[188px]">
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${TREASURE_VAULT_ART.pixels[0].length} ${TREASURE_VAULT_ART.pixels.length}`}
              className="pixel-art w-full h-auto drop-shadow-[0_2px_0_rgba(0,0,0,0.35)]"
              style={{ shapeRendering: 'crispEdges' }}
            >
              {TREASURE_VAULT_ART.pixels.map((rowStr, y) => rowStr.split('').map((char, x) => {
                if (TREASURE_VAULT_ART.colors[char] === 'transparent') return null;
                return <rect key={`vault-${x}-${y}`} x={x} y={y} width="1" height="1" fill={TREASURE_VAULT_ART.colors[char]} />;
              }))}
            </svg>
          </div>
          {profitBundleSlots.map((bundle, idx) => (
            <div
              key={`profit-bundle-${idx}`}
              className="absolute w-[14px] h-[8px] border border-black/35 rounded-[1px] overflow-hidden"
              style={{
                left: `${bundle.left}%`,
                bottom: `${bundle.bottom}%`,
                zIndex: bundle.z + 4,
                background: 'linear-gradient(180deg, #dcfce7 0%, #86efac 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55)',
              }}
            >
              <div className="absolute left-[5px] top-0 bottom-0 w-[3px] bg-[#0f766e]/75" />
              <div className="absolute inset-x-0 top-[3px] h-[1px] bg-[#0f766e]/65" />
            </div>
          ))}
          {profitCoinSlots.map((coin, idx) => (
            <div
              key={`profit-coin-${idx}`}
              className="absolute w-[7px] h-[4px] rounded-full border border-black/35"
              style={{
                left: `${coin.left}%`,
                bottom: `${coin.bottom}%`,
                zIndex: coin.z + 3,
                background: 'linear-gradient(180deg, #fde68a 0%, #f59e0b 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55)',
              }}
            />
          ))}
        </div>
        <div className="relative z-[5]">
          <div className="text-[15px]">そうりえき</div>
          <div className="text-right text-[17px] text-yellow-200">{currentUserTotalProfit > 0 ? formatG(currentUserTotalProfit) : "—"}</div>
          <div className="mt-3 flex justify-center opacity-85">
            <span className="text-[32px]">G</span>
          </div>
          <div className="text-center text-[10px] text-yellow-100/85 mt-1">
            {profitBundleCount > 0
              ? `札束 ${profitBundleCount} 束 / コイン ${profitLooseCoinCount} 枚`
              : `コイン ${profitLooseCoinCount} 枚`}
          </div>
        </div>
      </DqWindow>
    </div>

    <DqWindow title="もくひょう (KPI)">
      <div className="space-y-4 mt-2">
        {Object.entries(kpi).map(([key, data]) => (
          <div key={key}>
            <div className="flex justify-between text-[15px] mb-1">
              <span>{data.icon} {data.name}</span>
              <span className={data.current >= data.target ? 'text-yellow-300 font-bold' : ''}>
                {data.current} <span className="text-gray-400">/ {data.target}</span>
              </span>
            </div>
            <ProgressBar current={data.current} target={data.target} colorClass={data.color} />
          </div>
        ))}
      </div>
    </DqWindow>
  </div>
);

export default HomeScreen;
