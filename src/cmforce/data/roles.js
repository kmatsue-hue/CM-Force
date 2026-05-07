// --- 権限ロール定義 ---
export const ROLES = {
  KIKAKU: '企画部',
  SETUP: 'セットアップ',
  EIGYO: '営業部',
};

export const ROLE_LIST = [ROLES.KIKAKU, ROLES.SETUP, ROLES.EIGYO];

// KPI タブを閲覧できるロール（セットアップは不可）
export const KPI_ALLOWED_ROLES = [ROLES.KIKAKU, ROLES.EIGYO];

// 担当者管理を閲覧・編集できるロール（営業企画 = 企画部のみ）
export const STAFF_ADMIN_ROLES = [ROLES.KIKAKU];

// 介援隊クエスト（外部リンク）を表示できるロール
export const KAIENTAI_QUEST_ROLES = [ROLES.KIKAKU, ROLES.EIGYO];
