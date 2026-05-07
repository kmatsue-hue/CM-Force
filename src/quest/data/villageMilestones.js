import {
  ADVANCED_VILLAGE_MILESTONE_START,
  ADVANCED_VILLAGE_MILESTONE_STEP,
} from './constants.js';

export const ADVANCED_VILLAGE_DEVELOPMENTS = [
  { title: "中央市場ホール", comment: "巨大な市場が開き、商人が絶えず集うようになった。", glyph: "市", left: 34, bottom: 46, bg: "#fde68a", fg: "#111827" },
  { title: "路面電車ターミナル", comment: "新しい公共交通が村の動脈として走り始めた。", glyph: "電", left: 58, bottom: 46, bg: "#bfdbfe", fg: "#111827" },
  { title: "観光案内所", comment: "外からの来訪者を迎える玄関口が整備された。", glyph: "観", left: 74, bottom: 45, bg: "#fef9c3", fg: "#111827" },
  { title: "大図書館", comment: "知識を蓄える大規模な書庫が完成した。", glyph: "書", left: 42, bottom: 50, bg: "#ddd6fe", fg: "#111827" },
  { title: "工業団地", comment: "生産施設が集まり、製造力が一段と高まった。", glyph: "工", left: 66, bottom: 49, bg: "#d1d5db", fg: "#111827" },
  { title: "高速道路IC", comment: "広域流通の要衝となる接続点が開通した。", glyph: "高", left: 52, bottom: 52, bg: "#c7d2fe", fg: "#111827" },
  { title: "中央病院", comment: "高度な医療体制で村の安心が強化された。", glyph: "医", left: 80, bottom: 50, bg: "#fecaca", fg: "#111827" },
  { title: "芸術公園", comment: "噴水と彫刻が並ぶ憩いの公園が人気を集めている。", glyph: "芸", left: 30, bottom: 47, bg: "#f9a8d4", fg: "#111827" },
  { title: "物流センター", comment: "物資の集配が効率化され、倉庫網が最適化された。", glyph: "物", left: 62, bottom: 54, bg: "#fed7aa", fg: "#111827" },
  { title: "国際駅", comment: "遠方との接続が増え、交流人口が急増した。", glyph: "駅", left: 46, bottom: 56, bg: "#e2e8f0", fg: "#111827" },
  { title: "テックキャンパス", comment: "技術者が集い、新産業の研究が進んでいる。", glyph: "技", left: 72, bottom: 56, bg: "#bae6fd", fg: "#111827" },
  { title: "新市庁舎", comment: "行政機能が強化され、都市運営が安定した。", glyph: "庁", left: 56, bottom: 58, bg: "#f8fafc", fg: "#111827" },
  { title: "メガソーラー", comment: "広大な発電設備が昼の電力需要を支えている。", glyph: "陽", left: 35, bottom: 55, bg: "#fde047", fg: "#111827" },
  { title: "風力発電群", comment: "丘陵地に風車が並び、再生可能エネルギーが増加。", glyph: "風", left: 82, bottom: 57, bg: "#c4b5fd", fg: "#111827" },
  { title: "国際展示場", comment: "大型イベントが開催され、商談が活発になった。", glyph: "展", left: 48, bottom: 60, bg: "#fed7aa", fg: "#111827" },
  { title: "研究学園都市", comment: "教育と研究が連動し、知的基盤が飛躍した。", glyph: "研", left: 64, bottom: 61, bg: "#bfdbfe", fg: "#111827" },
  { title: "中央データセンター", comment: "都市機能を支える計算資源が大幅に増強された。", glyph: "算", left: 38, bottom: 61, bg: "#d1fae5", fg: "#111827" },
  { title: "河川再開発地区", comment: "水辺空間が再整備され、景観と防災が向上した。", glyph: "河", left: 74, bottom: 60, bg: "#67e8f9", fg: "#111827" },
  { title: "歴史資料館", comment: "開拓の記録が展示され、文化の厚みが増した。", glyph: "史", left: 28, bottom: 60, bg: "#e5e7eb", fg: "#111827" },
  { title: "空港第2ターミナル", comment: "空路需要に対応し、国際便の発着が始まった。", glyph: "空", left: 58, bottom: 63, bg: "#c7d2fe", fg: "#111827" },
  { title: "宇宙通信局", comment: "衛星通信網が整備され、情報連携が強化された。", glyph: "宇", left: 83, bottom: 63, bg: "#c4b5fd", fg: "#111827" },
  { title: "環状モノレール", comment: "主要区画を結ぶ環状線が都市回遊を支えている。", glyph: "輪", left: 44, bottom: 64, bg: "#93c5fd", fg: "#111827" },
  { title: "臨海副都心", comment: "新たな商業中枢が生まれ、夜景が華やいだ。", glyph: "湾", left: 69, bottom: 64, bg: "#a5f3fc", fg: "#111827" },
  { title: "文化交流ドーム", comment: "多様な催しが開かれ、都市の魅力が広がった。", glyph: "文", left: 33, bottom: 66, bg: "#fbcfe8", fg: "#111827" },
  { title: "国立劇場", comment: "一流の公演が連日満席となる文化拠点が誕生。", glyph: "劇", left: 53, bottom: 66, bg: "#fca5a5", fg: "#111827" },
  { title: "未来農業プラント", comment: "高効率な生産方式で食料供給が安定した。", glyph: "農", left: 78, bottom: 66, bg: "#86efac", fg: "#111827" },
  { title: "AI管制センター", comment: "交通・防災・電力の統合制御が実現した。", glyph: "智", left: 60, bottom: 68, bg: "#bfdbfe", fg: "#111827" },
  { title: "浮遊庭園区画", comment: "上空庭園が整備され、新たな観光名所となった。", glyph: "園", left: 40, bottom: 68, bg: "#bbf7d0", fg: "#111827" },
  { title: "王都迎賓街区", comment: "格式ある街並みが整い、要人の往来が増えた。", glyph: "王", left: 70, bottom: 69, bg: "#fde68a", fg: "#111827" },
  { title: "天空城プロジェクト", comment: "空へ伸びる象徴建築が完成し、伝説級の都となった。", glyph: "天", left: 50, bottom: 70, bg: "#e2e8f0", fg: "#111827" },
];

export const VILLAGE_MILESTONES = [
  { threshold: 50000, phase: "第1段階: 開拓と定住", title: "始まりの看板", comment: "村の名前が荒野に刻まれた。" },
  { threshold: 100000, phase: "第1段階: 開拓と定住", title: "焚き火とテント", comment: "冒険者たちの暮らしが始まる。" },
  { threshold: 150000, phase: "第1段階: 開拓と定住", title: "古びた井戸", comment: "生活用の水場が整った。" },
  { threshold: 200000, phase: "第1段階: 開拓と定住", title: "家庭菜園", comment: "小さな芽が村の希望になった。" },
  { threshold: 250000, phase: "第1段階: 開拓と定住", title: "道具置き場", comment: "開拓用の資材を保管できるようになった。" },
  { threshold: 300000, phase: "第1段階: 開拓と定住", title: "木の家", comment: "テントが家へ進化した。" },
  { threshold: 350000, phase: "第1段階: 開拓と定住", title: "土の道", comment: "村の移動がぐっと楽になった。" },
  { threshold: 400000, phase: "第1段階: 開拓と定住", title: "木の柵", comment: "村を守る外周ができた。" },
  { threshold: 450000, phase: "第1段階: 開拓と定住", title: "2人目の村人", comment: "新しい仲間が移住してきた。" },
  { threshold: 500000, phase: "第1段階: 開拓と定住", title: "村長の家", comment: "村の中心となる拠点が完成した。" },

  { threshold: 550000, phase: "第2段階: 集落から村へ", title: "小さな祠", comment: "村の端に祈りの場ができた。" },
  { threshold: 600000, phase: "第2段階: 集落から村へ", title: "鶏小屋", comment: "ニワトリが走り回るにぎやかな朝。" },
  { threshold: 650000, phase: "第2段階: 集落から村へ", title: "松明の街灯", comment: "夜道が明るく安全になった。" },
  { threshold: 700000, phase: "第2段階: 集落から村へ", title: "石造りの橋", comment: "小川を越えて行き来しやすくなった。" },
  { threshold: 750000, phase: "第2段階: 集落から村へ", title: "雑貨屋", comment: "アイテムを扱う店が開いた。" },
  { threshold: 800000, phase: "第2段階: 集落から村へ", title: "行商人の荷車", comment: "外からの交易が始まった。" },
  { threshold: 850000, phase: "第2段階: 集落から村へ", title: "花壇", comment: "村の景色が華やいだ。" },
  { threshold: 900000, phase: "第2段階: 集落から村へ", title: "鍛冶屋", comment: "煙突の煙がたなびく工房が稼働。" },
  { threshold: 950000, phase: "第2段階: 集落から村へ", title: "水車小屋", comment: "水車が回り、産業が動き始めた。" },
  { threshold: 1000000, phase: "第2段階: 集落から村へ", title: "中央噴水", comment: "広場に象徴となる噴水ができた。" },

  { threshold: 1050000, phase: "第3段階: 産業の発展と豊かさ", title: "酒場", comment: "夜にも灯りがともる活気が生まれた。" },
  { threshold: 1100000, phase: "第3段階: 産業の発展と豊かさ", title: "掲示板", comment: "情報と分析の拠点ができた。" },
  { threshold: 1150000, phase: "第3段階: 産業の発展と豊かさ", title: "石畳の道", comment: "道路が整備され、村の格が上がった。" },
  { threshold: 1200000, phase: "第3段階: 産業の発展と豊かさ", title: "果樹園", comment: "実りの木々が増えていく。" },
  { threshold: 1250000, phase: "第3段階: 産業の発展と豊かさ", title: "料理人の屋台", comment: "香ばしい匂いが広場を包む。" },
  { threshold: 1300000, phase: "第3段階: 産業の発展と豊かさ", title: "時計塔", comment: "村の時間を刻むシンボルが立った。" },
  { threshold: 1350000, phase: "第3段階: 産業の発展と豊かさ", title: "図書室", comment: "知恵が集まる館ができた。" },
  { threshold: 1400000, phase: "第3段階: 産業の発展と豊かさ", title: "開拓者の像", comment: "開拓の功績が像として残された。" },
  { threshold: 1450000, phase: "第3段階: 産業の発展と豊かさ", title: "厩舎", comment: "馬が村を走るようになった。" },
  { threshold: 1500000, phase: "第3段階: 産業の発展と豊かさ", title: "見張り塔と門", comment: "防衛設備が完成した。" },

  { threshold: 1550000, phase: "第4段階: 繁栄と文化の都", title: "薬草園と診療所", comment: "医療と薬草の体制が整った。" },
  { threshold: 1600000, phase: "第4段階: 繁栄と文化の都", title: "学問所", comment: "子どもたちが学ぶ声が響く。" },
  { threshold: 1650000, phase: "第4段階: 繁栄と文化の都", title: "仕立て屋", comment: "村人の装いが豪華になった。" },
  { threshold: 1700000, phase: "第4段階: 繁栄と文化の都", title: "魔術師の塔", comment: "怪しい塔と不思議な光が現れた。" },
  { threshold: 1750000, phase: "第4段階: 繁栄と文化の都", title: "劇場", comment: "吟遊詩人の歌が夜に広がる。" },
  { threshold: 1800000, phase: "第4段階: 繁栄と文化の都", title: "豪邸", comment: "拠点が豪華な館に改築された。" },
  { threshold: 1850000, phase: "第4段階: 繁栄と文化の都", title: "大倉庫", comment: "交易物資を蓄える拠点が完成。" },
  { threshold: 1900000, phase: "第4段階: 繁栄と文化の都", title: "公衆浴場", comment: "湯気とにぎわいが広場に満ちる。" },
  { threshold: 1950000, phase: "第4段階: 繁栄と文化の都", title: "お祝い花火", comment: "夜空を祝福の光が彩る。" },
  { threshold: 2000000, phase: "第4段階: 繁栄と文化の都", title: "迎賓館", comment: "小国のような威厳を持つ村になった。" },
  ...ADVANCED_VILLAGE_DEVELOPMENTS.map((development, idx) => ({
    threshold: ADVANCED_VILLAGE_MILESTONE_START + idx * ADVANCED_VILLAGE_MILESTONE_STEP,
    phase: idx < 10
      ? "第5段階: 都市基盤の拡張"
      : idx < 20
      ? "第6段階: 産業都市への進化"
      : "第7段階: 未来都市かいえんたい",
    title: development.title,
    comment: development.comment
  })),
];

export const MAX_VILLAGE_PROFIT_TARGET = VILLAGE_MILESTONES[VILLAGE_MILESTONES.length - 1]?.threshold ?? 0;
