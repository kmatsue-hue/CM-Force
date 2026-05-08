import React, { useState, useEffect, useRef } from 'react';
import {
  STARTUP_POP_STORAGE_KEY,
  VILLAGE_PROFIT_UNIT,
  TRANSPORT_UNLOCK_PROFIT_THRESHOLD,
  STATUE_PROFIT_THRESHOLD,
  PROFIT_G_PER_COIN,
  PROFIT_COINS_PER_BUNDLE,
  ADVANCED_VILLAGE_MILESTONE_START,
  ADVANCED_VILLAGE_MILESTONE_STEP,
} from './quest/data/constants.js';
import {
  CUTE_CHARACTER_PIXELS,
  PIXEL_ARTS,
  CLASS_FEATURE_OVERLAYS,
  TREASURE_VAULT_ART,
  ACTION_BADGE_ARTS,
} from './quest/data/pixelArt.js';
import {
  JAPAN_MAP_PIXELS,
  MAP_COLORS,
  MAP_COORDS,
  AREA_TO_MAP_CODE,
  AREA_LABELS,
  PREF_TO_AREA,
} from './quest/data/japanMap.js';
import {
  USERS_MASTER,
  USER_ACCOUNT_PROFILES,
  MAP_CSV_SORT_OPTIONS,
  CHAR_CLASSES,
} from './quest/data/users.js';
import {
  INITIAL_USER,
  INITIAL_KPI,
  INITIAL_CLIENTS,
  INITIAL_LOGS,
  ACTIONS,
} from './quest/data/initialState.js';
import {
  ADVANCED_VILLAGE_DEVELOPMENTS,
  VILLAGE_MILESTONES,
  MAX_VILLAGE_PROFIT_TARGET,
} from './quest/data/villageMilestones.js';
import DqWindow from './quest/ui/DqWindow.jsx';
import DqCommand from './quest/ui/DqCommand.jsx';
import ProgressBar from './quest/ui/ProgressBar.jsx';
import PixelCharacter from './quest/ui/PixelCharacter.jsx';
import PixelActionBadge from './quest/ui/PixelActionBadge.jsx';
import { formatG, formatId, getActionBadgeType } from './quest/utils/format.js';
import { escapeCsvField, parseCsvLine, parseCsvRows } from './quest/utils/csv.js';
import questStyles from './quest/styles/questStyles.js';
import { useRetroAudio } from './quest/audio/useRetroAudio.js';
import { getBorderClassByLevel, getBgColorByLevel } from './quest/utils/userLevel.js';
import {
  DAY_CYCLE_MS,
  clamp01,
  hexToRgb,
  rgbToHex,
  mixHex,
  blendDaySunsetNight,
  smooth01,
  range01,
} from './quest/utils/colorMath.js';
import UserProfileModal from './quest/screens/UserProfileModal.jsx';
import GuildScreen from './quest/screens/GuildScreen.jsx';
import MapScreen from './quest/screens/MapScreen.jsx';
import HomeScreen from './quest/screens/HomeScreen.jsx';
import VillageScreen from './quest/screens/VillageScreen.jsx';



export default function KaientaiQuest() {
  const [currentScreen, setCurrentScreen] = useState('home'); 
  const [guildTab, setGuildTab] = useState('sales'); 
  const [mapZoom, setMapZoom] = useState(1);
  const [villageZoom, setVillageZoom] = useState(0.9);
  const [user, setUser] = useState(INITIAL_USER);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCharType, setEditCharType] = useState("");
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [kpi, setKpi] = useState(INITIAL_KPI);
  const [clients, setClients] = useState(INITIAL_CLIENTS);
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [mapCsvSort, setMapCsvSort] = useState("all");
  const [editProgress, setEditProgress] = useState(null); // 進捗編集用のステート
  const [popup, setPopup] = useState({ show: false, message: "", isHighlight: false });
  const [dayCycleNow, setDayCycleNow] = useState(() => Date.now());
  const timerRef = useRef(null);
  const { playRetroBgm, playInputSe, playPopupSe } = useRetroAudio();
  const prevPopupShownRef = useRef(false);

  // 選択されたクライアントが変わったら、編集用ステートにコピー
  useEffect(() => {
    if (selectedClientId) {
      const client = clients.find(c => String(c.id) === selectedClientId);
      if (client) {
        setEditProgress({ ...client.progress, profit: client.profit || 0 });
      }
    } else {
      setEditProgress(null);
    }
  }, [selectedClientId, clients]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setDayCycleNow(Date.now());
    }, 240);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let saved = null;
    try {
      const raw = localStorage.getItem(STARTUP_POP_STORAGE_KEY);
      saved = raw ? JSON.parse(raw) : null;
    } catch {
      saved = null;
    }
    if (!saved?.message) return;

    setPopup({ show: true, message: saved.message, isHighlight: true });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setPopup({ show: false, message: "", isHighlight: false }), 4500);
    playRetroBgm();

    try {
      localStorage.removeItem(STARTUP_POP_STORAGE_KEY);
    } catch {
      // ignore localStorage errors
    }
  }, []);

  useEffect(() => {
    const handleFirstInteraction = () => {
      playRetroBgm();
    };

    window.addEventListener("pointerdown", handleFirstInteraction);
    window.addEventListener("keydown", handleFirstInteraction);
    return () => {
      window.removeEventListener("pointerdown", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };
  }, []);

  useEffect(() => {
    const handleInputSound = (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) return;
      if (target instanceof HTMLInputElement && target.type === "file") return;
      playInputSe();
    };

    window.addEventListener("input", handleInputSound, true);
    window.addEventListener("change", handleInputSound, true);
    return () => {
      window.removeEventListener("input", handleInputSound, true);
      window.removeEventListener("change", handleInputSound, true);
    };
  }, []);

  useEffect(() => {
    if (popup.show && !prevPopupShownRef.current) {
      playPopupSe(popup.isHighlight);
    }
    prevPopupShownRef.current = popup.show;
  }, [popup.show, popup.isHighlight]);


  const getCharInfo = (userName) => {
    if (userName === user.name) {
      return { id: user.id, charType: user.charType, className: user.className, level: user.level };
    }
    return USERS_MASTER[userName] || { id: 999, charType: 'hero', className: 'みならい', level: 1 };
  };


  const dayCycleProgress = ((dayCycleNow % DAY_CYCLE_MS) + DAY_CYCLE_MS) % DAY_CYCLE_MS / DAY_CYCLE_MS;
  const villageHour = dayCycleProgress * 24;
  const dawnRise = smooth01(range01(villageHour, 4.5, 8));
  const duskFall = smooth01(range01(villageHour, 16, 20.5));
  const preDawnDark = 1 - smooth01(range01(villageHour, 4.5, 7.2));
  const nightDensity = villageHour >= 12 ? duskFall : preDawnDark;
  const twilightWarmth = villageHour >= 12
    ? smooth01(range01(villageHour, 16, 19.3)) * (1 - smooth01(range01(villageHour, 19.3, 21.6)))
    : 0;
  const isEveningToMidnight = villageHour >= 16 && villageHour < 24;
  const cityLightLevel = clamp01(
    isEveningToMidnight
      ? smooth01(range01(villageHour, 16.2, 20.8)) * (1 - smooth01(range01(villageHour, 23.2, 24)))
      : 0
  );
  const lightDisplayGate = isEveningToMidnight ? 1 : 0;
  const villageStageBrightness = Math.max(0.56, Math.min(1.1, 1.08 - nightDensity * 0.43 + dawnRise * 0.04));
  const villageStageSaturation = Math.max(0.82, Math.min(1.16, 0.97 + twilightWarmth * 0.15 - nightDensity * 0.08));
  const isCityWindowLit = (seed, bonus = 0) => {
    if (!isEveningToMidnight) return false;
    const threshold = 16 + cityLightLevel * 76 + bonus;
    return Math.abs(seed * 37 + 17) % 100 < threshold;
  };

  const handleSaveProfile = () => {
    if (!editName.trim()) {
      alert("なまえを いれてください。");
      return;
    }
    const selectedClass = CHAR_CLASSES.find(c => c.type === editCharType) || CHAR_CLASSES[0];
    
    if (user.name !== editName.trim()) {
      const updatedLogs = logs.map(log => 
        log.userName === user.name ? { ...log, userName: editName.trim() } : log
      );
      setLogs(updatedLogs);
      setClients(prevClients =>
        prevClients.map(client =>
          client.owner === user.name ? { ...client, owner: editName.trim() } : client
        )
      );
    }
  
    setUser({
      ...user,
      name: editName.trim(),
      charType: editCharType,
      className: selectedClass.name
    });
    setIsEditingProfile(false);
  };

  // CSVファイルアップロード処理
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const rows = parseCsvRows(text);
      const data = {};
      const importHeaderCandidates = new Set([
        "エリア(施設都道府県)",
        "エリア",
        "都道府県",
        "地域",
        "販売店名",
        "販売店",
        "ディーラー名",
        "代理店名",
        "しせつ(施設名)",
        "施設名",
        "施設",
        "担当者名(営業担当者名)",
        "担当者名",
        "営業担当",
        "担当者",
        "ヒアリング(件数)",
        "ヒアリング",
        "見積もり(件数)",
        "見積もり",
        "契約(件数)",
        "契約",
        "利益(円)",
        "利益",
        "りえき"
      ]);
      const headerRow = rows[0] || [];
      const hasHeaderRow = headerRow.some((cell) => importHeaderCandidates.has(cell));

      if (hasHeaderRow) {
        const firstDataRow = rows.slice(1).find((row) => row.some((cell) => cell !== "")) || [];
        headerRow.forEach((header, idx) => {
          if (!header) return;
          data[header] = String(firstDataRow[idx] ?? "").trim();
        });
      } else {
        rows.forEach((row) => {
          if (row.length < 2) return;
          const key = String(row[0] ?? "").trim();
          if (!key) return;
          data[key] = String(row[1] ?? "").trim();
        });
      }

      const getCsvValue = (...keys) => {
        for (const key of keys) {
          if (Object.prototype.hasOwnProperty.call(data, key) && String(data[key]).trim() !== "") {
            return String(data[key]).trim();
          }
        }
        return "";
      };

      const rawArea = getCsvValue(
        "エリア(施設都道府県)",
        "エリア",
        "都道府県",
        "地域"
      );
      const areaName = PREF_TO_AREA[rawArea] || '関東';
      const csvUserName = getCsvValue(
        "担当者名(営業担当者名)",
        "担当者名",
        "営業担当",
        "担当者"
      ) || user.name;
      const csvClientName = getCsvValue(
        "しせつ(施設名)",
        "施設名",
        "施設"
      ) || "ななしのしせつ";
      const csvDealerName = getCsvValue(
        "販売店名",
        "販売店",
        "ディーラー名",
        "代理店名"
      );
      const csvHearing = parseInt(getCsvValue(
        "ヒアリング(件数)",
        "ヒアリング"
      ) || "0", 10) || 0;
      const csvEstimate = parseInt(getCsvValue(
        "見積もり(件数)",
        "見積もり"
      ) || "0", 10) || 0;
      const csvContract = parseInt(getCsvValue(
        "契約(件数)",
        "契約"
      ) || "0", 10) || 0;
      const csvProfit = parseInt(getCsvValue(
        "利益(円)",
        "利益",
        "りえき"
      ) || "0", 10) || 0;
      
      const newClient = {
        id: Date.now(),
        name: csvClientName,
        dealerName: csvDealerName,
        status: '未着手',
        owner: csvUserName,
        area: areaName,
        progress: {
          hearing: csvHearing,
          estimate: csvEstimate,
          contract: csvContract,
        },
        profit: csvProfit,
      };

      if (newClient.progress.contract > 0) newClient.status = "契約済み";
      else if (newClient.progress.estimate > 0) newClient.status = "見積もり中";
      else if (newClient.progress.hearing > 0) newClient.status = "ヒアリング中";
      
      // ログと報酬の処理
      let expGained = 0;
      let goldGained = 0;
      let newLogs = [];
      let kpiUpdates = { ...kpi };
      const dateStr = new Date().toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });

      newLogs.push({
        id: Date.now() + 5,
        date: dateStr,
        userName: csvUserName,
        clientName: newClient.name,
        area: newClient.area,
        actionType: "クエスト追加",
        earnedExp: 0,
        sales: 0,
        profit: 0
      });

      if (newClient.progress.hearing > 0) {
        expGained += newClient.progress.hearing * ACTIONS.HEARING.exp;
        goldGained += newClient.progress.hearing * ACTIONS.HEARING.gold;
        kpiUpdates.hearing.current += newClient.progress.hearing;
        newLogs.push({ id: Date.now() + 1, date: dateStr, userName: csvUserName, clientName: newClient.name, area: newClient.area, actionType: "ヒアリング", earnedExp: newClient.progress.hearing * ACTIONS.HEARING.exp, sales: 0, profit: 0 });
      }
      if (newClient.progress.estimate > 0) {
        expGained += newClient.progress.estimate * ACTIONS.ESTIMATE.exp;
        goldGained += newClient.progress.estimate * ACTIONS.ESTIMATE.gold;
        kpiUpdates.estimate.current += newClient.progress.estimate;
        newLogs.push({ id: Date.now() + 2, date: dateStr, userName: csvUserName, clientName: newClient.name, area: newClient.area, actionType: "見積もり", earnedExp: newClient.progress.estimate * ACTIONS.ESTIMATE.exp, sales: newClient.progress.estimate * ACTIONS.ESTIMATE.baseSales, profit: 0 });
      }
      if (newClient.progress.contract > 0) {
        expGained += newClient.progress.contract * ACTIONS.CONTRACT.exp;
        goldGained += newClient.progress.contract * ACTIONS.CONTRACT.gold;
        kpiUpdates.contract.current += newClient.progress.contract;
        newLogs.push({ id: Date.now() + 3, date: dateStr, userName: csvUserName, clientName: newClient.name, area: newClient.area, actionType: "契約", earnedExp: newClient.progress.contract * ACTIONS.CONTRACT.exp, sales: newClient.progress.contract * ACTIONS.CONTRACT.baseSales, profit: newClient.profit > 0 ? newClient.profit : 0 });
      } else if (newClient.profit > 0) {
        newLogs.push({ id: Date.now() + 4, date: dateStr, userName: csvUserName, clientName: newClient.name, area: newClient.area, actionType: "利益更新", earnedExp: 0, sales: 0, profit: newClient.profit });
      }

      setClients(prev => [...prev, newClient]);
      setLogs(prev => [...newLogs.reverse(), ...prev]);
      setKpi(kpiUpdates);

      let msg = `${csvUserName} が あたらしいクエスト\n「${newClient.name}」を ついかしました！`;
      let shouldPlayCelebration = false;

      // 現在のユーザー自身が取り込んだCSVの場合は経験値とゴールドを反映
      if (csvUserName === user.name) {
        let newExp = user.exp + expGained;
        let newLevel = Math.floor(newExp / 100) + 1;
        let isLevelUp = newLevel > user.level;
        let newNextExp = newLevel * 100;

        setUser({ ...user, exp: newExp, gold: user.gold + goldGained, level: newLevel, nextExp: newNextExp });

        if (expGained > 0) msg += `\n\nけいけんち ${expGained} を かくとく！\n${goldGained}ゴールド を てにいれた！`;
        if (isLevelUp) msg += `\n\n${user.name}の レベルが\n${newLevel} に あがった！`;
        shouldPlayCelebration = expGained > 0 || isLevelUp;
      } else {
        if (expGained > 0) msg += `\n\n${csvUserName}は ギルドで\nおおきな こうけんを しました！`;
      }

      setSelectedClientId(String(newClient.id)); 
      
      setPopup({ show: true, message: msg, isHighlight: true });
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setPopup({ show: false, message: "", isHighlight: false }), 4000);

      if (shouldPlayCelebration) {
        playRetroBgm();
        try {
          localStorage.setItem(STARTUP_POP_STORAGE_KEY, JSON.stringify({
            message: `さいかいボーナス！\n\n${msg}`,
            createdAt: Date.now()
          }));
        } catch {
          // localStorage error is non-fatal
        }
      }
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  // 進捗報告をギルドに反映
  const handleReport = () => {
    const client = clients.find(c => String(c.id) === selectedClientId);
    if (!client) return;

    const diffHearing = editProgress.hearing - client.progress.hearing;
    const diffEstimate = editProgress.estimate - client.progress.estimate;
    const diffContract = editProgress.contract - client.progress.contract;
    const diffProfit = editProgress.profit - client.profit;

    if (diffHearing === 0 && diffEstimate === 0 && diffContract === 0 && diffProfit === 0) {
      setPopup({ show: true, message: "しんちょくに へんかは ありません。", isHighlight: false });
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setPopup({ show: false, message: "", isHighlight: false }), 2000);
      return;
    }

    let expGained = 0;
    let goldGained = 0;
    let newLogs = [];
    let kpiUpdates = { ...kpi };

    const dateStr = new Date().toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });

    kpiUpdates.hearing.current = Math.max(0, kpiUpdates.hearing.current + diffHearing);
    kpiUpdates.estimate.current = Math.max(0, kpiUpdates.estimate.current + diffEstimate);
    kpiUpdates.contract.current = Math.max(0, kpiUpdates.contract.current + diffContract);

    // プラスの差分がある場合に、報酬ログを追加
    if (diffHearing > 0) {
      expGained += diffHearing * ACTIONS.HEARING.exp;
      goldGained += diffHearing * ACTIONS.HEARING.gold;
      newLogs.push({ id: Date.now() + 1, date: dateStr, userName: user.name, clientName: client.name, area: client.area, actionType: "ヒアリング", earnedExp: diffHearing * ACTIONS.HEARING.exp, sales: 0, profit: 0 });
    }
    if (diffEstimate > 0) {
      expGained += diffEstimate * ACTIONS.ESTIMATE.exp;
      goldGained += diffEstimate * ACTIONS.ESTIMATE.gold;
      newLogs.push({ id: Date.now() + 2, date: dateStr, userName: user.name, clientName: client.name, area: client.area, actionType: "見積もり", earnedExp: diffEstimate * ACTIONS.ESTIMATE.exp, sales: diffEstimate * ACTIONS.ESTIMATE.baseSales, profit: 0 });
    }
    if (diffContract > 0) {
      expGained += diffContract * ACTIONS.CONTRACT.exp;
      goldGained += diffContract * ACTIONS.CONTRACT.gold;
      newLogs.push({ id: Date.now() + 3, date: dateStr, userName: user.name, clientName: client.name, area: client.area, actionType: "契約", earnedExp: diffContract * ACTIONS.CONTRACT.exp, sales: diffContract * ACTIONS.CONTRACT.baseSales, profit: diffProfit > 0 ? diffProfit : 0 });
    } else if (diffProfit > 0) {
       newLogs.push({ id: Date.now() + 4, date: dateStr, userName: user.name, clientName: client.name, area: client.area, actionType: "利益更新", earnedExp: 0, sales: 0, profit: diffProfit });
    }

    // 差分がすべてマイナス/ゼロの場合も、履歴として残す
    if (diffHearing <= 0 && diffEstimate <= 0 && diffContract <= 0 && diffProfit <= 0) {
       newLogs.push({ id: Date.now() + 5, date: dateStr, userName: user.name, clientName: client.name, area: client.area, actionType: "記録なし", earnedExp: 0, sales: 0, profit: diffProfit });
    }

    // レベル更新
    let newExp = user.exp + expGained;
    let newLevel = Math.floor(newExp / 100) + 1;
    let isLevelUp = newLevel > user.level;
    let newNextExp = newLevel * 100;

    setUser({ ...user, exp: newExp, gold: user.gold + goldGained, level: newLevel, nextExp: newNextExp });
    setKpi(kpiUpdates);
    setLogs([...newLogs.reverse(), ...logs]);

    // クライアントの状態を更新
    let nextStatus = client.status;
    if (editProgress.contract > 0) nextStatus = "契約済み";
    else if (editProgress.estimate > 0) nextStatus = "見積もり中";
    else if (editProgress.hearing > 0) nextStatus = "ヒアリング中";

    const updatedClients = clients.map(c => 
      String(c.id) === String(client.id) 
      ? { ...c, owner: c.owner || user.name, status: nextStatus, progress: { hearing: editProgress.hearing, estimate: editProgress.estimate, contract: editProgress.contract }, profit: editProgress.profit }
      : c
    );
    setClients(updatedClients);

    let msg = "";
    if (expGained > 0 || diffProfit > 0) {
      msg = `${user.name}は ほうこくを まとめた！\n\nけいけんち ${expGained} を かくとく！\n${goldGained}ゴールド を てにいれた！`;
      if (diffProfit > 0 && diffContract > 0) msg += `\n\n${formatG(diffProfit)} の りえきを\nせいやくで かくとく！`;
      else if (diffProfit > 0) msg += `\n\n${formatG(diffProfit)} の りえきを\nついかで かくとく！`;
      if (isLevelUp) msg += `\n\n${user.name}の レベルが\n${newLevel} に あがった！`;
    } else {
      msg = `${user.name}は きろくを\nただしく しゅうせいした！`;
    }

    setPopup({ show: true, message: msg, isHighlight: isLevelUp || diffProfit > 0 });

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setPopup({ show: false, message: "", isHighlight: false });
    }, 4500); 
  };

  const latestClientOwnerMap = logs.reduce((map, log) => {
    if (log.clientName && !map.has(log.clientName)) {
      map.set(log.clientName, log.userName);
    }
    return map;
  }, new Map());

  const resolveClientOwnerName = (client) => client.owner || latestClientOwnerMap.get(client.name) || user.name;

  const getUserAccountProfile = (userName) => {
    const charInfo = getCharInfo(userName);
    const knownProfile = USER_ACCOUNT_PROFILES[userName];
    const account = knownProfile?.account || `char-${String(charInfo.id).padStart(3, '0')}-${charInfo.charType}@kaientai.local`;
    const fullName = knownProfile?.fullName || userName;
    return { account, fullName };
  };

  const sortClientsByMode = (sourceClients, mode) => {
    const list = [...sourceClients];
    if (mode === "project") {
      return list.sort((a, b) =>
        String(a.area || "").localeCompare(String(b.area || ""), 'ja') ||
        String(a.name || "").localeCompare(String(b.name || ""), 'ja') ||
        Number(a.id) - Number(b.id)
      );
    }
    if (mode === "owner") {
      return list.sort((a, b) =>
        resolveClientOwnerName(a).localeCompare(resolveClientOwnerName(b), 'ja') ||
        String(a.name || "").localeCompare(String(b.name || ""), 'ja') ||
        Number(a.id) - Number(b.id)
      );
    }
    return list.sort((a, b) => Number(a.id) - Number(b.id));
  };

  const handleExportClientsCsv = () => {
    const sortedClients = sortClientsByMode(clients, mapCsvSort);
    if (sortedClients.length === 0) {
      setPopup({ show: true, message: "しゅつりょく できる けんが ありません。", isHighlight: false });
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setPopup({ show: false, message: "", isHighlight: false }), 2500);
      return;
    }

    const header = [
      "エリア(施設都道府県)",
      "販売店名",
      "しせつ(施設名)",
      "ヒアリング(件数)",
      "見積もり(件数)",
      "契約(件数)",
      "利益(円)",
      "キャラクターアカウント情報",
      "担当者フルネーム"
    ];

    const rows = sortedClients.map((client) => {
      const ownerName = resolveClientOwnerName(client);
      const profile = getUserAccountProfile(ownerName);
      return [
        client.area || "",
        client.dealerName || "",
        client.name || "",
        Number(client.progress?.hearing) || 0,
        Number(client.progress?.estimate) || 0,
        Number(client.progress?.contract) || 0,
        Number(client.profit) || 0,
        profile.account,
        profile.fullName
      ];
    });

    const csvText = [header, ...rows]
      .map((row) => row.map(escapeCsvField).join(","))
      .join("\r\n");

    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    const blob = new Blob(["\uFEFF", csvText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `quest_export_${mapCsvSort}_${stamp}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    setPopup({ show: true, message: `CSVを しゅつりょくしました。\nけんすう: ${rows.length}件`, isHighlight: false });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setPopup({ show: false, message: "", isHighlight: false }), 2500);
  };

  const dashboardData = logs.reduce((acc, log) => {
    if (!acc.users[log.userName]) acc.users[log.userName] = { sales: 0, profit: 0 };
    acc.total.sales += (log.sales || 0);
    acc.users[log.userName].sales += (log.sales || 0);
    return acc;
  }, { total: { sales: 0, profit: 0 }, users: {} });

  clients.forEach((client) => {
    const ownerName = resolveClientOwnerName(client);
    const clientProfit = Math.max(0, Number(client.profit) || 0);
    if (!dashboardData.users[ownerName]) dashboardData.users[ownerName] = { sales: 0, profit: 0 };
    dashboardData.total.profit += clientProfit;
    dashboardData.users[ownerName].profit += clientProfit;
  });

  const sortedUsers = Object.entries(dashboardData.users).sort((a, b) => b[1].profit - a[1].profit || b[1].sales - a[1].sales);
  const profitRankingUsers = sortedUsers.filter(([, data]) => (data?.profit || 0) > 0);
  const currentUserTotalProfit = Math.max(0, Math.floor(dashboardData.users[user.name]?.profit || 0));
  const profitCoinCount = Math.max(0, Math.floor(currentUserTotalProfit / PROFIT_G_PER_COIN));
  const profitBundleCount = Math.floor(profitCoinCount / PROFIT_COINS_PER_BUNDLE);
  const profitLooseCoinCount = profitCoinCount % PROFIT_COINS_PER_BUNDLE;
  const profitCoinCols = 17;
  const profitCoinSlots = Array.from({ length: profitLooseCoinCount }, (_, idx) => {
    const row = Math.floor(idx / profitCoinCols);
    const col = idx % profitCoinCols;
    const step = 94 / Math.max(1, profitCoinCols - 1);
    const offset = row % 2 === 1 ? step * 0.5 : 0;
    return {
      left: Math.min(96, 3 + col * step + offset),
      bottom: 4 + row * 2.4,
      z: 1 + row,
    };
  });
  const profitBundleCols = 7;
  const profitBundleSlots = Array.from({ length: profitBundleCount }, (_, idx) => {
    const row = Math.floor(idx / profitBundleCols);
    const col = idx % profitBundleCols;
    const step = 82 / Math.max(1, profitBundleCols - 1);
    const offset = row % 2 === 1 ? step * 0.3 : 0;
    return {
      left: Math.min(92, 9 + col * step + offset),
      bottom: 28 + row * 4.1,
      z: 14 + row,
    };
  });






  return (
    <div className="fc-shell min-h-[100dvh] bg-neutral-900 text-white font-sans flex justify-center items-center sm:p-4 md:p-8">
      <style dangerouslySetInnerHTML={{__html: questStyles}} />

      <div className="fc-frame w-full h-[100dvh] overflow-hidden relative font-dq flex flex-col sm:h-[85vh] sm:max-h-[900px] sm:min-h-[600px] sm:max-w-[450px]">
        
        {/* ヘッダー */}
        <header className="fc-header p-3 text-center shrink-0 z-20">
          <h1 className="dq-logo text-[14px] sm:text-[16px] font-dq-title dq-title-shadow mt-1">Kaientai Quest</h1>
        </header>

        {/* メインコンテンツ */}
        <main className="fc-main flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="min-h-full">
            {currentScreen === 'home' && <HomeScreen user={user} kpi={kpi} currentUserTotalProfit={currentUserTotalProfit} profitBundleSlots={profitBundleSlots} profitCoinSlots={profitCoinSlots} profitBundleCount={profitBundleCount} profitLooseCoinCount={profitLooseCoinCount} isEditingProfile={isEditingProfile} setIsEditingProfile={setIsEditingProfile} editName={editName} setEditName={setEditName} editCharType={editCharType} setEditCharType={setEditCharType} handleSaveProfile={handleSaveProfile} />}
            {currentScreen === 'village' && <VillageScreen user={user} villageZoom={villageZoom} setVillageZoom={setVillageZoom} sortedUsers={sortedUsers} isEveningToMidnight={isEveningToMidnight} cityLightLevel={cityLightLevel} lightDisplayGate={lightDisplayGate} twilightWarmth={twilightWarmth} nightDensity={nightDensity} dawnRise={dawnRise} villageHour={villageHour} villageStageBrightness={villageStageBrightness} villageStageSaturation={villageStageSaturation} isCityWindowLit={isCityWindowLit} />}
            {currentScreen === 'map' && <MapScreen clients={clients} selectedClientId={selectedClientId} setSelectedClientId={setSelectedClientId} mapCsvSort={mapCsvSort} setMapCsvSort={setMapCsvSort} mapZoom={mapZoom} setMapZoom={setMapZoom} editProgress={editProgress} setEditProgress={setEditProgress} user={user} sortClientsByMode={sortClientsByMode} resolveClientOwnerName={resolveClientOwnerName} handleFileUpload={handleFileUpload} handleExportClientsCsv={handleExportClientsCsv} handleReport={handleReport} />}
            {currentScreen === 'guild' && <GuildScreen guildTab={guildTab} setGuildTab={setGuildTab} profitRankingUsers={profitRankingUsers} user={user} setSelectedUserProfile={setSelectedUserProfile} logs={logs} />}
          </div>
        </main>

        {/* ナビゲーションバー */}
        <nav className="fc-nav absolute bottom-0 left-0 w-full pt-2 px-2 nav-safe-area flex items-center gap-1 z-30 shrink-0">
          <button 
            onClick={() => setCurrentScreen('home')}
            className={`fc-nav-btn ${currentScreen === 'home' ? 'is-active' : ''}`}
          >
            <span className={`fc-nav-caret ${currentScreen === 'home' ? 'is-active' : ''}`}>▼</span>
            <span className="text-[11px] leading-none whitespace-nowrap">じょうたい</span>
          </button>
          <button 
            onClick={() => setCurrentScreen('village')}
            className={`fc-nav-btn ${currentScreen === 'village' ? 'is-active' : ''}`}
          >
            <span className={`fc-nav-caret ${currentScreen === 'village' ? 'is-active' : ''}`}>▼</span>
            <span className="text-[11px] leading-none whitespace-nowrap">かいえんたい村</span>
          </button>
          <button 
            onClick={() => setCurrentScreen('map')}
            className={`fc-nav-btn ${currentScreen === 'map' ? 'is-active' : ''}`}
          >
            <span className={`fc-nav-caret ${currentScreen === 'map' ? 'is-active' : ''}`}>▼</span>
            <span className="text-[11px] leading-none whitespace-nowrap">ぼうけん</span>
          </button>
          <button 
            onClick={() => setCurrentScreen('guild')}
            className={`fc-nav-btn ${currentScreen === 'guild' ? 'is-active' : ''}`}
          >
            <span className={`fc-nav-caret ${currentScreen === 'guild' ? 'is-active' : ''}`}>▼</span>
            <span className="text-[11px] leading-none whitespace-nowrap">きろく</span>
          </button>
        </nav>

        {/* アクション結果ポップアップ */}
        {popup.show && (
          <div className="absolute inset-0 z-40 flex items-center justify-center p-4 pointer-events-none">
            <div className="absolute inset-0 bg-black/40 animate-fadeIn" />
            <DqWindow className={`w-full relative z-50 animate-fadeIn ${popup.isHighlight ? 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]' : ''}`}>
              <div className="whitespace-pre-wrap text-[17px] leading-loose">
                {popup.message}
              </div>
              <div className="absolute bottom-2 right-4 animate-blink text-[20px]">▶</div>
            </DqWindow>
          </div>
        )}

        {/* プロフィール詳細モーダル */}
        <UserProfileModal selectedUserProfile={selectedUserProfile} user={user} dashboardData={dashboardData} onClose={() => setSelectedUserProfile(null)} />

      </div>
    </div>
  );
}




