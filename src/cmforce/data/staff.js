import { normalizeRole, ROLES } from './roles.js';

export const DEPARTMENT_OPTIONS = [ROLES.KIKAKU, ROLES.SETUP, ROLES.EIGYO];

export const initialStaff = [
  { id: 'STF-001', staffNumber: 'CM-001', name: '山田 太郎', department: ROLES.SETUP, questCharacterType: 'fighter', phone: '03-1234-5678', email: 'yamada@caremax.example.jp', note: '介護機器導入全般' },
  { id: 'STF-002', staffNumber: 'CM-002', name: '佐藤 次郎', department: ROLES.EIGYO, questCharacterType: 'hero', phone: '090-2345-6789', email: 'sato@caremax.example.jp', note: '関東エリア営業' },
  { id: 'STF-003', staffNumber: 'CM-003', name: '鈴木 花子', department: ROLES.KIKAKU, questCharacterType: 'mage', phone: '03-9876-5432', email: 'suzuki@caremax.example.jp', note: '営業企画・KPI管理' },
];

export const nextStaffNumber = (staff) => {
  const max = staff.reduce((current, member) => {
    const value = Number(String(member.staffNumber || '').match(/\d+/)?.[0] || 0);
    return Math.max(current, value);
  }, 0);
  return `CM-${String(max + 1).padStart(3, '0')}`;
};

export const normalizeStaffMembers = (staff = []) => {
  const used = new Set(staff.map(member => member.staffNumber).filter(Boolean));
  let next = 1;
  return staff.map((member) => {
    let staffNumber = member.staffNumber;
    if (!staffNumber) {
      const idDigits = String(member.id || '').match(/\d+/)?.[0] || '';
      const idNumber = Number(idDigits || 0);
      const candidate = idNumber > 0 && idDigits.length <= 3
        ? `CM-${String(idNumber).padStart(3, '0')}`
        : '';
      if (candidate && !used.has(candidate)) {
        staffNumber = candidate;
      } else {
        while (used.has(`CM-${String(next).padStart(3, '0')}`)) next += 1;
        staffNumber = `CM-${String(next).padStart(3, '0')}`;
      }
      used.add(staffNumber);
    }
    return {
      ...member,
      department: normalizeRole(member.department),
      note: member.note === '介護機器セットアップ全般' ? '介護機器導入全般' : member.note,
      staffNumber,
      questCharacterType: member.questCharacterType || 'hero',
    };
  });
};
