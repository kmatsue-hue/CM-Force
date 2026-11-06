import React, { useMemo, useState } from 'react';
import { CalendarClock, ChevronRight, RotateCcw } from 'lucide-react';
import Card from './Card.jsx';
import ProjectName from './ProjectName.jsx';
import { AssistTip } from './AssistMode.jsx';
import RevisitActionModal from './RevisitActionModal.jsx';
import {
  REVISIT_LEAD_DAYS,
  buildFinalLostProject,
  buildReattackProject,
  buildRevisitPostponedProject,
  formatRevisitDate,
  getRevisitStatus,
  getRevisitStatusLabel,
  isRevisitSurfaced,
} from '../data/revisit.js';

const STATUS_TONE = {
  due: 'bg-red-50 text-red-700 ring-red-200',
  nodate: 'bg-amber-50 text-amber-700 ring-amber-200',
  soon: 'bg-purple-50 text-purple-700 ring-purple-200',
  waiting: 'bg-gray-100 text-gray-500 ring-gray-200',
};

// ダッシュボードの「再浮上リスト」
// 来季再挑戦の失注案件のうち、再浮上時期の REVISIT_LEAD_DAYS 日前を過ぎたものを並べる。
// 営業部（閲覧専用）は一覧の確認だけ、企画部・SOMPOケアは再アタック開始などの操作ができる。
const RevisitList = ({ projects, canEdit, onSelectProject, onUpdateProject, getOwnerName, onShowLostProjects }) => {
  const [showWaiting, setShowWaiting] = useState(false);
  const [pending, setPending] = useState(null); // { action, project }

  const { surfaced, waiting, dueCount, soonCount, unclassifiedCount } = useMemo(() => {
    const today = new Date();
    const items = projects
      .map((project) => ({ project, status: getRevisitStatus(project, today) }))
      .filter((item) => item.status)
      .sort((a, b) => String(a.project.lostInfo?.revisitDate || '').localeCompare(String(b.project.lostInfo?.revisitDate || '')));
    const surfacedItems = items.filter((item) => isRevisitSurfaced(item.status));
    return {
      surfaced: surfacedItems,
      waiting: items.filter((item) => !isRevisitSurfaced(item.status)),
      dueCount: surfacedItems.filter((item) => item.status.state !== 'soon').length,
      soonCount: surfacedItems.filter((item) => item.status.state === 'soon').length,
      unclassifiedCount: projects.filter((project) => project.isLost && !project.lostInfo?.category).length,
    };
  }, [projects]);

  if (surfaced.length === 0 && waiting.length === 0 && !(canEdit && unclassifiedCount > 0)) return null;

  const visible = showWaiting ? [...surfaced, ...waiting] : surfaced;

  const handleConfirm = ({ actor, revisitDate }) => {
    if (!pending) return;
    const { action, project } = pending;
    if (action === 'reattack') onUpdateProject(buildReattackProject(project, actor));
    if (action === 'postpone') onUpdateProject(buildRevisitPostponedProject(project, revisitDate, actor));
    if (action === 'final') onUpdateProject(buildFinalLostProject(project, actor));
    setPending(null);
  };

  return (
    <Card>
      <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex flex-wrap items-center gap-2 sm:gap-3">
        <AssistTip text={`「来季再挑戦」で失注した案件のうち、再浮上の時期の${REVISIT_LEAD_DAYS}日前を過ぎたものを表示します。\n再アタック開始で「案件発掘」から再スタートします。`} side="bottom">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-purple-600" />
            再浮上リスト
          </h2>
        </AssistTip>
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
          <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-700 ring-1 ring-inset ring-red-200">時期が来た {dueCount}件</span>
          <span className="rounded-full bg-purple-50 px-2.5 py-1 text-purple-700 ring-1 ring-inset ring-purple-200">{REVISIT_LEAD_DAYS}日以内 {soonCount}件</span>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600 ring-1 ring-inset ring-gray-200">来季待ち {waiting.length}件</span>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {canEdit && unclassifiedCount > 0 && onShowLostProjects && (
            <button
              type="button"
              onClick={onShowLostProjects}
              className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100"
            >
              区分が未分類の失注 {unclassifiedCount}件
            </button>
          )}
          {waiting.length > 0 && (
            <button
              type="button"
              onClick={() => setShowWaiting((prev) => !prev)}
              aria-pressed={showWaiting}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                showWaiting ? 'border-purple-300 bg-purple-600 text-white' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              来季待ちも表示
            </button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="px-5 py-6 text-center text-sm font-medium text-gray-400">
          いま再浮上している案件はありません{waiting.length > 0 ? `（来季待ち ${waiting.length}件）` : ''}
        </p>
      ) : (
        <ul className="divide-y divide-gray-50">
          {visible.map(({ project, status }) => {
            const lostInfo = project.lostInfo || {};
            const owner = getOwnerName ? getOwnerName(project) : '';
            return (
              <li
                key={project.id}
                className="group flex flex-col gap-3 px-3 py-4 sm:px-5 lg:grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.5fr)_auto] lg:items-center lg:gap-4 cursor-pointer hover:bg-gray-50"
                onClick={() => onSelectProject(project.id)}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-900 sm:text-base">
                    <ProjectName name={project.name} className="truncate" />
                  </div>
                  <div className="mt-1 text-[11px] font-medium text-slate-400 sm:text-xs">
                    {owner && <>担当者：<span className="font-semibold text-slate-600">{owner}</span>　</>}
                    失注 {formatRevisitDate(lostInfo.date)}（{project.status}）
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-extrabold tabular-nums ring-1 ring-inset ${STATUS_TONE[status.state]}`}>
                    <CalendarClock className="h-4 w-4" strokeWidth={2.2} />
                    {formatRevisitDate(lostInfo.revisitDate)}
                  </span>
                  <span className="text-[11px] font-bold text-gray-500">{getRevisitStatusLabel(status)}</span>
                  {lostInfo.revisitTrigger && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">{lostInfo.revisitTrigger}</span>
                  )}
                </div>
                <p className="min-w-0 text-xs leading-5 text-gray-600">
                  {lostInfo.revisitNote
                    ? <><span className="font-bold text-purple-700">やること：</span>{lostInfo.revisitNote}</>
                    : <span className="text-gray-400">{lostInfo.reason ? `失注理由：${lostInfo.reason}` : 'やること未記入'}</span>}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 lg:justify-end" onClick={(e) => e.stopPropagation()}>
                  {canEdit ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setPending({ action: 'reattack', project })}
                        className="rounded-full bg-purple-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-purple-700"
                      >
                        再アタック開始
                      </button>
                      <button
                        type="button"
                        onClick={() => setPending({ action: 'postpone', project })}
                        className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50"
                      >
                        時期を延ばす
                      </button>
                      <button
                        type="button"
                        onClick={() => setPending({ action: 'final', project })}
                        className="rounded-full px-2.5 py-1.5 text-xs font-bold text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      >
                        完全失注にする
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectProject(project.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 ring-1 ring-inset ring-slate-200 hover:bg-purple-50 hover:text-purple-700"
                      aria-label="案件詳細を開く"
                    >
                      <ChevronRight className="h-5 w-5" strokeWidth={2.3} />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <RevisitActionModal
        open={pending !== null}
        action={pending?.action}
        project={pending?.project}
        onConfirm={handleConfirm}
        onCancel={() => setPending(null)}
      />
    </Card>
  );
};

export default RevisitList;
