import React from 'react';
import {
  VILLAGE_PROFIT_UNIT,
  TRANSPORT_UNLOCK_PROFIT_THRESHOLD,
  STATUE_PROFIT_THRESHOLD,
} from '../data/constants.js';
import {
  VILLAGE_MILESTONES,
  MAX_VILLAGE_PROFIT_TARGET,
  ADVANCED_VILLAGE_DEVELOPMENTS,
} from '../data/villageMilestones.js';
import { formatG } from '../utils/format.js';
import {
  getBgColorByLevel,
  getBorderClassByLevel,
  getCharInfo as getCharInfoUtil,
} from '../utils/userLevel.js';
import { blendDaySunsetNight } from '../utils/colorMath.js';
import DqWindow from '../ui/DqWindow.jsx';
import PixelCharacter from '../ui/PixelCharacter.jsx';

const VillageScreen = ({
  user,
  villageZoom,
  setVillageZoom,
  sortedUsers,
  isEveningToMidnight,
  cityLightLevel,
  lightDisplayGate,
  twilightWarmth,
  nightDensity,
  dawnRise,
  villageHour,
}) => {
  const getCharInfo = (userName) => getCharInfoUtil(userName, user);
  const _renderVillage = () => {
    const userProfitMap = new Map(sortedUsers);
    if (!userProfitMap.has(user.name)) {
      userProfitMap.set(user.name, { sales: 0, profit: 0 });
    }

    const villageContributors = Array.from(userProfitMap.entries())
      .map(([userName, data]) => {
        const profit = Math.max(0, data?.profit || 0);
        const points = Math.floor(profit / VILLAGE_PROFIT_UNIT);
        return {
          userName,
          profit,
          points,
          houses: Math.min(12, points),
          facilities: Math.min(4, Math.floor(points / 4)),
          vehicles: Math.min(3, Math.floor(points / 7)),
          charInfo: getCharInfo(userName)
        };
      })
      .sort((a, b) => b.profit - a.profit);

    const totalVillagePoints = villageContributors.reduce((sum, userData) => sum + userData.points, 0);
    const totalVillageProfit = villageContributors.reduce((sum, userData) => sum + userData.profit, 0);
    const isTransportUnlocked = totalVillageProfit > TRANSPORT_UNLOCK_PROFIT_THRESHOLD;
    const buildingGrowthPoints = totalVillageProfit >= TRANSPORT_UNLOCK_PROFIT_THRESHOLD
      ? Math.floor((totalVillageProfit - TRANSPORT_UNLOCK_PROFIT_THRESHOLD) / VILLAGE_PROFIT_UNIT) + 1
      : 0;
    const unlockedMilestones = VILLAGE_MILESTONES.filter((milestone) => totalVillageProfit >= milestone.threshold);
    const latestMilestone = unlockedMilestones.length > 0 ? unlockedMilestones[unlockedMilestones.length - 1] : null;
    const nextMilestone = VILLAGE_MILESTONES.find((milestone) => totalVillageProfit < milestone.threshold) || null;
    const previousThreshold = latestMilestone ? latestMilestone.threshold : 0;
    const nextThreshold = nextMilestone ? nextMilestone.threshold : previousThreshold + 1;
    const phaseProgress = nextMilestone
      ? Math.min(100, Math.floor(((totalVillageProfit - previousThreshold) / Math.max(1, nextThreshold - previousThreshold)) * 100))
      : 100;
    const villagePhaseLabel = latestMilestone ? latestMilestone.phase : "第0段階: 未開拓";
    const recentUnlockedMilestones = unlockedMilestones.slice(-6).reverse();
    const isMilestoneUnlocked = (threshold) => totalVillageProfit >= threshold;
    const visibleVillageContributors = villageContributors.filter((entry) => entry.profit > 0);
    const statueContributors = villageContributors.filter((entry) => entry.profit > STATUE_PROFIT_THRESHOLD);
    const villageStatueSlots = Array.from({ length: Math.min(8, statueContributors.length) }, (_, idx) => {
      const row = Math.floor(idx / 4);
      const col = idx % 4;
      return {
        left: 36 + col * 11 + (row % 2 === 1 ? 2.2 : 0),
        bottom: 23 + row * 7.6,
      };
    });
    const villageStatues = statueContributors
      .slice(0, villageStatueSlots.length)
      .map((entry, idx) => ({
        ...entry,
        left: villageStatueSlots[idx].left,
        bottom: villageStatueSlots[idx].bottom,
      }));

    const milestoneFeatures = [
      { threshold: 50000, left: 31, bottom: 25, glyph: "看", title: "始まりの看板", bg: "#fef3c7", fg: "#111827" },
      { threshold: 100000, left: 24, bottom: 24, glyph: "火", title: "焚き火とテント", bg: "#fb923c", fg: "#111827" },
      { threshold: 150000, left: 40, bottom: 24, glyph: "井", title: "古びた井戸", bg: "#bfdbfe", fg: "#111827" },
      { threshold: 200000, left: 51, bottom: 22, glyph: "菜", title: "家庭菜園", bg: "#86efac", fg: "#111827" },
      { threshold: 250000, left: 62, bottom: 23, glyph: "倉", title: "道具置き場", bg: "#d6d3d1", fg: "#111827" },
      { threshold: 300000, left: 24, bottom: 29, glyph: "家", title: "木の家", bg: "#f5f5f4", fg: "#111827" },
      { threshold: 350000, left: 46, bottom: 18, glyph: "道", title: "土の道", bg: "#ca8a04", fg: "#111827" },
      { threshold: 400000, left: 80, bottom: 17, glyph: "柵", title: "木の柵", bg: "#92400e", fg: "#ffffff" },
      { threshold: 450000, left: 37, bottom: 20, glyph: "人", title: "2人目の村人", bg: "#fca5a5", fg: "#111827" },
      { threshold: 500000, left: 46, bottom: 29, glyph: "長", title: "村長の家", bg: "#fef08a", fg: "#111827" },

      { threshold: 550000, left: 82, bottom: 37, glyph: "祠", title: "小さな祠", bg: "#f5d0fe", fg: "#111827" },
      { threshold: 600000, left: 68, bottom: 23, glyph: "鶏", title: "鶏小屋", bg: "#ffffff", fg: "#111827" },
      { threshold: 650000, left: 58, bottom: 20, glyph: "灯", title: "松明の街灯", bg: "#f59e0b", fg: "#111827" },
      { threshold: 700000, left: 20, bottom: 28, glyph: "橋", title: "石造りの橋", bg: "#cbd5e1", fg: "#111827" },
      { threshold: 750000, left: 63, bottom: 32, glyph: "店", title: "雑貨屋", bg: "#dbeafe", fg: "#111827" },
      { threshold: 800000, left: 56, bottom: 18, glyph: "荷", title: "行商人の荷車", bg: "#fdba74", fg: "#111827" },
      { threshold: 850000, left: 75, bottom: 23, glyph: "花", title: "花壇", bg: "#f9a8d4", fg: "#111827" },
      { threshold: 900000, left: 74, bottom: 33, glyph: "鍛", title: "鍛冶屋", bg: "#9ca3af", fg: "#111827" },
      { threshold: 950000, left: 22, bottom: 36, glyph: "車", title: "水車小屋", bg: "#bfdbfe", fg: "#111827" },
      { threshold: 1000000, left: 52, bottom: 28, glyph: "泉", title: "中央噴水", bg: "#93c5fd", fg: "#111827" },

      { threshold: 1050000, left: 36, bottom: 31, glyph: "酒", title: "酒場", bg: "#fca5a5", fg: "#111827" },
      { threshold: 1100000, left: 58, bottom: 25, glyph: "板", title: "掲示板", bg: "#e7e5e4", fg: "#111827" },
      { threshold: 1150000, left: 47, bottom: 16, glyph: "石", title: "石畳の道", bg: "#d1d5db", fg: "#111827" },
      { threshold: 1200000, left: 82, bottom: 22, glyph: "果", title: "果樹園", bg: "#84cc16", fg: "#111827" },
      { threshold: 1250000, left: 46, bottom: 20, glyph: "屋", title: "料理人の屋台", bg: "#fdba74", fg: "#111827" },
      { threshold: 1300000, left: 60, bottom: 40, glyph: "塔", title: "時計塔", bg: "#cbd5e1", fg: "#111827" },
      { threshold: 1350000, left: 31, bottom: 38, glyph: "本", title: "図書室", bg: "#ddd6fe", fg: "#111827" },
      { threshold: 1400000, left: 54, bottom: 24, glyph: "像", title: "開拓者の像", bg: "#e5e7eb", fg: "#111827" },
      { threshold: 1450000, left: 79, bottom: 23, glyph: "馬", title: "厩舎", bg: "#fed7aa", fg: "#111827" },
      { threshold: 1500000, left: 89, bottom: 30, glyph: "門", title: "見張り塔と門", bg: "#cbd5e1", fg: "#111827" },

      { threshold: 1550000, left: 25, bottom: 43, glyph: "薬", title: "薬草園と診療所", bg: "#86efac", fg: "#111827" },
      { threshold: 1600000, left: 44, bottom: 43, glyph: "学", title: "学問所", bg: "#bfdbfe", fg: "#111827" },
      { threshold: 1650000, left: 67, bottom: 41, glyph: "服", title: "仕立て屋", bg: "#f9a8d4", fg: "#111827" },
      { threshold: 1700000, left: 84, bottom: 47, glyph: "魔", title: "魔術師の塔", bg: "#c4b5fd", fg: "#111827" },
      { threshold: 1750000, left: 50, bottom: 17, glyph: "劇", title: "劇場", bg: "#fca5a5", fg: "#111827" },
      { threshold: 1800000, left: 44, bottom: 30, glyph: "邸", title: "豪邸", bg: "#f8fafc", fg: "#111827" },
      { threshold: 1850000, left: 74, bottom: 17, glyph: "庫", title: "大倉庫", bg: "#d6d3d1", fg: "#111827" },
      { threshold: 1900000, left: 33, bottom: 18, glyph: "湯", title: "公衆浴場", bg: "#67e8f9", fg: "#111827" },
      { threshold: 1950000, left: 16, bottom: 58, glyph: "祝", title: "お祝い花火", bg: "#fde68a", fg: "#111827" },
      { threshold: 2000000, left: 82, bottom: 44, glyph: "城", title: "迎賓館", bg: "#e2e8f0", fg: "#111827" },
      ...ADVANCED_VILLAGE_DEVELOPMENTS.map((development, idx) => ({
        threshold: ADVANCED_VILLAGE_MILESTONE_START + idx * ADVANCED_VILLAGE_MILESTONE_STEP,
        left: development.left,
        bottom: development.bottom,
        glyph: development.glyph,
        title: development.title,
        bg: development.bg,
        fg: development.fg
      })),
    ];
    const unlockedAdvancedMilestoneFeatures = milestoneFeatures.filter(
      (feature) => feature.threshold >= ADVANCED_VILLAGE_MILESTONE_START && isMilestoneUnlocked(feature.threshold)
    );
    const advancedDevelopmentCount = unlockedAdvancedMilestoneFeatures.length;
    const advancedDevelopmentTotal = ADVANCED_VILLAGE_DEVELOPMENTS.length;
    const advancedIllustrationSlots = ADVANCED_VILLAGE_DEVELOPMENTS.map((_, idx) => {
      const row = Math.floor(idx / 6);
      const col = idx % 6;
      return {
        left: 33 + col * 10.6 + (row % 2 === 1 ? 1.6 : 0),
        bottom: 22 + row * 7.1
      };
    });
    const unlockedAdvancedIllustrations = unlockedAdvancedMilestoneFeatures.map((feature, idx) => ({
      ...feature,
      left: advancedIllustrationSlots[idx]?.left ?? feature.left,
      bottom: advancedIllustrationSlots[idx]?.bottom ?? Math.max(22, Math.min(58, feature.bottom))
    }));
    const advancedIllustrationProfiles = [
      { width: 34, height: 24, wallTop: '#e8eef7', wallBottom: '#cbd9ea', roof: '#334155', window: '#bfdbfe', accent: '#475569', type: 'civic' },
      { width: 36, height: 22, wallTop: '#f3efe2', wallBottom: '#d6ccb2', roof: '#7c2d12', window: '#fde68a', accent: '#92400e', type: 'market' },
      { width: 30, height: 28, wallTop: '#dbe7f6', wallBottom: '#b8c9de', roof: '#1f2937', window: '#93c5fd', accent: '#334155', type: 'tower' },
      { width: 32, height: 24, wallTop: '#d7efe0', wallBottom: '#afd4c1', roof: '#166534', window: '#bbf7d0', accent: '#15803d', type: 'plant' },
      { width: 38, height: 20, wallTop: '#e9ecf3', wallBottom: '#cfd6e2', roof: '#374151', window: '#c4d4e6', accent: '#4b5563', type: 'transit' },
      { width: 34, height: 23, wallTop: '#f2e7f7', wallBottom: '#d6c0e4', roof: '#6d28d9', window: '#ddd6fe', accent: '#7c3aed', type: 'culture' },
    ];

    const villagerName = visibleVillageContributors[1]?.userName || visibleVillageContributors[0]?.userName || "村人A";
    const villagerCharType = visibleVillageContributors[1]?.charInfo?.charType || visibleVillageContributors[0]?.charInfo?.charType || "merchant";
    const villagerComment = latestMilestone
      ? `「${latestMilestone.title} が できたよ。${latestMilestone.comment}」`
      : "「まずは 5万G ためて、かんばんを 立てよう！」";

    const totalHouses = Math.min(36, Math.floor(totalVillagePoints * 1.3));
    const totalFacilities = Math.min(14, Math.floor(totalVillagePoints / 3));
    const totalTowers = Math.min(6, Math.floor(totalVillagePoints / 8));
    const totalVehicles = Math.min(4, Math.floor(totalVillagePoints / 6));
    const totalWalkers = Math.min(7, Math.floor(totalVillagePoints / 4));
    const totalFields = Math.min(16, Math.floor(totalVillagePoints / 2));
    const totalTrees = Math.min(70, Math.floor(totalVillagePoints * 2));
    const totalSmokeStacks = Math.min(8, Math.floor(totalVillagePoints / 3));
    const totalBoats = totalVillageProfit >= 500000
      ? Math.max(1, Math.min(3, Math.floor(totalVillagePoints / 10)))
      : 0;
    const totalWindmills = Math.min(3, Math.floor(totalVillagePoints / 11));
    const totalLamps = Math.min(14, Math.floor(totalVillagePoints / 2));
    const totalWaterSparkles = Math.min(24, Math.floor(totalVillagePoints / 2));
    const totalRoadStones = Math.min(84, Math.floor(totalVillagePoints * 2));
    const totalFences = Math.min(30, Math.floor(totalVillagePoints * 1.2));
    const totalFlowerBeds = Math.min(22, Math.floor(totalVillagePoints / 2));
    const totalCanalReeds = Math.min(20, Math.floor(totalVillagePoints / 2));
    const totalBirds = Math.min(7, Math.floor(totalVillagePoints / 5));
    const totalBanners = Math.min(10, Math.floor(totalVillagePoints / 4));
    const totalRoofFlags = Math.min(10, Math.floor(totalVillagePoints / 5));
    const totalMidrise = Math.min(18, Math.floor(buildingGrowthPoints * 0.7));
    const totalHighrise = Math.min(8, Math.floor(buildingGrowthPoints / 6));
    const totalCars = Math.min(12, Math.floor(totalVillagePoints / 2));
    const totalServiceVehicles = Math.min(5, Math.floor(totalVillagePoints / 5));
    const totalUtilityPoles = Math.min(12, Math.floor(totalVillagePoints / 3));
    const totalPlazaTrees = Math.min(12, Math.floor(totalVillagePoints / 3));
    const totalCrosswalks = totalVillagePoints >= 9 ? 2 : totalVillagePoints >= 4 ? 1 : 0;
    const constructionSiteCount = Math.min(4, Math.floor(totalVillagePoints / 6));
    const hasAirship = totalVillageProfit >= 1000000;
    const hasCastle = totalVillageProfit >= 2000000;
    const hasBridgeGuards = totalVillagePoints >= 14;
    const hasMarket = totalVillagePoints >= 11;
    const hasNightGlow = totalVillagePoints >= 18 && cityLightLevel > 0.08;
    const hasHarbor = totalVillagePoints >= 14;
    const hasRiverwalk = totalVillagePoints >= 10;
    const hasTransitHub = totalVillagePoints >= 22;
    const villageClockHour = Math.floor(villageHour) % 24;
    const villageClockMinute = Math.floor((villageHour % 1) * 60);
    const villageClockLabel = `${String(villageClockHour).padStart(2, '0')}:${String(villageClockMinute).padStart(2, '0')}`;
    const kairoBlockCount = Math.min(26, Math.floor(buildingGrowthPoints * 1.1));
    const kairoCitizenCount = Math.min(18, Math.floor(totalVillagePoints * 0.8));
    const kairoVehicleCount = Math.min(16, Math.floor(totalVillagePoints * 0.7));
    const kairoServiceCount = Math.min(6, totalServiceVehicles);
    const kairoBackRoadVehicleCount = kairoVehicleCount > 0
      ? Math.max(1, Math.min(6, Math.floor(kairoVehicleCount * 0.45)))
      : 0;
    const kairoTrafficVehicles = [
      ...Array.from({ length: kairoVehicleCount }, (_, idx) => ({
        id: `main-${idx}`,
        direction: idx % 2 === 0 ? 'kairo-drive-lr' : 'kairo-drive-rl',
        bottom: idx % 2 === 0 ? 18.1 : 39.2,
        delay: idx * 0.8,
        duration: 8 + (idx % 4) * 1.2,
        scaleFactor: 1,
        zIndex: 30,
        colorIdx: idx
      })),
      ...Array.from({ length: kairoBackRoadVehicleCount }, (_, idx) => ({
        id: `back-${idx}`,
        direction: idx % 2 === 0 ? 'kairo-drive-rl' : 'kairo-drive-lr',
        bottom: 51.8 + ((idx % 3) - 1) * 0.2,
        delay: idx * 1.1 + 0.4,
        duration: 10 + (idx % 3) * 1.3,
        scaleFactor: 0.78,
        zIndex: 24,
        colorIdx: idx + kairoVehicleCount
      }))
    ];
    const kairoPopulation = totalHouses * 5 + totalMidrise * 18 + totalHighrise * 36;
    const kairoJobs = totalFacilities * 16 + totalMidrise * 10 + totalHighrise * 18;
    const kairoSatisfaction = totalVillagePoints > 0
      ? Math.min(99, 40 + unlockedMilestones.length * 2 + Math.floor(totalMidrise / 2))
      : 0;
    const hasVillageDevelopment = totalVillagePoints > 0;
    const villageProfitLabel = totalVillageProfit > 0 ? formatG(totalVillageProfit) : "—";
    const villageTax = totalVillageProfit > 0 ? Math.round(totalVillageProfit * 0.03 + kairoPopulation * 120) : 0;
    const villageTaxLabel = villageTax > 0 ? formatG(villageTax) : "—";
    const villageLandMinX = 30;
    const villageLandMaxX = 92;
    const cityLandMinX = 32;
    const cityLandMaxX = 92;
    const isVillageLandSlot = (left) => left >= villageLandMinX && left <= villageLandMaxX;
    const isCityLandSlot = (left) => left >= cityLandMinX && left <= cityLandMaxX;
    const kairoBuildingProfiles = [
      { type: 'residence', wallTop: '#f5f7fb', wallBottom: '#dce6f3', roof: '#7f5a35', windowOn: '#f1d882', windowOff: '#94adca', accent: '#4b5563' },
      { type: 'apartment', wallTop: '#e8eef7', wallBottom: '#cdd9e8', roof: '#334155', windowOn: '#d8e8ff', windowOff: '#8ca5bf', accent: '#374151' },
      { type: 'office', wallTop: '#d9e2ef', wallBottom: '#b7c6da', roof: '#1f2937', windowOn: '#bcd8ff', windowOff: '#7ea0c4', accent: '#475569' },
      { type: 'shop', wallTop: '#fde6e6', wallBottom: '#efcaca', roof: '#b91c1c', windowOn: '#ffe49a', windowOff: '#c4d4e5', accent: '#7f1d1d' },
      { type: 'factory', wallTop: '#d7d9df', wallBottom: '#b4b9c4', roof: '#3f3f46', windowOn: '#d5e5ff', windowOff: '#8ea0b5', accent: '#52525b' }
    ];
    const kairoPlotRows = [
      { bottom: 24.2, cols: 4, start: 34.2, gap: 14.0, baseHeight: 8.4, scale: 0.98 },
      { bottom: 42.4, cols: 4, start: 35.0, gap: 13.8, baseHeight: 8.9, scale: 0.94 },
      { bottom: 54.4, cols: 4, start: 34.4, gap: 14.0, baseHeight: 9.5, scale: 0.9 },
      { bottom: 66.2, cols: 4, start: 35.2, gap: 13.6, baseHeight: 10.1, scale: 0.86 },
    ];
    const kairoVerticalRoads = [
      { center: 41, width: 3.2 },
      { center: 55, width: 3.2 },
      { center: 69, width: 3.2 },
    ].map((road, idx) => ({
      ...road,
      id: idx,
      left: road.center - road.width / 2
    }));
    const kairoPlotSlots = kairoPlotRows.flatMap((rowCfg, rowIdx) =>
      Array.from({ length: rowCfg.cols }, (_, colIdx) => ({
        row: rowIdx,
        left: rowCfg.start + colIdx * rowCfg.gap,
        bottom: rowCfg.bottom,
        baseHeight: rowCfg.baseHeight,
        scale: rowCfg.scale,
      }))
    ).filter((slot) =>
      isCityLandSlot(slot.left) &&
      kairoVerticalRoads.every((road) => Math.abs(slot.left - road.center) >= road.width / 2 + 4.2)
    );
    const kairoPlottedCount = Math.min(kairoBlockCount, kairoPlotSlots.length);
    const lampLaneCount = Math.max(1, Math.ceil(totalLamps / 2));

    const houseSlots = Array.from({ length: 36 }, (_, i) => {
      const row = Math.floor(i / 9);
      const col = i % 9;
      return { left: 31 + col * 7 + (row % 2 === 1 ? 1.6 : 0), bottom: 16 + row * 8, row };
    }).filter((slot) => isVillageLandSlot(slot.left));

    const facilitySlots = Array.from({ length: 14 }, (_, i) => {
      const row = Math.floor(i / 7);
      const col = i % 7;
      return { left: 33 + col * 8.7 + (row % 2 === 1 ? 1.5 : 0), bottom: 42 + row * 11 };
    }).filter((slot) => isVillageLandSlot(slot.left));

    const towerSlots = [
      { left: 33, bottom: 57 },
      { left: 44, bottom: 60 },
      { left: 55, bottom: 62 },
      { left: 66, bottom: 60 },
      { left: 77, bottom: 59 },
      { left: 88, bottom: 63 },
    ].filter((slot) => isVillageLandSlot(slot.left));

    const fieldSlots = Array.from({ length: 16 }, (_, i) => {
      const row = Math.floor(i / 4);
      const col = i % 4;
      const palette = ['#8ea74f', '#779643', '#9ea85a', '#6f8f3d'];
      return {
        left: 31 + col * 14 + (row % 2 === 1 ? 2.6 : 0),
        bottom: 14 + row * 7.4,
        width: 11 + ((i * 3) % 3),
        height: 5 + (i % 2),
        color: palette[i % palette.length]
      };
    });

    const treeSlots = Array.from({ length: 70 }, (_, i) => {
      const band = Math.floor(i / 14);
      const col = i % 14;
      return {
        left: 3 + col * 7 + (band % 2 === 1 ? 2.6 : 0),
        bottom: 24 + band * 5.8 + ((col + band) % 3 === 0 ? 0.8 : 0),
        scale: 0.7 + band * 0.08 + ((col % 3) * 0.03)
      };
    });

    const cloudSlots = [
      { top: 7, size: 70, delay: '0s', duration: '44s', opacity: 0.42 },
      { top: 11, size: 55, delay: '-10s', duration: '39s', opacity: 0.35 },
      { top: 5, size: 85, delay: '-20s', duration: '52s', opacity: 0.3 },
      { top: 14, size: 62, delay: '-28s', duration: '41s', opacity: 0.37 }
    ];

    const meadowSlots = Array.from({ length: 24 }, (_, i) => {
      const row = Math.floor(i / 6);
      const col = i % 6;
      return {
        left: 28 + col * 11 + (row % 2 === 0 ? 1.4 : 0),
        bottom: 13.5 + row * 4.2,
        width: 8 + (i % 3),
        height: 2 + (i % 2),
        opacity: 0.18 + row * 0.05
      };
    });

    const roadStoneSlots = Array.from({ length: 84 }, (_, i) => {
      const upperLane = i % 2 === 1;
      return {
        left: 2 + ((i * 7) % 96),
        bottom: upperLane ? 39.2 + ((i % 3) - 1) * 0.3 : 18 + ((i % 3) - 1) * 0.35,
        width: 2 + (i % 2),
        opacity: 0.2 + (i % 4) * 0.12
      };
    });

    const fenceSlots = Array.from({ length: 30 }, (_, i) => {
      const lane = i < 16 ? 'upper' : 'lower';
      const idx = lane === 'upper' ? i : i - 16;
      return {
        left: lane === 'upper' ? 9 + idx * 5.6 : 11 + idx * 7.8,
        bottom: lane === 'upper' ? 29.4 : 15.2,
        lane
      };
    });

    const reedSlots = Array.from({ length: 20 }, (_, i) => ({
      left: 11.5 + ((i * 9) % 14),
      bottom: 4 + ((i * 7) % 54),
      height: 4 + (i % 4),
      delay: `${(i % 6) * 0.18}s`
    }));

    const flowerPalette = ['#fda4af', '#fde68a', '#93c5fd', '#c4b5fd', '#f9a8d4', '#fdba74'];
    const flowerSlots = Array.from({ length: 24 }, (_, i) => {
      const row = Math.floor(i / 6);
      const col = i % 6;
      return {
        left: 26 + col * 11.2 + (row % 2 === 1 ? 1.7 : 0),
        bottom: 14 + row * 3.4 + (i % 2) * 0.4,
        color: flowerPalette[i % flowerPalette.length],
        size: 2 + (i % 2)
      };
    });

    const birdSlots = [
      { top: 13, delay: '0s', duration: '24s', scale: 1 },
      { top: 10, delay: '-3s', duration: '27s', scale: 0.85 },
      { top: 15, delay: '-7s', duration: '29s', scale: 0.9 },
      { top: 12, delay: '-12s', duration: '25s', scale: 0.8 },
      { top: 8, delay: '-16s', duration: '31s', scale: 0.95 },
      { top: 17, delay: '-20s', duration: '26s', scale: 0.75 },
      { top: 11, delay: '-24s', duration: '30s', scale: 0.88 },
    ];

    const midriseSlots = Array.from({ length: 18 }, (_, i) => {
      const row = Math.floor(i / 6);
      const col = i % 6;
      return {
        left: 31 + col * 8.6 + (row % 2 === 1 ? 1.8 : 0),
        bottom: 25.5 + row * 5.1,
        width: 16 + (i % 3) * 2,
        height: 24 + row * 6 + (i % 3) * 2,
        roof: ['#475569', '#1f2937', '#7c2d12', '#0f766e'][i % 4],
        wall: ['#dbe6f3', '#f1f5f9', '#d6dee9', '#e5e7eb'][i % 4],
      };
    }).filter((slot) => isVillageLandSlot(slot.left));

    const highriseSlots = [
      { left: 35, bottom: 43.2, width: 20, height: 50, wall: '#cbd5e1', roof: '#1e293b' },
      { left: 47.5, bottom: 43.4, width: 18, height: 58, wall: '#dbe5f0', roof: '#334155' },
      { left: 60.5, bottom: 43.8, width: 20, height: 54, wall: '#d1d9e6', roof: '#1f2937' },
      { left: 72.5, bottom: 43.6, width: 17, height: 62, wall: '#cfd8e6', roof: '#374151' },
      { left: 83, bottom: 42.8, width: 15, height: 46, wall: '#dbe2ee', roof: '#475569' },
      { left: 32, bottom: 42.7, width: 16, height: 44, wall: '#d6dee9', roof: '#334155' },
      { left: 55, bottom: 50.2, width: 14, height: 42, wall: '#d9e2ef', roof: '#1f2937' },
      { left: 40.5, bottom: 50.2, width: 14, height: 40, wall: '#d9e2ef', roof: '#1f2937' },
    ].filter((slot) => isVillageLandSlot(slot.left));

    const carTrafficSlots = Array.from({ length: 12 }, (_, i) => ({
      lane: i % 2 === 0 ? 'lower' : 'upper',
      delay: `${i * 0.9}s`,
      duration: `${9 + (i % 4) * 1.4}s`,
      color: ['#1d4ed8', '#dc2626', '#f59e0b', '#0f766e', '#334155'][i % 5]
    }));

    const serviceVehicleSlots = Array.from({ length: 5 }, (_, i) => ({
      delay: `${i * 1.4}s`,
      duration: `${11 + i * 1.5}s`,
      color: ['#f97316', '#facc15', '#16a34a', '#2563eb', '#ef4444'][i % 5]
    }));

    const utilityPoleSlots = Array.from({ length: 12 }, (_, i) => ({
      left: 18 + i * 6.3,
      bottom: i % 2 === 0 ? 21.8 : 39.6
    }));

    const plazaTreeSlots = Array.from({ length: 12 }, (_, i) => ({
      left: 44 + (i % 4) * 3.6 + (Math.floor(i / 4) % 2 === 1 ? 1 : 0),
      bottom: 30.2 + Math.floor(i / 4) * 2.8
    }));

    const constructionSlots = [
      { left: 33, bottom: 29.5, width: 11, height: 8 },
      { left: 66, bottom: 29.2, width: 11, height: 8 },
      { left: 50, bottom: 45.2, width: 10, height: 7 },
      { left: 78, bottom: 44.7, width: 9, height: 7 },
    ].filter((slot) => isVillageLandSlot(slot.left));

    const cityMapFrameSize = 1.36;
    const cityMapFrameScale = 0.82;
    const cityGroundStartInMap = 0.32;
    const cityGroundMidInMap = cityGroundStartInMap + (1 - cityGroundStartInMap) * 0.45;
    const cityMapTopInStage = (1 - cityMapFrameSize * cityMapFrameScale) / 2;
    const mapToStageStop = (stop) => cityMapTopInStage + stop * cityMapFrameSize * cityMapFrameScale;
    const stageToViewportStop = (stop) => Math.max(0, Math.min(1, 0.5 + (stop - 0.5) * villageZoom));
    const focusHorizonStop = mapToStageStop(cityGroundStartInMap);
    const focusSkyMidStop = focusHorizonStop * 0.62;
    const focusGroundMidStop = mapToStageStop(cityGroundMidInMap);
    const backdropSkyMidStop = stageToViewportStop(focusSkyMidStop);
    const backdropHorizonStop = stageToViewportStop(focusHorizonStop);
    const backdropGroundMidStop = stageToViewportStop(focusGroundMidStop);
    const citySkyTopColor = blendDaySunsetNight('#9bd9ff', '#ffb46f', '#0b1733', twilightWarmth, nightDensity);
    const citySkyMidColor = blendDaySunsetNight('#80c9f6', '#f59d63', '#17345c', twilightWarmth, nightDensity);
    const citySkyHorizonColor = blendDaySunsetNight('#6eb5e4', '#ce7e5f', '#234a74', twilightWarmth, nightDensity);
    const cityGroundTopColor = blendDaySunsetNight('#83c564', '#90a95d', '#2e4e3a', twilightWarmth, nightDensity);
    const cityGroundMidColor = blendDaySunsetNight('#6fb357', '#7d9450', '#293f31', twilightWarmth, nightDensity);
    const cityGroundBottomColor = blendDaySunsetNight('#5c9b47', '#6f8244', '#22352a', twilightWarmth, nightDensity);
    const villageSkyTopColor = blendDaySunsetNight('#b9e2ff', '#ffc47c', '#15254b', twilightWarmth, nightDensity * 0.94);
    const villageSkyMidColor = blendDaySunsetNight('#8dc6ff', '#f6a367', '#214d79', twilightWarmth, nightDensity * 0.94);
    const villageSkyLowColor = blendDaySunsetNight('#6698de', '#c77d61', '#30537c', twilightWarmth, nightDensity * 0.94);
    const villageGroundTopColor = blendDaySunsetNight('#4f8a3f', '#7e7c47', '#2f4b39', twilightWarmth, nightDensity * 0.94);
    const villageGroundBottomColor = blendDaySunsetNight('#3f7034', '#605f35', '#263d31', twilightWarmth, nightDensity * 0.94);
    const villageWideBackgroundGradient = `linear-gradient(180deg, ${villageSkyTopColor} 0%, ${villageSkyMidColor} 22%, ${villageSkyLowColor} 52%, ${villageGroundTopColor} 52%, ${villageGroundBottomColor} 100%)`;
    const kairoCitySkyGradient = `linear-gradient(180deg, ${citySkyTopColor} 0%, ${citySkyMidColor} 40%, ${citySkyHorizonColor} 62%, transparent 100%)`;
    const kairoMapBaseColor = blendDaySunsetNight('#7ac1ee', '#bf7f57', '#203a60', twilightWarmth * 0.76, nightDensity * 0.92);
    const gradientStopPct = (stop) => `${(stop * 100).toFixed(2)}%`;
    const buildCityBaseGradient = (skyMidStop, horizonStop, groundMidStop) =>
      `linear-gradient(180deg,
        ${citySkyTopColor} 0%,
        ${citySkyMidColor} ${gradientStopPct(skyMidStop)},
        ${citySkyHorizonColor} ${gradientStopPct(horizonStop)},
        ${cityGroundTopColor} ${gradientStopPct(horizonStop)},
        ${cityGroundMidColor} ${gradientStopPct(groundMidStop)},
        ${cityGroundBottomColor} 100%)`;
    const kairoFocusGradient = buildCityBaseGradient(focusSkyMidStop, focusHorizonStop, focusGroundMidStop);
    const kairoZoomBackdropGradient = buildCityBaseGradient(backdropSkyMidStop, backdropHorizonStop, backdropGroundMidStop);
    const isCityOnlyZoom = villageZoom <= 0.9;
    const isVillageZoomDefault = Math.abs(villageZoom - 0.9) < 0.001;
    const cityBuildingScale = isVillageZoomDefault ? 0.88 : 1;
    const cityVehicleScale = isVillageZoomDefault ? 0.86 : 1;
    const kairoMountainLayers = [
      {
        bottom: 55.8,
        height: 24.5,
        opacity: 0.42,
        colorTop: '#dde9f3',
        colorBottom: '#adc3d4',
        ridge: 'polygon(0% 100%, 5% 82%, 11% 90%, 18% 70%, 25% 86%, 34% 54%, 43% 76%, 50% 50%, 58% 78%, 66% 58%, 74% 82%, 83% 62%, 90% 79%, 96% 66%, 100% 74%, 100% 100%)',
        snowRidge: 'polygon(18% 70%, 24% 82%, 30% 70%, 34% 54%, 39% 73%, 45% 66%, 50% 50%, 56% 74%, 61% 68%, 66% 58%, 72% 79%, 77% 72%, 83% 62%, 88% 76%, 92% 71%, 86% 60%, 79% 58%, 74% 74%, 67% 52%, 61% 60%, 56% 69%, 50% 46%, 45% 62%, 40% 66%, 34% 50%, 28% 68%, 23% 64%)'
      },
      {
        bottom: 52.3,
        height: 27.2,
        opacity: 0.54,
        colorTop: '#cadced',
        colorBottom: '#90adc3',
        ridge: 'polygon(0% 100%, 4% 76%, 11% 86%, 19% 55%, 27% 74%, 35% 48%, 43% 69%, 52% 40%, 61% 70%, 70% 45%, 79% 67%, 88% 42%, 95% 63%, 100% 53%, 100% 100%)',
        snowRidge: 'polygon(19% 55%, 24% 68%, 30% 61%, 35% 48%, 41% 63%, 46% 56%, 52% 40%, 58% 65%, 64% 56%, 70% 45%, 76% 60%, 82% 54%, 88% 42%, 93% 58%, 87% 50%, 81% 47%, 76% 55%, 70% 41%, 64% 50%, 58% 61%, 52% 37%, 46% 50%, 41% 57%, 35% 44%, 30% 53%, 24% 64%)'
      },
      {
        bottom: 49.6,
        height: 25.6,
        opacity: 0.65,
        colorTop: '#a5bfd2',
        colorBottom: '#6f8ea8',
        ridge: 'polygon(0% 100%, 7% 79%, 14% 90%, 23% 59%, 31% 81%, 41% 50%, 50% 78%, 59% 48%, 68% 73%, 77% 45%, 86% 68%, 94% 51%, 100% 64%, 100% 100%)'
      },
      {
        bottom: 46.7,
        height: 22.8,
        opacity: 0.73,
        colorTop: '#89a3bb',
        colorBottom: '#5f7b92',
        ridge: 'polygon(0% 100%, 8% 85%, 17% 92%, 28% 70%, 37% 86%, 47% 62%, 57% 84%, 66% 61%, 76% 82%, 86% 64%, 94% 78%, 100% 69%, 100% 100%)'
      }
    ];
    const kairoTerraceSlots = Array.from({ length: 22 }, (_, idx) => {
      const row = Math.floor(idx / 6);
      const col = idx % 6;
      return {
        left: 29 + col * 10.7 + (row % 2 === 1 ? 1.8 : 0),
        bottom: 23.2 + row * 4.8 + ((idx % 3) - 1) * 0.28,
        width: 7.8 + (idx % 3) * 1.2,
        height: 2.1 + (idx % 2) * 0.65,
        opacity: 0.14 + row * 0.05,
        tint: idx % 2 === 0 ? '#89ba61' : '#78aa54'
      };
    });
    const kairoForestLineSlots = Array.from({ length: 26 }, (_, idx) => ({
      left: 27 + idx * 2.8 + (idx % 4 === 0 ? 0.4 : 0),
      bottom: 44.4 + (idx % 3 === 0 ? 0.45 : 0),
      width: 1.9 + (idx % 3) * 0.4,
      height: 2.7 + (idx % 4) * 0.45,
      dark: idx % 2 === 0
    }));
    const kairoRockSlots = Array.from({ length: 17 }, (_, idx) => ({
      left: idx < 8 ? 24.4 + idx * 0.52 : 5.1 + (idx - 8) * 2.35,
      bottom: idx < 8 ? 9 + (idx % 3) * 6.8 : 8.4 + ((idx - 8) % 6) * 8.8,
      width: idx < 8 ? 0.56 : 1 + ((idx + 1) % 2) * 0.35,
      height: idx < 8 ? 1 : 1.2 + (idx % 3) * 0.2,
      opacity: idx < 8 ? 0.38 : 0.26
    }));
    const sunCoreOpacity = Math.max(0.14, 0.24 + (1 - nightDensity) * 0.58);
    const sunHaloOpacity = Math.max(0.08, 0.1 + (1 - nightDensity) * 0.36 + twilightWarmth * 0.08);
    const moonOpacity = Math.max(0, Math.min(0.74, nightDensity * 0.76 - dawnRise * 0.2));
    const cityWindowGlowOpacity = lightDisplayGate * Math.min(1, 0.4 + cityLightLevel * 0.86);
    const cityLampGlowOpacity = lightDisplayGate * Math.min(1, 0.42 + cityLightLevel * 0.88);
    const cityVehicleLightOpacity = lightDisplayGate * Math.min(1, 0.38 + cityLightLevel * 0.84);
    const cityNightBloomOpacity = lightDisplayGate * Math.max(0.3, 0.22 + cityLightLevel * 0.96);
    const citySoftHaloBoost = lightDisplayGate * Math.min(1, 0.32 + cityLightLevel * 0.84);
    const cityLampCoreOpacity = lightDisplayGate * (0.38 + cityLightLevel * 0.62);
    const cityLampHeadOpacity = lightDisplayGate * (0.62 + cityLightLevel * 0.38);
    const cityVehicleHeadDotOpacity = lightDisplayGate * (0.48 + cityVehicleLightOpacity * 0.52);
    const cityVehicleTailDotOpacity = lightDisplayGate * (0.35 + cityVehicleLightOpacity * 0.65);
    const cityServiceBeaconOpacity = lightDisplayGate * (0.4 + cityVehicleLightOpacity * 0.6);
    const kairoBuildingBloomSlots = Array.from({ length: kairoPlottedCount }, (_, idx) => {
      const slot = kairoPlotSlots[idx];
      if (!slot) return null;
      const kind = idx % 5;
      const skylineBoost = Math.floor(totalHighrise / 3);
      const width = (7 + (kind % 2) * 1.1) * slot.scale;
      const height = Math.min(
        14.8,
        slot.baseHeight + (kind % 3) * 0.8 + (slot.row >= 2 ? skylineBoost * 0.6 : skylineBoost * 0.3)
      );
      return {
        id: idx,
        left: slot.left,
        bottom: slot.bottom + Math.max(2.8, height * 0.24),
        width: Math.max(8.2, width * 1.18),
        height: Math.max(6.4, height * 0.52),
        opacity: cityNightBloomOpacity * (0.58 + ((idx % 4) * 0.09))
      };
    }).filter(Boolean);
    const kairoLampBloomSlots = Array.from({ length: Math.min(16, 4 + totalLamps) }, (_, idx) => ({
      id: idx,
      left: 12 + idx * 5.2,
      bottom: idx % 2 === 0 ? 20.4 : 38.9,
      opacity: cityLampGlowOpacity * (0.92 + (idx % 3) * 0.08)
    }));
    const kairoAdvancedBloomSlots = unlockedAdvancedIllustrations.map((feature, idx) => ({
      id: idx,
      left: feature.left,
      bottom: feature.bottom + 4.2,
      opacity: cityNightBloomOpacity * (0.52 + (idx % 3) * 0.08)
    }));

    return (
      <div className="space-y-4 animate-fadeIn p-4 pb-20">
        <DqWindow title="かいえんたい村">
          <div className="mt-1 mb-3 text-[13px] leading-relaxed">
            りえき <span className="text-yellow-200">{villageProfitLabel}</span> / {formatG(MAX_VILLAGE_PROFIT_TARGET)}
            <span className="ml-2 text-gray-300">({unlockedMilestones.length} / {VILLAGE_MILESTONES.length} イベント)</span>
          </div>
          <div className="mb-3 text-[11px] text-gray-300">
            げんざい: <span className="text-yellow-200">{villagePhaseLabel}</span>
            {nextMilestone && (
              <span className="ml-2">
                つぎ: <span className="text-white">{Math.floor(nextMilestone.threshold / 10000)}万G で {nextMilestone.title}</span>
              </span>
            )}
          </div>

          <div className="relative h-[420px] border-[2px] border-white overflow-hidden">
            <div className="absolute inset-0 kairo-zoom-backdrop" style={{ background: kairoZoomBackdropGradient }} />
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[320] flex items-center gap-1">
              <button
                onClick={() => setVillageZoom((prev) => Math.max(0.9, Math.round((prev - 0.1) * 10) / 10))}
                className="bg-black/80 border border-white/80 w-7 h-7 text-white text-[14px] leading-none hover:bg-white/20"
              >
                -
              </button>
              <button
                onClick={() => setVillageZoom(0.9)}
                className="bg-black/80 border border-white/80 px-2 h-7 text-white text-[11px] leading-none hover:bg-white/20"
              >
                {villageZoom.toFixed(1)}x
              </button>
              <button
                onClick={() => setVillageZoom((prev) => Math.min(2.5, Math.round((prev + 0.1) * 10) / 10))}
                className="bg-black/80 border border-white/80 w-7 h-7 text-white text-[14px] leading-none hover:bg-white/20"
              >
                +
              </button>
            </div>

            <div
              className="absolute inset-0 village-zoom-stage"
              style={{
                transform: `scale(${villageZoom})`,
                transformOrigin: 'center center',
                transition: 'transform 160ms ease-out, filter 220ms linear',
                filter: `brightness(${villageStageBrightness.toFixed(3)}) saturate(${villageStageSaturation.toFixed(3)})`
              }}
            >
              <div className="absolute inset-0 pointer-events-none z-[6] kairo-day-cycle-haze" style={{ opacity: twilightWarmth * 0.92 }} />
              <div className="absolute inset-0 pointer-events-none z-[7] kairo-day-cycle-night" style={{ opacity: nightDensity * 0.76 }} />
              {Array.from({ length: 11 }).map((_, idx) => (
                <div
                  key={`kairo-night-star-${idx}`}
                  className="absolute rounded-full bg-white pointer-events-none"
                  style={{
                    left: `${8 + idx * 8.6 + (idx % 2 === 0 ? 1.8 : 0)}%`,
                    top: `${5 + (idx % 4) * 3.6}%`,
                    width: `${idx % 3 === 0 ? 2 : 1}px`,
                    height: `${idx % 3 === 0 ? 2 : 1}px`,
                    opacity: Math.max(0, nightDensity * 0.68 - (idx % 3) * 0.08),
                    zIndex: 8
                  }}
                />
              ))}
              {!isCityOnlyZoom && (
                <>
            <div
              className="absolute inset-0"
              style={{
                background: villageWideBackgroundGradient
              }}
            />
            <div className="absolute left-[11%] top-[7%] w-24 h-24 rounded-full bg-[#fff7cc]/40 blur-[2px]" style={{ opacity: sunCoreOpacity }} />
            <div className="absolute left-[9%] top-[6%] w-32 h-32 rounded-full bg-[#fff7cc]/20 blur-[10px]" style={{ opacity: sunHaloOpacity }} />
            <div className="absolute right-[13%] top-[9%] w-16 h-16 rounded-full bg-[#dbeafe]/55 border border-white/50" style={{ opacity: moonOpacity }} />
            <div className="absolute right-[11%] top-[8%] w-24 h-24 rounded-full bg-[#dbeafe]/20 blur-[8px]" style={{ opacity: moonOpacity * 0.85 }} />
            <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/16 via-white/6 to-transparent" />

            {cloudSlots.map((cloud, idx) => (
              <div
                key={`cloud-${idx}`}
                className="absolute village-cloud-drift"
                style={{
                  top: `${cloud.top}%`,
                  left: `${-18 + idx * 26}%`,
                  width: `${cloud.size}px`,
                  height: `${Math.round(cloud.size * 0.26)}px`,
                  opacity: cloud.opacity,
                  animationDelay: cloud.delay,
                  animationDuration: cloud.duration
                }}
              >
                <div className="absolute left-0 top-[4px] w-[52%] h-[70%] rounded-full bg-white/90" />
                <div className="absolute left-[30%] top-0 w-[44%] h-[74%] rounded-full bg-white/85" />
                <div className="absolute right-0 top-[6px] w-[40%] h-[68%] rounded-full bg-white/88" />
              </div>
            ))}

            {birdSlots.slice(0, totalBirds).map((bird, idx) => (
              <div
                key={`bird-${idx}`}
                className="absolute village-bird-fly"
                style={{
                  top: `${bird.top}%`,
                  left: '-16%',
                  animationDelay: bird.delay,
                  animationDuration: bird.duration,
                  transform: `scale(${bird.scale})`,
                  zIndex: 35
                }}
              >
                <div className="relative w-5 h-2 opacity-80">
                  <div className="absolute left-0 top-0 w-[9px] h-[2px] border-t border-black/55 -rotate-[18deg]" />
                  <div className="absolute right-0 top-0 w-[9px] h-[2px] border-t border-black/55 rotate-[18deg]" />
                </div>
              </div>
            ))}

            <div
              className="absolute inset-x-0 bottom-[56%] h-[24%] opacity-90"
              style={{
                background: 'linear-gradient(180deg, #8795a6 0%, #6f7f90 100%)',
                clipPath: 'polygon(0% 100%, 6% 64%, 14% 75%, 21% 52%, 30% 70%, 39% 48%, 47% 71%, 55% 44%, 63% 67%, 74% 40%, 83% 72%, 93% 46%, 100% 64%, 100% 100%)'
              }}
            />
            <div
              className="absolute inset-x-0 bottom-[50%] h-[20%] opacity-85"
              style={{
                background: 'linear-gradient(180deg, #758596 0%, #5f7385 100%)',
                clipPath: 'polygon(0% 100%, 8% 62%, 17% 73%, 29% 45%, 37% 66%, 46% 51%, 57% 72%, 68% 43%, 79% 66%, 90% 48%, 100% 68%, 100% 100%)'
              }}
            />
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={`snow-${idx}`}
                className="absolute h-[5%] bg-gradient-to-b from-white/90 to-white/20"
                style={{
                  left: `${5 + idx * 12.4}%`,
                  bottom: `${58 + (idx % 2)}%`,
                  width: `${6 + (idx % 3)}%`,
                  clipPath: 'polygon(10% 100%, 50% 12%, 90% 100%)',
                  opacity: 0.62 - (idx % 3) * 0.08
                }}
              />
            ))}

            <div
              className="absolute inset-x-0 bottom-[44%] h-[12%]"
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, #2f6638 0px, #2f6638 6px, #2a5b32 6px, #2a5b32 12px)'
              }}
            />
            <div className="absolute inset-x-0 bottom-[45%] h-[9%] bg-gradient-to-t from-[#89a162]/45 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-b from-[#6ea24d] via-[#4f8a3f] to-[#3f7034]" />
            {meadowSlots.map((slot, idx) => (
              <div
                key={`meadow-${idx}`}
                className="absolute bg-[#9bc86d] border border-black/15"
                style={{
                  left: `${slot.left}%`,
                  bottom: `${slot.bottom}%`,
                  width: `${slot.width}%`,
                  height: `${slot.height}%`,
                  opacity: slot.opacity,
                  zIndex: 18 + Math.floor(idx / 6)
                }}
              />
            ))}
            {isTransportUnlocked && (
              <>
                {/* 路肩 (sand shoulders) — full width */}
                <div className="absolute inset-x-0 bottom-[17%] h-[11%] bg-gradient-to-b from-[#c5a26a] to-[#ab8651] border-y-[2px] border-black/35" />
                <div className="absolute inset-x-0 bottom-[38%] h-[7%] bg-gradient-to-b from-[#b8935b] to-[#9a7745] border-y border-black/30 opacity-90" />
                {/* アスファルト路面 — 全幅まで連続 (was inset-x-[4%]/[8%], caused road cut-off) */}
                <div className="absolute inset-x-0 bottom-[16.5%] h-[6.1%] border-y border-black/50 bg-gradient-to-b from-[#6b7280] to-[#3f4752]" />
                <div className="absolute inset-x-0 bottom-[37.4%] h-[4.6%] border-y border-black/45 bg-gradient-to-b from-[#636b78] to-[#3e4652]" />
                {/* 路面のテクスチャ */}
                <div className="absolute inset-x-0 bottom-[16.5%] h-[6.1%] opacity-25 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(15,23,42,0.18) 0px, rgba(15,23,42,0.18) 1px, transparent 1px, transparent 4px)' }} />
                <div className="absolute inset-x-0 bottom-[37.4%] h-[4.6%] opacity-22 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(15,23,42,0.18) 0px, rgba(15,23,42,0.18) 1px, transparent 1px, transparent 4px)' }} />
                {/* 路面の縁石ハイライト */}
                <div className="absolute inset-x-0 bottom-[22.5%] h-[0.5px] bg-white/20" />
                <div className="absolute inset-x-0 bottom-[16.5%] h-[0.5px] bg-white/20" />
                {/* 縦の連絡道 */}
                <div className="absolute left-[47.2%] bottom-[16.4%] w-[5.8%] h-[25.8%] border-x border-black/50 bg-gradient-to-r from-[#4b5563] via-[#6b7280] to-[#4b5563]" />
                {/* 中央線 (破線) — 路面の全幅に合わせる */}
                <div className="absolute inset-x-[2%] bottom-[19.2%] h-[1px] opacity-85" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #f8fafc 0px, #f8fafc 9px, transparent 9px, transparent 18px)' }} />
                <div className="absolute inset-x-[2%] bottom-[39.5%] h-[1px] opacity-80" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #f8fafc 0px, #f8fafc 8px, transparent 8px, transparent 17px)' }} />
                {/* 縦道の中央線 */}
                <div className="absolute left-[49.9%] bottom-[17.8%] w-[1px] h-[22.2%] opacity-80" style={{ backgroundImage: 'repeating-linear-gradient(180deg, #f8fafc 0px, #f8fafc 8px, transparent 8px, transparent 16px)' }} />
                {Array.from({ length: totalCrosswalks }).map((_, idx) => (
                  <div
                    key={`crosswalk-${idx}`}
                    className="absolute flex justify-between z-[58]"
                    style={{ left: idx === 0 ? '44.1%' : '46.4%', bottom: idx === 0 ? '20.1%' : '39.1%', width: idx === 0 ? '12%' : '7.8%', height: idx === 0 ? '2.7%' : '4%' }}
                  >
                    {Array.from({ length: 5 }).map((__, stripeIdx) => (
                      <div key={`crosswalk-${idx}-${stripeIdx}`} className="w-[12%] h-full bg-white/70 border border-black/20" />
                    ))}
                  </div>
                ))}
                <div className="absolute left-[44.1%] bottom-[30.8%] w-[12.6%] h-[6.9%] rounded-[10px] border border-black/45 bg-gradient-to-b from-[#a1a1aa] to-[#71717a] z-[54]">
                  <div className="absolute left-[12%] top-[18%] right-[12%] bottom-[18%] rounded-[8px] border border-white/25 bg-[#3f4a57]" />
                  <div
                    className={`absolute left-[47%] top-[34%] w-[6%] h-[32%] bg-[#fde68a] ${isEveningToMidnight ? 'village-signal-blink' : ''}`}
                    style={{ opacity: lightDisplayGate }}
                  />
                </div>
              </>
            )}
            {hasNightGlow && <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/12 via-transparent to-[#0f172a]/10 pointer-events-none" />}
            {isTransportUnlocked && roadStoneSlots.slice(0, totalRoadStones).map((stone, idx) => (
              <div
                key={`road-stone-${idx}`}
                className="absolute bg-black/35 border border-white/10"
                style={{
                  left: `${stone.left}%`,
                  bottom: `${stone.bottom}%`,
                  width: `${stone.width}px`,
                  height: '2px',
                  opacity: stone.opacity,
                  zIndex: 48
                }}
              />
            ))}
            {fenceSlots.slice(0, totalFences).map((fence, idx) => (
              <div key={`fence-${idx}`} className="absolute" style={{ left: `${fence.left}%`, bottom: `${fence.bottom}%`, zIndex: 56 }}>
                <div className="relative w-[8px] h-[8px]">
                  <div className="absolute left-[1px] top-[1px] w-[2px] h-[7px] bg-[#7c4b22] border border-black/35" />
                  <div className="absolute right-[1px] top-[1px] w-[2px] h-[7px] bg-[#7c4b22] border border-black/35" />
                  <div className="absolute left-[1px] top-[2px] w-[6px] h-[1px] bg-[#b98b5f]" />
                  <div className="absolute left-[1px] top-[5px] w-[6px] h-[1px] bg-[#b98b5f]" />
                </div>
              </div>
            ))}

            <div
              className="absolute left-[14%] bottom-0 w-[11%] h-[62%] border-x border-[#93c5fd]/40"
              style={{
                background: 'linear-gradient(180deg, #70b7ff 0%, #3f86d6 55%, #2e6db4 100%)',
                clipPath: 'polygon(19% 0%, 84% 0%, 100% 11%, 95% 28%, 78% 46%, 90% 67%, 70% 100%, 22% 100%, 0% 82%, 6% 64%, 0% 42%, 9% 20%)'
              }}
            />
            <div
              className="absolute left-[12.6%] bottom-[20%] w-[14.8%] h-[3.2%] border-y border-black/35"
              style={{
                background: 'linear-gradient(90deg, #5ca3ef 0%, #73b6ff 100%)',
                clipPath: 'polygon(0% 70%, 12% 25%, 78% 30%, 100% 70%, 86% 100%, 10% 100%)'
              }}
            />

            {Array.from({ length: totalWaterSparkles }).map((_, idx) => (
              <div
                key={`water-sparkle-${idx}`}
                className="absolute village-water-shimmer"
                style={{
                  left: `${13.8 + ((idx * 11) % 12)}%`,
                  bottom: `${5 + ((idx * 13) % 56)}%`,
                  width: `${2 + (idx % 2)}px`,
                  height: '2px',
                  backgroundColor: '#dbeafe',
                  opacity: 0.85,
                  animationDelay: `${idx * 0.16}s`
                }}
              />
            ))}
            {reedSlots.slice(0, totalCanalReeds).map((reed, idx) => (
              <div
                key={`reed-${idx}`}
                className="absolute village-reed-sway"
                style={{
                  left: `${reed.left}%`,
                  bottom: `${reed.bottom}%`,
                  animationDelay: reed.delay,
                  zIndex: 62
                }}
              >
                <div className="relative w-[2px]" style={{ height: `${reed.height}px` }}>
                  <div className="absolute inset-0 bg-[#2d6a3a] border border-black/20" />
                </div>
              </div>
            ))}

            {fieldSlots.slice(0, totalFields).map((slot, idx) => (
              <div
                key={`field-${idx}`}
                className="absolute border border-black/40"
                style={{
                  left: `${slot.left}%`,
                  bottom: `${slot.bottom}%`,
                  width: `${slot.width}%`,
                  height: `${slot.height}%`,
                  backgroundColor: slot.color
                }}
              >
                <div
                  className="absolute inset-[1px] opacity-45"
                  style={{ backgroundImage: 'repeating-linear-gradient(90deg, #d7e1a4 0px, #d7e1a4 2px, transparent 2px, transparent 4px)' }}
                />
              </div>
            ))}

            {flowerSlots.slice(0, totalFlowerBeds).map((flower, idx) => (
              <div
                key={`flower-${idx}`}
                className="absolute"
                style={{ left: `${flower.left}%`, bottom: `${flower.bottom}%`, zIndex: 59 }}
              >
                <div className="relative" style={{ width: `${flower.size + 1}px`, height: `${flower.size + 2}px` }}>
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[1px] h-[2px] bg-[#35663a]" />
                  <div
                    className="absolute left-0 top-0 border border-black/25"
                    style={{ width: `${flower.size + 1}px`, height: `${flower.size}px`, backgroundColor: flower.color }}
                  />
                </div>
              </div>
            ))}

            {treeSlots.slice(0, totalTrees).map((slot, idx) => (
              <div
                key={`tree-${idx}`}
                className="absolute"
                style={{ left: `${slot.left}%`, bottom: `${slot.bottom}%`, transform: `scale(${slot.scale})`, transformOrigin: 'bottom center' }}
              >
                <div className="relative w-[10px] h-[14px]">
                  <div className="absolute left-[3px] bottom-0 w-[3px] h-[5px] bg-[#6b3d18]" />
                  <div className="absolute left-0 bottom-[3px] w-[10px] h-[8px] bg-[#2e6a32] border border-black/30" />
                  <div className="absolute left-[1px] bottom-[7px] w-[8px] h-[6px] bg-[#3f8244] border border-black/25" />
                  <div className="absolute left-[3px] bottom-[10px] w-[4px] h-[3px] bg-[#79b26a]" />
                </div>
              </div>
            ))}

            {utilityPoleSlots.slice(0, totalUtilityPoles).map((pole, idx) => (
              <div key={`utility-${idx}`} className="absolute z-[92]" style={{ left: `${pole.left}%`, bottom: `${pole.bottom}%` }}>
                <div className="relative w-[2px] h-[16px] bg-[#1f2937]">
                  <div className="absolute left-[-4px] top-[2px] w-[10px] h-[1px] bg-[#94a3b8]" />
                  <div className="absolute left-[-3px] top-[5px] w-[8px] h-[1px] bg-[#64748b]" />
                </div>
              </div>
            ))}

            {midriseSlots.slice(0, totalMidrise).map((slot, idx) => (
              <div
                key={`midrise-${idx}`}
                className="absolute z-[82]"
                style={{
                  left: `${slot.left}%`,
                  bottom: `${slot.bottom}%`,
                  width: `${slot.width}px`,
                  height: `${slot.height}px`,
                  transform: `translateX(-50%)`
                }}
              >
                <div className="relative w-full h-full border-[2px] border-black" style={{ backgroundColor: slot.wall }}>
                  <div className="absolute inset-y-0 right-0 w-[16%] bg-black/12" />
                  <div className="absolute -top-[6px] left-[-2px] right-[-2px] h-[6px] border-[2px] border-black border-b-0" style={{ backgroundColor: slot.roof }} />
                  <div className="absolute inset-[2px] grid grid-cols-3 gap-[1px] opacity-95">
                    {Array.from({ length: 15 }).map((_, wIdx) => (
                      <div key={`mid-window-${idx}-${wIdx}`} className={`h-[3px] border border-black/25 ${(wIdx + idx) % 4 === 0 ? 'bg-[#93c5fd]' : 'bg-[#fef3c7]'}`} />
                    ))}
                  </div>
                  <div className="absolute left-[39%] bottom-0 w-[22%] h-[17%] bg-[#7c4b22] border border-black/35 border-b-0" />
                  <div className="absolute left-[24%] bottom-[-2px] right-[24%] h-[2px] bg-black/20" />
                </div>
              </div>
            ))}

            {highriseSlots.slice(0, totalHighrise).map((slot, idx) => (
              <div
                key={`highrise-${idx}`}
                className="absolute z-[88]"
                style={{
                  left: `${slot.left}%`,
                  bottom: `${slot.bottom}%`,
                  width: `${slot.width}px`,
                  height: `${slot.height}px`,
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="relative w-full h-full border-[2px] border-black" style={{ backgroundColor: slot.wall }}>
                  <div className="absolute -top-[5px] left-[-2px] right-[-2px] h-[5px] border-[2px] border-black border-b-0" style={{ backgroundColor: slot.roof }} />
                  <div className="absolute inset-y-0 right-0 w-[16%] bg-black/14" />
                  <div className="absolute left-[2px] right-[2px] top-[2px] bottom-[2px] bg-[repeating-linear-gradient(180deg,#93c5fd_0px,#93c5fd_2px,transparent_2px,transparent_5px)] opacity-80" />
                  <div className="absolute left-[28%] top-[-11px] w-[2px] h-[8px] bg-[#cbd5e1] border border-black/35" />
                  <div className="absolute left-[33%] top-[-14px] w-[2px] h-[11px] bg-[#cbd5e1] border border-black/35" />
                  <div className="absolute left-[38%] top-[-9px] w-[2px] h-[6px] bg-[#cbd5e1] border border-black/35" />
                </div>
              </div>
            ))}

            {constructionSlots.slice(0, constructionSiteCount).map((site, idx) => (
              <div
                key={`construction-${idx}`}
                className="absolute z-[86]"
                style={{ left: `${site.left}%`, bottom: `${site.bottom}%`, width: `${site.width}%`, height: `${site.height}%` }}
              >
                <div className="absolute inset-0 border border-black/40 bg-[repeating-linear-gradient(135deg,#fbbf24_0px,#fbbf24_4px,#1f2937_4px,#1f2937_8px)] opacity-80" />
                <div className="absolute left-[8%] bottom-[15%] w-[3%] h-[72%] bg-[#334155]" />
                <div className="absolute left-[8%] top-[18%] w-[56%] h-[2px] bg-[#334155] village-crane-swing" />
                <div className="absolute left-[60%] top-[18%] w-[1px] h-[24%] bg-[#64748b]" />
                <div className="absolute left-[59.4%] top-[40%] w-[2%] h-[5%] bg-[#facc15] border border-black/30" />
              </div>
            ))}

            {hasTransitHub && (
              <div className="absolute left-[58.5%] bottom-[18.6%] w-[18%] h-[10.5%] z-[96]">
                <div className="absolute inset-0 border-[2px] border-black bg-[#dbe6f3]">
                  <div className="absolute inset-x-[7%] top-[18%] h-[2px] bg-[#475569]" />
                  <div className="absolute inset-x-[10%] bottom-[18%] h-[18%] bg-[#94a3b8] border border-black/30" />
                  <div className="absolute left-[12%] top-[35%] w-[10%] h-[25%] bg-[#93c5fd]" />
                  <div className="absolute left-[28%] top-[35%] w-[10%] h-[25%] bg-[#93c5fd]" />
                  <div className="absolute left-[44%] top-[35%] w-[10%] h-[25%] bg-[#93c5fd]" />
                  <div className="absolute left-[60%] top-[35%] w-[10%] h-[25%] bg-[#93c5fd]" />
                  <div className="absolute left-[76%] top-[35%] w-[10%] h-[25%] bg-[#93c5fd]" />
                </div>
                <div className="absolute inset-x-[5%] -bottom-[16%] h-[14%] border border-black/40 bg-[#6b7280]" />
              </div>
            )}

            {hasRiverwalk && (
              <div className="absolute left-[24.7%] bottom-[5.2%] w-[3.3%] h-[56%] z-[74]">
                <div className="absolute inset-0 bg-[#cbd5e1]/40 border-x border-white/25" />
                {Array.from({ length: 9 }).map((_, idx) => (
                  <div key={`riverwalk-rail-${idx}`} className="absolute left-[15%] right-[15%] h-[1px] bg-white/50" style={{ bottom: `${8 + idx * 10}%` }} />
                ))}
              </div>
            )}

            {plazaTreeSlots.slice(0, totalPlazaTrees).map((tree, idx) => (
              <div key={`plaza-tree-${idx}`} className="absolute z-[84]" style={{ left: `${tree.left}%`, bottom: `${tree.bottom}%` }}>
                <div className="relative w-[9px] h-[12px]">
                  <div className="absolute left-[3px] bottom-0 w-[3px] h-[4px] bg-[#6b3d18]" />
                  <div className="absolute left-0 bottom-[3px] w-[9px] h-[6px] bg-[#2f7d3b] border border-black/25" />
                  <div className="absolute left-[2px] bottom-[8px] w-[5px] h-[3px] bg-[#6bb56f]" />
                </div>
              </div>
            ))}

            {villageStatues.map((statue, idx) => (
              <div
                key={`statue-${statue.userName}-${idx}`}
                className="absolute z-[106]"
                style={{
                  left: `${statue.left}%`,
                  bottom: `${statue.bottom}%`,
                  transform: 'translateX(-50%)',
                }}
                title={`${statue.userName}の銅像 / 利益 ${formatG(statue.profit)}`}
              >
                <div className="absolute left-1/2 -translate-x-1/2 bottom-[-2px] w-[34px] h-[4px] bg-black/35" />
                <div className="relative w-[30px] h-[34px]">
                  <div
                    className="absolute inset-x-0 bottom-0 h-[10px] border-[2px] border-black"
                    style={{ background: idx % 2 === 0 ? 'linear-gradient(180deg, #b49772 0%, #7b6248 100%)' : 'linear-gradient(180deg, #a98a64 0%, #6c5640 100%)' }}
                  />
                  <div className="absolute inset-x-[3px] bottom-[9px] h-[2px] bg-white/30" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-[11px] w-[20px] h-[20px] border border-black/55 bg-[#8b7355]/45 flex items-end justify-center overflow-hidden">
                    <div style={{ filter: 'sepia(1) saturate(2.2) hue-rotate(338deg) brightness(0.72) contrast(1.08)' }}>
                      <PixelCharacter type={statue.charInfo.charType} size={18} />
                    </div>
                  </div>
                  <div className="absolute inset-x-[2px] bottom-[1px] text-[7px] leading-none text-center text-[#fef3c7] truncate">
                    {statue.userName}
                  </div>
                </div>
              </div>
            ))}

            {hasCastle && (
              <div className="absolute right-[6%] bottom-[43%] w-[16%] h-[22%]">
                <div className="absolute inset-0 border-[2px] border-black bg-[#dae5f3]">
                  <div className="absolute inset-y-0 right-0 w-[18%] bg-black/10" />
                  <div className="absolute inset-x-[8%] top-[40%] h-[2px] bg-black/15" />
                </div>
                <div className="absolute left-[8%] top-[-16%] w-[20%] h-[28%] border-[2px] border-black bg-[#cbd8e8]" />
                <div className="absolute right-[8%] top-[-16%] w-[20%] h-[28%] border-[2px] border-black bg-[#cbd8e8]" />
                <div className="absolute left-[10%] top-[-21%] w-[16%] h-[8%] bg-[#7f1d1d] border border-black" />
                <div className="absolute right-[10%] top-[-21%] w-[16%] h-[8%] bg-[#7f1d1d] border border-black" />
                <div className="absolute left-[17%] top-[-27%] w-[2px] h-[10%] bg-[#dbeafe] border border-black/35" />
                <div className="absolute right-[17%] top-[-27%] w-[2px] h-[10%] bg-[#dbeafe] border border-black/35" />
                <div className="absolute left-[19%] top-[-24%] w-[8%] h-[5%] bg-[#fde68a] border border-black/35 village-banner-wave" />
                <div className="absolute right-[19%] top-[-24%] w-[8%] h-[5%] bg-[#fde68a] border border-black/35 village-banner-wave" style={{ animationDelay: '0.3s' }} />
                <div className="absolute left-[42%] top-[30%] w-[16%] h-[30%] bg-[#7c4b22] border border-black">
                  <div className="absolute left-[35%] top-[42%] w-[2px] h-[2px] rounded-full bg-yellow-100" />
                </div>
                <div className={`absolute left-[20%] top-[18%] w-[9%] h-[9%] ${isEveningToMidnight ? 'bg-yellow-200 village-window' : 'bg-[#93c5fd]'}`} />
                <div className={`absolute right-[20%] top-[18%] w-[9%] h-[9%] ${isEveningToMidnight ? 'bg-yellow-200 village-window' : 'bg-[#93c5fd]'}`} />
                <div className={`absolute left-[46%] top-[10%] w-[8%] h-[8%] ${isEveningToMidnight ? 'bg-yellow-100 village-window' : 'bg-[#bfdbfe]'}`} />
              </div>
            )}

            {houseSlots.slice(0, totalHouses).map((slot, idx) => {
              const wallPalette = ['#f8fafc', '#fef3c7', '#e2e8f0', '#fee2e2'];
              const roofPalette = ['#b91c1c', '#92400e', '#334155', '#0f766e'];
              const depthScale = 0.76 + slot.row * 0.11;
              const variant = idx % 4;
              const hasChimney = idx < totalSmokeStacks && idx % 2 === 0;
              const hasFlowerBox = idx % 3 === 0;
              return (
                <div
                  key={`house-${idx}`}
                  className="absolute"
                  style={{
                    left: `${slot.left}%`,
                    bottom: `${slot.bottom}%`,
                    transform: `translateX(-50%) scale(${depthScale})`,
                    transformOrigin: 'bottom center',
                    zIndex: 30 + slot.row
                  }}
                >
                  <div className="absolute left-[2px] -bottom-[2px] w-[26px] h-[3px] bg-black/35" />
                  <div className="relative w-[26px] h-[18px] border-[2px] border-black" style={{ backgroundColor: wallPalette[variant] }}>
                    <div className="absolute inset-y-0 right-0 w-[5px] bg-black/10" />
                    <div className="absolute -top-[6px] left-[-2px] w-[30px] h-[6px] border-[2px] border-black border-b-0" style={{ backgroundColor: roofPalette[variant] }}>
                      <div className="absolute inset-x-[2px] top-[1px] h-[1px] bg-white/35" />
                      <div className="absolute inset-x-[2px] top-[3px] h-[1px] bg-black/20" />
                    </div>
                    <div className="absolute left-[2px] right-[2px] top-[10px] h-[1px] bg-black/12" />
                    <div
                      className={`absolute left-[3px] top-[4px] w-[4px] h-[4px] ${isEveningToMidnight ? 'bg-yellow-200 village-window' : 'bg-[#93c5fd]'}`}
                      style={{ animationDelay: `${(idx % 5) * 0.18}s` }}
                    />
                    <div
                      className={`absolute right-[3px] top-[4px] w-[4px] h-[4px] ${isEveningToMidnight ? 'bg-yellow-200 village-window' : 'bg-[#93c5fd]'}`}
                      style={{ animationDelay: `${(idx % 7) * 0.16}s` }}
                    />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[5px] h-[7px] bg-[#7c4b22] border border-black/30 border-b-0">
                      <div className="absolute right-[1px] top-[3px] w-[1px] h-[1px] rounded-full bg-yellow-200/80" />
                    </div>
                    <div className="absolute left-[6px] bottom-[1px] w-[14px] h-[1px] bg-black/20" />
                    {hasFlowerBox && (
                      <div className="absolute left-[3px] bottom-[-2px] w-[8px] h-[2px] bg-[#7c4b22] border border-black/30">
                        <div className="absolute left-[1px] -top-[1px] w-[1px] h-[1px] bg-[#fda4af]" />
                        <div className="absolute left-[3px] -top-[1px] w-[1px] h-[1px] bg-[#fde68a]" />
                        <div className="absolute left-[5px] -top-[1px] w-[1px] h-[1px] bg-[#93c5fd]" />
                      </div>
                    )}
                    {idx < totalRoofFlags && (
                      <div className="absolute left-[4px] -top-[13px] w-[1px] h-[7px] bg-[#e2e8f0] border border-black/30">
                        <div className="absolute left-[1px] top-[1px] w-[5px] h-[3px] bg-[#fde68a] border border-black/35 village-banner-wave" style={{ animationDelay: `${idx * 0.1}s` }} />
                      </div>
                    )}
                    {hasChimney && (
                      <>
                        <div className="absolute right-[2px] -top-[11px] w-[4px] h-[7px] bg-[#9a6240] border border-black/35" />
                        <div className="absolute right-[2px] -top-[14px] w-[4px] h-[4px] rounded-full bg-white/65 village-smoke-rise" style={{ animationDelay: `${idx * 0.2}s` }} />
                        <div className="absolute right-[1px] -top-[18px] w-[3px] h-[3px] rounded-full bg-white/55 village-smoke-rise" style={{ animationDelay: `${idx * 0.2 + 0.8}s` }} />
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {facilitySlots.slice(0, totalFacilities).map((slot, idx) => (
              <div
                key={`facility-${idx}`}
                className="absolute"
                style={{
                  left: `${slot.left}%`,
                  bottom: `${slot.bottom}%`,
                  transform: `translateX(-50%) scale(${0.86 + Math.floor(idx / 7) * 0.12})`,
                  transformOrigin: 'bottom center',
                  zIndex: 38 + Math.floor(idx / 7)
                }}
              >
                <div className="absolute left-[3px] -bottom-[2px] w-[34px] h-[3px] bg-black/35" />
                <div className="relative w-[34px] h-[22px] border-[2px] border-black bg-[#dde9f8]">
                  <div className="absolute inset-y-0 right-0 w-[6px] bg-black/10" />
                  <div className="absolute -top-[7px] left-[-2px] w-[38px] h-[7px] bg-[#8b1e1e] border-[2px] border-black border-b-0">
                    <div className="absolute inset-x-[2px] top-[1px] h-[1px] bg-white/35" />
                  </div>
                  <div className="absolute left-[12px] top-[6px] w-[10px] h-[10px] bg-[#1f8f52] border border-black">
                    <div className="absolute left-1/2 -translate-x-1/2 top-[1px] w-[2px] h-[8px] bg-white" />
                    <div className="absolute top-1/2 -translate-y-1/2 left-[1px] w-[8px] h-[2px] bg-white" />
                  </div>
                  <div className="absolute left-[3px] top-[8px] w-[6px] h-[8px] bg-[#7c4b22] border border-black/40 border-b-0" />
                  <div className="absolute right-[3px] top-[8px] w-[6px] h-[8px] bg-[#7c4b22] border border-black/40 border-b-0" />
                  <div className="absolute left-[4px] top-[4px] w-[4px] h-[2px] bg-[#0f172a]/25" />
                  <div className="absolute right-[4px] top-[4px] w-[4px] h-[2px] bg-[#0f172a]/25" />
                  <div className={`absolute left-[4px] bottom-[2px] w-[5px] h-[5px] ${isEveningToMidnight ? 'bg-yellow-200 village-window' : 'bg-[#93c5fd]'}`} />
                  <div className={`absolute right-[4px] bottom-[2px] w-[5px] h-[5px] ${isEveningToMidnight ? 'bg-yellow-200 village-window' : 'bg-[#93c5fd]'}`} />
                  {idx < totalBanners && (
                    <div className="absolute left-[15px] -top-[13px] w-[1px] h-[8px] bg-[#e2e8f0] border border-black/30">
                      <div className="absolute left-[1px] top-[1px] w-[6px] h-[3px] bg-[#fde68a] border border-black/35 village-banner-wave" style={{ animationDelay: `${idx * 0.2}s` }} />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {hasMarket && (
              <>
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={`market-${idx}`}
                    className="absolute"
                    style={{
                      left: `${41 + idx * 8.4}%`,
                      bottom: '24.8%',
                      zIndex: 95 + idx
                    }}
                  >
                    <div className="relative w-[15px] h-[10px]">
                      <div className="absolute inset-x-0 top-0 h-[4px] border border-black" style={{ backgroundColor: idx % 2 === 0 ? '#fb923c' : '#60a5fa' }} />
                      <div className="absolute left-[1px] right-[1px] top-[4px] h-[6px] bg-[#9a622f] border border-black/40" />
                      <div className="absolute left-[2px] top-[6px] w-[2px] h-[2px] bg-[#fde68a]" />
                      <div className="absolute left-[6px] top-[6px] w-[2px] h-[2px] bg-[#86efac]" />
                      <div className="absolute left-[10px] top-[6px] w-[2px] h-[2px] bg-[#fda4af]" />
                    </div>
                  </div>
                ))}
              </>
            )}

            {towerSlots.slice(0, totalTowers).map((slot, idx) => (
              <div
                key={`tower-${idx}`}
                className="absolute"
                style={{ left: `${slot.left}%`, bottom: `${slot.bottom}%`, zIndex: 70 + idx }}
              >
                <div className="relative w-[16px] h-[46px] border-[2px] border-black bg-[#d9e4f2]">
                  <div className="absolute inset-y-0 right-0 w-[4px] bg-black/10" />
                  <div className="absolute -top-[6px] left-[-2px] w-[20px] h-[6px] bg-[#32435d] border-[2px] border-black border-b-0" />
                  <div className="absolute left-[-2px] top-[-10px] w-[4px] h-[4px] bg-[#d9e4f2] border-[2px] border-black border-b-0" />
                  <div className="absolute left-[4px] top-[-10px] w-[4px] h-[4px] bg-[#d9e4f2] border-[2px] border-black border-b-0" />
                  <div className="absolute left-[10px] top-[-10px] w-[4px] h-[4px] bg-[#d9e4f2] border-[2px] border-black border-b-0" />
                  <div className={`absolute left-[5px] top-[5px] w-[4px] h-[4px] ${isEveningToMidnight ? 'bg-yellow-200 village-window' : 'bg-[#93c5fd]'}`} />
                  <div className={`absolute left-[5px] top-[15px] w-[4px] h-[4px] ${isEveningToMidnight ? 'bg-yellow-200 village-window' : 'bg-[#93c5fd]'}`} />
                  <div className={`absolute left-[5px] top-[25px] w-[4px] h-[4px] ${isEveningToMidnight ? 'bg-yellow-200 village-window' : 'bg-[#93c5fd]'}`} />
                  {idx < totalBanners && (
                    <div className="absolute left-[7px] top-[-18px] w-[1px] h-[8px] bg-[#dbeafe] border border-black/30">
                      <div className="absolute left-[1px] top-[1px] w-[7px] h-[3px] bg-[#f87171] border border-black/35 village-banner-wave" style={{ animationDelay: `${idx * 0.15}s` }} />
                    </div>
                  )}
                  {idx < totalWindmills && (
                    <div className="absolute left-1/2 top-[40%] w-[2px] h-[2px] village-windmill-spin">
                      <div className="absolute left-[-10px] top-[-1px] w-[20px] h-[2px] bg-[#f8fafc] border border-black/40" />
                      <div className="absolute left-[-1px] top-[-10px] w-[2px] h-[20px] bg-[#f8fafc] border border-black/40" />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {hasBridgeGuards && (
              <>
                <div className="absolute left-[20%] bottom-[20.8%] z-[118]">
                  <div className="relative w-3 h-5">
                    <div className="absolute top-0 left-[2px] w-[8px] h-[4px] bg-[#f6c7a6] border border-black/40" />
                    <div className="absolute top-[3px] left-0 w-[12px] h-[7px] bg-[#312e81] border border-black/40" />
                    <div className="absolute bottom-0 left-[1px] w-[3px] h-[5px] bg-black" />
                    <div className="absolute bottom-0 right-[1px] w-[3px] h-[5px] bg-black" />
                    <div className="absolute right-[-1px] top-[4px] w-[1px] h-[7px] bg-[#cbd5e1]" />
                  </div>
                </div>
                <div className="absolute left-[24%] bottom-[20.8%] z-[118]">
                  <div className="relative w-3 h-5">
                    <div className="absolute top-0 left-[2px] w-[8px] h-[4px] bg-[#f6c7a6] border border-black/40" />
                    <div className="absolute top-[3px] left-0 w-[12px] h-[7px] bg-[#1f2937] border border-black/40" />
                    <div className="absolute bottom-0 left-[1px] w-[3px] h-[5px] bg-black" />
                    <div className="absolute bottom-0 right-[1px] w-[3px] h-[5px] bg-black" />
                    <div className="absolute right-[-1px] top-[4px] w-[1px] h-[7px] bg-[#cbd5e1]" />
                  </div>
                </div>
              </>
            )}

            {Array.from({ length: totalLamps }).map((_, idx) => {
              const isUpperLane = idx % 2 === 1;
              const laneIndex = Math.floor(idx / 2);
              const left = lampLaneCount === 1 ? 50 : 8 + (laneIndex * 82) / (lampLaneCount - 1);
              const bottom = isUpperLane ? 38.4 : 17.2;
              return (
                <div key={`lamp-${idx}`} className="absolute" style={{ left: `${left}%`, bottom: `${bottom}%`, zIndex: 100 }}>
                  <div className="relative w-[2px] h-[11px] bg-[#1f2937]">
                    <div className={`absolute left-[-2px] top-[-4px] w-[6px] h-[4px] border border-black/40 ${isEveningToMidnight ? 'bg-[#fde68a] village-window' : 'bg-[#94a3b8]'}`} />
                    {hasNightGlow && <div className="absolute -left-[6px] -top-[8px] w-[14px] h-[14px] rounded-full bg-yellow-100/30 blur-[2px]" />}
                  </div>
                </div>
              );
            })}

            {isTransportUnlocked && carTrafficSlots.slice(0, totalCars).map((car, idx) => (
              <div
                key={`car-${idx}`}
                className={`absolute ${car.lane === 'lower' ? 'village-car-run' : 'village-car-run-rev'}`}
                style={{
                  bottom: car.lane === 'lower' ? `${18 + (idx % 2) * 0.3}%` : `${39.1 + (idx % 2) * 0.25}%`,
                  animationDelay: car.delay,
                  animationDuration: car.duration,
                  zIndex: 132
                }}
              >
                <div className="relative w-[24px] h-[13px]">
                  {/* drop shadow */}
                  <div className="absolute left-[2px] right-[2px] bottom-0 h-[2px] rounded-full bg-black/40 blur-[0.5px]" />
                  {/* main body */}
                  <div
                    className="absolute left-[1px] right-[1px] top-[3px] h-[7px] border border-black/65 rounded-[2px]"
                    style={{ background: `linear-gradient(180deg, rgba(255,255,255,0.32) 0%, ${car.color} 38%, rgba(15,23,42,0.4) 100%)` }}
                  />
                  {/* roof / windshield */}
                  <div className="absolute left-[4px] right-[5px] top-0 h-[4px] rounded-t-[2px] border border-black/45 bg-gradient-to-b from-[#eef6ff] to-[#a8c2dc]" />
                  {/* roof highlight */}
                  <div className="absolute left-[5px] right-[6px] top-[1px] h-[1px] bg-white/55 rounded-[1px]" />
                  {/* A-pillar / rear-pillar */}
                  <div className="absolute left-[9px] top-[1px] w-[1px] h-[3px] bg-black/55" />
                  <div className="absolute left-[14px] top-[1px] w-[1px] h-[3px] bg-black/55" />
                  {/* wipers */}
                  <div className="absolute left-[6px] top-[3px] w-[2px] h-[1px] bg-black/40" />
                  <div className="absolute left-[15px] top-[3px] w-[2px] h-[1px] bg-black/40" />
                  {/* door line */}
                  <div className="absolute left-[11px] top-[4px] w-[1px] h-[5px] bg-black/45" />
                  {/* door handles */}
                  <div className="absolute left-[6px] top-[6px] w-[3px] h-[1px] bg-white/65 rounded-[0.5px]" />
                  <div className="absolute left-[14px] top-[6px] w-[3px] h-[1px] bg-white/65 rounded-[0.5px]" />
                  {/* belt-line trim */}
                  <div className="absolute left-[1px] right-[1px] top-[4px] h-[1px] bg-black/25" />
                  {/* lower body trim (rocker panel) */}
                  <div className="absolute left-[1px] right-[1px] top-[8px] h-[1px] bg-black/35" />
                  {/* side mirrors */}
                  <div className="absolute -left-[1px] top-[4px] w-[2px] h-[1px] bg-black/65 rounded-[0.5px]" />
                  <div className="absolute -right-[1px] top-[4px] w-[2px] h-[1px] bg-black/65 rounded-[0.5px]" />
                  {/* front bumper accent */}
                  <div className="absolute left-[1px] right-[1px] top-[7px] h-[1px] bg-white/15" />
                  {isEveningToMidnight && (
                    <>
                      <div className="absolute left-[1px] top-[5px] w-[2px] h-[2px] bg-[#fef9c3] rounded-[0.5px]" />
                      <div className="absolute right-[1px] top-[5px] w-[2px] h-[2px] bg-[#fef9c3] rounded-[0.5px]" />
                      <div className="absolute -left-[3px] top-[4px] w-[6px] h-[4px] rounded-full bg-[#fef3c7]/55 blur-[2px]" />
                      <div className="absolute -right-[3px] top-[4px] w-[6px] h-[4px] rounded-full bg-[#fef3c7]/55 blur-[2px]" />
                      <div className="absolute -left-[6px] top-[3px] w-[8px] h-[6px] rounded-full bg-[#fefce8]/35 blur-[4px]" />
                      <div className="absolute -right-[6px] top-[3px] w-[8px] h-[6px] rounded-full bg-[#fefce8]/35 blur-[4px]" />
                      <div className="absolute left-[2px] bottom-[3px] w-[2px] h-[1px] bg-red-400/95 village-signal-blink" />
                      <div className="absolute right-[2px] bottom-[3px] w-[2px] h-[1px] bg-red-400/95 village-signal-blink" />
                    </>
                  )}
                  {/* wheels */}
                  <div className="absolute left-[2px] -bottom-[2px] w-[5px] h-[3px] rounded-full border border-black/70 bg-[#0b1220]" />
                  <div className="absolute right-[2px] -bottom-[2px] w-[5px] h-[3px] rounded-full border border-black/70 bg-[#0b1220]" />
                  {/* wheel hubs */}
                  <div className="absolute left-[4px] -bottom-[1px] w-[1px] h-[1px] rounded-full bg-[#cbd5e1]" />
                  <div className="absolute right-[4px] -bottom-[1px] w-[1px] h-[1px] rounded-full bg-[#cbd5e1]" />
                </div>
              </div>
            ))}

            {isTransportUnlocked && serviceVehicleSlots.slice(0, totalServiceVehicles).map((vehicle, idx) => (
              <div
                key={`service-${idx}`}
                className="absolute village-service-run"
                style={{ bottom: `${37.9 + (idx % 2) * 0.35}%`, animationDelay: vehicle.delay, animationDuration: vehicle.duration, zIndex: 134 }}
              >
                <div className="relative w-[28px] h-[14px]">
                  {/* drop shadow */}
                  <div className="absolute left-[2px] right-[2px] bottom-0 h-[2px] rounded-full bg-black/45 blur-[0.5px]" />
                  {/* main body */}
                  <div
                    className="absolute left-[1px] right-[1px] top-[3px] h-[8px] border border-black/70 rounded-[2px]"
                    style={{ background: `linear-gradient(180deg, rgba(255,255,255,0.25) 0%, ${vehicle.color} 38%, rgba(15,23,42,0.4) 100%)` }}
                  />
                  {/* white side stripe (livery) */}
                  <div className="absolute left-[1px] right-[1px] top-[7px] h-[2px] bg-white/85 border-y border-black/30" />
                  {/* red accent stripe inside */}
                  <div className="absolute left-[1px] right-[1px] top-[8px] h-[1px] bg-[#ef4444]/70" />
                  {/* windshield */}
                  <div className="absolute left-[3px] top-[1px] w-[16px] h-[4px] rounded-[2px] border border-black/45 bg-gradient-to-b from-[#ecf5ff] to-[#a7c3dd]" />
                  {/* windshield highlight */}
                  <div className="absolute left-[4px] top-[2px] w-[12px] h-[1px] bg-white/55" />
                  {/* A-pillar split */}
                  <div className="absolute left-[10px] top-[1px] w-[1px] h-[4px] bg-black/50" />
                  {/* cargo door / rear panel */}
                  <div className="absolute left-[19px] top-[3px] w-[1px] h-[6px] bg-black/55" />
                  <div className="absolute left-[22px] top-[3px] w-[1px] h-[6px] bg-black/45" />
                  {/* small rear cargo window */}
                  <div className="absolute left-[20px] top-[4px] w-[2px] h-[2px] bg-[#dbe7f4] border border-black/35" />
                  {/* side mirror */}
                  <div className="absolute -left-[1px] top-[4px] w-[2px] h-[1px] bg-black/65" />
                  {/* door handle */}
                  <div className="absolute left-[6px] top-[6px] w-[3px] h-[1px] bg-white/65" />
                  {/* light bar (rooftop) */}
                  <div className="absolute left-[10px] -top-[1px] w-[10px] h-[2px] rounded-[1px] bg-[#e5e7eb] border border-black/55" />
                  {/* light bar lamps */}
                  <div className="absolute left-[11px] -top-[1px] w-[2px] h-[2px] bg-[#ef4444] village-signal-blink rounded-[0.5px]" />
                  <div className="absolute left-[14px] -top-[1px] w-[2px] h-[2px] bg-[#fde68a] rounded-[0.5px]" />
                  <div className="absolute left-[17px] -top-[1px] w-[2px] h-[2px] bg-[#3b82f6] village-signal-blink rounded-[0.5px]" />
                  {/* night extras: headlights, taillights, glow */}
                  {isEveningToMidnight && (
                    <>
                      <div className="absolute left-[1px] top-[5px] w-[2px] h-[2px] bg-[#fef9c3] rounded-[0.5px]" />
                      <div className="absolute right-[1px] top-[5px] w-[2px] h-[2px] bg-[#fef9c3] rounded-[0.5px]" />
                      <div className="absolute -left-[3px] top-[4px] w-[6px] h-[4px] rounded-full bg-[#fef3c7]/55 blur-[2px]" />
                      <div className="absolute -right-[3px] top-[4px] w-[6px] h-[4px] rounded-full bg-[#fef3c7]/55 blur-[2px]" />
                      <div className="absolute -left-[6px] top-[3px] w-[8px] h-[6px] rounded-full bg-[#fefce8]/35 blur-[4px]" />
                      <div className="absolute -right-[6px] top-[3px] w-[8px] h-[6px] rounded-full bg-[#fefce8]/35 blur-[4px]" />
                      <div className="absolute left-[8px] -top-[3px] w-[12px] h-[3px] rounded-full bg-[#ef4444]/40 blur-[3px] village-signal-blink" />
                      <div className="absolute left-[2px] bottom-[3px] w-[2px] h-[1px] bg-red-400/95 village-signal-blink" />
                      <div className="absolute right-[2px] bottom-[3px] w-[2px] h-[1px] bg-red-400/95 village-signal-blink" />
                    </>
                  )}
                  {/* wheels */}
                  <div className="absolute left-[3px] -bottom-[2px] w-[5px] h-[3px] rounded-full border border-black/70 bg-[#0b1220]" />
                  <div className="absolute right-[3px] -bottom-[2px] w-[5px] h-[3px] rounded-full border border-black/70 bg-[#0b1220]" />
                  {/* wheel hubs */}
                  <div className="absolute left-[5px] -bottom-[1px] w-[1px] h-[1px] rounded-full bg-[#cbd5e1]" />
                  <div className="absolute right-[5px] -bottom-[1px] w-[1px] h-[1px] rounded-full bg-[#cbd5e1]" />
                </div>
              </div>
            ))}

            {Array.from({ length: totalWalkers }).map((_, idx) => (
              <div
                key={`walker-${idx}`}
                className="absolute village-walker-run"
                style={{ bottom: `${20 + (idx % 3) * 1.3}%`, animationDelay: `${idx * 1.1}s`, animationDuration: `${10 + idx * 1.2}s`, zIndex: 120 }}
              >
                <div className="relative w-3 h-5">
                  <div className="absolute top-0 left-[2px] w-[8px] h-[4px] bg-[#f6c7a6] border border-black" />
                  <div
                    className="absolute top-[3px] left-0 w-[12px] h-[7px] border border-black"
                    style={{ backgroundColor: ['#1d4ed8', '#166534', '#7c3aed', '#9a3412'][idx % 4] }}
                  />
                  <div className="absolute top-[4px] left-[-1px] w-[1px] h-[4px] bg-[#f6c7a6]" />
                  <div className="absolute top-[4px] right-[-1px] w-[1px] h-[4px] bg-[#f6c7a6]" />
                  <div className="absolute bottom-0 left-[1px] w-[3px] h-[5px] bg-black" />
                  <div className="absolute bottom-0 right-[1px] w-[3px] h-[5px] bg-black" />
                </div>
              </div>
            ))}

            {isTransportUnlocked && Array.from({ length: totalBoats }).map((_, idx) => (
              <div
                key={`boat-${idx}`}
                className="absolute village-boat-run"
                style={{ bottom: `${8 + (idx % 2) * 6}%`, animationDelay: `${idx * 2.4}s`, animationDuration: `${15 + idx * 2}s`, zIndex: 112 }}
              >
                <div className="relative w-[34px] h-[18px]">
                  {/* outer wake ripples */}
                  <div className="absolute left-[-5px] bottom-[1px] w-[44px] h-[1px] bg-white/35 village-water-shimmer" />
                  <div className="absolute left-[-3px] bottom-[2px] w-[40px] h-[1px] bg-white/55 village-water-shimmer" />
                  {/* bow spray */}
                  <div className="absolute left-[-4px] bottom-[3px] w-[5px] h-[1px] bg-white/85 village-water-shimmer" />
                  <div className="absolute left-[-2px] bottom-[4px] w-[3px] h-[1px] bg-white/65 village-water-shimmer" />
                  {/* waterline */}
                  <div className="absolute left-[-1px] bottom-0 w-[36px] h-[1px] bg-[#1e3a5f]/50" />
                  {/* hull main */}
                  <div className="absolute left-[2px] bottom-[3px] w-[28px] h-[5px] border border-black/65 rounded-bl-[4px] rounded-br-[3px] rounded-t-[1px] bg-gradient-to-b from-[#a37145] via-[#7a4a25] to-[#3f2410]" />
                  {/* hull plank lines */}
                  <div className="absolute left-[3px] bottom-[5px] w-[26px] h-[1px] bg-black/30" />
                  <div className="absolute left-[3px] bottom-[6px] w-[26px] h-[1px] bg-white/15" />
                  {/* gunwale */}
                  <div className="absolute left-[2px] bottom-[7px] w-[28px] h-[1px] bg-[#3f240e]" />
                  {/* deck rim highlight */}
                  <div className="absolute left-[3px] bottom-[8px] w-[26px] h-[1px] bg-[#c89a6c]/55" />
                  {/* port side portholes */}
                  <div className="absolute left-[5px] bottom-[5px] w-[1px] h-[1px] rounded-full bg-[#fef9c3]" />
                  <div className="absolute left-[9px] bottom-[5px] w-[1px] h-[1px] rounded-full bg-[#fef9c3]" />
                  <div className="absolute left-[13px] bottom-[5px] w-[1px] h-[1px] rounded-full bg-[#fef9c3]" />
                  <div className="absolute left-[17px] bottom-[5px] w-[1px] h-[1px] rounded-full bg-[#fef9c3]" />
                  <div className="absolute left-[21px] bottom-[5px] w-[1px] h-[1px] rounded-full bg-[#fef9c3]" />
                  {/* cabin (raised wheelhouse) */}
                  <div className="absolute left-[7px] bottom-[8px] w-[14px] h-[4px] border border-black/60 bg-gradient-to-b from-[#e3edf8] to-[#7c9fbf]" />
                  {/* cabin window grid */}
                  <div className="absolute left-[8px] bottom-[9px] w-[3px] h-[2px] bg-[#1f3550] border border-black/30" />
                  <div className="absolute left-[12px] bottom-[9px] w-[3px] h-[2px] bg-[#1f3550] border border-black/30" />
                  <div className="absolute left-[16px] bottom-[9px] w-[3px] h-[2px] bg-[#1f3550] border border-black/30" />
                  {/* cabin roof */}
                  <div className="absolute left-[6px] bottom-[12px] w-[16px] h-[1px] bg-[#475569] border-x border-black/45" />
                  {/* funnel / smokestack */}
                  <div className="absolute left-[24px] bottom-[8px] w-[3px] h-[6px] bg-gradient-to-b from-[#1f2937] to-[#0f172a] border border-black/65 rounded-t-[1px]" />
                  <div className="absolute left-[24px] bottom-[13px] w-[3px] h-[1px] bg-[#dc2626]" />
                  {/* smoke puffs */}
                  <div className="absolute left-[22px] bottom-[14px] w-[5px] h-[3px] rounded-full bg-white/55 blur-[1px] village-water-shimmer" />
                  <div className="absolute left-[20px] bottom-[16px] w-[4px] h-[2px] rounded-full bg-white/35 blur-[1px]" />
                  <div className="absolute left-[18px] bottom-[17px] w-[3px] h-[1px] rounded-full bg-white/25 blur-[1px]" />
                  {/* mast */}
                  <div className="absolute left-[14px] bottom-[12px] w-[1px] h-[5px] bg-[#1f2937]" />
                  <div className="absolute left-[12px] bottom-[14px] w-[3px] h-[1px] bg-[#1f2937]" />
                  {/* flag */}
                  <div className="absolute left-[15px] bottom-[15px] w-[3px] h-[2px] bg-[#dc2626] border border-black/40 village-water-shimmer" />
                  {/* anchor (front) */}
                  <div className="absolute left-[3px] bottom-[4px] w-[1px] h-[2px] bg-[#475569]" />
                  {/* night lights */}
                  {isEveningToMidnight && (
                    <>
                      <div className="absolute left-[4px] bottom-[4px] w-[2px] h-[1px] bg-[#fde68a]/95" />
                      <div className="absolute left-[28px] bottom-[4px] w-[2px] h-[1px] bg-red-400/85 village-signal-blink" />
                      <div className="absolute left-[2px] bottom-[3px] w-[28px] h-[1px] bg-[#fde68a]/30 blur-[1px]" />
                      <div className="absolute left-[8px] bottom-[9px] w-[1px] h-[1px] bg-[#fef3c7]" />
                      <div className="absolute left-[12px] bottom-[9px] w-[1px] h-[1px] bg-[#fef3c7]" />
                      <div className="absolute left-[16px] bottom-[9px] w-[1px] h-[1px] bg-[#fef3c7]" />
                      <div className="absolute left-[14px] bottom-[16px] w-[1px] h-[1px] bg-[#fef9c3] village-signal-blink" />
                    </>
                  )}
                </div>
              </div>
            ))}

            {isTransportUnlocked && hasAirship && (
              <div className="absolute village-airship-run z-[140]">
                {/* drop shadow on ground */}
                <div className="absolute left-[8px] top-[20px] w-[54px] h-[3px] rounded-full bg-black/30 blur-[1.5px]" />
                {/* envelope (gas balloon) */}
                <div className="relative w-[68px] h-[28px] border-[2px] border-black rounded-[14px] bg-gradient-to-b from-[#fafbfd] via-[#cfd6e2] to-[#7a8499]">
                  {/* upper highlight */}
                  <div className="absolute left-[4px] right-[4px] top-[2px] h-[2px] bg-white/65 rounded-full" />
                  <div className="absolute left-[10px] right-[10px] top-[3px] h-[1px] bg-white/40 rounded-full" />
                  {/* envelope rib segments */}
                  <div className="absolute left-[14px] top-[1px] bottom-[1px] w-[1px] bg-black/30" />
                  <div className="absolute left-[28px] top-[1px] bottom-[1px] w-[1px] bg-black/30" />
                  <div className="absolute left-[42px] top-[1px] bottom-[1px] w-[1px] bg-black/30" />
                  <div className="absolute left-[56px] top-[1px] bottom-[1px] w-[1px] bg-black/30" />
                  {/* nose cone */}
                  <div className="absolute -left-[3px] top-[8px] w-[5px] h-[8px] rounded-l-[5px] bg-[#475569] border-y border-l border-black/55" />
                  {/* nose marker light */}
                  <div className="absolute -left-[1px] top-[11px] w-[1px] h-[2px] bg-[#fde68a]" />
                  {/* center belt stripe */}
                  <div className="absolute left-[2px] right-[2px] top-[12px] h-[1px] bg-[#dc2626]/85" />
                  <div className="absolute left-[2px] right-[2px] top-[13px] h-[1px] bg-white/65" />
                  {/* logo emblem */}
                  <div className="absolute left-[30px] top-[8px] w-[6px] h-[3px] border border-black/55 bg-[#fde68a] flex items-center justify-center text-[5px] leading-none text-[#7c2d12]">★</div>
                  {/* passenger gondola */}
                  <div className="absolute left-[20px] bottom-[-7px] w-[28px] h-[7px] border-[1.5px] border-black bg-gradient-to-b from-[#9a622f] via-[#7c4b22] to-[#5b3514] rounded-b-[2px]" />
                  {/* gondola plank lines */}
                  <div className="absolute left-[20px] bottom-[-3px] w-[28px] h-[1px] bg-black/30" />
                  {/* gondola windows */}
                  <div className="absolute left-[22px] bottom-[-5px] w-[2px] h-[2px] bg-[#fef3c7] border border-black/35" />
                  <div className="absolute left-[26px] bottom-[-5px] w-[2px] h-[2px] bg-[#fef3c7] border border-black/35" />
                  <div className="absolute left-[30px] bottom-[-5px] w-[2px] h-[2px] bg-[#fef3c7] border border-black/35" />
                  <div className="absolute left-[34px] bottom-[-5px] w-[2px] h-[2px] bg-[#fef3c7] border border-black/35" />
                  <div className="absolute left-[38px] bottom-[-5px] w-[2px] h-[2px] bg-[#fef3c7] border border-black/35" />
                  <div className="absolute left-[42px] bottom-[-5px] w-[2px] h-[2px] bg-[#fef3c7] border border-black/35" />
                  {/* suspension cables */}
                  <div className="absolute left-[22px] bottom-[-1px] w-[1px] h-[3px] bg-black/65" />
                  <div className="absolute left-[34px] bottom-[-1px] w-[1px] h-[3px] bg-black/65" />
                  <div className="absolute left-[46px] bottom-[-1px] w-[1px] h-[3px] bg-black/65" />
                  {/* keel fin (bottom) */}
                  <div className="absolute left-[28px] bottom-[-12px] w-[14px] h-[5px] bg-[#9a622f] border border-black/45 rounded-b-[2px]" />
                  {/* horizontal stabilizer */}
                  <div className="absolute right-[-8px] top-[8px] w-0 h-0 border-y-[5px] border-y-transparent border-l-[8px] border-l-[#94a3b8]" />
                  {/* vertical stabilizer (top fin) */}
                  <div className="absolute right-[-2px] -top-[6px] w-0 h-0 border-x-[4px] border-x-transparent border-b-[8px] border-b-[#64748b]" />
                  {/* vertical stabilizer (bottom fin) */}
                  <div className="absolute right-[-2px] top-[22px] w-0 h-0 border-x-[4px] border-x-transparent border-t-[6px] border-t-[#64748b]" />
                  {/* tail accent stripe */}
                  <div className="absolute right-[-7px] top-[12px] w-[7px] h-[1px] bg-[#dc2626]" />
                  {/* propeller hub */}
                  <div className="absolute right-[-10px] top-[12px] w-[2px] h-[2px] rounded-full bg-[#1f2937] border border-black" />
                  {/* propeller blades (animated) */}
                  <div className="absolute right-[-15px] top-[10px] w-[6px] h-[6px] village-prop-spin">
                    <div className="absolute left-[-3px] top-[2.5px] w-[12px] h-[1px] bg-[#dbeafe] border border-black/35" />
                    <div className="absolute left-[2.5px] top-[-3px] w-[1px] h-[12px] bg-[#dbeafe] border border-black/35" />
                  </div>
                  {/* propeller wash blur */}
                  <div className="absolute right-[-20px] top-[10px] w-[8px] h-[6px] rounded-full bg-white/15 blur-[2px]" />
                  {/* trailing banner */}
                  <div className="absolute -right-[24px] top-[7px] w-[12px] h-[2px] bg-[#fde68a]/85 border border-black/35 village-water-shimmer" />
                  {/* night-only embellishments */}
                  {isEveningToMidnight && (
                    <>
                      {/* envelope edge running lights */}
                      <div className="absolute left-[6px] top-[6px] w-[1px] h-[1px] bg-[#fef3c7]" />
                      <div className="absolute left-[20px] top-[5px] w-[1px] h-[1px] bg-[#fef3c7]" />
                      <div className="absolute left-[34px] top-[5px] w-[1px] h-[1px] bg-[#fef3c7]" />
                      <div className="absolute left-[48px] top-[5px] w-[1px] h-[1px] bg-[#fef3c7]" />
                      <div className="absolute right-[6px] top-[6px] w-[1px] h-[1px] bg-red-300 village-signal-blink" />
                      {/* gondola interior glow */}
                      <div className="absolute left-[20px] bottom-[-7px] w-[28px] h-[5px] bg-[#fde68a]/15 blur-[2px]" />
                      {/* searchlight beam */}
                      <div className="absolute left-[26px] bottom-[-12px] w-[14px] h-[14px] bg-gradient-to-b from-[#fef9c3]/60 to-transparent blur-[2px]" />
                      <div className="absolute left-[31px] bottom-[-9px] w-[3px] h-[2px] bg-[#fef9c3] rounded-full" />
                      {/* ambient envelope glow */}
                      <div className="absolute -inset-[6px] rounded-[14px] bg-[#fef3c7]/10 blur-[6px] -z-10" />
                    </>
                  )}
                </div>
              </div>
            )}

            {milestoneFeatures.map((feature, idx) => {
              if (!isMilestoneUnlocked(feature.threshold)) return null;
              const isLatestFeature = latestMilestone?.threshold === feature.threshold;
              const animationClass = feature.threshold >= 1950000 ? "village-milestone-flash" : "village-milestone-bob";
              const isStarterSign = feature.threshold === 50000;
              return (
                <div
                  key={`milestone-feature-${feature.threshold}`}
                  className={`absolute z-[170] ${animationClass}`}
                  style={{ left: `${feature.left}%`, bottom: `${feature.bottom}%`, animationDelay: `${idx * 0.06}s` }}
                  title={`${Math.floor(feature.threshold / 10000)}万G: ${feature.title}`}
                >
                  {isStarterSign ? (
                    <>
                      <div className="absolute left-[8px] top-[12px] w-[2px] h-[12px] bg-[#7c4b22] border border-black/45" />
                      <div className="absolute left-[14px] top-[12px] w-[2px] h-[12px] bg-[#7c4b22] border border-black/45" />
                      <div
                        className={`relative w-[24px] h-[13px] border-[2px] border-black flex items-center justify-center text-[7px] leading-none text-[#111827] ${isLatestFeature ? "ring-2 ring-yellow-200 ring-offset-1 ring-offset-black/70" : ""}`}
                        style={{ background: 'linear-gradient(180deg, #fef3c7 0%, #d6b98a 100%)' }}
                      >
                        <div className="absolute inset-x-[2px] top-[1px] h-[1px] bg-white/40" />
                        <div className="absolute inset-x-[2px] bottom-[1px] h-[1px] bg-black/20" />
                        看板
                      </div>
                      <div className="absolute left-[6px] top-[24px] w-[14px] h-[2px] bg-black/30" />
                    </>
                  ) : (
                    <>
                      <div className="absolute left-[3px] top-[16px] w-[12px] h-[3px] bg-black/35 blur-[0.5px]" />
                      <div
                        className={`w-[17px] h-[17px] border border-black text-[9px] leading-none flex items-center justify-center ${isLatestFeature ? "ring-2 ring-yellow-200 ring-offset-1 ring-offset-black/70" : ""}`}
                        style={{ backgroundColor: feature.bg, color: feature.fg }}
                      >
                        {feature.glyph}
                      </div>
                      <div className="absolute left-[4px] top-[17px] w-[9px] h-[2px] bg-[#cbd5e1] border border-black/40" />
                    </>
                  )}
                  {isLatestFeature && <div className="absolute left-[-3px] top-[-3px] w-[23px] h-[23px] rounded-full border border-yellow-200/70 village-milestone-flash" />}
                </div>
              );
            })}

            <div className="absolute inset-0 z-[200] kairo-city-focus-layer pointer-events-none" style={{ background: kairoFocusGradient }} />
                </>
              )}

            <div
              className="absolute left-1/2 top-1/2 z-[260] kairo-city-map"
              style={{
                width: `${cityMapFrameSize * 100}%`,
                height: `${cityMapFrameSize * 100}%`,
                transform: `translate(-50%, -50%) scale(${cityMapFrameScale})`,
                transformOrigin: 'center center',
                background: kairoMapBaseColor
              }}
            >
              <div className="absolute inset-0 kairo-city-sky" style={{ background: kairoCitySkyGradient }} />
              <div className="absolute left-[14%] top-[4.5%] w-[21%] h-[14%] rounded-full bg-white/24 blur-[1px] pointer-events-none" />
              <div className="absolute left-[11%] top-[2.6%] w-[30%] h-[20%] rounded-full bg-[#dbeafe]/24 blur-[9px] pointer-events-none" />
              <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/10 via-white/3 to-transparent" />
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={`kairo-cloud-${idx}`}
                  className="absolute kairo-cloud-drift"
                  style={{
                    top: `${7 + idx * 4}%`,
                    left: `${-24 + idx * 37}%`,
                    width: `${66 - idx * 6}px`,
                    height: `${20 - idx * 2}px`,
                    animationDelay: `${idx * -6}s`,
                    animationDuration: `${40 + idx * 7}s`,
                    opacity: 0.36 - idx * 0.06
                  }}
                >
                  <div className="absolute left-0 top-[4px] w-[52%] h-[68%] rounded-full bg-white/72" />
                  <div className="absolute left-[30%] top-0 w-[46%] h-[72%] rounded-full bg-white/66" />
                  <div className="absolute right-0 top-[6px] w-[38%] h-[64%] rounded-full bg-white/70" />
                </div>
              ))}
              <div className="absolute inset-0 kairo-city-color-grade pointer-events-none" />

              {kairoMountainLayers.map((layer, idx) => (
                <div
                  key={`kairo-mountain-${idx}`}
                  className="absolute inset-x-0 pointer-events-none"
                  style={{
                    bottom: `${layer.bottom}%`,
                    height: `${layer.height}%`,
                    opacity: layer.opacity
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      clipPath: layer.ridge,
                      background: `linear-gradient(180deg, ${layer.colorTop} 0%, ${layer.colorBottom} 100%)`
                    }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      clipPath: layer.ridge,
                      background: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.14) 0px, rgba(255,255,255,0.14) 1px, transparent 1px, transparent 6px)',
                      mixBlendMode: 'soft-light',
                      opacity: 0.4
                    }}
                  />
                  {layer.snowRidge && (
                    <div
                      className="absolute inset-0"
                      style={{
                        clipPath: layer.snowRidge,
                        background: 'linear-gradient(180deg, rgba(248,250,252,0.95) 0%, rgba(233,241,247,0.55) 72%, rgba(233,241,247,0) 100%)'
                      }}
                    />
                  )}
                </div>
              ))}
              <div
                className="absolute inset-x-0 bottom-[43.8%] h-[9%] pointer-events-none"
                style={{
                  clipPath: 'polygon(0% 100%, 5% 72%, 13% 84%, 22% 63%, 31% 80%, 40% 58%, 49% 81%, 58% 60%, 68% 79%, 77% 61%, 87% 80%, 95% 67%, 100% 76%, 100% 100%)',
                  background: 'linear-gradient(180deg, rgba(108,138,104,0.68) 0%, rgba(84,116,81,0.78) 100%)'
                }}
              />

              <div className="absolute inset-x-0 bottom-0 h-[70%] kairo-city-ground" />
              <div className="absolute inset-x-0 bottom-0 h-[70%] kairo-terrain-relief pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-[70%] kairo-terrain-texture pointer-events-none" />
              <div className="absolute inset-x-0 bottom-[33.5%] h-[3.5%] kairo-horizon-haze pointer-events-none" />
              <div className="absolute inset-x-[26%] bottom-[43.3%] h-[8.4%] kairo-foothill-fade pointer-events-none" />
              {kairoForestLineSlots.map((tree, idx) => (
                <div
                  key={`kairo-forest-line-${idx}`}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${tree.left}%`,
                    bottom: `${tree.bottom}%`,
                    width: `${tree.width}%`,
                    height: `${tree.height}%`,
                    background: tree.dark
                      ? 'linear-gradient(180deg, rgba(60,95,64,0.88) 0%, rgba(43,75,52,0.92) 100%)'
                      : 'linear-gradient(180deg, rgba(85,126,79,0.8) 0%, rgba(57,91,63,0.86) 100%)',
                    clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
                    opacity: 0.65
                  }}
                />
              ))}
              <div className="absolute inset-x-[28%] bottom-[22%] h-[23%] kairo-farmland-grid pointer-events-none" />
              {kairoTerraceSlots.map((terrace, idx) => (
                <div
                  key={`kairo-terrace-${idx}`}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${terrace.left}%`,
                    bottom: `${terrace.bottom}%`,
                    width: `${terrace.width}%`,
                    height: `${terrace.height}%`,
                    background: `linear-gradient(180deg, rgba(236,253,245,0.15) 0%, ${terrace.tint} 100%)`,
                    border: '1px solid rgba(15,23,42,0.14)',
                    opacity: terrace.opacity
                  }}
                />
              ))}
              <div className="absolute left-[5%] bottom-[6%] w-[1.3%] h-[64%] kairo-riverbank-west" />
              <div className="absolute left-[23.9%] bottom-[6%] w-[1.3%] h-[64%] kairo-riverbank-east" />
              <div className="absolute left-[6%] bottom-[6%] w-[18%] h-[64%] kairo-city-river">
                <div className="absolute inset-0 kairo-river-depth" />
                <div className="absolute inset-0 kairo-river-current" />
                <div className="absolute inset-0 kairo-river-sparkle" />
                <div className="absolute inset-0 kairo-river-caustics" />
                <div className="absolute left-[24%] top-[12%] bottom-[12%] w-[34%] bg-[#0f4f81]/28 blur-[1px]" />
                <div className="absolute inset-x-[15%] top-[38%] h-[2px] kairo-river-caustics-line" />
                <div className="absolute inset-x-[8%] top-[17%] h-[2px] kairo-river-foam" />
                <div className="absolute inset-x-[6%] bottom-[22%] h-[2px] kairo-river-foam" style={{ animationDelay: '-1.4s' }} />
                <div className="absolute left-[9%] top-[8%] bottom-[10%] w-[1px] bg-white/24" />
                <div className="absolute right-[10%] top-[8%] bottom-[12%] w-[1px] bg-[#0f3d6a]/45" />
              </div>
              <div className="absolute left-[24.6%] bottom-[8%] w-[3.2%] h-[59%] kairo-canal">
                <div className="absolute inset-[1px] kairo-canal-inner" />
                <div className="absolute inset-x-0 top-[18%] h-[1px] bg-white/35" />
                <div className="absolute inset-x-0 bottom-[24%] h-[1px] bg-[#0f3f72]/45" />
              </div>
              {kairoRockSlots.map((rock, idx) => (
                <div
                  key={`kairo-river-rock-${idx}`}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${rock.left}%`,
                    bottom: `${rock.bottom}%`,
                    width: `${rock.width}%`,
                    height: `${rock.height}%`,
                    background: 'linear-gradient(180deg, #7b8897 0%, #556271 100%)',
                    border: '1px solid rgba(15,23,42,0.28)',
                    opacity: rock.opacity,
                    zIndex: 17
                  }}
                />
              ))}

              {isTransportUnlocked && (
                <>
                  <div className="absolute inset-x-[4%] bottom-[17%] h-[6.2%] kairo-city-road" />
                  <div className="absolute inset-x-[8%] bottom-[38.2%] h-[4.6%] kairo-city-road" />
                  <div className="absolute inset-x-[12%] bottom-[50.6%] h-[3.8%] kairo-city-road opacity-95" />
                  <div className="absolute inset-x-[4%] bottom-[23%] h-[0.6%] bg-white/12 pointer-events-none z-[16]" />
                  <div className="absolute inset-x-[8%] bottom-[42.4%] h-[0.55%] bg-white/12 pointer-events-none z-[16]" />
                  <div className="absolute inset-x-[12%] bottom-[54.2%] h-[0.48%] bg-white/10 pointer-events-none z-[16]" />
                  {kairoVerticalRoads.map((road) => (
                    <div
                      key={`kairo-v-road-${road.id}`}
                      className="absolute kairo-city-road-vert"
                      style={{ left: `${road.left}%`, bottom: '17%', width: `${road.width}%`, height: '37.4%' }}
                    />
                  ))}
                  <div className="absolute inset-x-[7%] bottom-[19.2%] h-[1px] bg-[repeating-linear-gradient(90deg,#f8fafc_0px,#f8fafc_8px,transparent_8px,transparent_16px)] opacity-80" />
                  <div className="absolute inset-x-[10%] bottom-[39.8%] h-[1px] bg-[repeating-linear-gradient(90deg,#f8fafc_0px,#f8fafc_7px,transparent_7px,transparent_14px)] opacity-75" />
                  <div className="absolute inset-x-[14%] bottom-[52.2%] h-[1px] bg-[repeating-linear-gradient(90deg,#f8fafc_0px,#f8fafc_6px,transparent_6px,transparent_12px)] opacity-70" />
                  {kairoVerticalRoads.map((road) => (
                    <div
                      key={`kairo-v-road-line-${road.id}`}
                      className="absolute w-[1px] bg-[repeating-linear-gradient(180deg,#f8fafc_0px,#f8fafc_7px,transparent_7px,transparent_14px)] opacity-75"
                      style={{ left: `${road.center}%`, bottom: '18%', height: '34.2%' }}
                    />
                  ))}

                  {Array.from({ length: Math.max(1, Math.min(2, Math.floor(totalFields / 8))) }).map((_, idx) => (
                    <div
                      key={`kairo-cross-${idx}`}
                      className="absolute z-[15] flex justify-between"
                      style={{
                        left: idx === 0 ? '44.2%' : '46.5%',
                        bottom: idx === 0 ? '20.1%' : '39.1%',
                        width: idx === 0 ? '12%' : '7.8%',
                        height: idx === 0 ? '2.6%' : '4%'
                      }}
                    >
                      {Array.from({ length: 5 }).map((__, stripeIdx) => (
                        <div key={`kairo-stripe-${idx}-${stripeIdx}`} className="w-[12%] h-full bg-white/70 border border-black/20" />
                      ))}
                    </div>
                  ))}
                </>
              )}

              {hasVillageDevelopment && (
                <div
                  className="absolute left-[44.1%] bottom-[30.5%] w-[12.8%] h-[7.1%] rounded-[10px] border border-black/45 bg-gradient-to-b from-[#a1a1aa] to-[#71717a] z-[18]"
                  style={{ transform: `scale(${cityBuildingScale})`, transformOrigin: 'center bottom' }}
                >
                  <div className="absolute left-[12%] top-[18%] right-[12%] bottom-[18%] rounded-[8px] border border-white/25 bg-[#3f4a57]" />
                  <div
                    className="absolute left-[47%] top-[34%] w-[6%] h-[32%] bg-[#fde68a] kairo-light-blink"
                    style={{ opacity: cityLampCoreOpacity }}
                  />
                  <div
                    className="absolute left-[34%] top-[20%] w-[30%] h-[58%] rounded-full bg-yellow-100/55 blur-[5px]"
                    style={{ opacity: cityLampGlowOpacity * 0.92 }}
                  />
                  <div
                    className="absolute left-[29%] top-[14%] w-[40%] h-[70%] rounded-full bg-yellow-100/28 blur-[10px]"
                    style={{ opacity: cityLampGlowOpacity * 0.84 }}
                  />
                  <div
                    className="absolute left-[24%] top-[10%] w-[52%] h-[82%] rounded-full bg-[#fef3c7] blur-[14px]"
                    style={{ opacity: citySoftHaloBoost * 0.52 }}
                  />
                </div>
              )}

              {unlockedAdvancedIllustrations.map((feature, idx) => {
                const depthScale = Math.max(0.74, Math.min(1.04, 0.7 + feature.bottom / 140));
                const profile = advancedIllustrationProfiles[idx % advancedIllustrationProfiles.length];
                const windowRows = profile.type === 'tower' ? 4 : 3;
                const windowCols = profile.type === 'transit' ? 5 : 4;
                const isLatestAdvanced = latestMilestone?.threshold === feature.threshold;
                return (
                  <div
                    key={`kairo-advanced-feature-${feature.threshold}`}
                    className="absolute z-[34]"
                    style={{
                      left: `${feature.left}%`,
                      bottom: `${feature.bottom}%`,
                      transform: `translateX(-50%) scale(${depthScale * cityBuildingScale})`,
                      transformOrigin: 'center bottom'
                    }}
                    title={`${Math.floor(feature.threshold / 10000)}万G: ${feature.title}`}
                  >
                    <div className="absolute left-[4px] right-[4px] -bottom-[3px] h-[3px] rounded-full bg-black/28" />
                    <div className="relative" style={{ width: `${profile.width}px`, height: `${profile.height}px` }}>
                      <div
                        className="absolute inset-0 border-[2px] border-black"
                        style={{ background: `linear-gradient(180deg, ${profile.wallTop} 0%, ${profile.wallBottom} 100%)` }}
                      />
                      <div className="absolute inset-y-[2px] left-[2px] w-[10%] bg-white/14 pointer-events-none" />
                      <div className="absolute inset-y-0 right-0 w-[14%] bg-black/12" />
                      <div className="absolute inset-x-[2px] bottom-[2px] h-[22%] bg-gradient-to-t from-black/16 to-transparent pointer-events-none" />
                      <div className="absolute left-[2px] right-[2px] top-[2px] h-[1px] bg-white/45" />
                      <div className="absolute -top-[6px] left-[-2px] right-[-2px] h-[6px] border-[2px] border-black border-b-0" style={{ backgroundColor: profile.roof }}>
                        <div className="absolute inset-x-[2px] top-[1px] h-[1px] bg-white/30" />
                      </div>

                      <div
                        className="absolute inset-[3px] grid gap-[1px]"
                        style={{
                          gridTemplateColumns: `repeat(${windowCols}, minmax(0, 1fr))`,
                          gridTemplateRows: `repeat(${windowRows}, minmax(0, 1fr))`
                        }}
                      >
                        {Array.from({ length: windowCols * windowRows }).map((__, wIdx) => {
                          const isLit = isCityWindowLit((wIdx + 1) * (idx + 11), profile.type === 'tower' ? 8 : 0);
                          const twinkle = cityLightLevel > 0.55 && isLit && (wIdx + idx) % 9 === 0;
                          return (
                            <div
                              key={`kairo-advanced-window-${feature.threshold}-${wIdx}`}
                              className={`border border-black/30 ${twinkle ? 'kairo-light-blink' : ''}`}
                              style={{
                                backgroundColor: isLit ? '#fff4bf' : profile.window,
                                boxShadow: isLit
                                  ? `0 0 5px rgba(254,243,199,${(cityWindowGlowOpacity * 0.78).toFixed(2)}), 0 0 11px rgba(254,243,199,${(cityWindowGlowOpacity * 0.5).toFixed(2)}), 0 0 18px rgba(254,243,199,${(cityWindowGlowOpacity * 0.28).toFixed(2)}), 0 0 24px rgba(254,243,199,${(citySoftHaloBoost * 0.16).toFixed(2)})`
                                  : 'none'
                              }}
                            />
                          );
                        })}
                      </div>

                      {profile.type === 'tower' && (
                        <>
                          <div className="absolute left-[44%] -top-[12px] w-[3px] h-[6px] border border-black/45 bg-[#cbd5e1]" />
                          <div className="absolute left-[45%] -top-[15px] w-[2px] h-[2px] bg-[#fde68a]" style={{ opacity: lightDisplayGate }} />
                        </>
                      )}

                      {profile.type === 'transit' && (
                        <div className="absolute left-[8%] right-[8%] bottom-[28%] h-[2px] border border-black/35 bg-[#94a3b8]" />
                      )}

                      {profile.type === 'plant' && (
                        <>
                          <div className="absolute right-[8%] -top-[10px] w-[5px] h-[8px] border border-black/45 bg-[#6b7280]" />
                          <div className="absolute right-[9%] -top-[13px] w-[4px] h-[4px] rounded-full bg-white/60 village-smoke-rise" style={{ animationDelay: `${idx * 0.1}s` }} />
                        </>
                      )}

                      {profile.type === 'culture' && (
                        <div className="absolute left-[16%] right-[16%] bottom-[16%] h-[3px] border border-black/35 bg-[#fbcfe8]" />
                      )}

                      <div className="absolute left-[36%] bottom-0 w-[28%] h-[16%] border border-black/40 border-b-0 bg-[#7c4b22]">
                        <div className="absolute left-[42%] top-[40%] w-[2px] h-[2px] rounded-full bg-[#fde68a]" style={{ opacity: lightDisplayGate }} />
                      </div>

                      <div
                        className={`absolute -right-[3px] -top-[3px] w-[12px] h-[12px] rounded-full border border-black/65 flex items-center justify-center text-[8px] leading-none ${idx % 5 === 0 ? 'kairo-pin-bob' : ''}`}
                        style={{ backgroundColor: feature.bg, color: feature.fg }}
                      >
                        {feature.glyph}
                      </div>

                      {isLatestAdvanced && (
                        <div className="absolute -inset-[4px] rounded-[2px] border border-yellow-200/70 village-milestone-flash pointer-events-none" />
                      )}
                    </div>
                  </div>
                );
              })}

              {Array.from({ length: kairoPlottedCount }).map((_, idx) => {
                const slot = kairoPlotSlots[idx];
                const row = slot.row;
                const left = slot.left;
                const bottom = slot.bottom;
                const kind = idx % 5;
                const skylineBoost = Math.floor(totalHighrise / 3);
                const width = (7 + (kind % 2) * 1.1) * slot.scale;
                const height = Math.min(
                  14.8,
                  slot.baseHeight + (kind % 3) * 0.8 + (row >= 2 ? skylineBoost * 0.6 : skylineBoost * 0.3)
                );
                const profile = kairoBuildingProfiles[kind];
                const windowCols = profile.type === 'office' ? 4 : profile.type === 'factory' ? 3 : 3;
                const windowRows = Math.max(3, Math.min(7, Math.floor(height / 3.4)));
                const hasAwning = profile.type === 'shop';
                const hasChimney = profile.type === 'factory';
                const hasBalcony = profile.type === 'apartment';
                const hasRoofUnit = profile.type === 'office' || profile.type === 'factory';
                return (
                  <div
                    key={`kairo-block-${idx}`}
                    className="absolute z-[22]"
                    style={{
                      left: `${left}%`,
                      bottom: `${bottom}%`,
                      width: `${width}%`,
                      height: `${height}%`,
                      transform: `translateX(-50%) scale(${cityBuildingScale})`,
                      transformOrigin: 'center bottom',
                      zIndex: 26 + (kairoPlotRows.length - row) * 3,
                    }}
                  >
                    <div className="absolute left-[4%] right-[4%] -bottom-[3px] h-[3px] bg-black/28" />
                    <div
                      className="absolute inset-0 border-[2px] border-black"
                      style={{ background: `linear-gradient(180deg, ${profile.wallTop} 0%, ${profile.wallBottom} 100%)` }}
                    >
                      <div className="absolute inset-y-[2px] left-[2px] w-[10%] bg-white/12 pointer-events-none" />
                      <div className="absolute inset-y-0 right-0 w-[14%] bg-black/12" />
                      <div className="absolute inset-x-[2px] bottom-[2px] h-[22%] bg-gradient-to-t from-black/18 to-transparent pointer-events-none" />
                      <div className="absolute left-[2%] right-[2%] top-[2px] h-[1px] bg-white/45" />
                      <div className="absolute -top-[7px] left-[-2px] right-[-2px] h-[7px] border-[2px] border-black border-b-0" style={{ backgroundColor: profile.roof }}>
                        <div className="absolute inset-x-[2px] top-[1px] h-[1px] bg-white/25" />
                      </div>

                      {hasRoofUnit && (
                        <div className="absolute left-[12%] -top-[12px] w-[24%] h-[5px] border border-black/45 bg-[#9ca3af]">
                          <div className="absolute left-[2px] right-[2px] top-[1px] h-[1px] bg-white/35" />
                        </div>
                      )}

                      <div
                        className="absolute inset-[2px] grid gap-[1px]"
                        style={{
                          gridTemplateColumns: `repeat(${windowCols}, minmax(0, 1fr))`,
                          gridTemplateRows: `repeat(${windowRows}, minmax(0, 1fr))`
                        }}
                      >
                        {Array.from({ length: windowCols * windowRows }).map((__, wIdx) => {
                          const isLit = isCityWindowLit((idx + 5) * (wIdx + 7), profile.type === 'office' ? 8 : 0);
                          const twinkle = cityLightLevel > 0.58 && isLit && (wIdx + idx) % 11 === 0;
                          return (
                            <div
                              key={`kairo-window-${idx}-${wIdx}`}
                              className={`border border-black/30 ${twinkle ? 'kairo-light-blink' : ''}`}
                              style={{
                                backgroundColor: isLit ? profile.windowOn : profile.windowOff,
                                boxShadow: isLit
                                  ? `0 0 5px rgba(254,243,199,${(cityWindowGlowOpacity * 0.72).toFixed(2)}), 0 0 11px rgba(254,243,199,${(cityWindowGlowOpacity * 0.44).toFixed(2)}), 0 0 18px rgba(254,243,199,${(cityWindowGlowOpacity * 0.24).toFixed(2)}), 0 0 24px rgba(254,243,199,${(citySoftHaloBoost * 0.14).toFixed(2)})`
                                  : 'none'
                              }}
                            />
                          );
                        })}
                      </div>

                      {hasBalcony && (
                        <>
                          <div className="absolute left-[8%] right-[8%] top-[36%] h-[1px] bg-[#64748b]" />
                          <div className="absolute left-[8%] right-[8%] top-[58%] h-[1px] bg-[#64748b]" />
                        </>
                      )}

                      {hasAwning && (
                        <div className="absolute left-[10%] right-[10%] bottom-[18%] h-[8%] border border-black/35 bg-[#fde68a]">
                          <div className="absolute inset-y-0 left-[20%] w-[1px] bg-black/20" />
                          <div className="absolute inset-y-0 left-[40%] w-[1px] bg-black/20" />
                          <div className="absolute inset-y-0 left-[60%] w-[1px] bg-black/20" />
                          <div className="absolute inset-y-0 left-[80%] w-[1px] bg-black/20" />
                        </div>
                      )}

                      <div className="absolute left-[35%] bottom-0 w-[30%] h-[16%] border border-black/40 border-b-0 bg-[#7c4b22]">
                        <div className="absolute left-[44%] top-[40%] w-[12%] h-[12%] rounded-full bg-[#fef3c7]/75" style={{ opacity: lightDisplayGate }} />
                      </div>

                      {hasChimney && (
                        <>
                          <div className="absolute right-[8%] -top-[13px] w-[7px] h-[11px] border border-black/45 bg-[#6b7280]" />
                          <div className="absolute right-[8%] -top-[18px] w-[6px] h-[6px] rounded-full bg-white/55 village-smoke-rise" style={{ animationDelay: `${idx * 0.12}s` }} />
                          <div className="absolute right-[6%] -top-[22px] w-[5px] h-[5px] rounded-full bg-white/45 village-smoke-rise" style={{ animationDelay: `${idx * 0.12 + 0.7}s` }} />
                        </>
                      )}

                      <div className="absolute left-[4%] right-[4%] bottom-[2px] h-[1px]" style={{ backgroundColor: profile.accent }} />
                    </div>
                  </div>
                );
              })}

              {Array.from({ length: Math.max(0, Math.min(4, constructionSiteCount)) }).map((_, idx) => (
                <div
                  key={`kairo-construction-${idx}`}
                  className="absolute z-[24]"
                  style={{
                    left: `${34 + idx * 13}%`,
                    bottom: `${26 + (idx % 2) * 12}%`,
                    width: '10%',
                    height: '10%',
                    transform: `scale(${cityBuildingScale})`,
                    transformOrigin: 'center bottom'
                  }}
                >
                  <div className="absolute inset-0 border border-black/45 bg-[repeating-linear-gradient(135deg,#fbbf24_0px,#fbbf24_4px,#1f2937_4px,#1f2937_8px)]" />
                  <div className="absolute left-[8%] bottom-[14%] w-[4%] h-[72%] bg-[#475569]" />
                  <div className="absolute left-[8%] top-[18%] w-[56%] h-[2px] bg-[#334155] kairo-crane-swing" />
                </div>
              ))}

              {Array.from({ length: Math.min(22, 8 + totalTrees) }).map((_, idx) => (
                <div
                  key={`kairo-tree-${idx}`}
                  className="absolute z-[20]"
                  style={{ left: `${27 + (idx % 8) * 8.6 + (Math.floor(idx / 8) % 2 ? 1.8 : 0)}%`, bottom: `${25 + Math.floor(idx / 8) * 4.8}%`, transform: `scale(${0.76 + (idx % 3) * 0.08})`, transformOrigin: 'bottom center' }}
                >
                  <div className="relative w-[10px] h-[14px]">
                    <div className="absolute left-[3px] bottom-0 w-[3px] h-[4px] bg-[#6b3d18]" />
                    <div className="absolute left-0 bottom-[3px] w-[10px] h-[7px] bg-[#2f7d3b] border border-black/25" />
                    <div className="absolute left-[2px] bottom-[8px] w-[6px] h-[4px] bg-[#7bc47f]" />
                  </div>
                </div>
              ))}

              {Array.from({ length: Math.min(16, 4 + totalLamps) }).map((_, idx) => (
                <div key={`kairo-lamp-${idx}`} className="absolute z-[26]" style={{ left: `${12 + idx * 5.2}%`, bottom: `${idx % 2 === 0 ? 20.4 : 38.9}%` }}>
                  <div className="relative w-[2px] h-[11px] bg-[#1f2937]">
                    <div
                      className="absolute left-[-2px] top-[-4px] w-[6px] h-[4px] border border-black/40"
                      style={{
                        backgroundColor: cityLightLevel > 0.28 ? '#fde68a' : '#d6c278',
                        opacity: cityLampHeadOpacity
                      }}
                    />
                    <div
                      className="absolute -left-[12px] -top-[14px] w-[26px] h-[26px] rounded-full bg-yellow-100/34 blur-[4px]"
                      style={{ opacity: cityLampGlowOpacity }}
                    />
                    <div
                      className="absolute -left-[22px] -top-[24px] w-[46px] h-[46px] rounded-full bg-yellow-100/24 blur-[10px]"
                      style={{ opacity: cityLampGlowOpacity * 0.92 }}
                    />
                    <div
                      className="absolute -left-[30px] -top-[32px] w-[62px] h-[62px] rounded-full bg-yellow-100/14 blur-[14px]"
                      style={{ opacity: citySoftHaloBoost * 0.72 }}
                    />
                  </div>
                </div>
              ))}

              {isTransportUnlocked && kairoTrafficVehicles.map((vehicle) => (
                <div
                  key={`kairo-car-${vehicle.id}`}
                  className={`absolute ${vehicle.direction}`}
                  style={{
                    bottom: `${vehicle.bottom}%`,
                    animationDelay: `${vehicle.delay}s`,
                    animationDuration: `${vehicle.duration}s`,
                    zIndex: vehicle.zIndex,
                    transform: `scale(${cityVehicleScale * vehicle.scaleFactor})`,
                    transformOrigin: 'center bottom'
                  }}
                >
                  <div className="relative w-[22px] h-[12px]">
                    <div className="absolute left-[2px] right-[2px] bottom-0 h-[2px] rounded-full bg-black/35" />
                    <div
                      className="absolute left-[1px] right-[1px] top-[2px] h-[7px] border border-black/70 rounded-[2px]"
                      style={{
                        background: `linear-gradient(180deg, rgba(255,255,255,0.28) 0%, ${['#2563eb', '#dc2626', '#f59e0b', '#0f766e', '#334155'][vehicle.colorIdx % 5]} 38%, rgba(15,23,42,0.32) 100%)`
                      }}
                    />
                    <div className="absolute left-[4px] right-[5px] top-0 h-[4px] rounded-[2px] border border-black/45 bg-gradient-to-b from-[#f8fbff] to-[#bcd5eb]" />
                    <div className="absolute left-[8px] top-[1px] w-[1px] h-[2px] bg-black/25" />
                    <div className="absolute left-[12px] top-[1px] w-[1px] h-[2px] bg-black/25" />
                    <div className="absolute left-[2px] top-[4px] w-[2px] h-[2px] bg-[#fde68a]" style={{ opacity: cityVehicleHeadDotOpacity }} />
                    <div className="absolute right-[2px] top-[4px] w-[2px] h-[2px] bg-[#fde68a]" style={{ opacity: cityVehicleHeadDotOpacity }} />
                    <div className="absolute left-[-1px] top-[2px] w-[7px] h-[5px] rounded-full bg-[#fde68a] blur-[2px]" style={{ opacity: cityVehicleLightOpacity * 0.78 }} />
                    <div className="absolute right-[-1px] top-[2px] w-[7px] h-[5px] rounded-full bg-[#fde68a] blur-[2px]" style={{ opacity: cityVehicleLightOpacity * 0.78 }} />
                    <div className="absolute left-[-3px] top-[2px] w-[8px] h-[5px] rounded-full bg-[#fef3c7] blur-[3px]" style={{ opacity: cityVehicleLightOpacity * 0.5 }} />
                    <div className="absolute right-[-3px] top-[2px] w-[8px] h-[5px] rounded-full bg-[#fef3c7] blur-[3px]" style={{ opacity: cityVehicleLightOpacity * 0.5 }} />
                    <div className="absolute left-[-6px] top-[1px] w-[10px] h-[6px] rounded-full bg-[#fefce8] blur-[5px]" style={{ opacity: citySoftHaloBoost * 0.34 }} />
                    <div className="absolute right-[-6px] top-[1px] w-[10px] h-[6px] rounded-full bg-[#fefce8] blur-[5px]" style={{ opacity: citySoftHaloBoost * 0.34 }} />
                    <div className="absolute left-[2px] bottom-[2px] w-[2px] h-[1px] bg-red-300/80 kairo-light-blink" style={{ opacity: cityVehicleTailDotOpacity }} />
                    <div className="absolute right-[2px] bottom-[2px] w-[2px] h-[1px] bg-red-300/80 kairo-light-blink" style={{ opacity: cityVehicleTailDotOpacity }} />
                    <div className="absolute left-[3px] right-[3px] bottom-[2px] h-[1px] bg-black/35" />
                    <div className="absolute left-[2px] -bottom-[2px] w-[5px] h-[3px] rounded-full border border-black/60 bg-[#0f172a]" />
                    <div className="absolute right-[2px] -bottom-[2px] w-[5px] h-[3px] rounded-full border border-black/60 bg-[#0f172a]" />
                    <div className="absolute left-[3px] -bottom-[1px] w-[3px] h-[1px] rounded-full bg-gray-400/65" />
                    <div className="absolute right-[3px] -bottom-[1px] w-[3px] h-[1px] rounded-full bg-gray-400/65" />
                  </div>
                </div>
              ))}

              {isTransportUnlocked && Array.from({ length: kairoServiceCount }).map((_, idx) => (
                <div
                  key={`kairo-service-${idx}`}
                  className="absolute kairo-drive-up"
                  style={{
                    bottom: `${38 + (idx % 2) * 0.3}%`,
                    animationDelay: `${idx * 1.2}s`,
                    animationDuration: `${10 + idx * 1.6}s`,
                    zIndex: 31,
                    transform: `scale(${cityVehicleScale})`,
                    transformOrigin: 'center bottom'
                  }}
                >
                  {(() => {
                    const serviceColor = ['#f97316', '#ef4444', '#22c55e', '#2563eb', '#64748b'][idx % 5];
                    return (
                  <div className="relative w-[26px] h-[13px]">
                    <div className="absolute left-[2px] right-[2px] bottom-0 h-[2px] rounded-full bg-black/35" />
                    <div
                      className="absolute left-[1px] right-[1px] top-[3px] h-[8px] border border-black/70 rounded-[2px]"
                      style={{ background: `linear-gradient(180deg, rgba(255,255,255,0.22) 0%, ${serviceColor} 42%, rgba(15,23,42,0.34) 100%)` }}
                    />
                    <div className="absolute left-[4px] top-[1px] w-[14px] h-[4px] rounded-[2px] border border-black/45 bg-gradient-to-b from-[#ebf4ff] to-[#c6d9ee]" />
                    <div className="absolute left-[3px] right-[3px] top-[6px] h-[1px] bg-[#fef3c7]/85" style={{ opacity: lightDisplayGate }} />
                    <div className="absolute left-[3px] right-[3px] top-[8px] h-[1px] bg-[#ef4444]/55" style={{ opacity: lightDisplayGate }} />
                    <div className="absolute left-[10px] -top-[1px] w-[8px] h-[2px] rounded-[1px] bg-[#e5e7eb] border border-black/40" />
                    <div className="absolute left-[13px] -top-[2px] w-[2px] h-[1px] rounded-[1px] bg-[#f8fafc] kairo-light-blink" style={{ opacity: cityServiceBeaconOpacity }} />
                    <div className="absolute left-[2px] top-[5px] w-[2px] h-[2px] bg-[#fde68a]" style={{ opacity: cityVehicleHeadDotOpacity }} />
                    <div className="absolute right-[2px] top-[5px] w-[2px] h-[2px] bg-[#fde68a]" style={{ opacity: cityVehicleHeadDotOpacity }} />
                    <div className="absolute left-[-1px] top-[3px] w-[7px] h-[5px] rounded-full bg-[#fde68a] blur-[2px]" style={{ opacity: cityVehicleLightOpacity * 0.78 }} />
                    <div className="absolute right-[-1px] top-[3px] w-[7px] h-[5px] rounded-full bg-[#fde68a] blur-[2px]" style={{ opacity: cityVehicleLightOpacity * 0.78 }} />
                    <div className="absolute left-[-3px] top-[3px] w-[8px] h-[5px] rounded-full bg-[#fef3c7] blur-[3px]" style={{ opacity: cityVehicleLightOpacity * 0.5 }} />
                    <div className="absolute right-[-3px] top-[3px] w-[8px] h-[5px] rounded-full bg-[#fef3c7] blur-[3px]" style={{ opacity: cityVehicleLightOpacity * 0.5 }} />
                    <div className="absolute left-[-6px] top-[2px] w-[10px] h-[6px] rounded-full bg-[#fefce8] blur-[5px]" style={{ opacity: citySoftHaloBoost * 0.34 }} />
                    <div className="absolute right-[-6px] top-[2px] w-[10px] h-[6px] rounded-full bg-[#fefce8] blur-[5px]" style={{ opacity: citySoftHaloBoost * 0.34 }} />
                    <div className="absolute left-[2px] bottom-[2px] w-[2px] h-[1px] bg-red-300/85 kairo-light-blink" style={{ opacity: cityVehicleTailDotOpacity }} />
                    <div className="absolute right-[2px] bottom-[2px] w-[2px] h-[1px] bg-red-300/85 kairo-light-blink" style={{ opacity: cityVehicleTailDotOpacity }} />
                    <div className="absolute left-[3px] -bottom-[2px] w-[5px] h-[3px] rounded-full border border-black/60 bg-[#0f172a]" />
                    <div className="absolute right-[3px] -bottom-[2px] w-[5px] h-[3px] rounded-full border border-black/60 bg-[#0f172a]" />
                    <div className="absolute left-[4px] -bottom-[1px] w-[3px] h-[1px] rounded-full bg-gray-400/65" />
                    <div className="absolute right-[4px] -bottom-[1px] w-[3px] h-[1px] rounded-full bg-gray-400/65" />
                  </div>
                    );
                  })()}
                </div>
              ))}

              {Array.from({ length: kairoCitizenCount }).map((_, idx) => (
                <div
                  key={`kairo-citizen-${idx}`}
                  className={`absolute ${idx % 2 === 0 ? 'kairo-walk-lr' : 'kairo-walk-rl'}`}
                  style={{ bottom: `${idx % 2 === 0 ? 21.1 : 40.5}%`, animationDelay: `${idx * 0.7}s`, animationDuration: `${8 + (idx % 4) * 1.3}s`, zIndex: 32 }}
                >
                  <div className="relative w-3 h-5">
                    <div className="absolute top-0 left-[2px] w-[8px] h-[4px] bg-[#f6c7a6] border border-black/50" />
                    <div className="absolute top-[3px] left-0 w-[12px] h-[7px] border border-black/50" style={{ backgroundColor: ['#1d4ed8', '#166534', '#7c3aed', '#9a3412', '#be123c'][idx % 5] }} />
                    <div className="absolute bottom-0 left-[1px] w-[3px] h-[5px] bg-black" />
                    <div className="absolute bottom-0 right-[1px] w-[3px] h-[5px] bg-black" />
                  </div>
                </div>
              ))}

              {isTransportUnlocked && hasTransitHub && (
                <div className="absolute inset-x-[31%] bottom-[57%] h-[2px] bg-[#64748b] border-y border-black/35 z-[36]">
                  <div
                    className="absolute kairo-monorail-run top-[-6px] w-[46px] h-[14px] border border-black/55 bg-[#f8fafc]"
                    style={{ transform: `scale(${cityVehicleScale})`, transformOrigin: 'left bottom' }}
                  >
                    <div className="absolute inset-x-0 top-0 h-[4px] bg-gradient-to-b from-white to-[#dbeafe]" />
                    <div className="absolute left-[3px] right-[3px] top-[3px] h-[5px] border border-black/35 bg-[#93c5fd]" />
                    <div className="absolute left-[11px] top-[3px] w-[1px] h-[5px] bg-[#5d7c9c]" />
                    <div className="absolute left-[19px] top-[3px] w-[1px] h-[5px] bg-[#5d7c9c]" />
                    <div className="absolute left-[27px] top-[3px] w-[1px] h-[5px] bg-[#5d7c9c]" />
                    <div className="absolute left-[35px] top-[3px] w-[1px] h-[5px] bg-[#5d7c9c]" />
                    <div className="absolute inset-x-[2px] bottom-[2px] h-[2px] bg-[#94a3b8]" />
                    <div className="absolute right-[-4px] top-[3px] w-0 h-0 border-y-[4px] border-y-transparent border-l-[4px] border-l-[#cbd5e1]" />
                  </div>
                </div>
              )}

              {hasHarbor && (
                <div className="absolute left-[8.5%] bottom-[9.5%] w-[10.4%] h-[14.8%] z-[28]">
                  <div className="absolute inset-0 border border-black/40 bg-[#8b5e34]" />
                  <div className="absolute left-[8%] right-[8%] top-[10%] bottom-[10%] border border-black/40 bg-[#b08968]" />
                  <div className="absolute left-[22%] top-[-36%] w-[2px] h-[36%] bg-[#f8fafc] border border-black/30" />
                  <div className="absolute left-[24%] top-[-33%] w-[20%] h-[12%] bg-[#facc15] border border-black/40" />
                </div>
              )}

              <div
                className="absolute inset-0 bg-[#0b1f56]/10 pointer-events-none z-[39]"
                style={{ opacity: 0.08 + nightDensity * 0.34 }}
              />
              <div className="absolute inset-0 pointer-events-none z-[39] kairo-night-bloom-pass">
                {kairoBuildingBloomSlots.map((slot) => (
                  <React.Fragment key={`kairo-building-bloom-${slot.id}`}>
                    <div
                      className="absolute rounded-full bg-yellow-100/46 blur-[10px]"
                      style={{
                        left: `${slot.left}%`,
                        bottom: `${slot.bottom}%`,
                        width: `${slot.width}%`,
                        height: `${slot.height}%`,
                        transform: 'translateX(-50%)',
                        opacity: slot.opacity,
                        boxShadow: `0 0 24px rgba(254,243,199,${(slot.opacity * 0.62).toFixed(2)})`
                      }}
                    />
                    <div
                      className="absolute rounded-full bg-yellow-100/26 blur-[14px]"
                      style={{
                        left: `${slot.left}%`,
                        bottom: `${slot.bottom}%`,
                        width: `${slot.width * 1.34}%`,
                        height: `${slot.height * 1.32}%`,
                        transform: 'translateX(-50%)',
                        opacity: slot.opacity * 0.56
                      }}
                    />
                  </React.Fragment>
                ))}
                {kairoAdvancedBloomSlots.map((slot) => (
                  <React.Fragment key={`kairo-advanced-bloom-${slot.id}`}>
                    <div
                      className="absolute rounded-full bg-yellow-100/40 blur-[10px]"
                      style={{
                        left: `${slot.left}%`,
                        bottom: `${slot.bottom}%`,
                        width: '11.6%',
                        height: '6.8%',
                        transform: 'translateX(-50%)',
                        opacity: slot.opacity
                      }}
                    />
                    <div
                      className="absolute rounded-full bg-yellow-100/24 blur-[14px]"
                      style={{
                        left: `${slot.left}%`,
                        bottom: `${slot.bottom}%`,
                        width: '16.4%',
                        height: '9.4%',
                        transform: 'translateX(-50%)',
                        opacity: slot.opacity * 0.62
                      }}
                    />
                  </React.Fragment>
                ))}
                {kairoLampBloomSlots.map((lamp) => (
                  <React.Fragment key={`kairo-lamp-bloom-${lamp.id}`}>
                    <div
                      className="absolute rounded-full bg-yellow-100/46 blur-[8px]"
                      style={{
                        left: `${lamp.left}%`,
                        bottom: `${lamp.bottom}%`,
                        width: '10.2%',
                        height: '7.4%',
                        transform: 'translateX(-50%)',
                        opacity: lamp.opacity
                      }}
                    />
                    <div
                      className="absolute rounded-full bg-yellow-100/28 blur-[12px]"
                      style={{
                        left: `${lamp.left}%`,
                        bottom: `${lamp.bottom}%`,
                        width: '16.2%',
                        height: '11.8%',
                        transform: 'translateX(-50%)',
                        opacity: lamp.opacity * 0.78
                      }}
                    />
                    <div
                      className="absolute rounded-full bg-yellow-100/16 blur-[16px]"
                      style={{
                        left: `${lamp.left}%`,
                        bottom: `${lamp.bottom}%`,
                        width: '21.8%',
                        height: '15.6%',
                        transform: 'translateX(-50%)',
                        opacity: lamp.opacity * 0.52
                      }}
                    />
                  </React.Fragment>
                ))}
                {isTransportUnlocked && kairoTrafficVehicles.map((vehicle) => (
                  <div
                    key={`kairo-car-bloom-${vehicle.id}`}
                    className={`absolute ${vehicle.direction}`}
                    style={{
                      bottom: `${vehicle.bottom}%`,
                      animationDelay: `${vehicle.delay}s`,
                      animationDuration: `${vehicle.duration}s`,
                      transform: `scale(${cityVehicleScale * vehicle.scaleFactor})`,
                      transformOrigin: 'center bottom'
                    }}
                  >
                    <div className="relative w-[22px] h-[12px]">
                      <div className="absolute left-[-5px] top-[1px] w-[11px] h-[7px] rounded-full bg-yellow-100/52 blur-[4px]" style={{ opacity: cityVehicleLightOpacity * 0.9 }} />
                      <div className="absolute right-[-5px] top-[1px] w-[11px] h-[7px] rounded-full bg-yellow-100/52 blur-[4px]" style={{ opacity: cityVehicleLightOpacity * 0.9 }} />
                      <div className="absolute left-[-8px] top-0 w-[16px] h-[10px] rounded-full bg-yellow-100/32 blur-[7px]" style={{ opacity: cityVehicleLightOpacity * 0.76 }} />
                      <div className="absolute right-[-8px] top-0 w-[16px] h-[10px] rounded-full bg-yellow-100/32 blur-[7px]" style={{ opacity: cityVehicleLightOpacity * 0.76 }} />
                      <div className="absolute left-[-12px] top-[-1px] w-[21px] h-[12px] rounded-full bg-yellow-100/18 blur-[10px]" style={{ opacity: citySoftHaloBoost * 0.6 }} />
                      <div className="absolute right-[-12px] top-[-1px] w-[21px] h-[12px] rounded-full bg-yellow-100/18 blur-[10px]" style={{ opacity: citySoftHaloBoost * 0.6 }} />
                      <div className="absolute left-[-1px] bottom-[-1px] w-[6px] h-[4px] rounded-full bg-red-200/48 blur-[3px]" style={{ opacity: cityVehicleLightOpacity * 0.7 }} />
                      <div className="absolute right-[-1px] bottom-[-1px] w-[6px] h-[4px] rounded-full bg-red-200/48 blur-[3px]" style={{ opacity: cityVehicleLightOpacity * 0.7 }} />
                    </div>
                  </div>
                ))}
                {isTransportUnlocked && Array.from({ length: kairoServiceCount }).map((_, idx) => (
                  <div
                    key={`kairo-service-bloom-${idx}`}
                    className="absolute kairo-drive-up"
                    style={{
                      bottom: `${38 + (idx % 2) * 0.3}%`,
                      animationDelay: `${idx * 1.2}s`,
                      animationDuration: `${10 + idx * 1.6}s`,
                      transform: `scale(${cityVehicleScale})`,
                      transformOrigin: 'center bottom'
                    }}
                  >
                    <div className="relative w-[26px] h-[13px]">
                      <div className="absolute left-[-5px] top-[2px] w-[12px] h-[7px] rounded-full bg-yellow-100/52 blur-[4px]" style={{ opacity: cityVehicleLightOpacity * 0.9 }} />
                      <div className="absolute right-[-5px] top-[2px] w-[12px] h-[7px] rounded-full bg-yellow-100/52 blur-[4px]" style={{ opacity: cityVehicleLightOpacity * 0.9 }} />
                      <div className="absolute left-[-8px] top-[1px] w-[17px] h-[10px] rounded-full bg-yellow-100/32 blur-[7px]" style={{ opacity: cityVehicleLightOpacity * 0.76 }} />
                      <div className="absolute right-[-8px] top-[1px] w-[17px] h-[10px] rounded-full bg-yellow-100/32 blur-[7px]" style={{ opacity: cityVehicleLightOpacity * 0.76 }} />
                      <div className="absolute left-[-12px] top-0 w-[22px] h-[12px] rounded-full bg-yellow-100/18 blur-[10px]" style={{ opacity: citySoftHaloBoost * 0.6 }} />
                      <div className="absolute right-[-12px] top-0 w-[22px] h-[12px] rounded-full bg-yellow-100/18 blur-[10px]" style={{ opacity: citySoftHaloBoost * 0.6 }} />
                      <div className="absolute left-[0px] bottom-0 w-[6px] h-[4px] rounded-full bg-red-200/48 blur-[3px]" style={{ opacity: cityVehicleLightOpacity * 0.7 }} />
                      <div className="absolute right-[0px] bottom-0 w-[6px] h-[4px] rounded-full bg-red-200/48 blur-[3px]" style={{ opacity: cityVehicleLightOpacity * 0.7 }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="absolute top-2 left-2 px-2 py-1 bg-black/62 border border-white/70 text-[11px] z-[40]">
                CITY LV {unlockedMilestones.length}
              </div>
              <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 border border-white/70 text-[11px] text-right z-[40] max-w-[68%]">
                <div className="text-yellow-200 truncate">{villagePhaseLabel}</div>
                <div className="truncate">{latestMilestone ? latestMilestone.title : '次は始まりの看板'}</div>
                <div className="text-gray-300">人口 {kairoPopulation} / 雇用 {kairoJobs}</div>
                <div className="text-gray-300">交通 {Math.min(99, 30 + kairoTrafficVehicles.length * 4)}% / 満足 {kairoSatisfaction}%</div>
                <div className="text-gray-300">拡張 {advancedDevelopmentCount}/{advancedDevelopmentTotal}</div>
                <div className="text-gray-300">時刻 {villageClockLabel} / 夜度 {Math.round(cityLightLevel * 100)}%</div>
              </div>

              <div className="absolute left-1/2 -translate-x-1/2 bottom-11 z-[40] px-3 py-1 border border-white/70 bg-black/62 text-[11px] text-center min-w-[200px]">
                税収 {villageTaxLabel} ・ 住居 {totalHouses} ・ 中層 {totalMidrise} ・ 高層 {totalHighrise}
              </div>

              <div className="absolute right-[2px] bottom-[2px] z-[41] flex items-end gap-2">
                <div className="p-[3px] rounded-[4px] bg-black/70 border border-white/70 kairo-pin-bob">
                  <PixelCharacter type={villagerCharType} size={28} />
                </div>
                <div className="relative max-w-[190px] px-2 py-1 border border-black/70 bg-[#f8fafc]/95 rounded-[5px] text-[11px] leading-snug text-[#111827]">
                  <div className="absolute left-[-5px] bottom-[7px] w-[8px] h-[8px] bg-[#f8fafc] border-l border-b border-black/70 rotate-45" />
                  <div className="relative">
                    <div className="text-[10px] text-[#7c2d12] mb-[2px]">{villagerName}</div>
                    <div>{villagerComment}</div>
                  </div>
                </div>
              </div>
            </div>

            {!isCityOnlyZoom && (
              <>
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/55 border border-white/70 text-[11px] z-[180]">
                  Village Lv {unlockedMilestones.length}
                </div>
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/55 border border-white/70 text-[11px] text-right z-[180] max-w-[65%]">
                  <div className="text-yellow-200 truncate">{villagePhaseLabel}</div>
                  <div className="truncate">{latestMilestone ? latestMilestone.title : "次は始まりの看板"}</div>
                  <div className="text-gray-300">住居{totalHouses}・中層{totalMidrise}・高層{totalHighrise}</div>
                  <div className="text-gray-300">交通{totalCars + totalServiceVehicles}・公共{totalFacilities}・農地{totalFields}</div>
                  <div className="text-gray-300">{phaseProgress}% ・ 時刻 {villageClockLabel}</div>
                </div>
              </>
            )}

            </div>
          </div>
        </DqWindow>

        <DqWindow title="むらの はってん ようす">
          <div className="space-y-2 mt-2">
            <div className="p-2 border-[2px] border-white/60 bg-black/40 rounded-[4px]">
              <div className="text-[13px]">
                現在段階: <span className="text-yellow-200">{villagePhaseLabel}</span>
              </div>
              <div className="text-[11px] text-gray-300 mt-1">
                次の目標: {nextMilestone ? `${Math.floor(nextMilestone.threshold / 10000)}万G で ${nextMilestone.title}` : "すべての発展イベントを達成しました"}
              </div>
              <div className="fc-progress mt-2">
                <div className="fc-progress-fill bg-emerald-400" style={{ width: `${phaseProgress}%` }} />
              </div>
              <div className="text-[11px] text-right text-gray-300 mt-1">{phaseProgress}%</div>
              <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-gray-200">
                <div className="border border-white/20 px-1 py-[2px] bg-black/25">人口: {Math.max(24, totalHouses * 4 + totalMidrise * 18 + totalHighrise * 36)}人</div>
                <div className="border border-white/20 px-1 py-[2px] bg-black/25">雇用: {Math.max(12, totalFacilities * 22 + totalMidrise * 6)}枠</div>
                <div className="border border-white/20 px-1 py-[2px] bg-black/25">交通量: {totalCars + totalServiceVehicles}/{Math.max(12, totalMidrise + totalHighrise * 2 + 10)}</div>
                <div className="border border-white/20 px-1 py-[2px] bg-black/25">公共満足: {Math.min(99, 42 + unlockedMilestones.length * 2)}%</div>
              </div>
            </div>

            <div className="p-2 border-[2px] border-white/60 bg-black/30 rounded-[4px]">
              <div className="text-[12px] text-yellow-200 mb-1">直近の発展イベント</div>
              <div className="space-y-1 max-h-[92px] overflow-y-auto custom-scrollbar pr-1">
                {recentUnlockedMilestones.length > 0 ? recentUnlockedMilestones.map((item) => (
                  <div key={`recent-${item.threshold}`} className="text-[11px]">
                    <span className="text-gray-300">{Math.floor(item.threshold / 10000)}万G:</span> {item.title}
                  </div>
                )) : (
                  <div className="text-[11px] text-gray-300">まだ発展イベントがありません</div>
                )}
              </div>
            </div>

            <div className="p-2 border-[2px] border-white/60 bg-black/25 rounded-[4px]">
              <div className="text-[12px] text-yellow-200 mb-1">発展チェック (5万〜{Math.floor(MAX_VILLAGE_PROFIT_TARGET / 10000)}万)</div>
              <div className="space-y-1 max-h-[150px] overflow-y-auto custom-scrollbar pr-1">
                {VILLAGE_MILESTONES.map((item, idx) => {
                  const unlocked = isMilestoneUnlocked(item.threshold);
                  return (
                    <div key={`check-${item.threshold}`} className={`text-[11px] px-1 py-[2px] border ${unlocked ? "border-yellow-300/55 bg-yellow-500/10 text-yellow-100" : "border-white/20 bg-black/20 text-gray-400"}`}>
                      <span className="inline-block w-[16px] text-center">{unlocked ? "済" : "未"}</span>
                      <span className="mr-1">{idx + 1}.</span>
                      <span className="mr-1">{Math.floor(item.threshold / 10000)}万</span>
                      <span>{item.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {visibleVillageContributors.length > 0 ? visibleVillageContributors.map((entry) => (
              <div key={`village-${entry.userName}`} className="p-2 border-[2px] border-white/60 bg-black/40 rounded-[4px]">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`p-1 rounded-[4px] shrink-0 ${getBgColorByLevel(entry.charInfo.level)} ${getBorderClassByLevel(entry.charInfo.level)}`}>
                      <PixelCharacter type={entry.charInfo.charType} size={28} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[14px] font-bold truncate">{entry.userName}</div>
                      <div className="text-[11px] text-gray-300">利益 {formatG(entry.profit)} / 発展 {entry.points}pt</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-yellow-200 text-right whitespace-nowrap">
                    <div>家 {entry.houses}</div>
                    <div>施設 {entry.facilities} 乗り物 {entry.vehicles}</div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-[3px]">
                  {Array.from({ length: Math.min(12, entry.points) }).map((_, idx) => (
                    <div key={`pt-${entry.userName}-${idx}`} className="w-2 h-2 bg-yellow-300 border border-black" />
                  ))}
                  {entry.points > 12 && <span className="text-[11px] text-gray-300">+{entry.points - 12}</span>}
                  {entry.points === 0 && <span className="text-[11px] text-gray-300">まだ発展ポイントがありません</span>}
                </div>
              </div>
            )) : (
              <div className="p-2 border-[2px] border-white/40 bg-black/25 rounded-[4px] text-[11px] text-gray-300">
                利益がまだ記録されていません
              </div>
            )}
          </div>
        </DqWindow>
      </div>
    );
  };
  return _renderVillage();
};

export default VillageScreen;
