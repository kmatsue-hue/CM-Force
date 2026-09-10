import React, { useEffect, useMemo, useRef, useState } from 'react';
import PixelCharacter from '../ui/PixelCharacter.jsx';
import { CHAR_CLASSES } from '../data/users.js';
import useBombGameAudio from './useBombGameAudio.js';

const COLS = 13;
const ROWS = 11;
const FUSE_MS = 2800;
const EXPLOSION_MS = 430;

const DIRECTIONS = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
];

const CHARACTER_DETAILS = {
  hero: { title: 'ゆうしゃ', skill: 'バランスタイプ', accent: '#facc15' },
  mage: { title: 'まほうつかい', skill: 'クールな魔法使い', accent: '#c084fc' },
  merchant: { title: 'しょうにん', skill: 'お宝ハンター', accent: '#fb923c' },
  fighter: { title: 'ぶとうか', skill: 'パワーファイター', accent: '#f87171' },
  priest: { title: 'そうりょ', skill: '光のサポーター', accent: '#67e8f9' },
  thief: { title: 'とうぞく', skill: 'スピードスター', accent: '#4ade80' },
  warrior: { title: 'せんし', skill: '鉄壁のガード', accent: '#60a5fa' },
  sage: { title: 'けんじゃ', skill: '知恵のマスター', accent: '#e879f9' },
  ranger: { title: 'レンジャー', skill: '森の追跡者', accent: '#34d399' },
  paladin: { title: 'パラディン', skill: '聖なる守護者', accent: '#fde047' },
  dancer: { title: 'おどりこ', skill: '華麗なステップ', accent: '#fb7185' },
  beastmaster: { title: 'まものつかい', skill: '魔物のともだち', accent: '#a3e635' },
};

const getCharacterDetail = type => (
  CHARACTER_DETAILS[type]
  || {
    title: CHAR_CLASSES.find(character => character.type === type)?.name || 'ゆうしゃ',
    skill: 'バランスタイプ',
    accent: '#facc15',
  }
);

const STAGES = [
  {
    name: 'ケアフォレスト',
    subtitle: '木漏れ日の森を抜けろ',
    environment: 'nature',
    bgmLabel: 'FOREST BREEZE',
    theme: {
      floorA: '#4c8b42',
      floorB: '#357238',
      floorDark: '#173b27',
      glow: '#86efac',
    },
    seed: 3,
    density: 4,
    range: 2,
    maxBombs: 1,
    enemyMs: 690,
    timeLimit: 120,
    exit: { x: 11, y: 9 },
    enemies: [
      { x: 11, y: 1 },
      { x: 1, y: 9 },
    ],
  },
  {
    name: 'ケアマックス・タウン',
    subtitle: '夕暮れの街角を駆け抜けろ',
    environment: 'town',
    bgmLabel: 'SUNSET PARADE',
    theme: {
      floorA: '#587398',
      floorB: '#405979',
      floorDark: '#1c2940',
      glow: '#f9a8d4',
    },
    seed: 7,
    density: 5,
    range: 2,
    maxBombs: 2,
    enemyMs: 560,
    timeLimit: 105,
    exit: { x: 7, y: 5 },
    enemies: [
      { x: 11, y: 1 },
      { x: 1, y: 9 },
      { x: 11, y: 9 },
    ],
    cpu: {
      x: 9,
      y: 9,
      charType: 'fighter',
      moveMs: 680,
      bombCooldownMs: 4300,
      fuseMs: 3400,
      range: 1,
      maxBombs: 1,
      chaseChance: 0.74,
      bombDistance: 3,
    },
  },
  {
    name: 'ゴールド倉庫',
    subtitle: '最後の出口を探し出せ',
    environment: 'warehouse',
    bgmLabel: 'STEEL PANIC',
    theme: {
      floorA: '#94651e',
      floorB: '#694716',
      floorDark: '#2d1807',
      glow: '#fbbf24',
    },
    seed: 11,
    density: 6,
    range: 3,
    maxBombs: 2,
    enemyMs: 450,
    timeLimit: 90,
    exit: { x: 9, y: 7 },
    enemies: [
      { x: 11, y: 1 },
      { x: 1, y: 9 },
      { x: 11, y: 9 },
      { x: 5, y: 5 },
    ],
    cpu: {
      x: 7,
      y: 9,
      charType: 'warrior',
      moveMs: 390,
      bombCooldownMs: 2400,
      fuseMs: 2800,
      range: 2,
      maxBombs: 2,
      chaseChance: 0.96,
      bombDistance: 5,
    },
  },
];

const cellKey = (x, y) => `${x}:${y}`;
const isSolid = (x, y) => (
  x === 0
  || y === 0
  || x === COLS - 1
  || y === ROWS - 1
  || (x % 2 === 0 && y % 2 === 0)
);

const createStage = (stageIndex, score = 0, status = 'playing') => {
  const stage = STAGES[stageIndex];
  const player = { x: 1, y: 1 };
  const safeCells = new Set([
    cellKey(1, 1),
    cellKey(2, 1),
    cellKey(3, 1),
    cellKey(1, 2),
    cellKey(1, 3),
    ...stage.enemies.flatMap(enemy => [
      cellKey(enemy.x, enemy.y),
      cellKey(Math.max(1, enemy.x - 1), enemy.y),
      cellKey(enemy.x, Math.max(1, enemy.y - 1)),
    ]),
    ...(stage.cpu ? [
      cellKey(stage.cpu.x, stage.cpu.y),
      cellKey(Math.max(1, stage.cpu.x - 1), stage.cpu.y),
      cellKey(Math.max(1, stage.cpu.x - 2), stage.cpu.y),
      cellKey(Math.min(COLS - 2, stage.cpu.x + 1), stage.cpu.y),
      cellKey(Math.min(COLS - 2, stage.cpu.x + 2), stage.cpu.y),
      cellKey(stage.cpu.x, Math.max(1, stage.cpu.y - 1)),
      cellKey(stage.cpu.x, Math.max(1, stage.cpu.y - 2)),
    ] : []),
  ]);
  const blocks = new Set();

  for (let y = 1; y < ROWS - 1; y += 1) {
    for (let x = 1; x < COLS - 1; x += 1) {
      if (isSolid(x, y) || safeCells.has(cellKey(x, y))) continue;
      const noise = (x * 17 + y * 23 + x * y * 3 + stage.seed) % 10;
      if (noise < stage.density) blocks.add(cellKey(x, y));
    }
  }
  blocks.add(cellKey(stage.exit.x, stage.exit.y));

  return {
    stageIndex,
    status,
    player,
    enemies: stage.enemies.map((enemy, index) => ({
      ...enemy,
      id: `${stageIndex}-${index}`,
      direction: index % DIRECTIONS.length,
    })),
    cpu: stage.cpu ? {
      ...stage.cpu,
      id: `cpu-${stageIndex}`,
      direction: 3,
      cooldownUntil: 0,
    } : null,
    blocks,
    bombs: [],
    explosions: new Set(),
    destructionEffects: [],
    items: [],
    powerRange: stage.range,
    maxBombs: stage.maxBombs,
    canKickBombs: false,
    score,
    timeLeft: stage.timeLimit,
    destroyed: 0,
    message: 'すべてのモンスターを倒して出口を探せ！',
  };
};

const BombSprite = ({ owner = 'player' }) => (
  <span className={`bomb-fuse-pulse relative z-20 block h-[72%] w-[72%] rounded-full border-[2px] ${owner === 'cpu' ? 'border-red-400' : 'border-black'} bg-[radial-gradient(circle_at_33%_27%,#94a3b8_0_7%,#263247_8%_28%,#020617_66%)] shadow-[inset_2px_2px_0_rgba(255,255,255,0.26),3px_4px_0_rgba(0,0,0,0.42),0_0_8px_rgba(251,146,60,0.25)]`}>
    <span className="absolute left-[55%] top-[-25%] h-[38%] w-[18%] -rotate-12 border-x border-black/50 bg-gradient-to-t from-amber-900 to-amber-500" />
    <span className="absolute right-[-12%] top-[-27%] h-[24%] w-[24%] animate-ping bg-orange-400 opacity-60 shadow-[0_0_8px_#fb923c]" />
    <span className="absolute right-[-7%] top-[-22%] h-[18%] w-[18%] bg-yellow-100 shadow-[0_0_6px_#fde047]" />
    <span className="absolute bottom-[17%] left-[19%] h-[10%] w-[18%] bg-white/15" />
    {owner === 'cpu' && <span className="absolute -bottom-[12%] left-1/2 -translate-x-1/2 bg-red-600 px-[2px] text-[5px] font-black text-white">CP</span>}
  </span>
);

const EnemySprite = ({ variant = 0 }) => {
  const enemyType = variant % 4;

  if (enemyType === 1) {
    return (
      <span className="bomb-enemy-body bomb-enemy-robot relative block h-[70%] w-[70%] rounded-[18%] border-2 border-[#111827] bg-[linear-gradient(145deg,#e2e8f0_0%,#64748b_44%,#1e293b_100%)] shadow-[inset_3px_3px_3px_rgba(255,255,255,0.5),inset_-4px_-4px_4px_rgba(0,0,0,0.45),0_4px_2px_rgba(0,0,0,0.5),0_0_8px_rgba(125,211,252,0.55)]">
        <span className="absolute left-1/2 top-[-28%] h-[30%] w-[8%] -translate-x-1/2 bg-slate-300">
          <span className="absolute -left-[80%] -top-[35%] h-[150%] w-[260%] rounded-full border border-slate-900 bg-red-400 shadow-[0_0_5px_#fb7185]" />
        </span>
        <span className="absolute inset-x-[13%] top-[22%] h-[29%] rounded bg-[#071329] shadow-[inset_0_2px_3px_#000]">
          <span className="absolute left-[15%] top-[26%] h-[42%] w-[22%] rounded-full bg-cyan-200 shadow-[0_0_5px_#67e8f9]" />
          <span className="absolute right-[15%] top-[26%] h-[42%] w-[22%] rounded-full bg-cyan-200 shadow-[0_0_5px_#67e8f9]" />
        </span>
        <span className="absolute bottom-[17%] left-[25%] h-[10%] w-[50%] bg-slate-900">
          <span className="absolute inset-x-[16%] top-1/2 h-px bg-yellow-300" />
        </span>
        <span className="absolute -bottom-[14%] left-[9%] h-[22%] w-[30%] rounded-b bg-slate-800" />
        <span className="absolute -bottom-[14%] right-[9%] h-[22%] w-[30%] rounded-b bg-slate-800" />
      </span>
    );
  }

  if (enemyType === 2) {
    return (
      <span className="bomb-enemy-body bomb-enemy-ghost relative block h-[78%] w-[70%] border-2 border-[#25104d] bg-[radial-gradient(circle_at_35%_22%,#f5d0fe_0_8%,transparent_9%),linear-gradient(150deg,#d8b4fe,#7e22ce_58%,#3b0764)] shadow-[inset_3px_3px_4px_rgba(255,255,255,0.4),inset_-4px_-5px_5px_rgba(0,0,0,0.32),0_0_10px_rgba(192,132,252,0.72)] [clip-path:polygon(50%_0,84%_10%,100%_39%,96%_78%,78%_100%,60%_82%,43%_100%,24%_82%,5%_96%,0_40%,16%_10%)]">
        <span className="absolute left-[19%] top-[29%] h-[19%] w-[19%] rounded-full bg-white">
          <span className="absolute bottom-[6%] right-[5%] h-[55%] w-[55%] rounded-full bg-[#1e1b4b]" />
        </span>
        <span className="absolute right-[19%] top-[29%] h-[19%] w-[19%] rounded-full bg-white">
          <span className="absolute bottom-[6%] left-[5%] h-[55%] w-[55%] rounded-full bg-[#1e1b4b]" />
        </span>
        <span className="absolute bottom-[30%] left-[38%] h-[13%] w-[24%] rounded-full bg-[#2e1065]" />
      </span>
    );
  }

  if (enemyType === 3) {
    return (
      <span className="bomb-enemy-body bomb-enemy-bat relative block h-[64%] w-[48%] rounded-[46%] border-2 border-[#160927] bg-[linear-gradient(145deg,#f472b6,#7e22ce_55%,#3b0764)] shadow-[inset_2px_2px_3px_rgba(255,255,255,0.35),0_3px_2px_rgba(0,0,0,0.55),0_0_9px_rgba(244,114,182,0.65)]">
        <span className="bomb-enemy-wing absolute -left-[72%] top-[3%] h-[72%] w-[84%] origin-right -rotate-[18deg] border-2 border-[#160927] bg-[linear-gradient(145deg,#c084fc,#581c87)] [clip-path:polygon(100%_15%,78%_100%,50%_66%,20%_94%,0_12%,42%_38%)]" />
        <span className="bomb-enemy-wing absolute -right-[72%] top-[3%] h-[72%] w-[84%] origin-left rotate-[18deg] border-2 border-[#160927] bg-[linear-gradient(215deg,#c084fc,#581c87)] [clip-path:polygon(0_15%,22%_100%,50%_66%,80%_94%,100%_12%,58%_38%)] [animation-delay:110ms]" />
        <span className="absolute left-[12%] top-[25%] h-[18%] w-[25%] rounded-full bg-yellow-200 shadow-[0_0_4px_#fde047]" />
        <span className="absolute right-[12%] top-[25%] h-[18%] w-[25%] rounded-full bg-yellow-200 shadow-[0_0_4px_#fde047]" />
        <span className="absolute bottom-[19%] left-[35%] h-[17%] w-[30%] bg-white [clip-path:polygon(0_0,100%_0,50%_100%)]" />
      </span>
    );
  }

  return (
    <span className="bomb-enemy-body bomb-enemy-slime relative block h-[72%] w-[76%] rounded-[48%_48%_34%_34%] border-2 border-[#052e16] bg-[radial-gradient(circle_at_35%_22%,#dcfce7_0_8%,transparent_9%),linear-gradient(145deg,#86efac_0%,#10b981_38%,#065f46_82%)] shadow-[inset_3px_3px_4px_rgba(255,255,255,0.35),inset_-4px_-5px_5px_rgba(0,0,0,0.35),0_4px_2px_rgba(0,0,0,0.48),0_0_9px_rgba(52,211,153,0.62)]">
      <span className="absolute left-[20%] top-[28%] h-[18%] w-[18%] rounded-full bg-white">
        <span className="absolute bottom-0 right-0 h-1/2 w-1/2 rounded-full bg-[#07104d]" />
      </span>
      <span className="absolute right-[20%] top-[28%] h-[18%] w-[18%] rounded-full bg-white">
        <span className="absolute bottom-0 left-0 h-1/2 w-1/2 rounded-full bg-[#07104d]" />
      </span>
      <span className="absolute bottom-[22%] left-[34%] h-[9%] w-[32%] rounded-b-full bg-[#064e3b]" />
      <span className="absolute -bottom-[10%] left-[8%] h-[20%] w-[30%] rounded-full bg-[#064e3b]" />
      <span className="absolute -bottom-[10%] right-[8%] h-[20%] w-[30%] rounded-full bg-[#064e3b]" />
    </span>
  );
};

const ExplosionSprite = () => (
  <span className="bomb-explosion-cell relative z-30 block h-full w-full">
    <span className="bomb-explosion-ring absolute inset-[8%] rounded-full border-2 border-yellow-100/80" />
    <span className="bomb-explosion-core absolute inset-[18%] rounded-full bg-[radial-gradient(circle,#fff_0_16%,#fef08a_17%_38%,#fb923c_39%_68%,#dc2626_69%)]" />
    <span className="bomb-explosion-debris absolute left-[8%] top-[10%] h-[16%] w-[16%] rounded-sm bg-yellow-200" />
    <span className="bomb-explosion-debris absolute bottom-[8%] right-[5%] h-[13%] w-[13%] rounded-sm bg-orange-500 [animation-delay:70ms]" />
  </span>
);

const CRATE_SHARD_VECTORS = [
  { x: -120, y: -95, rotate: -145, delay: 0 },
  { x: -88, y: 82, rotate: 105, delay: 28 },
  { x: 4, y: -138, rotate: 190, delay: 12 },
  { x: 94, y: -88, rotate: 130, delay: 36 },
  { x: 126, y: 64, rotate: -170, delay: 18 },
  { x: 12, y: 112, rotate: 225, delay: 44 },
];

const ENEMY_POP_VECTORS = [
  { x: -120, y: -84, delay: 0 },
  { x: -118, y: 54, delay: 25 },
  { x: -20, y: -134, delay: 12 },
  { x: 98, y: -92, delay: 36 },
  { x: 124, y: 44, delay: 18 },
  { x: 22, y: 118, delay: 42 },
];

const CrateBurst = ({ environment }) => (
  <span className="bomb-crate-burst relative block h-full w-full">
    <span className="bomb-crate-dust absolute inset-[14%] rounded-full" />
    {CRATE_SHARD_VECTORS.map((vector, index) => (
      <span
        key={`${vector.x}-${vector.y}`}
        className={`bomb-crate-shard bomb-crate-shard--${environment}`}
        style={{
          '--burst-x': `${vector.x}%`,
          '--burst-y': `${vector.y}%`,
          '--burst-rotate': `${vector.rotate}deg`,
          animationDelay: `${vector.delay}ms`,
          left: `${34 + (index % 3) * 10}%`,
          top: `${35 + Math.floor(index / 3) * 12}%`,
        }}
      />
    ))}
  </span>
);

const EnemyPop = ({ variant = 0 }) => (
  <span className={`bomb-enemy-pop bomb-enemy-pop--${variant % 4} relative block h-full w-full`}>
    <span className="bomb-enemy-pop-core absolute inset-[18%] rounded-full" />
    <span className="bomb-enemy-pop-ring absolute inset-[12%] rounded-full border-2" />
    {ENEMY_POP_VECTORS.map((vector, index) => (
      <span
        key={`${vector.x}-${vector.y}`}
        className="bomb-enemy-pop-particle"
        style={{
          '--burst-x': `${vector.x}%`,
          '--burst-y': `${vector.y}%`,
          animationDelay: `${vector.delay}ms`,
          left: `${42 + (index % 2) * 8}%`,
          top: `${40 + (index % 3) * 6}%`,
        }}
      />
    ))}
  </span>
);

const ItemCard = ({ type }) => (
  <span className={`bomb-item-card relative z-10 grid h-[72%] w-[72%] place-items-center border-2 border-white shadow-[2px_3px_0_rgba(0,0,0,0.5),0_0_8px_rgba(255,255,255,0.3)] ${
    type === 'fire'
      ? 'bg-gradient-to-br from-yellow-200 via-orange-500 to-red-700'
      : type === 'kick'
        ? 'bg-gradient-to-br from-lime-100 via-emerald-400 to-green-800'
        : 'bg-gradient-to-br from-cyan-100 via-blue-400 to-indigo-800'
  }`}>
    {type === 'fire' ? (
      <span className="relative h-[58%] w-[42%] bg-yellow-100 [clip-path:polygon(55%_0,100%_48%,72%_100%,18%_92%,0_48%)]">
        <span className="absolute bottom-[8%] left-[27%] h-[58%] w-[48%] bg-red-500 [clip-path:polygon(55%_0,100%_55%,62%_100%,0_72%)]" />
      </span>
    ) : type === 'kick' ? (
      <span className="relative h-[54%] w-[62%] -rotate-12 rounded-r-full border-2 border-[#052e16] bg-white shadow-[inset_-3px_-2px_0_#86efac]">
        <span className="absolute -bottom-[18%] -left-[8%] h-[52%] w-[48%] rounded-l-sm border-2 border-[#052e16] bg-emerald-700" />
        <span className="absolute -right-[30%] top-[28%] text-[10px] font-black text-yellow-100 drop-shadow-[1px_1px_0_#14532d]">›</span>
      </span>
    ) : (
      <span className="relative h-[54%] w-[54%] rounded-full border-2 border-black bg-slate-900">
        <span className="absolute -right-[8%] -top-[22%] h-[30%] w-[16%] rotate-12 bg-amber-400" />
        <span className="absolute bottom-[-28%] left-[42%] text-[8px] font-black text-white drop-shadow-[1px_1px_0_#000]">+</span>
      </span>
    )}
    <span className="absolute bottom-[-2px] right-[1px] bg-[#07104d] px-[2px] text-[6px] font-bold text-white">
      {type === 'fire' ? 'FIRE' : type === 'kick' ? 'KICK' : 'BOMB'}
    </span>
  </span>
);

const ControlButton = ({
  children,
  onPress,
  className = '',
  ariaLabel,
  repeat = false,
}) => {
  const delayRef = useRef(null);
  const intervalRef = useRef(null);

  const stopRepeat = () => {
    if (delayRef.current) window.clearTimeout(delayRef.current);
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    delayRef.current = null;
    intervalRef.current = null;
  };

  useEffect(() => stopRepeat, []);

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture?.(event.pointerId);
        onPress();
        if (!repeat) return;
        stopRepeat();
        delayRef.current = window.setTimeout(() => {
          intervalRef.current = window.setInterval(onPress, 148);
        }, 280);
      }}
      onPointerUp={stopRepeat}
      onPointerCancel={stopRepeat}
      onLostPointerCapture={stopRepeat}
      className={`bomb-control-button grid touch-none select-none place-items-center border-2 border-white bg-[#172b92] text-white shadow-[3px_3px_0_#020617] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${className}`}
    >
      {children}
    </button>
  );
};

export default function BombQuestGame({ open, onClose, user }) {
  const [game, setGame] = useState(() => createStage(0));
  const [isShaking, setIsShaking] = useState(false);
  const [selectedCharacterType, setSelectedCharacterType] = useState(user?.charType || 'hero');
  const gameRef = useRef(game);
  const timersRef = useRef(new Set());
  const bombSequenceRef = useRef(0);
  const heldDirectionsRef = useRef([]);
  const lastKeyboardMoveAtRef = useRef(0);
  const gameAudio = useBombGameAudio();

  const stage = STAGES[game.stageIndex];
  const exitKey = cellKey(stage.exit.x, stage.exit.y);
  const exitVisible = !game.blocks.has(exitKey);
  const hostileCount = game.enemies.length + (game.cpu ? 1 : 0);
  const playerBombCount = game.bombs.filter(bomb => bomb.owner !== 'cpu').length;

  const commit = (nextGame) => {
    gameRef.current = nextGame;
    setGame(nextGame);
  };

  const clearTimers = () => {
    timersRef.current.forEach(timerId => window.clearTimeout(timerId));
    timersRef.current.clear();
    gameAudio.stopAllFuses();
  };

  const schedule = (callback, delay) => {
    const timerId = window.setTimeout(() => {
      timersRef.current.delete(timerId);
      callback();
    }, delay);
    timersRef.current.add(timerId);
    return timerId;
  };

  const startStage = (stageIndex, score = gameRef.current.score, status = 'playing') => {
    clearTimers();
    setIsShaking(false);
    commit(createStage(stageIndex, score, status));
  };

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    if (!open) {
      clearTimers();
      gameAudio.stop();
      return undefined;
    }
    setSelectedCharacterType(user?.charType || 'hero');
    startStage(0, 0, 'ready');
    return clearTimers;
  }, [open, user?.charType]);

  useEffect(() => {
    if (!open || game.status === 'ready') return;
    gameAudio.setStage(game.stageIndex);
  }, [open, game.stageIndex, game.status]);

  useEffect(() => {
    if (game.status !== 'playing') gameAudio.stopAllFuses();
  }, [game.status]);

  const detonateBomb = (bombId) => {
    const current = gameRef.current;
    const firstBomb = current.bombs.find(bomb => bomb.id === bombId);
    if (!firstBomb || current.status !== 'playing') return;
    setIsShaking(true);
    schedule(() => setIsShaking(false), 180);

    const stageConfig = STAGES[current.stageIndex];
    const bombByCell = new Map(current.bombs.map(bomb => [cellKey(bomb.x, bomb.y), bomb]));
    const queue = [firstBomb];
    const detonatedIds = new Set();
    const blastCells = new Set();
    const destroyedBlocks = new Set();

    while (queue.length > 0) {
      const bomb = queue.shift();
      if (!bomb || detonatedIds.has(bomb.id)) continue;
      detonatedIds.add(bomb.id);
      blastCells.add(cellKey(bomb.x, bomb.y));

      DIRECTIONS.forEach(({ dx, dy }) => {
        for (let distance = 1; distance <= (bomb.range || current.powerRange); distance += 1) {
          const x = bomb.x + dx * distance;
          const y = bomb.y + dy * distance;
          const key = cellKey(x, y);
          if (isSolid(x, y)) break;
          blastCells.add(key);

          const chainedBomb = bombByCell.get(key);
          if (chainedBomb && !detonatedIds.has(chainedBomb.id)) {
            queue.push(chainedBomb);
            break;
          }
          if (current.blocks.has(key)) {
            destroyedBlocks.add(key);
            break;
          }
        }
      });
    }

    detonatedIds.forEach(id => gameAudio.stopFuse(id));
    gameAudio.play('explosion');

    const nextBlocks = new Set(current.blocks);
    destroyedBlocks.forEach(key => nextBlocks.delete(key));
    const survivingItems = current.items.filter(item => !blastCells.has(cellKey(item.x, item.y)));
    const spawnedItems = [];
    destroyedBlocks.forEach((key, index) => {
      if (key === cellKey(stageConfig.exit.x, stageConfig.exit.y)) return;
      const [x, y] = key.split(':').map(Number);
      const itemRoll = (x * 11 + y * 7 + current.destroyed + index + stageConfig.seed) % 9;
      if (itemRoll > 2) return;
      spawnedItems.push({
        id: `item-${current.stageIndex}-${x}-${y}-${current.destroyed + index}`,
        x,
        y,
        type: itemRoll === 0 ? 'fire' : itemRoll === 1 ? 'bomb' : 'kick',
      });
    });
    const defeatedEnemies = current.enemies.filter(enemy => blastCells.has(cellKey(enemy.x, enemy.y)));
    const nextEnemies = current.enemies.filter(enemy => !blastCells.has(cellKey(enemy.x, enemy.y)));
    const cpuHit = Boolean(
      current.cpu && blastCells.has(cellKey(current.cpu.x, current.cpu.y))
    );
    const nextCpu = cpuHit ? null : current.cpu;
    const playerHit = blastCells.has(cellKey(current.player.x, current.player.y));
    const nextExplosions = new Set([...current.explosions, ...blastCells]);
    const effectBatchId = `burst-${bombId}-${Date.now()}`;
    const destructionEffects = [
      ...[...destroyedBlocks].map((key, index) => {
        const [x, y] = key.split(':').map(Number);
        return {
          id: `${effectBatchId}-crate-${index}`,
          batchId: effectBatchId,
          type: 'crate',
          environment: stageConfig.environment,
          x,
          y,
        };
      }),
      ...defeatedEnemies.map((enemy, index) => ({
        id: `${effectBatchId}-enemy-${enemy.id}`,
        batchId: effectBatchId,
        type: 'enemy',
        variant: index + Number(enemy.id.split('-')[1] || 0),
        x: enemy.x,
        y: enemy.y,
      })),
      ...(cpuHit ? [{
        id: `${effectBatchId}-cpu-${current.cpu.id}`,
        batchId: effectBatchId,
        type: 'enemy',
        variant: current.stageIndex + 1,
        x: current.cpu.x,
        y: current.cpu.y,
      }] : []),
    ];
    const nextGame = {
      ...current,
      status: playerHit ? 'lost' : current.status,
      blocks: nextBlocks,
      bombs: current.bombs.filter(bomb => !detonatedIds.has(bomb.id)),
      explosions: nextExplosions,
      destructionEffects: [...(current.destructionEffects || []), ...destructionEffects],
      enemies: nextEnemies,
      cpu: nextCpu,
      items: [...survivingItems, ...spawnedItems],
      destroyed: current.destroyed + destroyedBlocks.size,
      score: current.score + destroyedBlocks.size * 10 + defeatedEnemies.length * 100 + (cpuHit ? 300 : 0),
      message: playerHit
        ? '爆風に巻き込まれた！'
        : nextEnemies.length === 0 && !nextCpu
          ? 'モンスター全滅！ 出口へ急げ！'
          : cpuHit
            ? 'ライバルCPを撃破！'
          : `${defeatedEnemies.length > 0 ? `${defeatedEnemies.length}体撃破！` : 'ドカーン！'}`,
    };
    commit(nextGame);
    if (defeatedEnemies.length > 0 || cpuHit) {
      schedule(() => gameAudio.play('defeat'), 110);
    }
    if (playerHit) {
      schedule(() => gameAudio.play('lose'), 150);
    }

    if (destructionEffects.length > 0) {
      schedule(() => {
        const latest = gameRef.current;
        commit({
          ...latest,
          destructionEffects: (latest.destructionEffects || []).filter(
            effect => effect.batchId !== effectBatchId
          ),
        });
      }, 620);
    }

    schedule(() => {
      const latest = gameRef.current;
      const remaining = new Set(latest.explosions);
      blastCells.forEach(key => remaining.delete(key));
      commit({ ...latest, explosions: remaining });
    }, EXPLOSION_MS);
  };

  const placeBomb = () => {
    const current = gameRef.current;
    const playerBombs = current.bombs.filter(bomb => bomb.owner !== 'cpu');
    if (current.status !== 'playing' || playerBombs.length >= current.maxBombs) return;
    const key = cellKey(current.player.x, current.player.y);
    if (current.bombs.some(bomb => cellKey(bomb.x, bomb.y) === key)) return;

    const bomb = {
      id: `bomb-${bombSequenceRef.current += 1}`,
      x: current.player.x,
      y: current.player.y,
      owner: 'player',
      range: current.powerRange,
    };
    commit({
      ...current,
      bombs: [...current.bombs, bomb],
      message: '爆弾を置いた！ 離れろ！',
    });
    gameAudio.play('place');
    gameAudio.startFuse(bomb.id, FUSE_MS);
    schedule(() => detonateBomb(bomb.id), FUSE_MS);
  };

  const remoteDetonate = () => {
    const current = gameRef.current;
    const playerBomb = current.bombs.find(bomb => bomb.owner !== 'cpu');
    if (current.status !== 'playing' || !playerBomb) return;
    detonateBomb(playerBomb.id);
  };

  const movePlayer = (dx, dy) => {
    const current = gameRef.current;
    if (current.status !== 'playing') return;
    const x = current.player.x + dx;
    const y = current.player.y + dy;
    const key = cellKey(x, y);
    if (isSolid(x, y) || current.blocks.has(key)) return;

    const targetBomb = current.bombs.find(bomb => bomb.x === x && bomb.y === y);
    let nextBombs = current.bombs;
    if (targetBomb) {
      if (!current.canKickBombs) return;
      let kickX = x;
      let kickY = y;
      let slideDistance = 0;

      while (slideDistance < Math.max(COLS, ROWS)) {
        const candidateX = kickX + dx;
        const candidateY = kickY + dy;
        const candidateKey = cellKey(candidateX, candidateY);
        const hitsEnemy = current.enemies.some(
          enemy => enemy.x === candidateX && enemy.y === candidateY
        );
        const kickBlocked = (
          isSolid(candidateX, candidateY)
          || current.blocks.has(candidateKey)
          || current.explosions.has(candidateKey)
          || current.bombs.some(
            bomb => bomb.id !== targetBomb.id && bomb.x === candidateX && bomb.y === candidateY
          )
          || hitsEnemy
          || (current.cpu && current.cpu.x === candidateX && current.cpu.y === candidateY)
        );
        if (kickBlocked) break;
        kickX = candidateX;
        kickY = candidateY;
        slideDistance += 1;
      }

      if (slideDistance === 0) return;
      nextBombs = current.bombs.map(bomb => (
        bomb.id === targetBomb.id
          ? {
              ...bomb,
              x: kickX,
              y: kickY,
              slideDuration: Math.min(620, 100 + slideDistance * 72),
              slideToken: (bomb.slideToken || 0) + 1,
            }
          : bomb
      ));
      gameAudio.play('kick');
    }

    const touchedEnemy = current.enemies.some(enemy => enemy.x === x && enemy.y === y);
    const touchedExplosion = current.explosions.has(key);
    const pickedItem = current.items.find(item => item.x === x && item.y === y);
    const stageCleared = (
      key === cellKey(STAGES[current.stageIndex].exit.x, STAGES[current.stageIndex].exit.y)
      && current.enemies.length === 0
      && !current.cpu
      && !current.blocks.has(key)
    );
    commit({
      ...current,
      player: { x, y },
      bombs: nextBombs,
      items: pickedItem ? current.items.filter(item => item.id !== pickedItem.id) : current.items,
      powerRange: pickedItem?.type === 'fire' ? Math.min(6, current.powerRange + 1) : current.powerRange,
      maxBombs: pickedItem?.type === 'bomb' ? Math.min(5, current.maxBombs + 1) : current.maxBombs,
      canKickBombs: current.canKickBombs || pickedItem?.type === 'kick',
      status: touchedEnemy || touchedExplosion ? 'lost' : stageCleared ? 'stageClear' : 'playing',
      score: current.score + (stageCleared ? 500 : 0) + (pickedItem ? 50 : 0),
      message: touchedEnemy
        ? 'モンスターに捕まった！'
        : touchedExplosion
          ? 'まだ爆風が残っていた！'
          : stageCleared
            ? `ステージ${current.stageIndex + 1} クリア！`
            : pickedItem?.type === 'fire'
              ? '火力アップ！ 爆風が1マス伸びた！'
              : pickedItem?.type === 'bomb'
                ? '爆弾アップ！ 同時設置数が増えた！'
                : pickedItem?.type === 'kick'
                  ? 'キック獲得！ 爆弾に向かって移動すると蹴られる！'
                : current.message,
    });
    gameAudio.play('move');
    if (pickedItem) gameAudio.play('powerup');
    if (touchedEnemy || touchedExplosion) gameAudio.play('lose');
    if (stageCleared) gameAudio.play('clear');
  };

  const moveEnemies = () => {
    const current = gameRef.current;
    if (current.status !== 'playing') return;
    const occupied = new Set(current.enemies.map(enemy => cellKey(enemy.x, enemy.y)));
    const nextEnemies = [];
    let playerCaught = false;

    current.enemies.forEach((enemy, enemyIndex) => {
      occupied.delete(cellKey(enemy.x, enemy.y));
      const preferred = [
        enemy.direction,
        (enemy.direction + 1 + ((current.destroyed + enemyIndex) % 2) * 2) % 4,
        (enemy.direction + 3) % 4,
        (enemy.direction + 2) % 4,
      ];
      let moved = { ...enemy };

      for (const directionIndex of preferred) {
        const direction = DIRECTIONS[directionIndex];
        const x = enemy.x + direction.dx;
        const y = enemy.y + direction.dy;
        const key = cellKey(x, y);
        const blocked = (
          isSolid(x, y)
          || current.blocks.has(key)
          || current.bombs.some(bomb => bomb.x === x && bomb.y === y)
          || occupied.has(key)
          || (current.cpu && current.cpu.x === x && current.cpu.y === y)
        );
        if (blocked) continue;
        moved = { ...enemy, x, y, direction: directionIndex };
        break;
      }

      const movedKey = cellKey(moved.x, moved.y);
      if (current.explosions.has(movedKey)) return;
      if (moved.x === current.player.x && moved.y === current.player.y) playerCaught = true;
      occupied.add(movedKey);
      nextEnemies.push(moved);
    });

    commit({
      ...current,
      enemies: nextEnemies,
      status: playerCaught ? 'lost' : current.status,
      score: current.score + (current.enemies.length - nextEnemies.length) * 100,
      message: playerCaught
        ? 'モンスターに捕まった！'
        : nextEnemies.length === 0 && !current.cpu
          ? 'モンスター全滅！ 出口へ急げ！'
          : current.message,
    });
    if (current.enemies.length > nextEnemies.length) gameAudio.play('defeat');
    if (playerCaught) gameAudio.play('lose');
  };

  const moveCpu = () => {
    const current = gameRef.current;
    const cpu = current.cpu;
    if (current.status !== 'playing' || !cpu) return;

    const now = Date.now();
    const cpuBombs = current.bombs.filter(bomb => bomb.owner === 'cpu');
    const playerDistance = Math.abs(cpu.x - current.player.x) + Math.abs(cpu.y - current.player.y);
    const adjacentBlock = DIRECTIONS.some(({ dx, dy }) => (
      current.blocks.has(cellKey(cpu.x + dx, cpu.y + dy))
    ));
    const bombAtCpu = current.bombs.some(bomb => bomb.x === cpu.x && bomb.y === cpu.y);
    const wantsToBomb = (
      cpuBombs.length < cpu.maxBombs
      && now >= cpu.cooldownUntil
      && !bombAtCpu
      && (playerDistance <= cpu.bombDistance || adjacentBlock)
    );

    const dangerCells = new Set();
    const addBombDanger = (bomb, targetSet) => {
      targetSet.add(cellKey(bomb.x, bomb.y));
      DIRECTIONS.forEach(({ dx, dy }) => {
        for (let distance = 1; distance <= (bomb.range || 1); distance += 1) {
          const x = bomb.x + dx * distance;
          const y = bomb.y + dy * distance;
          const key = cellKey(x, y);
          if (isSolid(x, y)) break;
          targetSet.add(key);
          if (current.blocks.has(key)) break;
        }
      });
    };
    current.bombs.forEach(bomb => addBombDanger(bomb, dangerCells));

    const isCpuWalkable = (x, y) => {
      const key = cellKey(x, y);
      return (
        !isSolid(x, y)
        && !current.blocks.has(key)
        && !current.bombs.some(bomb => bomb.x === x && bomb.y === y)
        && !current.enemies.some(enemy => enemy.x === x && enemy.y === y)
        && !(current.player.x === x && current.player.y === y)
      );
    };

    const safetyDistance = (startX, startY, dangerSet, maxDepth) => {
      if (!dangerSet.has(cellKey(startX, startY))) return 0;
      const queue = [{ x: startX, y: startY, depth: 0 }];
      const visited = new Set([cellKey(startX, startY)]);
      while (queue.length > 0) {
        const node = queue.shift();
        if (node.depth >= maxDepth) continue;
        for (const { dx, dy } of DIRECTIONS) {
          const x = node.x + dx;
          const y = node.y + dy;
          const key = cellKey(x, y);
          if (visited.has(key) || !isCpuWalkable(x, y)) continue;
          if (!dangerSet.has(key)) return node.depth + 1;
          visited.add(key);
          queue.push({ x, y, depth: node.depth + 1 });
        }
      }
      return 99;
    };

    const prospectiveDanger = new Set();
    addBombDanger({ x: cpu.x, y: cpu.y, range: cpu.range }, prospectiveDanger);
    const escapeStepBudget = Math.max(3, Math.floor(cpu.fuseMs / cpu.moveMs) - 1);
    const canEscapeOwnBomb = safetyDistance(
      cpu.x,
      cpu.y,
      prospectiveDanger,
      escapeStepBudget
    ) <= escapeStepBudget;
    const currentInDanger = dangerCells.has(cellKey(cpu.x, cpu.y));
    const shouldBomb = wantsToBomb && !currentInDanger && canEscapeOwnBomb;
    if (shouldBomb) {
      prospectiveDanger.forEach(key => dangerCells.add(key));
    }

    const candidates = DIRECTIONS.map((direction, directionIndex) => {
      const x = cpu.x + direction.dx;
      const y = cpu.y + direction.dy;
      const key = cellKey(x, y);
      const blocked = (
        isSolid(x, y)
        || current.blocks.has(key)
        || current.bombs.some(bomb => bomb.x === x && bomb.y === y)
        || current.enemies.some(enemy => enemy.x === x && enemy.y === y)
        || (current.player.x === x && current.player.y === y)
      );
      return {
        x,
        y,
        key,
        direction: directionIndex,
        blocked,
        danger: dangerCells.has(key),
        safetyDistance: safetyDistance(x, y, dangerCells, escapeStepBudget + 2),
        distance: Math.abs(x - current.player.x) + Math.abs(y - current.player.y),
      };
    }).filter(candidate => !candidate.blocked);

    const chaseRoll = ((current.timeLeft * 17 + current.destroyed * 13 + cpu.x * 7 + cpu.y) % 100) / 100;
    const shouldChase = chaseRoll < cpu.chaseChance;
    candidates.sort((a, b) => {
      if (a.danger !== b.danger) {
        return Number(a.danger) - Number(b.danger);
      }
      if ((currentInDanger || shouldBomb) && a.safetyDistance !== b.safetyDistance) {
        return a.safetyDistance - b.safetyDistance;
      }
      if (shouldChase && a.distance !== b.distance) return a.distance - b.distance;
      return ((a.direction + current.timeLeft) % 4) - ((b.direction + current.timeLeft) % 4);
    });

    const destination = candidates[0] || cpu;
    const cpuBomb = shouldBomb ? {
      id: `cpu-bomb-${bombSequenceRef.current += 1}`,
      x: cpu.x,
      y: cpu.y,
      owner: 'cpu',
      range: cpu.range,
    } : null;
    const nextCpu = {
      ...cpu,
      x: destination.x,
      y: destination.y,
      direction: destination.direction ?? cpu.direction,
      cooldownUntil: shouldBomb ? now + cpu.bombCooldownMs : cpu.cooldownUntil,
    };

    commit({
      ...current,
      cpu: nextCpu,
      bombs: cpuBomb ? [...current.bombs, cpuBomb] : current.bombs,
      message: cpuBomb ? 'ライバルCPが爆弾を置いた！' : current.message,
    });

    if (cpuBomb) {
      gameAudio.play('place');
      gameAudio.startFuse(cpuBomb.id, cpu.fuseMs);
      schedule(() => detonateBomb(cpuBomb.id), cpu.fuseMs);
    }
  };

  const enemyMoverRef = useRef(moveEnemies);
  enemyMoverRef.current = moveEnemies;
  const cpuMoverRef = useRef(moveCpu);
  cpuMoverRef.current = moveCpu;

  useEffect(() => {
    if (!open || game.status !== 'playing') return undefined;
    const intervalId = window.setInterval(
      () => enemyMoverRef.current(),
      STAGES[game.stageIndex].enemyMs
    );
    return () => window.clearInterval(intervalId);
  }, [open, game.status, game.stageIndex]);

  useEffect(() => {
    const cpuConfig = STAGES[game.stageIndex].cpu;
    if (!open || game.status !== 'playing' || !cpuConfig || !game.cpu) return undefined;
    const intervalId = window.setInterval(
      () => cpuMoverRef.current(),
      cpuConfig.moveMs
    );
    return () => window.clearInterval(intervalId);
  }, [open, game.status, game.stageIndex, Boolean(game.cpu)]);

  useEffect(() => {
    if (!open || game.status !== 'playing') return undefined;
    const timerId = window.setInterval(() => {
      const current = gameRef.current;
      if (current.status !== 'playing') return;
      const timeLeft = Math.max(0, current.timeLeft - 1);
      if (timeLeft === 0) {
        commit({
          ...current,
          status: 'lost',
          timeLeft,
          message: 'タイムアップ！',
        });
        gameAudio.play('lose');
        return;
      }
      commit({
        ...current,
        timeLeft,
        message: timeLeft <= 10 ? `あと ${timeLeft} 秒！` : current.message,
      });
      if (timeLeft <= 10) gameAudio.play('tick');
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [open, game.status, game.stageIndex]);

  useEffect(() => {
    if (!open) return undefined;
    const directionByKey = {
      ArrowUp: { dx: 0, dy: -1 },
      ArrowRight: { dx: 1, dy: 0 },
      ArrowDown: { dx: 0, dy: 1 },
      ArrowLeft: { dx: -1, dy: 0 },
    };

    const handleKeyDown = (event) => {
      const direction = directionByKey[event.key];
      if (direction) {
        event.preventDefault();
        const now = performance.now();
        const isNewDirection = !heldDirectionsRef.current.includes(event.key);
        if (isNewDirection) {
          heldDirectionsRef.current = [event.key];
          movePlayer(direction.dx, direction.dy);
          lastKeyboardMoveAtRef.current = now;
        } else if (event.repeat && now - lastKeyboardMoveAtRef.current >= 145) {
          movePlayer(direction.dx, direction.dy);
          lastKeyboardMoveAtRef.current = now;
        }
        return;
      }
      if ((event.key === ' ' || event.code === 'Space') && !event.repeat) {
        event.preventDefault();
        placeBomb();
        return;
      }
      if ((event.key === 'b' || event.key === 'B') && !event.repeat) {
        event.preventDefault();
        remoteDetonate();
      }
    };

    const handleKeyUp = (event) => {
      if (!directionByKey[event.key]) return;
      heldDirectionsRef.current = heldDirectionsRef.current.filter(key => key !== event.key);
    };

    const clearHeldDirections = () => {
      heldDirectionsRef.current = [];
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', clearHeldDirections);
    return () => {
      heldDirectionsRef.current = [];
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', clearHeldDirections);
    };
  }, [open]);

  const cells = useMemo(() => {
    const rendered = [];
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) rendered.push({ x, y, key: cellKey(x, y) });
    }
    return rendered;
  }, []);

  const selectableCharacters = useMemo(() => {
    const preferredTypes = [
      user?.charType,
      'hero',
      'mage',
      'fighter',
      'priest',
      'thief',
      'merchant',
    ].filter(Boolean);
    return [...new Set(preferredTypes)].slice(0, 6).map(type => ({
      type,
      ...getCharacterDetail(type),
    }));
  }, [user?.charType]);

  if (!open) return null;

  const handleGameStart = async () => {
    await gameAudio.start(0);
    startStage(0, 0, 'playing');
    gameAudio.play('clear');
  };

  const handleClose = () => {
    gameAudio.stop();
    onClose();
  };

  const goToNextStage = () => {
    if (game.stageIndex >= STAGES.length - 1) {
      commit({ ...gameRef.current, status: 'complete', message: '全ステージ制覇！' });
      return;
    }
    startStage(game.stageIndex + 1, game.score);
  };

  return (
    <section className="bomb-game-shell fixed inset-0 z-[100] flex flex-col overflow-hidden text-white">
      <header className="relative flex shrink-0 items-center justify-between border-b-[3px] border-[#0a102c] bg-[linear-gradient(180deg,#5369d8_0%,#263daf_16%,#101f77_66%,#07104d_100%)] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_3px_0_#020617,0_0_22px_rgba(59,130,246,0.5)]">
        <span className="absolute inset-x-0 bottom-[2px] h-px bg-cyan-200/45" />
        <div>
          <div className="font-dq-title text-[14px] tracking-[0.08em] text-yellow-200 drop-shadow-[2px_2px_0_#7c2d12]">BOMB QUEST</div>
          <div className="flex items-center gap-1 text-[9px] text-blue-100">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-300 shadow-[0_0_7px_#86efac]" />
            ひみつの爆破ミッション
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="rounded-sm border border-white/80 bg-[linear-gradient(180deg,#263a96,#07104d)] px-3 py-1 text-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),2px_2px_0_#000] active:translate-y-px"
        >
          とじる
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col p-2">
        <div className="bomb-game-width bomb-n64-hud mx-auto mb-2 grid shrink-0 grid-cols-[auto_1fr_auto] items-center gap-2 rounded-md border-2 border-white/80 bg-[linear-gradient(180deg,rgba(53,78,190,0.98),rgba(10,24,91,0.98))] px-2 py-1 shadow-[inset_1px_1px_0_rgba(255,255,255,0.2),inset_-1px_-1px_0_rgba(0,0,0,0.45),3px_3px_0_#020617,0_0_12px_rgba(96,165,250,0.18)]">
          <div className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded border border-cyan-100/70 bg-[radial-gradient(circle_at_50%_38%,#415bd0,#081454_72%)] shadow-[inset_0_0_8px_rgba(255,255,255,0.15),1px_2px_0_#020617]">
            <PixelCharacter
              type={selectedCharacterType}
              size={38}
              animated={game.status === 'playing'}
              className="h-[88%] w-[88%] drop-shadow-[1px_2px_0_rgba(0,0,0,0.7)]"
            />
            <span className="absolute inset-x-1 bottom-0 h-px bg-cyan-200/40" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[12px] font-bold text-yellow-200">
              STAGE {game.stageIndex + 1}　{stage.name}
            </div>
            <div className="truncate text-[9px] text-blue-100/80">{stage.subtitle}</div>
            <div className="mt-0.5 flex min-w-0 items-center gap-1 text-[8px] text-cyan-200">
              <span className="truncate">PLAYER / {getCharacterDetail(selectedCharacterType).title}</span>
              <span className="text-white/35">•</span>
              <span className="truncate text-yellow-100/80">♪ {stage.bgmLabel}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-3 text-right font-mono text-[10px] drop-shadow-[1px_1px_0_#000]">
            <div className="text-white">★ {String(game.score).padStart(5, '0')}</div>
            <div className={game.timeLeft <= 10 ? 'bomb-danger-flash text-red-200' : 'text-cyan-100'}>
              ◷ {String(game.timeLeft).padStart(3, '0')}
            </div>
            <div className="text-pink-200">ENEMY × {hostileCount}</div>
            <div className="text-yellow-200">● × {game.maxBombs - playerBombCount}/{game.maxBombs}</div>
            <div className="col-span-2 text-cyan-100">
              POWER {game.powerRange}　{game.canKickBombs ? 'KICK ON' : `ITEM ${game.items.length}`}
            </div>
          </div>
        </div>

        <div
          className={`bomb-arena bomb-arena--${stage.environment} bomb-screen-grain relative mx-auto grid w-full max-w-[420px] shrink-0 overflow-hidden rounded-[3px] border-[4px] border-[#dbeafe] bg-[#09175f] shadow-[inset_0_0_0_2px_#172554,5px_7px_0_#000,0_0_28px_rgba(59,130,246,0.42)] ${isShaking ? 'bomb-arena-shake' : ''}`}
          style={{
            gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
            aspectRatio: `${COLS} / ${ROWS}`,
            '--bomb-floor-a': stage.theme.floorA,
            '--bomb-floor-b': stage.theme.floorB,
            '--bomb-floor-dark': stage.theme.floorDark,
            '--bomb-stage-glow': stage.theme.glow,
          }}
        >
          {cells.map(({ x, y, key }) => {
            const solid = isSolid(x, y);
            const block = game.blocks.has(key);
            const bomb = game.bombs.find(item => item.x === x && item.y === y);
            const item = game.items.find(entry => entry.x === x && entry.y === y);
            const explosion = game.explosions.has(key);
            const showExit = exitVisible && key === exitKey;

            return (
              <div
                key={key}
                className={`bomb-floor-cell relative grid min-h-0 min-w-0 place-items-center ${
                  (x + y) % 2 === 0 ? 'bomb-floor-cell--a' : 'bomb-floor-cell--b'
                }`}
              >
                <span className="absolute inset-[3%] border border-white/[0.035] bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.12),transparent_40%)] shadow-[inset_-2px_-2px_3px_rgba(0,0,0,0.12)]" />
                <span className="absolute inset-x-0 bottom-0 h-px bg-black/40" />
                <span className="absolute inset-y-0 right-0 w-px bg-white/10" />
                {showExit && (
                  <span className={`absolute inset-[17%] border-2 ${hostileCount === 0 ? 'animate-pulse border-cyan-200 bg-cyan-300/35 shadow-[0_0_7px_#67e8f9]' : 'border-slate-400 bg-black/25'}`}>
                    <span className="absolute inset-[24%] bg-[#050a2a]" />
                  </span>
                )}
                {solid && (
                  <span className={`bomb-solid-block bomb-solid-block--${stage.environment} absolute inset-[3%] rounded-[8%] border border-[#020617] shadow-[inset_3px_3px_2px_rgba(255,255,255,0.3),inset_-4px_-4px_3px_rgba(0,0,0,0.48),2px_3px_2px_rgba(0,0,0,0.45)]`}>
                    <span className="absolute inset-[12%] border border-white/10 bg-[linear-gradient(145deg,transparent_45%,rgba(0,0,0,0.18)_46%)]" />
                    <span className="absolute left-[18%] top-[14%] h-[8%] w-[24%] bg-white/20" />
                  </span>
                )}
                {block && (
                  <span className={`bomb-crate bomb-crate--${stage.environment} absolute inset-[6%] rounded-[5%] border-2 shadow-[inset_2px_2px_0_rgba(254,240,138,0.6),inset_-4px_-4px_3px_rgba(45,20,5,0.72),2px_3px_2px_rgba(0,0,0,0.5)]`}>
                    <span className="absolute inset-[12%] border border-[#5f2309] bg-[linear-gradient(45deg,transparent_43%,#78350f_44%_56%,transparent_57%),linear-gradient(-45deg,transparent_43%,#92400e_44%_56%,transparent_57%)]" />
                    <span className="absolute left-[12%] top-[9%] h-[8%] w-[32%] bg-yellow-100/35" />
                  </span>
                )}
                {!solid && !block && !bomb && !item && !explosion && (
                  <span
                    className={`bomb-cell-decor bomb-cell-decor--${stage.environment} ${
                      (x * 7 + y * 11 + stage.seed) % 9 === 0 ? 'is-visible' : ''
                    }`}
                  />
                )}
                {!solid && !block && item && !bomb && <ItemCard type={item.type} />}
                {explosion && <ExplosionSprite />}
              </div>
            );
          })}

          <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
            {game.bombs.map(bomb => (
              <div
                key={bomb.id}
                className="bomb-grid-actor bomb-slide-actor grid place-items-center"
                style={{
                  transform: `translate3d(${bomb.x * 100}%, ${bomb.y * 100}%, 0)`,
                  '--bomb-slide-ms': `${bomb.slideDuration || 90}ms`,
                }}
              >
                <BombSprite owner={bomb.owner} />
              </div>
            ))}
            {game.enemies.map(enemy => {
              const enemyExploding = game.explosions.has(cellKey(enemy.x, enemy.y));
              if (enemyExploding) return null;
              return (
                <div
                  key={enemy.id}
                  className="bomb-grid-actor bomb-enemy-actor grid place-items-center"
                  style={{
                    transform: `translate3d(${enemy.x * 100}%, ${enemy.y * 100}%, 0)`,
                    '--bomb-step-ms': `${Math.max(170, stage.enemyMs - 90)}ms`,
                  }}
                >
                  <EnemySprite variant={Number(enemy.id.split('-')[1])} />
                </div>
              );
            })}
            {game.cpu && (
              <div
                className="bomb-grid-actor bomb-cpu-actor grid place-items-center"
                style={{
                  transform: `translate3d(${game.cpu.x * 100}%, ${game.cpu.y * 100}%, 0)`,
                  '--bomb-cpu-step-ms': `${Math.max(150, game.cpu.moveMs - 70)}ms`,
                }}
              >
                <span className="bomb-cpu-glow absolute inset-[10%] rounded-full" />
                <span className="bomb-cpu-label absolute -top-[18%] left-1/2 z-20 -translate-x-1/2 rounded bg-red-600 px-1 text-[6px] font-black text-white shadow-[1px_1px_0_#000]">
                  CP
                </span>
                <PixelCharacter
                  type={game.cpu.charType}
                  size={32}
                  animated
                  className="relative z-10 h-[82%] w-[82%] drop-shadow-[1px_3px_1px_rgba(0,0,0,0.82)]"
                />
              </div>
            )}
            {!game.explosions.has(cellKey(game.player.x, game.player.y)) && (
              <div
                className="bomb-grid-actor bomb-player-actor grid place-items-center"
                style={{
                  transform: `translate3d(${game.player.x * 100}%, ${game.player.y * 100}%, 0)`,
                }}
              >
                <span className="bomb-player-glow absolute inset-[16%] rounded-full" />
                <PixelCharacter
                  type={selectedCharacterType}
                  size={32}
                  animated={game.status === 'playing'}
                  className="relative z-10 h-[82%] w-[82%] drop-shadow-[1px_3px_1px_rgba(0,0,0,0.82)]"
                />
              </div>
            )}
          </div>

          <div className="pointer-events-none absolute inset-0 z-[33] overflow-hidden">
            {(game.destructionEffects || []).map(effect => (
              <div
                key={effect.id}
                className="bomb-grid-effect absolute"
                style={{
                  transform: `translate3d(${effect.x * 100}%, ${effect.y * 100}%, 0)`,
                }}
              >
                {effect.type === 'crate' ? (
                  <CrateBurst environment={effect.environment} />
                ) : (
                  <EnemyPop variant={effect.variant} />
                )}
              </div>
            ))}
          </div>

          <div className="pointer-events-none absolute inset-0 z-30 bg-[radial-gradient(circle_at_50%_42%,transparent_50%,rgba(2,6,23,0.42)_100%)] mix-blend-multiply" />

          {game.status !== 'playing' && (
            <div className="absolute inset-0 z-40 grid place-items-center bg-[radial-gradient(circle_at_50%_35%,rgba(30,64,175,0.52),rgba(2,6,23,0.92)_72%)] p-3 backdrop-blur-[1px]">
              <div className="w-full rounded-sm border-[3px] border-white bg-[linear-gradient(160deg,rgba(29,48,142,0.98),rgba(7,16,77,0.99))] p-3 text-center shadow-[inset_0_0_0_2px_#223bb0,inset_0_1px_10px_rgba(255,255,255,0.12),5px_5px_0_#000,0_0_22px_rgba(96,165,250,0.32)]">
                <div className={`font-dq-title text-[16px] ${game.status === 'lost' ? 'text-pink-300' : 'text-yellow-200'}`}>
                  {game.status === 'ready'
                    ? 'PLAYER SELECT'
                    : game.status === 'lost'
                    ? 'GAME OVER'
                    : game.status === 'complete'
                      ? 'ALL CLEAR!'
                      : 'STAGE CLEAR!'}
                </div>
                {game.status !== 'ready' && <div className="mt-2 text-[12px]">{game.message}</div>}
                {game.status === 'ready' && (
                  <div className="mt-2">
                    <div className="mb-2 text-[9px] tracking-[0.12em] text-cyan-100">
                      出撃するキャラクターを選択
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {selectableCharacters.map(character => {
                        const selected = selectedCharacterType === character.type;
                        return (
                          <button
                            key={character.type}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => setSelectedCharacterType(character.type)}
                            className={`group relative min-w-0 overflow-hidden rounded border p-1 transition ${
                              selected
                                ? 'border-yellow-200 bg-[linear-gradient(180deg,#344fc3,#122575)] shadow-[inset_0_0_0_1px_#facc15,0_0_10px_rgba(250,204,21,0.45)]'
                                : 'border-blue-200/35 bg-[#07104d]/80 hover:border-cyan-200/80 hover:bg-[#10257d]'
                            }`}
                          >
                            {selected && (
                              <span className="absolute right-1 top-0.5 text-[8px] text-yellow-200">SELECT</span>
                            )}
                            <div
                              className="mx-auto grid h-10 w-10 place-items-center rounded-full border border-white/20"
                              style={{
                                background: `radial-gradient(circle, ${character.accent}55 0%, #111f6e 68%, #050b35 100%)`,
                              }}
                            >
                              <PixelCharacter
                                type={character.type}
                                size={38}
                                animated={selected}
                                className="h-[90%] w-[90%] drop-shadow-[1px_2px_0_#000]"
                              />
                            </div>
                            <div className={`mt-0.5 truncate text-[9px] font-bold ${selected ? 'text-yellow-100' : 'text-white'}`}>
                              {character.title}
                            </div>
                            <div className="truncate text-[7px] text-blue-200/80">{character.skill}</div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-2 flex items-center justify-center gap-2 text-[8px] text-blue-100/80">
                      <span className="h-px w-6 bg-blue-200/30" />
                      選んだキャラクターで全3ステージに挑戦
                      <span className="h-px w-6 bg-blue-200/30" />
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={
                    game.status === 'ready'
                      ? handleGameStart
                      : game.status === 'lost'
                      ? () => startStage(game.stageIndex, game.score)
                      : game.status === 'complete'
                        ? () => startStage(0, 0, 'ready')
                        : goToNextStage
                  }
                  className="mt-2 rounded-sm border-2 border-white bg-[linear-gradient(180deg,#fef08a,#facc15_55%,#ca8a04)] px-5 py-2 text-[12px] font-bold text-[#07104d] shadow-[inset_0_1px_0_#fff,3px_3px_0_#000,0_0_10px_rgba(250,204,21,0.3)] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_#000]"
                >
                  {game.status === 'ready'
                    ? 'このキャラで出撃'
                    : game.status === 'lost'
                    ? 'もういちど'
                    : game.status === 'complete'
                      ? 'タイトルへ'
                      : game.stageIndex === STAGES.length - 1
                        ? '結果を見る'
                        : 'つぎのステージ'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bomb-game-width mx-auto mt-2 min-h-[24px] shrink-0 border border-white/30 bg-[#07104d] px-2 py-1 text-center text-[10px] text-yellow-100">
          {game.message}
        </div>

        <div className="bomb-touch-controls bomb-handheld-panel relative mx-auto mt-auto grid w-full max-w-[460px] grid-cols-[auto_1fr] items-center gap-3 overflow-hidden rounded-[22px_22px_44px_22px] border-[3px] border-[#e5e7d8] bg-[linear-gradient(145deg,#d7d8ca,#aeb0a5)] px-3 pb-4 pt-7 text-[#27304d] shadow-[inset_4px_4px_8px_rgba(255,255,255,0.7),inset_-5px_-6px_9px_rgba(55,65,81,0.35),0_5px_0_#5b6170,0_9px_14px_rgba(0,0,0,0.42)]">
          <div className="absolute left-4 top-2 flex items-center gap-1.5 text-[8px] font-black tracking-[0.16em] text-[#27304d]/70">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_5px_#ef4444]" />
            BOMB POCKET
          </div>
          <div className="absolute right-5 top-2 flex gap-[3px] opacity-35">
            {[0, 1, 2, 3, 4].map(line => <span key={line} className="h-[2px] w-3 rounded-full bg-[#27304d]" />)}
          </div>

          <div className="bomb-dpad grid w-[158px] shrink-0 grid-cols-3 grid-rows-3 gap-1 rounded-full border-2 border-white/40 bg-[radial-gradient(circle,#73786f_0_28%,#b8baae_30%_59%,#858a82_61%)] p-2.5 shadow-[inset_3px_3px_7px_rgba(255,255,255,0.48),inset_-4px_-5px_8px_rgba(0,0,0,0.25),2px_3px_5px_rgba(0,0,0,0.28)]">
            <span />
            <ControlButton repeat onPress={() => movePlayer(0, -1)} ariaLabel="上" className="bomb-dpad-key h-[43px] rounded-t-md text-[16px]">▲</ControlButton>
            <span />
            <ControlButton repeat onPress={() => movePlayer(-1, 0)} ariaLabel="左" className="bomb-dpad-key h-[43px] rounded-l-md text-[16px]">◀</ControlButton>
            <span className="grid place-items-center rounded bg-[#171827] shadow-[inset_2px_2px_4px_#000]"><span className="h-4 w-4 rounded-full bg-[#303244] shadow-[inset_1px_1px_1px_rgba(255,255,255,0.25)]" /></span>
            <ControlButton repeat onPress={() => movePlayer(1, 0)} ariaLabel="右" className="bomb-dpad-key h-[43px] rounded-r-md text-[16px]">▶</ControlButton>
            <span />
            <ControlButton repeat onPress={() => movePlayer(0, 1)} ariaLabel="下" className="bomb-dpad-key h-[43px] rounded-b-md text-[16px]">▼</ControlButton>
            <span />
          </div>

          <div className="flex min-w-0 flex-col items-center justify-center">
            <div className="flex -rotate-[8deg] items-end justify-center gap-3">
              <div className="text-center">
                <ControlButton onPress={remoteDetonate} ariaLabel="B 起爆" className="bomb-action-b h-[58px] w-[58px] rounded-full text-[20px] font-black">B</ControlButton>
                <div className="mt-1 text-[8px] font-bold tracking-wider text-[#27304d]/70">起爆</div>
              </div>
              <div className="text-center">
                <ControlButton onPress={placeBomb} ariaLabel="A 爆弾" className="bomb-action-a h-[70px] w-[70px] rounded-full text-[24px] font-black">A</ControlButton>
                <div className="mt-1 text-[8px] font-bold tracking-wider text-[#27304d]/70">爆弾</div>
              </div>
            </div>
            <div className="mt-2 flex rotate-[-5deg] items-center gap-2">
              <button type="button" onClick={remoteDetonate} className="bomb-handheld-mini h-4 w-12 rounded-full" aria-label="SELECT 起爆" />
              <button type="button" onClick={placeBomb} className="bomb-handheld-mini h-4 w-12 rounded-full" aria-label="START 爆弾" />
            </div>
            <div className="mt-0.5 flex gap-5 text-[6px] font-black tracking-wider text-[#27304d]/55">
              <span>SELECT</span>
              <span>START</span>
            </div>
          </div>
        </div>

        <div className="bomb-keyboard-help mt-auto hidden shrink-0 border-t border-white/20 pt-2 text-center text-[10px] text-blue-100">
          矢印キー：移動　／　SPACE：爆弾　／　B：起爆
        </div>
      </div>
    </section>
  );
}
