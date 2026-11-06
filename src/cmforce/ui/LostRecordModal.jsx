import React, { useEffect, useState } from 'react';
import { AlertCircle, CalendarClock, X } from 'lucide-react';
import {
  LOST_CATEGORY_OPTIONS,
  LOST_CATEGORY_REVISIT,
  REVISIT_LEAD_DAYS,
  REVISIT_TRIGGER_OPTIONS,
  getNextFiscalYearStart,
} from '../data/revisit.js';

const createInitialForm = (initial = {}) => ({
  reason: initial.reason || '',
  competitor: initial.competitor || '',
  category: initial.category || '',
  revisitDate: initial.revisitDate || getNextFiscalYearStart(),
  revisitTrigger: initial.revisitTrigger || '',
  revisitNote: initial.revisitNote || '',
});

// 失注の記録・失注情報の編集で共通に使うモーダル
//   mode: 'create' = 失注として記録 / 'edit' = 失注情報（区分・再浮上欄）の編集
const LostRecordModal = ({ open, mode = 'create', initialValue, onSubmit, onCancel }) => {
  const [form, setForm] = useState(() => createInitialForm(initialValue));

  useEffect(() => {
    if (open) setForm(createInitialForm(initialValue));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const isRevisit = form.category === LOST_CATEGORY_REVISIT;
  const missingCategory = !form.category;
  const missingRevisitDate = isRevisit && !form.revisitDate;
  const canSubmit = !missingCategory && !missingRevisitDate;
  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));
  const title = mode === 'edit' ? '失注情報の編集' : '失注として記録';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[calc(100%-2rem)] max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mr-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h4 className="text-lg font-bold text-gray-900">{title}</h4>
            </div>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100" aria-label="閉じる">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-5 ml-[52px]">
            {mode === 'edit'
              ? '区分と再浮上の時期を見直せます。失注日は変わりません。'
              : '案件は一覧に残りますが、KPI計算から除外されます。'}
          </p>

          <div className="space-y-4">
            <div>
              <p className="block text-xs font-bold text-gray-700 mb-1.5">
                失注の区分 <span className="text-red-600">*</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {LOST_CATEGORY_OPTIONS.map((option) => {
                  const selected = form.category === option.value;
                  const tone = option.value === LOST_CATEGORY_REVISIT
                    ? (selected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300')
                    : (selected ? 'border-gray-700 bg-gray-50' : 'border-gray-200 hover:border-gray-400');
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => update({ category: option.value })}
                      aria-pressed={selected}
                      className={`text-left rounded-xl border-2 px-3.5 py-3 transition-colors ${tone}`}
                    >
                      <span className="block text-sm font-bold text-gray-900">{option.label}</span>
                      <span className="block text-[11px] leading-4 text-gray-500 mt-1">{option.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {isRevisit && (
              <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-4 space-y-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-1.5" htmlFor="lost-revisit-date">
                    <CalendarClock className="w-3.5 h-3.5 text-purple-600" />
                    再浮上の時期 <span className="text-red-600">*</span>
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      id="lost-revisit-date"
                      type="date"
                      value={form.revisitDate}
                      onChange={(e) => update({ revisitDate: e.target.value })}
                      className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-300"
                    />
                    <button
                      type="button"
                      onClick={() => update({ revisitDate: getNextFiscalYearStart() })}
                      className="px-3 py-1.5 rounded-full text-xs font-bold text-purple-700 bg-white border border-purple-200 hover:bg-purple-100"
                    >
                      来年度4月
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500">
                    この日の{REVISIT_LEAD_DAYS}日前から、ダッシュボードの再浮上リストに表示されます。補助金の公募時期に合わせる場合は日付を直してください。
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-700 mb-1.5">再浮上のきっかけ</p>
                  <div className="flex flex-wrap gap-1.5">
                    {REVISIT_TRIGGER_OPTIONS.map((trigger) => {
                      const selected = form.revisitTrigger === trigger;
                      return (
                        <button
                          key={trigger}
                          type="button"
                          onClick={() => update({ revisitTrigger: selected ? '' : trigger })}
                          aria-pressed={selected}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                            selected
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          {trigger}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5" htmlFor="lost-revisit-note">
                    再浮上したらやること
                  </label>
                  <input
                    id="lost-revisit-note"
                    type="text"
                    value={form.revisitNote}
                    onChange={(e) => update({ revisitNote: e.target.value })}
                    placeholder="例：4月に施設長へ新年度予算を確認し、補助金の申請を提案"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5" htmlFor="lost-reason">
                失注理由
              </label>
              <textarea
                id="lost-reason"
                className="w-full h-24 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-red-300 focus:border-red-300 focus:bg-white focus:outline-none resize-none transition-all"
                placeholder="例：今年度の予算がなく来年度に再検討、競合製品に決定した 等"
                value={form.reason}
                onChange={(e) => update({ reason: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5" htmlFor="lost-competitor">
                競合情報
                <span className="ml-2 text-xs font-normal text-gray-400">（競合製品・企業名など）</span>
              </label>
              <input
                id="lost-competitor"
                type="text"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 font-semibold focus:ring-2 focus:ring-red-300 focus:border-red-300 focus:bg-white focus:outline-none transition-all"
                placeholder="例：〇〇社製品、△△システム 等"
                value={form.competitor}
                onChange={(e) => update({ competitor: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 pt-4 mt-5">
            {!canSubmit && (
              <span className="mr-auto text-[11px] font-semibold text-gray-400">
                {missingCategory ? '区分を選んでください' : '再浮上の時期を入れてください'}
              </span>
            )}
            <button onClick={onCancel} className="px-5 py-2 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-100">キャンセル</button>
            <button
              onClick={() => canSubmit && onSubmit(form)}
              disabled={!canSubmit}
              className="px-5 py-2 rounded-full text-sm font-bold bg-red-600 text-white hover:bg-red-700 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {mode === 'edit' ? '保存する' : '失注として記録する'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LostRecordModal;
