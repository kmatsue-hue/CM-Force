// localStorage キー定義
// バージョン番号を含めて、データ形状を変えた時に古いデータを無視できるようにする
export const PROJECTS_STORAGE_KEY = 'cm-force-projects-v1';
export const STAFF_STORAGE_KEY = 'cm-force-staff-v1';

// 値を JSON として読み込む。失敗 / 値なしなら fallback を返す
export const loadJson = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

// 値を JSON で保存。例外は静かに無視（容量超過・プライベートモード等）
export const saveJson = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
};
