import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarClock, RotateCcw, Undo2, X, XCircle } from 'lucide-react';
import ProjectName from './ProjectName.jsx';
import {
  REATTACK_START_PHASE,
  formatRevisitDate,
  getLostCategoryLabel,
  getNextFiscalYearStart,
  toLocalDateString,
} from '../data/revisit.js';

const addMonths = (months) => {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return toLocalDateString(date);
};

const ACTIONS = {
  reattack: {
    title: '再アタック開始',
    icon: RotateCcw,
    iconTone: 'bg-purple-50 text-purple-600',
    confirmLabel: '再アタックを開始する',
    confirmTone: 'bg-purple-600 hover:bg-purple-700',
  },
  postpone: {
    title: '再浮上の時期を延ばす',
    icon: CalendarClock,
    iconTone: 'bg-amber-50 text-amber-600',
    confirmLabel: '時期を変更する',
    confirmTone: 'bg-amber-600 hover:bg-amber-700',
  },
  final: {
    title: '完全失注に切り替える',
    icon: XCircle,
    iconTone: 'bg-gray-100 text-gray-600',
    confirmLabel: '完全失注にする',
    confirmTone: 'bg-gray-800 hover:bg-gray-900',
  },
  cancelLost: {
    title: '失注を取り消す',
    icon: Undo2,
    iconTone: 'bg-gray-100 text-gray-600',
    confirmLabel: '失注を取り消す',
    confirmTone: 'bg-gray-800 hover:bg-gray-900',
  },
};

// 再浮上リスト・案件詳細から使う操作モーダル（実行者の名前を必須にして活動ログに残す）
//   action: 'reattack' | 'postpone' | 'final' | 'cancelLost'
const RevisitActionModal = ({ open, action, project, onConfirm, onCancel, onSwitchAction }) => {
  const [actor, setActor] = useState('');
  const [revisitDate, setRevisitDate] = useState('');

  useEffect(() => {
    if (!open) return;
    setActor('');
    setRevisitDate(project?.lostInfo?.revisitDate || getNextFiscalYearStart());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, action, project?.id]);

  if (!open || !project || !ACTIONS[action]) return null;

  const config = ACTIONS[action];
  const Icon = config.icon;
  const lostInfo = project.lostInfo || {};
  const needsDate = action === 'postpone';
  const canSubmit = actor.trim() !== '' && (!needsDate || Boolean(revisitDate));

  // カードの中から呼ばれても画面全体に重なるよう body へ出す
  return createPortal(
    <div className="fixed inset-0 z-[210] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-[calc(100%-2rem)] max-w-md max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.iconTone}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900 leading-tight">{config.title}</h4>
                <p className="text-xs font-semibold text-gray-500 mt-0.5"><ProjectName name={project.name} /></p>
              </div>
            </div>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100" aria-label="閉じる">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="text-sm text-gray-600 leading-6 space-y-2">
            {action === 'reattack' && (
              <>
                <p>
                  「{REATTACK_START_PHASE}」から再スタートします。施設情報・メモ・関連リンク・活動ログはそのまま残ります。
                </p>
                <p className="text-xs text-gray-500">
                  今回の失注（{formatRevisitDate(lostInfo.date)}・{getLostCategoryLabel(lostInfo.category)}・失注時のフェーズ「{project.status}」）は失注履歴に残り、KPIの失注延べ件数にも数えます。
                </p>
                {lostInfo.revisitNote && (
                  <p className="rounded-lg bg-purple-50 px-3 py-2 text-xs text-purple-800">
                    再浮上したらやること：{lostInfo.revisitNote}
                  </p>
                )}
              </>
            )}
            {action === 'postpone' && (
              <>
                <p>今の再浮上時期：<span className="font-bold text-gray-800">{formatRevisitDate(lostInfo.revisitDate)}</span></p>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    value={revisitDate}
                    onChange={(e) => setRevisitDate(e.target.value)}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-300"
                    aria-label="新しい再浮上時期"
                  />
                  {[
                    { label: '1か月後', value: addMonths(1) },
                    { label: '3か月後', value: addMonths(3) },
                    { label: '来年度4月', value: getNextFiscalYearStart() },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setRevisitDate(preset.value)}
                      className="px-3 py-1.5 rounded-full text-xs font-bold text-amber-700 bg-white border border-amber-200 hover:bg-amber-50"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </>
            )}
            {action === 'final' && (
              <p>再浮上リストから外し、完全失注として扱います。あとから失注情報の編集で「来季再挑戦」に戻せます。</p>
            )}
            {action === 'cancelLost' && (
              <p>誤って失注にした場合の訂正です。失注の記録を消し、失注時のフェーズ「{project.status}」のまま進行中に戻します。失注履歴には残りません。</p>
            )}
          </div>

          <label className="block mt-5">
            <span className="text-xs font-semibold text-gray-700">
              実行者の名前 <span className="text-red-600">*</span>
            </span>
            <input
              type="text"
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              placeholder="例：山田 太郎"
              className="mt-1.5 w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
              autoFocus
            />
            <span className="block mt-1 text-[10px] text-gray-400">活動ログに記録されます</span>
          </label>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 pt-4 mt-5">
            {action === 'reattack' && onSwitchAction && (
              <button
                type="button"
                onClick={() => onSwitchAction('cancelLost')}
                className="mr-auto text-[11px] font-semibold text-gray-400 hover:text-gray-700 underline underline-offset-2"
              >
                誤って失注にした場合はこちら
              </button>
            )}
            <button onClick={onCancel} className="px-5 py-2 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-100">キャンセル</button>
            <button
              onClick={() => canSubmit && onConfirm({ actor: actor.trim(), revisitDate })}
              disabled={!canSubmit}
              className={`px-5 py-2 rounded-full text-sm font-bold text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${config.confirmTone}`}
            >
              {config.confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default RevisitActionModal;
