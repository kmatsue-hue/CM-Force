export const USERS_MASTER = {
  "しんまい": { id: 1, charType: "hero", className: "ゆうしゃ", level: 1 },
  "アラン": { id: 2, charType: "mage", className: "まほうつかい", level: 3 },
  "トーマス": { id: 3, charType: "merchant", className: "こうしょうにん", level: 5 },
  "レジェンド": { id: 4, charType: "hero", className: "ロイヤルナイト", level: 10 }
};

export const USER_ACCOUNT_PROFILES = {
  "しんまい": { fullName: "新米 太郎", account: "char-001-hero@kaientai.local" },
  "アラン": { fullName: "有馬 蘭", account: "char-002-mage@kaientai.local" },
  "トーマス": { fullName: "富松 翔", account: "char-003-merchant@kaientai.local" },
  "レジェンド": { fullName: "伝堂 暁", account: "char-004-hero@kaientai.local" },
};

export const MAP_CSV_SORT_OPTIONS = [
  { value: "all", label: "全件" },
  { value: "project", label: "案件ごと" },
  { value: "owner", label: "担当ごと" },
];

export const CHAR_CLASSES = [
  { type: "hero", name: "ゆうしゃ", evolutions: [{ level: 5, name: "ナイト" }, { level: 10, name: "ロイヤルナイト" }, { level: 15, name: "でんせつのきし" }] },
  { type: "mage", name: "まほうつかい", evolutions: [{ level: 5, name: "ウィザード" }, { level: 10, name: "アークメイジ" }, { level: 15, name: "だいまどうし" }] },
  { type: "merchant", name: "しょうにん", evolutions: [{ level: 5, name: "こうしょうにん" }, { level: 10, name: "だいしょうにん" }, { level: 15, name: "ゴールドマスター" }] },
  { type: "fighter", name: "ぶとうか", evolutions: [{ level: 5, name: "かくとうか" }, { level: 10, name: "ぶじん" }, { level: 15, name: "ぶとうおう" }] },
  { type: "priest", name: "そうりょ", evolutions: [{ level: 5, name: "しさい" }, { level: 10, name: "ハイプリースト" }, { level: 15, name: "せいじゃ" }] },
  { type: "thief", name: "とうぞく", evolutions: [{ level: 5, name: "スカウト" }, { level: 10, name: "アサシン" }, { level: 15, name: "シャドウマスター" }] },
  { type: "warrior", name: "せんし", evolutions: [{ level: 5, name: "じゅうせんし" }, { level: 10, name: "ウォーロード" }, { level: 15, name: "せんじん" }] },
  { type: "sage", name: "けんじゃ", evolutions: [{ level: 5, name: "こうけんじゃ" }, { level: 10, name: "グランドセージ" }, { level: 15, name: "ちえのしゅごしゃ" }] },
  { type: "ranger", name: "レンジャー", evolutions: [{ level: 5, name: "ハンター" }, { level: 10, name: "マスターレンジャー" }, { level: 15, name: "フォレストロード" }] },
  { type: "paladin", name: "パラディン", evolutions: [{ level: 5, name: "ホーリーナイト" }, { level: 10, name: "テンプルガード" }, { level: 15, name: "セイントロード" }] },
  { type: "dancer", name: "おどりこ", evolutions: [{ level: 5, name: "パフォーマー" }, { level: 10, name: "スターダンサー" }, { level: 15, name: "ミューズ" }] },
  { type: "beastmaster", name: "まものつかい", evolutions: [{ level: 5, name: "ビーストテイマー" }, { level: 10, name: "モンスターロード" }, { level: 15, name: "げんじゅうおう" }] }
];

export const getClassEvolution = (type, level = 1) => {
  const characterClass = CHAR_CLASSES.find(character => character.type === type) || CHAR_CLASSES[0];
  const normalizedLevel = Math.max(1, Number(level) || 1);
  const stages = [
    { level: 1, name: characterClass.name },
    ...(characterClass.evolutions || []),
  ];
  const currentIndex = stages.reduce(
    (latestIndex, stage, index) => (normalizedLevel >= stage.level ? index : latestIndex),
    0
  );
  const current = stages[currentIndex];
  const next = stages[currentIndex + 1] || null;

  return {
    ...current,
    tier: currentIndex + 1,
    maxTier: stages.length,
    next,
  };
};
