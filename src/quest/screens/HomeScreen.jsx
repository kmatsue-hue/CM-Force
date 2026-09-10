import React from 'react';
import profitPileImage from '../../assets/quest-profit-pile-32bit-512.png';
import { formatG, formatId } from '../utils/format.js';
import DqWindow from '../ui/DqWindow.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';
import CharacterIcon from '../ui/CharacterIcon.jsx';
import { getClassEvolution } from '../data/users.js';

const CHARACTER_CATCHPHRASES = {
  hero: 'さあ、冒険を始めよう！',
  mage: '知恵で道をひらこう。',
  merchant: '商機は逃さないよ！',
  fighter: 'まかせろ、突破する！',
  priest: 'みんなを支えます。',
  thief: '気配は見逃さない。',
  warrior: '正面から受けて立つ！',
  sage: '答えはきっと見つかる。',
  ranger: '狙いは外さない。',
  paladin: '必ず守り抜く。',
  dancer: 'さあ、華やかに！',
  beastmaster: '心はちゃんと通じる。',
};

const ProfitCounter = ({ value }) => {
  const total = Math.max(0, Math.round(Number(value) || 0));
  const characters = new Intl.NumberFormat('ja-JP').format(total).split('');

  return (
    <div
      role="meter"
      aria-label={`そうりえき ${formatG(total)}`}
      aria-valuemin={0}
      aria-valuenow={total}
      className="mt-2 border-y border-white/20 bg-[#243ca0]/35 px-2 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-1px_0_rgba(0,0,0,0.18)] backdrop-blur-[1px]"
    >
      <div className="mb-1 flex items-center justify-between font-mono text-[7px] tracking-[0.15em] text-blue-100/65 sm:text-[8px]">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/90 shadow-[0_0_5px_rgba(103,232,249,0.75)]" />
          TOTAL G
        </span>
        <span>そうりえき</span>
      </div>
      <div
        aria-hidden="true"
        className="flex min-w-0 items-center justify-end gap-[1px] overflow-hidden whitespace-nowrap rounded-[2px] border border-white/10 bg-[#07104d]/35 px-1 font-mono font-bold tabular-nums"
      >
        {characters.map((character, index) => (
          character === ',' ? (
            <span key={`${character}-${index}`} className="w-[4px] shrink-0 self-end pb-[2px] text-center text-[10px] text-blue-100/60">
              ,
            </span>
          ) : (
            <span
              key={`${character}-${index}`}
              className="flex h-[22px] min-w-[11px] flex-1 items-center justify-center border-r border-white/10 text-[13px] leading-none text-cyan-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] last:border-r-0 sm:h-[25px] sm:text-[15px]"
            >
              {character}
            </span>
          )
        ))}
        <span className="ml-1 shrink-0 text-[11px] text-cyan-200 sm:text-[13px]">G</span>
      </div>
      <div className="mt-1.5 grid grid-cols-8 gap-[2px] opacity-60">
        {Array.from({ length: 8 }).map((_, index) => (
          <span
            key={index}
            className={`h-[2px] ${index < 6 ? 'bg-gradient-to-r from-violet-300 to-cyan-200' : 'bg-white/15'}`}
          />
        ))}
      </div>
    </div>
  );
};

const HomeScreen = ({
  user,
  characters,
  selectedStaffNumber,
  onSelectCharacter,
  kpi,
  currentUserTotalProfit,
  profitBundleCount,
  profitLooseCoinCount,
}) => {
  const classEvolution = getClassEvolution(user.charType, user.level);
  const catchphrase = CHARACTER_CATCHPHRASES[user.charType] || CHARACTER_CATCHPHRASES.hero;
  const profitBreakdown = [
    profitBundleCount > 0 ? `札束 ${profitBundleCount} 束` : null,
    profitLooseCoinCount > 0 ? `コイン ${profitLooseCoinCount} 枚` : null,
  ].filter(Boolean).join(' / ');

  return (
  <div className="space-y-3 animate-fadeIn p-3 pb-16">
    <DqWindow title="じょうたい">
      <div className="mt-1">
        {characters.length > 1 && (
          <div className="mb-2 border-b-[2px] border-white/30 pb-2">
            <div className="mb-1.5 text-[11px] text-gray-300">▼ キャラクターを えらぶ</div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              {characters.map(character => {
                const selected = character.staffNumber === selectedStaffNumber;
                return (
                  <button
                    key={character.staffNumber || character.name}
                    type="button"
                    onClick={() => onSelectCharacter(character.staffNumber)}
                    className={`flex min-w-[86px] flex-shrink-0 items-center gap-1.5 rounded-[4px] border-[2px] p-1.5 text-left transition-colors ${
                      selected
                        ? 'border-yellow-300 bg-white/15 text-yellow-100'
                        : 'border-gray-600 bg-black/40 text-gray-300 hover:border-white'
                    }`}
                  >
                    <CharacterIcon type={character.charType} level={character.level} size={28} />
                    <span className="min-w-0">
                      <span className="block truncate text-[10px] font-bold">{character.name}</span>
                      <span className="block font-mono text-[8px] text-purple-200">{character.staffNumber}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div className="relative mb-1 pt-8">
          <div className="absolute left-[50px] top-0 z-30 max-w-[calc(100%_-_56px)] rounded-[5px] border-[2px] border-[#111827] bg-white px-2.5 py-1 text-[10px] font-black leading-snug text-[#111827] shadow-[3px_3px_0_#cbd5e1,4px_4px_0_#111827] sm:text-[11px]">
            <span className="pointer-events-none absolute inset-[3px] rounded-[3px] border border-gray-300" />
            <span className="relative">
            「{catchphrase}」
            </span>
            <span className="absolute -bottom-[7px] left-[14px] h-[11px] w-[11px] rotate-45 border-b-[2px] border-r-[2px] border-[#111827] bg-white shadow-[2px_2px_0_#cbd5e1]" />
          </div>
          <div className="flex items-start gap-4 sm:gap-5">
            <CharacterIcon type={user.charType} level={user.level} size={92} animated />
            <div className="min-w-0 flex-1 pl-1 pt-0.5 text-[14px] leading-relaxed sm:pl-2 sm:text-[16px]">
              <div className="mb-0.5 text-[12px] leading-none text-yellow-200">
                {user.staffNumber || formatId(user.id)}
              </div>
              <div>なまえ: {user.name}</div>
              <div>しょくぎょう: {classEvolution.name}</div>
              <div>レベル: <span className="text-white">{user.level}</span></div>
              <div className="mt-0.5 text-[10px] leading-snug text-cyan-200 sm:text-[11px]">
                {classEvolution.next
                  ? `つぎのしんか: Lv.${classEvolution.next.level} ${classEvolution.next.name}`
                  : `さいしゅうしょく: ${classEvolution.name}`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DqWindow>

    <div className="grid grid-cols-2 gap-3">
      <DqWindow>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[13px] text-gray-300">げんざいレベル</span>
            <span className="text-[20px] font-bold text-yellow-200">Lv.{user.level}</span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[13px] text-gray-300">かくとくけいけんち</span>
            <span className="text-[17px] font-bold">{user.exp}<span className="ml-1 text-[11px] text-blue-200">EXP</span></span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[13px] text-gray-300">つぎのレベルまで</span>
            <span className="text-[17px] font-bold">{100 - (user.exp % 100)}<span className="ml-1 text-[11px] text-blue-200">EXP</span></span>
          </div>
        </div>
        <ProgressBar
          current={user.exp % 100}
          target={100}
          colorClass="bg-gradient-to-r from-cyan-500 to-blue-400"
          large
          showValue
        />
      </DqWindow>

      <DqWindow className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/12 via-yellow-200/4 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-[3%] z-[1] flex justify-center">
            <img
              src={profitPileImage}
              alt=""
              className="h-auto w-[76%] max-w-[145px] opacity-90 [image-rendering:pixelated] drop-shadow-[0_4px_2px_rgba(0,0,0,0.36)]"
            />
          </div>
        </div>
        <div className="relative z-[5] min-h-[122px]">
          <div className="text-[15px]">そうりえき</div>
          <ProfitCounter value={currentUserTotalProfit} />
          {profitBreakdown && (
            <div className="absolute inset-x-0 bottom-0 bg-[#07104d]/75 py-1 text-center text-[10px] text-blue-100/80">
              {profitBreakdown}
            </div>
          )}
        </div>
      </DqWindow>
    </div>

    <DqWindow title="もくひょう (KPI)">
      <div className="space-y-4 mt-2">
        {Object.entries(kpi).map(([key, data]) => (
          <div key={key}>
            <div className="flex justify-between text-[15px] mb-1">
              <span>{data.name}</span>
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
};

export default HomeScreen;
