// --- ドット絵データ ---
export const CUTE_CHARACTER_PIXELS = [
  ".......BBBBBB.......",
  "......BHHHHHHB......",
  ".....BHHHHHHHHB.....",
  "....BHHHHHHHHHHB....",
  "....BHSSSSSSSSHB....",
  "...BHSEESSSSEESHB...",
  "...BHSEESSSSEESHB...",
  "...BHSEESSSSEESHB...",
  "...BHSEESSSSEESHB...",
  "...BHSSSWWWWWWSSB...",
  "...BCCCCCCCCCCCCB...",
  "..BCCXXXXXXXXXXCCB..",
  "..BCXXXXXXXXXXXXCB..",
  "..BCXXXXCCCCXXXXCB..",
  "..BCXXXXCCCCXXXXCB..",
  "...BKKKKKKKKKKKKB...",
  "...BK..KK....KK.B...",
  "...BK..KK....KK.B...",
  "...BB..KK....KKBB...",
  "....BB........BB....",
];

export const PIXEL_ARTS = {
  hero: {
    colors: { '.': 'transparent', 'B': '#0f172a', 'H': '#fb7185', 'S': '#f7dc7d', 'E': '#111827', 'I': '#f8fafc', 'W': '#ffffff', 'P': '#fda4af', 'M': '#be123c', 'C': '#3b82f6', 'X': '#93c5fd', 'K': '#64748b' },
    pixels: CUTE_CHARACTER_PIXELS
  },
  mage: {
    colors: { '.': 'transparent', 'B': '#0f172a', 'H': '#c084fc', 'S': '#f7dc7d', 'E': '#111827', 'I': '#f8fafc', 'W': '#ffffff', 'P': '#f9a8d4', 'M': '#be123c', 'C': '#ec4899', 'X': '#d8b4fe', 'K': '#64748b' },
    pixels: CUTE_CHARACTER_PIXELS
  },
  merchant: {
    colors: { '.': 'transparent', 'B': '#0f172a', 'H': '#f59e0b', 'S': '#f7dc7d', 'E': '#111827', 'I': '#f8fafc', 'W': '#ffffff', 'P': '#fdba74', 'M': '#be123c', 'C': '#22c55e', 'X': '#86efac', 'K': '#64748b' },
    pixels: CUTE_CHARACTER_PIXELS
  },
  fighter: {
    colors: { '.': 'transparent', 'B': '#0f172a', 'H': '#334155', 'S': '#f7dc7d', 'E': '#111827', 'I': '#f8fafc', 'W': '#ffffff', 'P': '#fda4af', 'M': '#be123c', 'C': '#ef4444', 'X': '#fca5a5', 'K': '#64748b' },
    pixels: CUTE_CHARACTER_PIXELS
  },
  priest: {
    colors: { '.': 'transparent', 'B': '#0f172a', 'H': '#facc15', 'S': '#f7dc7d', 'E': '#111827', 'I': '#f8fafc', 'W': '#ffffff', 'P': '#fda4af', 'M': '#be123c', 'C': '#10b981', 'X': '#a7f3d0', 'K': '#94a3b8' },
    pixels: CUTE_CHARACTER_PIXELS
  },
  thief: {
    colors: { '.': 'transparent', 'B': '#0f172a', 'H': '#38bdf8', 'S': '#f7dc7d', 'E': '#111827', 'I': '#f8fafc', 'W': '#ffffff', 'P': '#fda4af', 'M': '#be123c', 'C': '#475569', 'X': '#cbd5e1', 'K': '#64748b' },
    pixels: CUTE_CHARACTER_PIXELS
  }
};

export const CLASS_FEATURE_OVERLAYS = {
  hero: [
    { x: 7, y: 4, w: 6, h: 1, color: '#cbd5e1' },
    { x: 8, y: 3, w: 4, h: 1, color: '#94a3b8' },
    { x: 5, y: 11, w: 10, h: 3, color: '#cbd5e1' },
    { x: 6, y: 11, w: 8, h: 1, color: '#e2e8f0' },
    { x: 9, y: 12, w: 2, h: 3, color: '#475569' },
    { x: 16, y: 9, w: 1, h: 7, color: '#e5e7eb' },
    { x: 15, y: 11, w: 3, h: 1, color: '#9ca3af' },
    { x: 16, y: 15, w: 1, h: 2, color: '#f59e0b' },
  ],
  mage: [
    { x: 6, y: 0, w: 8, h: 1, color: '#5b21b6' },
    { x: 5, y: 1, w: 10, h: 2, color: '#7c3aed' },
    { x: 4, y: 3, w: 12, h: 2, color: '#6d28d9' },
    { x: 11, y: 1, w: 1, h: 1, color: '#fde68a' },
    { x: 2, y: 8, w: 1, h: 8, color: '#cbd5e1' },
    { x: 1, y: 7, w: 3, h: 2, color: '#a78bfa' },
    { x: 2, y: 7, w: 1, h: 1, color: '#fde68a' },
  ],
  merchant: [
    { x: 4, y: 4, w: 12, h: 1, color: '#b45309' },
    { x: 5, y: 3, w: 10, h: 1, color: '#f59e0b' },
    { x: 6, y: 2, w: 8, h: 1, color: '#fbbf24' },
    { x: 2, y: 10, w: 3, h: 6, color: '#7c4b22' },
    { x: 3, y: 11, w: 1, h: 1, color: '#fde68a' },
    { x: 2, y: 15, w: 3, h: 1, color: '#5b341c' },
    { x: 7, y: 9, w: 1, h: 6, color: '#f59e0b' },
    { x: 8, y: 10, w: 4, h: 2, color: '#fde68a' },
  ],
  fighter: [
    { x: 3, y: 4, w: 14, h: 1, color: '#dc2626' },
    { x: 2, y: 4, w: 1, h: 2, color: '#fca5a5' },
    { x: 17, y: 4, w: 1, h: 2, color: '#fca5a5' },
    { x: 4, y: 12, w: 3, h: 2, color: '#9ca3af' },
    { x: 13, y: 12, w: 3, h: 2, color: '#9ca3af' },
    { x: 8, y: 11, w: 4, h: 1, color: '#ef4444' },
  ],
  priest: [
    { x: 4, y: 3, w: 12, h: 3, color: '#e2e8f0' },
    { x: 3, y: 5, w: 2, h: 6, color: '#cbd5e1' },
    { x: 15, y: 5, w: 2, h: 6, color: '#cbd5e1' },
    { x: 9, y: 10, w: 2, h: 5, color: '#f8fafc' },
    { x: 8, y: 12, w: 4, h: 1, color: '#facc15' },
    { x: 9, y: 11, w: 2, h: 3, color: '#facc15' },
    { x: 1, y: 8, w: 1, h: 8, color: '#d1d5db' },
    { x: 0, y: 9, w: 3, h: 1, color: '#fde68a' },
  ],
  thief: [
    { x: 3, y: 3, w: 14, h: 2, color: '#1f2937' },
    { x: 4, y: 5, w: 12, h: 1, color: '#334155' },
    { x: 4, y: 8, w: 12, h: 2, color: '#0f172a' },
    { x: 2, y: 9, w: 2, h: 5, color: '#334155' },
    { x: 16, y: 9, w: 2, h: 5, color: '#334155' },
    { x: 9, y: 9, w: 2, h: 1, color: '#475569' },
    { x: 17, y: 11, w: 1, h: 6, color: '#e5e7eb' },
    { x: 16, y: 14, w: 3, h: 1, color: '#94a3b8' },
  ],
};

export const TREASURE_VAULT_ART = {
  colors: {
    '.': 'transparent',
    'B': '#111827',
    'S': '#6b7280',
    'L': '#9ca3af',
    'C': '#8b5e34',
    'G': '#f59e0b',
    'E': '#34d399',
    'W': '#f8fafc',
  },
  pixels: [
    "....BBBBBBBBBBBBBBBBBBBB....",
    "...BSSSSSSSSSSSSSSSSSSSSB...",
    "..BSSSSSSSSSSSSSSSSSSSSSSB..",
    "..BSSSSSSBBBBBBBBSSSSSSSSB..",
    "..BSSSSSSBLLLLLLBSSSSSSSSB..",
    "..BSSSSSSBLSGGSLBSSSSSSSSB..",
    "..BSSSSSSBLSCCSLBSSSSSSSSB..",
    "..BSSSSSSBLLLLLLBSSSSSSSSB..",
    "..BSSSSSSSSSSSSSSSSSSSSSSB..",
    "..BSSCCCCCCSSGGEESSCCCCSSB..",
    "..BSSCGGGGCSSWWSSCGGGGCSSB..",
    "..BSSCCCCCCSSGGSSCCCCCCSSB..",
    "..BSSSSSSSSSSSSSSSSSSSSSSB..",
    "...BSSSSSSSSSSSSSSSSSSSSB...",
    "....BBBBBBBBBBBBBBBBBBBB....",
  ],
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
