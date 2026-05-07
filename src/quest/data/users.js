export const USERS_MASTER = {
  "しんまい": { id: 1, charType: "hero", className: "ゆうしゃ", level: 1 },
  "アラン": { id: 2, charType: "mage", className: "まほうつかい", level: 3 },
  "トーマス": { id: 3, charType: "merchant", className: "しょうにん", level: 5 },
  "レジェンド": { id: 4, charType: "hero", className: "でんせつ", level: 10 }
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
  { type: "hero", name: "ゆうしゃ" },
  { type: "mage", name: "まほうつかい" },
  { type: "merchant", name: "しょうにん" },
  { type: "fighter", name: "ぶとうか" },
  { type: "priest", name: "そうりょ" },
  { type: "thief", name: "とうぞく" }
];
