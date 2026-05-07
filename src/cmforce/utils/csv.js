// CSV ユーティリティ
// 値内のカンマ・改行・ダブルクォートを安全に扱う
export const escapeCsvField = (value) => {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (/["\r\n,]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

// 行配列(2次元) → CSV 文字列。先頭に Excel 互換の BOM を付ける。
export const rowsToCsv = (rows) => {
  const body = rows.map((row) => row.map(escapeCsvField).join(',')).join('\r\n');
  return '﻿' + body;
};

// CSV 文字列をブラウザでダウンロードさせる
export const downloadCsv = (filename, csv) => {
  if (typeof window === 'undefined') return;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// 「YYYY-MM-DD」形式の今日の日付（ローカルタイム）
export const todayStamp = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
