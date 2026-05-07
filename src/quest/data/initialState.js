export const INITIAL_USER = { id: 1, name: "しんまい", charType: "hero", className: "ゆうしゃ", level: 1, exp: 0, gold: 0, nextExp: 100 };

export const INITIAL_KPI = {
  hearing: { current: 395, target: 400, name: "ヒアリング", icon: "耳", color: "bg-blue-500" },
  estimate: { current: 198, target: 200, name: "見積もり", icon: "巻", color: "bg-yellow-500" },
  contract: { current: 29, target: 30, name: "契約", icon: "冠", color: "bg-red-500" },
};

export const INITIAL_CLIENTS = [
  { id: 1, name: "サッポロさくら苑", status: "未着手", area: "北海道", progress: { hearing: 0, estimate: 0, contract: 0 }, profit: 0 },
  { id: 2, name: "アオモリクリニック", status: "ヒアリング中", area: "東北", progress: { hearing: 2, estimate: 0, contract: 0 }, profit: 0 },
  { id: 3, name: "トウキョウみらい苑", status: "契約済み", area: "関東", progress: { hearing: 5, estimate: 3, contract: 1 }, profit: 1500000 },
  { id: 4, name: "ナゴヤかいごセンター", status: "見積もり中", area: "中部", progress: { hearing: 4, estimate: 1, contract: 0 }, profit: 0 },
  { id: 5, name: "オオサカしんりょう所", status: "未着手", area: "関西", progress: { hearing: 0, estimate: 0, contract: 0 }, profit: 0 },
  { id: 6, name: "ヒロシマクリニック", status: "未着手", area: "中国", progress: { hearing: 0, estimate: 0, contract: 0 }, profit: 0 },
  { id: 7, name: "タカマツしんりょう苑", status: "未着手", area: "四国", progress: { hearing: 0, estimate: 0, contract: 0 }, profit: 0 },
  { id: 8, name: "フクオカかいごセンター", status: "未着手", area: "九州", progress: { hearing: 0, estimate: 0, contract: 0 }, profit: 0 },
];

export const INITIAL_LOGS = [
  { id: 1, date: "3/30", userName: "レジェンド", clientName: "トウキョウみらい苑", area: "関東", actionType: "契約", earnedExp: 500, sales: 1500000, profit: 0 },
  { id: 2, date: "3/30", userName: "アラン", clientName: "ナゴヤかいごセンター", area: "中部", actionType: "見積もり", earnedExp: 50, sales: 800000, profit: 0 },
  { id: 3, date: "3/31", userName: "トーマス", clientName: "アオモリクリニック", area: "東北", actionType: "ヒアリング", earnedExp: 25, sales: 0, profit: 0 },
];

export const ACTIONS = {
  HEARING: { exp: 25, gold: 5, icon: "耳", baseSales: 0 },
  ESTIMATE: { exp: 50, gold: 20, icon: "巻", baseSales: 500000 },
  CONTRACT: { exp: 500, gold: 100, icon: "冠", baseSales: 800000 },
};
