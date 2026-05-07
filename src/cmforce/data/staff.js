import { ROLES } from './roles.js';

export const DEPARTMENT_OPTIONS = [ROLES.KIKAKU, ROLES.SETUP, ROLES.EIGYO];

export const initialStaff = [
  { id: 'STF-001', name: '山田 太郎', department: ROLES.SETUP, phone: '03-1234-5678', email: 'yamada@caremax.example.jp', note: '介護機器セットアップ全般' },
  { id: 'STF-002', name: '佐藤 次郎', department: ROLES.EIGYO, phone: '090-2345-6789', email: 'sato@caremax.example.jp', note: '関東エリア営業' },
  { id: 'STF-003', name: '鈴木 花子', department: ROLES.KIKAKU, phone: '03-9876-5432', email: 'suzuki@caremax.example.jp', note: '営業企画・KPI管理' },
];
