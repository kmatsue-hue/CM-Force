import { ROLES } from './roles.js';

// ロール別パスワード
// 注意: クライアントサイド認証のため、本番運用には適しません（バンドルから可読）。
// 共有デモ・社内利用のアクセスゲート目的の簡易認証です。
export const ROLE_PASSWORDS = {
  [ROLES.KIKAKU]: 'CMC8610',
  [ROLES.EIGYO]: 'kuwanatakashi',
  [ROLES.SETUP]: '1234',
};

export const AUTH_STORAGE_KEY = 'cm-force-auth-v1';
