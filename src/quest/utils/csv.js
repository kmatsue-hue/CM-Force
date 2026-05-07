export const escapeCsvField = (value) => {
  const text = String(value ?? "");
  if (/["\r\n,]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

export const parseCsvLine = (line) => {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ',' && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells.map((cell) => String(cell ?? "").trim());
};

export const parseCsvRows = (text) => String(text ?? "")
  .replace(/^﻿/, "")
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line !== "")
  .map(parseCsvLine);
