export const BALL_OWNER_OPTIONS = [
  { value: '', label: '未設定' },
  { value: 'caremax', label: 'ケアマックス' },
  { value: 'sompo', label: 'SOMPOケアソリューションズ' },
  { value: 'endUser', label: 'エンドユーザー' },
  { value: 'retailer', label: '販売店' },
  { value: 'other', label: 'その他' },
];

export const normalizeBallOwner = (value = {}) => {
  const type = BALL_OWNER_OPTIONS.some(option => option.value === value?.type) ? value.type : '';
  return {
    type,
    name: type ? String(value?.name || '').trim() : '',
    updatedAt: value?.updatedAt || '',
  };
};

export const getBallOwnerLabel = (value = {}) => {
  const owner = normalizeBallOwner(value);
  const typeLabel = BALL_OWNER_OPTIONS.find(option => option.value === owner.type)?.label || '未設定';
  return owner.name ? `${typeLabel}｜${owner.name}` : typeLabel;
};

export const getBallOwnerTone = (type = '') => ({
  caremax: 'bg-blue-50 text-blue-700 ring-blue-200',
  sompo: 'bg-violet-50 text-violet-700 ring-violet-200',
  endUser: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  retailer: 'bg-amber-50 text-amber-700 ring-amber-200',
  other: 'bg-slate-100 text-slate-700 ring-slate-200',
}[type] || 'bg-gray-100 text-gray-500 ring-gray-200');
