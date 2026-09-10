export const FACILITY_TYPE_OPTIONS = [
  '特養',
  '老健',
  '有料',
  'グループホーム',
  'サ高住',
  'デイサービス',
  '病院・クリニック',
  'その他',
];

const DEFAULT_PILL_CLASS_NAME = 'border-slate-200 bg-slate-50 text-slate-600';
const DEFAULT_MARKER_CLASS_NAME = 'bg-slate-400';

const FACILITY_TYPE_META = {
  特養: { pillClassName: 'border-rose-200 bg-rose-50 text-rose-700', markerClassName: 'bg-rose-500' },
  老健: { pillClassName: 'border-sky-200 bg-sky-50 text-sky-700', markerClassName: 'bg-sky-500' },
  有料: { pillClassName: 'border-amber-200 bg-amber-50 text-amber-700', markerClassName: 'bg-amber-500' },
  グループホーム: { pillClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700', markerClassName: 'bg-emerald-500' },
  サ高住: { pillClassName: 'border-violet-200 bg-violet-50 text-violet-700', markerClassName: 'bg-violet-500' },
  デイサービス: { pillClassName: 'border-cyan-200 bg-cyan-50 text-cyan-700', markerClassName: 'bg-cyan-500' },
  '病院・クリニック': { pillClassName: 'border-indigo-200 bg-indigo-50 text-indigo-700', markerClassName: 'bg-indigo-500' },
  その他: { pillClassName: 'border-gray-200 bg-gray-50 text-gray-700', markerClassName: 'bg-gray-400' },
};

export const normalizeFacilityType = (facilityType) =>
  typeof facilityType === 'string' ? facilityType.trim() : '';

export const getFacilityTypeMeta = (facilityType) => {
  const label = normalizeFacilityType(facilityType);
  return {
    label,
    pillClassName: FACILITY_TYPE_META[label]?.pillClassName || DEFAULT_PILL_CLASS_NAME,
    markerClassName: FACILITY_TYPE_META[label]?.markerClassName || DEFAULT_MARKER_CLASS_NAME,
  };
};
