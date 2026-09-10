// --- オリジナル16-bitポップRPGキャラクター ---
const HERO_PIXELS = [
  "................",
  ".....RRRRRR.....",
  "....RrrrrrrR....",
  "...RrrrrrrrrR...",
  "...RRRRRRRRRR...",
  "...BSSSSSSSSB...",
  "..BSEBSSSSBESB..",
  "..BSSSSNSSSSSB..",
  "...BSSMMMMSSB...",
  "....BSSSSSSB....",
  "...BBCCCCCCBB...",
  "..BCCCCCCCCCCB..",
  "..BCCCWWWWCCCB..",
  "...BCCCCCCCCB...",
  "....BKKKKKKB....",
  "....BK....KB....",
  "...BBK....KBB...",
  "...BKK....KKB...",
  "...BBB....BBB...",
  "................",
];

const MAGE_PIXELS = [
  "................",
  ".....YYYYYY.....",
  "....YyyyyyyY....",
  "...YyyyyyyyyY...",
  "..YyyyyyyyyyyY..",
  "..YBSSSSSSSSBY..",
  "..YSEBSSSSBESY..",
  "..YSSSSNSSSSSY..",
  "...YSSMMMMSSY...",
  "....YSSSSSSY....",
  "...BBPPPPPPBB...",
  "..BPPPPGPPPPPB..",
  "..BPPPGGGPPPPB..",
  "...BPPPGPPPPB...",
  "....BPPPPPPB....",
  "...BPP....PPB...",
  "..BBPP....PPBB..",
  "...BKK....KKB...",
  "...BBB....BBB...",
  "................",
];

const MERCHANT_PIXELS = [
  "................",
  ".....HHHHHH.....",
  "....HhhhhhhH....",
  "...HhhhhhhhhH...",
  "...HHHHHHHHHH...",
  "...BSSSSSSSSB...",
  "..BSEEBSSBEEB...",
  "..BSEEBSSBEEB...",
  "...BSSSNNSSSB...",
  "....BMMMMMMB....",
  "...BBJJJJJJBB...",
  "..BJJJWTTWJJJB..",
  "..BJJJWTTWJJJB..",
  "...BJJJTTJJB....",
  "....BJJJJJJB....",
  "....BK....KB....",
  "...BBK....KBB...",
  "...BKK....KKB...",
  "...BBB....BBB...",
  "................",
];

const FIGHTER_PIXELS = [
  "................",
  ".....DDDDDD.....",
  "....DddddddD....",
  "...DddddddddD...",
  "..RRRRRRRRRRRR..",
  "...BSSSSSSSSB...",
  "..BSEBSSSSBESB..",
  "..BSSSSNSSSSSB..",
  "...BSSMMMMSSB...",
  "....BSSSSSSB....",
  "..BBBFFFFFFBBB..",
  ".BFFFFFFFFFFFFB.",
  ".BFFWWFFFFWWFFB.",
  "..BFFFFFFFFFFB..",
  "...BFFFFFFFFB...",
  "...BFF....FFB...",
  "..BBFF....FFBB..",
  "...BKK....KKB...",
  "...BBB....BBB...",
  "................",
];

const PRIEST_PIXELS = [
  "................",
  ".....LLLLLL.....",
  "....LllllllL....",
  "...LllllllllL...",
  "..LllllllllllL..",
  "..LBSSSSSSSSBL..",
  "..LSEBSSSSBESL..",
  "..LSSSSNSSSSSL..",
  "...LSSMMMMSSL...",
  "....LSSSSSSL....",
  "...BBGGWWGGBB...",
  "..BGGGGWWGGGGB..",
  "..BGGGWWWWGGGB..",
  "...BGGGWWGGGB...",
  "....BGGWWGGB....",
  "...BGG....GGB...",
  "..BBGG....GGBB..",
  "...BKK....KKB...",
  "...BBB....BBB...",
  "................",
];

const THIEF_PIXELS = [
  "................",
  "....TTTTTTTT....",
  "...TttttttttT...",
  "..TttttttttttT..",
  "..TTTTTTTTTTTT..",
  "...BSSSSSSSSB...",
  "..BSEBSSSSBESB..",
  "..BSSSSNSSSSSB..",
  "...BSSMMMMSSB...",
  "....BSSSSSSB....",
  "...BBQQQQQQBB...",
  "..BQQQXQQXQQQB..",
  "..BQQQXQQXQQQB..",
  "...BQQQQQQQQB...",
  "....BQQQQQQB....",
  "..T.BQ....QB.T..",
  "..TBBQ....QBBT..",
  "...BKK....KKB...",
  "...BBB....BBB...",
  "................",
];

export const CUTE_CHARACTER_PIXELS = HERO_PIXELS;

export const PIXEL_ARTS = {
  hero: {
    colors: {
      '.': 'transparent', B: '#17131f', R: '#e63946', r: '#ff6b6b', S: '#f2bf8f',
      E: '#17131f', N: '#d78b62', M: '#7a2335', C: '#3a86ff', W: '#f8fafc', K: '#384152',
    },
    pixels: HERO_PIXELS,
  },
  mage: {
    colors: {
      '.': 'transparent', B: '#17131f', Y: '#f4c430', y: '#ffe066', S: '#f3c39d',
      E: '#17131f', N: '#d98b6d', M: '#a83f68', P: '#9b5de5', G: '#f9c74f', K: '#4b3f72',
    },
    pixels: MAGE_PIXELS,
  },
  merchant: {
    colors: {
      '.': 'transparent', B: '#17131f', H: '#59351f', h: '#9a6034', S: '#d99a72',
      E: '#17131f', N: '#b86f52', M: '#6e2e2e', J: '#2d6a4f', W: '#f8fafc', T: '#ffb703', K: '#343a40',
    },
    pixels: MERCHANT_PIXELS,
  },
  fighter: {
    colors: {
      '.': 'transparent', B: '#17131f', D: '#22223b', d: '#4a4e69', R: '#ef233c',
      S: '#d99a72', E: '#17131f', N: '#b86f52', M: '#6e2e2e', F: '#f94144', W: '#f8fafc', K: '#343a40',
    },
    pixels: FIGHTER_PIXELS,
  },
  priest: {
    colors: {
      '.': 'transparent', B: '#17131f', L: '#e0aaff', l: '#f3d5ff', S: '#f1c7a5',
      E: '#17131f', N: '#d98b6d', M: '#a83f68', G: '#06d6a0', W: '#f8fafc', K: '#546a7b',
    },
    pixels: PRIEST_PIXELS,
  },
  thief: {
    colors: {
      '.': 'transparent', B: '#17131f', T: '#118ab2', t: '#73d2de', S: '#c98b68',
      E: '#17131f', N: '#a8624b', M: '#5c2735', Q: '#293241', X: '#ee6c4d', K: '#1d3557',
    },
    pixels: THIEF_PIXELS,
  },
  warrior: {
    colors: {
      '.': 'transparent', B: '#0f172a', D: '#1e293b', d: '#64748b', R: '#fbbf24',
      S: '#d8a47f', E: '#0f172a', N: '#b76e52', M: '#6b2737', F: '#334155', W: '#e2e8f0', K: '#172554',
    },
    pixels: FIGHTER_PIXELS,
  },
  sage: {
    colors: {
      '.': 'transparent', B: '#042f2e', Y: '#115e59', y: '#5eead4', S: '#f1c7a5',
      E: '#0f172a', N: '#d98b6d', M: '#9f315d', P: '#0f766e', G: '#fbbf24', K: '#134e4a',
    },
    pixels: MAGE_PIXELS,
  },
  ranger: {
    colors: {
      '.': 'transparent', B: '#1a2e05', T: '#3f6212', t: '#a3e635', S: '#c98b68',
      E: '#17210d', N: '#a8624b', M: '#5c2735', Q: '#365314', X: '#facc15', K: '#283618',
    },
    pixels: THIEF_PIXELS,
  },
  paladin: {
    colors: {
      '.': 'transparent', B: '#172554', R: '#f8fafc', r: '#93c5fd', S: '#f2bf8f',
      E: '#111827', N: '#d78b62', M: '#7a2335', C: '#2563eb', W: '#fef08a', K: '#1e3a8a',
    },
    pixels: HERO_PIXELS,
  },
  dancer: {
    colors: {
      '.': 'transparent', B: '#500724', Y: '#db2777', y: '#f9a8d4', S: '#e6ad86',
      E: '#2d0a1f', N: '#bd7357', M: '#9d174d', P: '#be185d', G: '#fbbf24', K: '#831843',
    },
    pixels: MAGE_PIXELS,
  },
  beastmaster: {
    colors: {
      '.': 'transparent', B: '#431407', H: '#7c2d12', h: '#ea580c', S: '#d99a72',
      E: '#2a160d', N: '#b86f52', M: '#6e2e2e', J: '#4d7c0f', W: '#ffedd5', T: '#facc15', K: '#713f12',
    },
    pixels: MERCHANT_PIXELS,
  },
};

export const CLASS_FEATURE_OVERLAYS = {
  hero: [
    { x: 5, y: 11, w: 6, h: 1, color: '#ffd166' },
    { x: 12, y: 11, w: 1, h: 4, color: '#f8fafc' },
    { x: 13, y: 12, w: 1, h: 2, color: '#ffd166' },
  ],
  mage: [
    { x: 11, y: 8, w: 1, h: 6, color: '#f15bb5' },
    { x: 10, y: 7, w: 3, h: 1, color: '#f9c74f' },
    { x: 12, y: 6, w: 1, h: 2, color: '#f8fafc' },
  ],
  merchant: [
    { x: 3, y: 12, w: 2, h: 2, color: '#ffb703' },
    { x: 11, y: 11, w: 2, h: 3, color: '#f8fafc' },
    { x: 11, y: 12, w: 2, h: 1, color: '#d97706' },
  ],
  fighter: [
    { x: 2, y: 10, w: 2, h: 2, color: '#f8fafc' },
    { x: 12, y: 10, w: 2, h: 2, color: '#f8fafc' },
    { x: 6, y: 13, w: 4, h: 1, color: '#ffd166' },
  ],
  priest: [
    { x: 6, y: 11, w: 3, h: 1, color: '#f8fafc' },
    { x: 7, y: 10, w: 1, h: 3, color: '#f8fafc' },
    { x: 5, y: 2, w: 6, h: 1, color: '#f8fafc' },
  ],
  thief: [
    { x: 11, y: 9, w: 2, h: 1, color: '#ee6c4d' },
    { x: 12, y: 10, w: 1, h: 2, color: '#ee6c4d' },
    { x: 3, y: 12, w: 1, h: 4, color: '#f8fafc' },
    { x: 4, y: 13, w: 1, h: 2, color: '#ee6c4d' },
  ],
  warrior: [
    { x: 1, y: 10, w: 3, h: 5, color: '#94a3b8' },
    { x: 2, y: 11, w: 1, h: 3, color: '#fbbf24' },
    { x: 12, y: 9, w: 1, h: 6, color: '#e2e8f0' },
    { x: 11, y: 9, w: 3, h: 1, color: '#fbbf24' },
  ],
  sage: [
    { x: 11, y: 7, w: 1, h: 8, color: '#fbbf24' },
    { x: 10, y: 6, w: 3, h: 2, color: '#ccfbf1' },
    { x: 3, y: 12, w: 4, h: 2, color: '#fef3c7' },
    { x: 4, y: 12, w: 1, h: 2, color: '#0f766e' },
  ],
  ranger: [
    { x: 2, y: 10, w: 1, h: 6, color: '#a16207' },
    { x: 3, y: 9, w: 1, h: 2, color: '#facc15' },
    { x: 12, y: 11, w: 1, h: 5, color: '#a16207' },
    { x: 11, y: 12, w: 3, h: 1, color: '#d9f99d' },
  ],
  paladin: [
    { x: 2, y: 10, w: 3, h: 5, color: '#f8fafc' },
    { x: 3, y: 11, w: 1, h: 3, color: '#fbbf24' },
    { x: 2, y: 12, w: 3, h: 1, color: '#fbbf24' },
    { x: 12, y: 9, w: 1, h: 6, color: '#dbeafe' },
  ],
  dancer: [
    { x: 2, y: 10, w: 2, h: 4, color: '#f9a8d4' },
    { x: 12, y: 10, w: 2, h: 4, color: '#f9a8d4' },
    { x: 5, y: 13, w: 6, h: 1, color: '#fbbf24' },
    { x: 7, y: 10, w: 2, h: 2, color: '#fce7f3' },
  ],
  beastmaster: [
    { x: 2, y: 10, w: 1, h: 6, color: '#713f12' },
    { x: 3, y: 9, w: 2, h: 1, color: '#facc15' },
    { x: 11, y: 10, w: 3, h: 2, color: '#84cc16' },
    { x: 12, y: 12, w: 1, h: 4, color: '#a16207' },
  ],
};

const r = (x, y, w, h, color) => ({ x, y, w, h, color });

const EVOLUTION_PALETTES = {
  hero: { metal: '#dbeafe', shade: '#64748b', accent: '#facc15', power: '#ef4444', dark: '#1e293b' },
  mage: { metal: '#e9d5ff', shade: '#7e22ce', accent: '#f0abfc', power: '#38bdf8', dark: '#4c1d95' },
  merchant: { metal: '#fde68a', shade: '#b45309', accent: '#f59e0b', power: '#22c55e', dark: '#422006' },
  fighter: { metal: '#fecaca', shade: '#991b1b', accent: '#f97316', power: '#fef08a', dark: '#450a0a' },
  priest: { metal: '#dcfce7', shade: '#059669', accent: '#f8fafc', power: '#facc15', dark: '#064e3b' },
  thief: { metal: '#bae6fd', shade: '#075985', accent: '#fb7185', power: '#f8fafc', dark: '#082f49' },
  warrior: { metal: '#e2e8f0', shade: '#475569', accent: '#facc15', power: '#f97316', dark: '#0f172a' },
  sage: { metal: '#ccfbf1', shade: '#0f766e', accent: '#fef3c7', power: '#a78bfa', dark: '#042f2e' },
  ranger: { metal: '#d9f99d', shade: '#3f6212', accent: '#facc15', power: '#84cc16', dark: '#1a2e05' },
  paladin: { metal: '#f8fafc', shade: '#60a5fa', accent: '#fef08a', power: '#38bdf8', dark: '#172554' },
  dancer: { metal: '#fce7f3', shade: '#be185d', accent: '#f9a8d4', power: '#facc15', dark: '#500724' },
  beastmaster: { metal: '#ffedd5', shade: '#9a3412', accent: '#facc15', power: '#84cc16', dark: '#431407' },
};

const COMMON_EVOLUTION_OVERLAYS = (p, tier) => [
  ...(tier >= 1 ? [
    r(2, 10, 2, 2, p.metal),
    r(12, 10, 2, 2, p.metal),
    r(4, 13, 8, 1, p.accent),
    r(5, 14, 6, 1, p.shade),
  ] : []),
  ...(tier >= 2 ? [
    r(3, 10, 2, 4, p.shade),
    r(11, 10, 2, 4, p.shade),
    r(5, 10, 6, 4, p.metal),
    r(7, 10, 2, 4, p.accent),
    r(4, 15, 2, 2, p.metal),
    r(10, 15, 2, 2, p.metal),
  ] : []),
  ...(tier >= 3 ? [
    r(4, 0, 8, 1, '#facc15'),
    r(5, 1, 1, 1, '#fff7ae'),
    r(8, 0, 1, 2, '#fff7ae'),
    r(11, 1, 1, 1, '#fff7ae'),
    r(1, 8, 2, 7, p.power),
    r(13, 8, 2, 7, p.power),
    r(2, 15, 2, 2, '#facc15'),
    r(12, 15, 2, 2, '#facc15'),
  ] : []),
];

const TYPE_EVOLUTION_OVERLAYS = {
  hero: (p, tier) => [
    ...(tier >= 1 ? [r(12, 8, 1, 7, '#f8fafc'), r(13, 9, 1, 5, p.accent)] : []),
    ...(tier >= 2 ? [r(1, 10, 3, 4, p.metal), r(2, 11, 1, 2, p.power), r(12, 7, 2, 8, '#f8fafc')] : []),
    ...(tier >= 3 ? [r(6, 2, 4, 1, '#facc15'), r(0, 11, 2, 3, '#ef4444'), r(14, 11, 2, 3, '#ef4444')] : []),
  ],
  mage: (p, tier) => [
    ...(tier >= 1 ? [r(12, 6, 1, 9, p.power), r(11, 5, 3, 2, p.accent)] : []),
    ...(tier >= 2 ? [r(5, 1, 6, 2, p.dark), r(6, 0, 4, 1, p.power), r(4, 12, 8, 2, p.shade)] : []),
    ...(tier >= 3 ? [r(1, 7, 1, 6, '#a78bfa'), r(14, 7, 1, 6, '#a78bfa'), r(6, 10, 4, 1, '#ffffff')] : []),
  ],
  merchant: (p, tier) => [
    ...(tier >= 1 ? [r(2, 12, 2, 3, p.accent), r(12, 12, 2, 3, p.accent), r(3, 11, 1, 1, '#fff7ae')] : []),
    ...(tier >= 2 ? [r(5, 10, 6, 5, '#14532d'), r(6, 11, 4, 1, p.accent), r(1, 13, 3, 2, '#f59e0b')] : []),
    ...(tier >= 3 ? [r(4, 2, 8, 1, '#f59e0b'), r(1, 9, 2, 2, '#facc15'), r(13, 9, 2, 2, '#facc15')] : []),
  ],
  fighter: (p, tier) => [
    ...(tier >= 1 ? [r(2, 10, 2, 4, '#f8fafc'), r(12, 10, 2, 4, '#f8fafc'), r(5, 13, 6, 1, p.power)] : []),
    ...(tier >= 2 ? [r(3, 4, 10, 1, p.dark), r(2, 5, 2, 1, p.accent), r(12, 5, 2, 1, p.accent)] : []),
    ...(tier >= 3 ? [r(4, 1, 2, 2, '#facc15'), r(10, 1, 2, 2, '#facc15'), r(0, 11, 2, 2, '#f97316'), r(14, 11, 2, 2, '#f97316')] : []),
  ],
  priest: (p, tier) => [
    ...(tier >= 1 ? [r(7, 1, 2, 4, '#f8fafc'), r(6, 2, 4, 1, p.power), r(12, 7, 1, 8, '#f8fafc')] : []),
    ...(tier >= 2 ? [r(4, 10, 8, 5, '#ecfdf5'), r(7, 10, 2, 5, p.shade), r(10, 6, 3, 1, p.power)] : []),
    ...(tier >= 3 ? [r(2, 7, 2, 7, '#bbf7d0'), r(12, 7, 2, 7, '#bbf7d0'), r(5, 0, 6, 1, '#fff7ae')] : []),
  ],
  thief: (p, tier) => [
    ...(tier >= 1 ? [r(2, 11, 1, 4, '#f8fafc'), r(13, 11, 1, 4, '#f8fafc'), r(5, 9, 6, 1, p.accent)] : []),
    ...(tier >= 2 ? [r(3, 4, 10, 1, p.dark), r(4, 10, 8, 2, '#111827'), r(1, 13, 2, 1, p.accent), r(13, 13, 2, 1, p.accent)] : []),
    ...(tier >= 3 ? [r(0, 8, 3, 7, '#0ea5e9'), r(13, 8, 3, 7, '#0ea5e9'), r(5, 1, 6, 1, '#f8fafc')] : []),
  ],
  warrior: (p, tier) => [
    ...(tier >= 1 ? [r(1, 10, 3, 5, p.metal), r(12, 8, 1, 8, '#f8fafc'), r(11, 8, 3, 1, p.accent)] : []),
    ...(tier >= 2 ? [r(3, 4, 10, 1, p.metal), r(2, 5, 2, 1, p.accent), r(12, 5, 2, 1, p.accent), r(5, 12, 6, 2, '#334155')] : []),
    ...(tier >= 3 ? [r(0, 10, 3, 5, '#cbd5e1'), r(13, 10, 3, 5, '#cbd5e1'), r(6, 1, 4, 1, '#facc15')] : []),
  ],
  sage: (p, tier) => [
    ...(tier >= 1 ? [r(12, 6, 1, 9, '#fef3c7'), r(11, 5, 3, 1, p.power), r(4, 12, 8, 2, p.shade)] : []),
    ...(tier >= 2 ? [r(4, 1, 8, 2, '#0f766e'), r(6, 0, 4, 1, '#ccfbf1'), r(5, 10, 6, 5, '#134e4a')] : []),
    ...(tier >= 3 ? [r(1, 7, 2, 7, '#5eead4'), r(13, 7, 2, 7, '#5eead4'), r(7, 2, 2, 2, '#fef3c7')] : []),
  ],
  ranger: (p, tier) => [
    ...(tier >= 1 ? [r(2, 10, 1, 6, '#a16207'), r(3, 9, 1, 2, p.accent), r(12, 11, 2, 4, '#84cc16')] : []),
    ...(tier >= 2 ? [r(3, 4, 10, 1, '#365314'), r(4, 10, 8, 2, '#14532d'), r(12, 8, 1, 7, '#fef3c7')] : []),
    ...(tier >= 3 ? [r(1, 7, 2, 8, '#65a30d'), r(13, 7, 2, 8, '#65a30d'), r(5, 1, 6, 1, '#d9f99d')] : []),
  ],
  paladin: (p, tier) => [
    ...(tier >= 1 ? [r(1, 10, 3, 5, '#f8fafc'), r(2, 12, 3, 1, p.accent), r(12, 7, 1, 9, '#dbeafe')] : []),
    ...(tier >= 2 ? [r(4, 10, 8, 5, '#eff6ff'), r(7, 10, 2, 5, '#fef08a'), r(11, 6, 3, 1, '#f8fafc')] : []),
    ...(tier >= 3 ? [r(0, 8, 3, 7, '#bae6fd'), r(13, 8, 3, 7, '#bae6fd'), r(5, 0, 6, 1, '#fff7ae')] : []),
  ],
  dancer: (p, tier) => [
    ...(tier >= 1 ? [r(2, 10, 2, 5, p.accent), r(12, 10, 2, 5, p.accent), r(5, 13, 6, 1, p.power)] : []),
    ...(tier >= 2 ? [r(4, 2, 8, 1, '#f9a8d4'), r(5, 10, 6, 5, '#be185d'), r(4, 12, 8, 1, '#fce7f3')] : []),
    ...(tier >= 3 ? [r(1, 8, 2, 7, '#f0abfc'), r(13, 8, 2, 7, '#f0abfc'), r(6, 0, 4, 1, '#facc15')] : []),
  ],
  beastmaster: (p, tier) => [
    ...(tier >= 1 ? [r(1, 10, 2, 6, '#713f12'), r(13, 10, 2, 6, '#713f12'), r(4, 9, 8, 1, p.accent)] : []),
    ...(tier >= 2 ? [r(4, 1, 2, 2, '#facc15'), r(10, 1, 2, 2, '#facc15'), r(5, 10, 6, 5, '#365314')] : []),
    ...(tier >= 3 ? [r(0, 8, 3, 7, '#a16207'), r(13, 8, 3, 7, '#a16207'), r(6, 0, 4, 1, '#ffedd5')] : []),
  ],
};

export const getCharacterEvolutionOverlays = (type, tier = 0) => {
  const normalizedTier = Math.max(0, Math.min(3, Number(tier) || 0));
  if (normalizedTier <= 0) return [];
  const palette = EVOLUTION_PALETTES[type] || EVOLUTION_PALETTES.hero;
  const typeOverlays = TYPE_EVOLUTION_OVERLAYS[type] || TYPE_EVOLUTION_OVERLAYS.hero;
  return [
    ...COMMON_EVOLUTION_OVERLAYS(palette, normalizedTier),
    ...typeOverlays(palette, normalizedTier),
  ];
};

export const TREASURE_VAULT_ART = {
  colors: {
    '.': 'transparent',
    'D': '#102a24',
    'M': '#047857',
    'E': '#6ee7b7',
    'W': '#ecfdf5',
    'Y': '#facc15',
    'G': '#f59e0b',
    'O': '#b45309',
  },
  pixels: (() => {
    const width = 32;
    const height = 19;
    const grid = Array.from({ length: height }, () => Array(width).fill('.'));
    const drawBundle = (startX, startY) => {
      for (let y = 0; y < 4; y += 1) {
        for (let x = 0; x < 10; x += 1) {
          const isBorder = x === 0 || x === 9 || y === 0 || y === 3;
          grid[startY + y][startX + x] = isBorder ? 'D' : 'E';
        }
      }
      grid[startY + 1][startX + 1] = 'W';
      grid[startY + 2][startX + 1] = 'M';
      grid[startY + 1][startX + 4] = 'Y';
      grid[startY + 1][startX + 5] = 'Y';
      grid[startY + 2][startX + 4] = 'Y';
      grid[startY + 2][startX + 5] = 'Y';
    };

    // 下段3束 → 中段2束 → 上段1束の、ひと目で分かる札束の山。
    [[1, 12], [11, 12], [21, 12], [6, 8], [16, 8], [11, 4]].forEach(
      ([x, y]) => drawBundle(x, y)
    );

    // 札束の足元に金貨の山を敷く。
    for (let x = 3; x < 29; x += 2) grid[17][x] = 'G';
    for (let x = 6; x < 27; x += 2) grid[16][x] = x % 4 === 0 ? 'O' : 'G';
    for (let x = 10; x < 23; x += 3) grid[15][x] = 'G';
    return grid.map(row => row.join(''));
  })(),
};

export const ACTION_BADGE_ARTS = {
  contract: {
    colors: { '.': 'transparent', 'B': '#111827', 'Y': '#facc15', 'W': '#fef9c3' },
    pixels: [
      "....YYYY....",
      "...YWWWWY...",
      "..YYWYYWYY..",
      "..YWWWWWWY..",
      ".YWWYYYYWWY.",
      ".YWWWWWWWWY.",
      ".BBBBBBBBBB.",
      ".BYYYYYYYYB.",
      ".BYYYYYYYYB.",
      ".BWWWWWWWWB.",
      ".BBBBBBBBBB.",
      "............"
    ]
  },
  estimate: {
    colors: { '.': 'transparent', 'B': '#111827', 'P': '#c2410c', 'Y': '#fef08a', 'W': '#ffffff' },
    pixels: [
      "..PPPPPPPP..",
      ".PYYYYYYYYP.",
      ".PYWWWWWWYP.",
      ".PYWWWWWWYP.",
      ".PYWWWWWWYP.",
      ".PYWWWWWWYP.",
      ".PYYYYYYYYP.",
      "..PPPPPPPP..",
      "...P....P...",
      "..P......P..",
      "...P....P...",
      "............"
    ]
  },
  hearing: {
    colors: { '.': 'transparent', 'B': '#111827', 'S': '#f6c7a6', 'P': '#fca5a5' },
    pixels: [
      "............",
      "...BBBB.....",
      "..BSSSB.....",
      "..BSPSSB....",
      "..BSPSSSB...",
      "..BSPSPSSB..",
      "..BSPSSSSB..",
      "..BSSSSSB...",
      "...BSPSSB...",
      "....BSSB....",
      ".....BB.....",
      "............"
    ]
  },
  default: {
    colors: { '.': 'transparent', 'B': '#111827', 'Y': '#facc15' },
    pixels: [
      ".....BB.....",
      "....BYYB....",
      "...BYYYYB...",
      "..BYYYYYYB..",
      ".BYYYYYYYYB.",
      "..BYYYYYYB..",
      "...BYYYYB...",
      "....BYYB....",
      ".....BB.....",
      "............",
      "............",
      "............"
    ]
  }
};
