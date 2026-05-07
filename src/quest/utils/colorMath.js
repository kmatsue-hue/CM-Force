// 純粋な数値・色ユーティリティ
export const DAY_CYCLE_MS = 60000;

export const clamp01 = (v) => Math.max(0, Math.min(1, v));

export const hexToRgb = (hex) => {
  const normalized = String(hex).replace('#', '');
  if (normalized.length !== 6) return { r: 0, g: 0, b: 0 };
  const parsed = Number.parseInt(normalized, 16);
  if (Number.isNaN(parsed)) return { r: 0, g: 0, b: 0 };
  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255
  };
};

export const rgbToHex = (r, g, b) => `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;

export const mixHex = (from, to, ratio) => {
  const t = clamp01(ratio);
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  return rgbToHex(
    a.r + (b.r - a.r) * t,
    a.g + (b.g - a.g) * t,
    a.b + (b.b - a.b) * t
  );
};

export const blendDaySunsetNight = (dayHex, sunsetHex, nightHex, twilight, night) =>
  mixHex(mixHex(dayHex, sunsetHex, twilight), nightHex, night);

export const smooth01 = (v) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};

export const range01 = (value, start, end) => clamp01((value - start) / Math.max(0.0001, end - start));
