import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Check,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Edit,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  MessageSquare,
  Plus,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { PHASES } from '../data/phases.js';
import { CONSTRUCTION_PHASE, CONSTRUCTION_SUBTASK_TEMPLATE } from '../data/constructionSubtasks.js';
import { useToast } from './Toast.jsx';
import { AssistTip } from './AssistMode.jsx';

const PhaseDetailPanel = ({ phase, data, isLost, onUpdate, currentProjectPhase, onAdvancePhase, nextPhaseLabel, onRevertPhase, prevPhaseLabel, advanceErrors = [], mainSkipTarget, onSkipToMain, isAtBranchPoint, canStartKaientaiHere, onStartKaientai, canStartMarginHere, onStartMargin, onAddProjectLog }) => {
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(data?.notes || '');
  const [tasks, setTasks] = useState(data?.tasks || []);
  const [newTaskText, setNewTaskText] = useState('');
  const [links, setLinks] = useState(data?.links || []);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [marginAmount, setMarginAmount] = useState(data?.marginAmount ?? '');
  const [marginScheduledDate, setMarginScheduledDate] = useState(data?.marginScheduledDate || '');
  const isMarginPaymentPhase = phase === 'マージン支払';
  const isConstructionPhase = phase === CONSTRUCTION_PHASE;
  // 施工サブタスク: 未初期化なら template から複製
  const initialSubTasks = data?.subTasks ?? CONSTRUCTION_SUBTASK_TEMPLATE.map((t) => ({ ...t }));
  const [subTasks, setSubTasks] = useState(initialSubTasks);
  const [newSubTaskText, setNewSubTaskText] = useState('');
  // 活動ログのインライン入力
  const [quickLog, setQuickLog] = useState({ content: '', nextAction: '', nextDate: '' });
  const submitQuickLog = () => {
    if (!quickLog.content.trim() || !onAddProjectLog) return;
    onAddProjectLog({ ...quickLog });
    setQuickLog({ content: '', nextAction: '', nextDate: '' });
  };

  const currentPhaseIndex = PHASES.indexOf(currentProjectPhase);
  const isCurrentPhase = phase === currentProjectPhase;
  // 一次保守 (PHASES 末尾) のみ最終。介援隊サブフェーズ中は常に進める対象あり。
  const isLastPhase = currentProjectPhase === PHASES[PHASES.length - 1];
  const hasIncompleteTasks = tasks.some(t => !t.completed);

  React.useEffect(() => {
    setNotes(data?.notes || '');
    setTasks(data?.tasks || []);
    setLinks(data?.links || []);
    setMarginAmount(data?.marginAmount ?? '');
    setMarginScheduledDate(data?.marginScheduledDate || '');
    setSubTasks(data?.subTasks ?? CONSTRUCTION_SUBTASK_TEMPLATE.map((t) => ({ ...t })));
    setIsEditing(false);
    setNewTaskText('');
    setNewLinkUrl('');
    setNewLinkTitle('');
    setNewSubTaskText('');
  }, [phase, data]);

  // 施工サブタスク: 即時保存（楽観的更新）
  const persistSubTasks = (next) => {
    setSubTasks(next);
    onUpdate && onUpdate(phase, { ...data, notes, tasks, links, subTasks: next });
  };
  const toggleSubTask = (id) => {
    if (isLost) return;
    persistSubTasks(subTasks.map((s) => s.id === id
      ? { ...s, completed: !s.completed, completedAt: !s.completed ? new Date().toISOString() : null }
      : s
    ));
  };
  const addSubTask = () => {
    const label = newSubTaskText.trim();
    if (!label) return;
    persistSubTasks([
      ...subTasks,
      { id: `custom-${Date.now()}`, label, completed: false, completedAt: null },
    ]);
    setNewSubTaskText('');
  };
  const removeSubTask = (id) => {
    if (isLost) return;
    persistSubTasks(subTasks.filter((s) => s.id !== id));
  };

  const toggleTask = (taskId) => {
    if (isLost) return;
    const newTasks = tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    setTasks(newTasks);
    onUpdate && onUpdate(phase, { ...data, notes, links, tasks: newTasks });
  };

  const addTask = () => {
    if (!newTaskText.trim() || isLost) return;
    const newTask = { id: Date.now(), text: newTaskText, completed: false };
    const newTasks = [...tasks, newTask];
    setTasks(newTasks);
    setNewTaskText('');
    onUpdate && onUpdate(phase, { ...data, notes, links, tasks: newTasks });
  };

  const deleteTask = (taskId) => {
    const newTasks = tasks.filter(t => t.id !== taskId);
    setTasks(newTasks);
    onUpdate && onUpdate(phase, { ...data, notes, links, tasks: newTasks });
  };

  const addLink = () => {
    if (!newLinkUrl.trim() || isLost) return;
    const newLink = { id: Date.now(), url: newLinkUrl, title: newLinkTitle.trim() || newLinkUrl };
    const newLinks = [...links, newLink];
    setLinks(newLinks);
    setNewLinkUrl('');
    setNewLinkTitle('');
    onUpdate && onUpdate(phase, { ...data, notes, links: newLinks, tasks });
  };

  const deleteLink = (linkId) => {
    const newLinks = links.filter(l => l.id !== linkId);
    setLinks(newLinks);
    onUpdate && onUpdate(phase, { ...data, notes, links: newLinks, tasks });
  };

  const handleSave = () => {
    const payload = { ...data, notes, links, tasks };
    if (isMarginPaymentPhase) {
      payload.marginAmount = marginAmount === '' ? '' : Number(marginAmount);
      payload.marginScheduledDate = marginScheduledDate;
    }
    onUpdate && onUpdate(phase, payload);
    setIsEditing(false);
  };

  return (
    <div className="mt-6 sm:mt-10 border-t border-gray-100 pt-5 sm:pt-8 animate-in fade-in slide-in-from-top-4 duration-500 relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6">
        <AssistTip text={`現在表示中のフェーズ「${phase}」の詳細パネル。\nここに記録したメモ・タスク・リンクは案件詳細とフェーズに紐付いて保存されます。\n進行中のフェーズは右上に「進行中」ラベルが付きます。`} side="bottom">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center tracking-tight cursor-help">
            <div className="w-1.5 h-6 bg-purple-600 rounded-full mr-3"></div>
            {phase} <span className="ml-2 text-xs sm:text-sm font-semibold text-gray-400 uppercase tracking-wider">Details</span>
          </h3>
        </AssistTip>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {canStartKaientaiHere && !isLost && (
            <button
              onClick={onStartKaientai}
              className="px-5 py-2 rounded-full text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md border border-blue-600 flex items-center transition-all"
            >
              介援隊サブフローを開始
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          )}
          {canStartMarginHere && !isLost && (
            <button
              onClick={onStartMargin}
              className="px-5 py-2 rounded-full text-sm font-bold bg-orange-600 text-white hover:bg-orange-700 shadow-md border border-orange-600 flex items-center transition-all"
            >
              マージン支払サブフローを開始
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          )}
          {isCurrentPhase && prevPhaseLabel && (
            <AssistTip text={`誤って進めたフェーズを1つ戻します。\n戻り先: 「${prevPhaseLabel}」\n各フェーズに記録したメモ・タスク・リンクは保持されます。`} side="top">
              <button
                onClick={() => {
                  if (isLost) return;
                  setShowRevertConfirm(true);
                }}
                disabled={isLost}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all shadow-sm flex items-center ${
                  isLost
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                前フェーズへ戻る
              </button>
            </AssistTip>
          )}
          {isCurrentPhase && mainSkipTarget && !isLost && (
            <AssistTip text={`サブフローを離脱して、本流の「${mainSkipTarget}」へ直接合流します。\nサブフローのフェーズデータは保持されますが、サブフローは非アクティブ化されます。`} side="top">
              <button
                onClick={() => setShowSkipConfirm(true)}
                className="px-5 py-2 rounded-full text-sm font-bold transition-all shadow-sm flex items-center bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100"
              >
                本流「{mainSkipTarget}」へ進む
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </AssistTip>
          )}
          {isCurrentPhase && !isLastPhase && (
            <AssistTip text={`次のフェーズへ進める。\n進む先: 「${nextPhaseLabel || ''}」\n\n推奨手順:\n1. このフェーズのタスクをすべて完了\n2. メモ・関連リンクを最新化\n3. 必須条件 (商談=次回アクション日 / 提案=金額or資料) を満たす`} side="top">
            <div className="relative group">
              <button
                onClick={() => {
                  if (isLost) return;
                  // 1) フェーズ別の必須条件チェック（registry-driven）
                  if (advanceErrors.length > 0) {
                    showToast(advanceErrors.join('\n'), 'error');
                    return;
                  }
                  // 2) 既存ルール: 未完了の通常タスクが残っていれば進めない
                  if (hasIncompleteTasks) {
                    showToast('登録されているタスクがすべて完了していません。', 'error');
                    return;
                  }
                  // 3) 分岐ポイントは確認ダイアログを挟まず直接モーダルへ
                  if (isAtBranchPoint) { onAdvancePhase(); return; }
                  setShowConfirm(true);
                }}
                disabled={isLost}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all shadow-sm flex items-center ${
                  isLost
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                    : (advanceErrors.length > 0 || hasIncompleteTasks)
                      ? 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200'
                      : 'bg-green-600 text-white hover:bg-green-700 shadow-md border border-green-600'
                }`}
              >
                {isAtBranchPoint ? '次フェーズへ進める（分岐選択）' : '次フェーズへ進める'}
                {advanceErrors.length === 0 && !hasIncompleteTasks && !isLost && <ChevronRight className="w-4 h-4 ml-1" />}
              </button>
              {(hasIncompleteTasks || advanceErrors.length > 0) && !isLost && (
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-max max-w-xs bg-gray-800 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-lg pointer-events-none z-50 whitespace-pre-line">
                  {advanceErrors.length > 0 ? advanceErrors.join('\n') : '未完了のタスクがあるため進めません'}
                </div>
              )}
            </div>
            </AssistTip>
          )}
          <AssistTip text={isEditing
            ? "編集中の内容（メモ・タスク・リンク）を保存します。\n保存後はそのままサーバーに反映され、他メンバーにも同期されます。"
            : "このフェーズのメモ・タスク・関連リンクを編集モードに切り替えます。\nクリック後にフィールドが入力可能になります。"} side="top">
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={isLost}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all shadow-sm ${
                isLost ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none border border-gray-200' :
                isEditing ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-md' : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-100'
              }`}
            >
              {isEditing ? '保存する' : '編集する'}
            </button>
          </AssistTip>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col space-y-6">
          {/* マージン支払専用フィールド */}
          {isMarginPaymentPhase && (
            <div className="bg-orange-50/60 border border-orange-100 rounded-xl p-5">
              <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-orange-500" />
                ケアマックスへの支払
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 支払額（税抜） */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    支払額（税抜）
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">¥</span>
                      <input
                        type="number"
                        min="0"
                        value={marginAmount}
                        onChange={e => setMarginAmount(e.target.value)}
                        placeholder="0"
                        className="w-full pl-8 pr-3 py-2.5 bg-white border-2 border-orange-200 rounded-lg text-sm font-semibold text-gray-900 focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-300 transition-all"
                      />
                    </div>
                  ) : (
                    <p className="text-base font-bold text-gray-900 tabular-nums px-1 py-2">
                      {marginAmount !== '' && marginAmount != null
                        ? `¥${Number(marginAmount).toLocaleString()}`
                        : <span className="text-gray-400 font-medium">未入力</span>}
                    </p>
                  )}
                  {/* 税込み自動表示 */}
                  {marginAmount !== '' && !isNaN(Number(marginAmount)) && (
                    <p className="text-xs font-bold text-gray-500 mt-2 tabular-nums">
                      税込（10%）<span className="ml-2 text-orange-700">¥{Math.floor(Number(marginAmount) * 1.10).toLocaleString()}</span>
                    </p>
                  )}
                </div>

                {/* 支払予定日 */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    支払予定日
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={marginScheduledDate}
                      onChange={e => setMarginScheduledDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border-2 border-orange-200 rounded-lg text-sm font-semibold text-gray-900 focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-300 transition-all"
                    />
                  ) : (
                    <p className="text-base font-bold text-gray-900 px-1 py-2 flex items-center gap-2">
                      {marginScheduledDate
                        ? <><Calendar className="w-4 h-4 text-orange-500" />{marginScheduledDate}</>
                        : <span className="text-gray-400 font-medium">未設定</span>}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 活動ログ クイック入力（コンパクト） */}
          <div className="bg-purple-50/40 border border-purple-100 rounded-xl p-3">
            <AssistTip text={"商談・電話・メールのやり取りを時系列で残せます。\n「次のアクション + 日付」を入れておくと、活動ログタブやアラート表示に活用されます。\n※ EUとの商談 から進めるには最新ログに日付が必要"} side="bottom">
              <h4 className="text-xs font-bold text-gray-600 mb-2 flex items-center cursor-help">
                <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-purple-500" />
                活動ログをすばやく追加
              </h4>
            </AssistTip>
            <textarea
              rows={2}
              disabled={isLost}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none disabled:bg-gray-100"
              placeholder="例：先方理事会で承認、契約締結に向けて準備中"
              value={quickLog.content}
              onChange={e => setQuickLog({ ...quickLog, content: e.target.value })}
            />
            <div className="mt-2 grid grid-cols-[1fr_140px_auto] gap-2 items-center">
              <input
                type="text"
                disabled={isLost}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:bg-gray-100"
                placeholder="次のアクション（任意）"
                value={quickLog.nextAction}
                onChange={e => setQuickLog({ ...quickLog, nextAction: e.target.value })}
              />
              <input
                type="date"
                disabled={isLost}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:bg-gray-100"
                value={quickLog.nextDate}
                onChange={e => setQuickLog({ ...quickLog, nextDate: e.target.value })}
              />
              <button
                onClick={submitQuickLog}
                disabled={isLost || !quickLog.content.trim()}
                className="px-4 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center"
              >
                <Plus className="w-3 h-3 mr-1" />追加
              </button>
            </div>
          </div>

          {/* 施工サブタスク（施工・納品 フェーズのみ） */}
          {isConstructionPhase && (
            <div className="bg-amber-50/40 p-5 rounded-xl border border-amber-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-amber-800 flex items-center">
                  <CheckSquare className="w-4 h-4 mr-2 text-amber-600" />
                  施工サブタスク
                </h4>
                <span className="text-xs font-bold text-amber-700 bg-white px-2 py-1 rounded-md border border-amber-200">
                  {subTasks.filter((s) => s.completed).length} / {subTasks.length}
                </span>
              </div>
              {/* 進捗バー */}
              <div className="h-1.5 w-full bg-amber-100 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${subTasks.length === 0 ? 0 : (subTasks.filter((s) => s.completed).length / subTasks.length) * 100}%` }}
                />
              </div>
              <div className="space-y-2 mb-3">
                {subTasks.map((s) => (
                  <div key={s.id} className="flex items-center group bg-white p-2.5 rounded-lg border border-amber-100">
                    <button
                      onClick={() => toggleSubTask(s.id)}
                      disabled={isLost}
                      className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        s.completed
                          ? 'bg-amber-500 border-amber-500'
                          : 'border-amber-300 hover:border-amber-500 bg-white'
                      } ${isLost ? 'cursor-not-allowed opacity-50' : ''}`}
                      aria-label={s.completed ? '未完了に戻す' : '完了にする'}
                    >
                      {s.completed && <Check className="w-3 h-3 text-white" strokeWidth={3.5} />}
                    </button>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className={`text-sm font-medium ${s.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                        {s.label}
                      </div>
                      {s.completed && s.completedAt && (
                        <div className="text-[10px] text-gray-400">完了: {String(s.completedAt).slice(0, 10)}</div>
                      )}
                    </div>
                    {!isLost && (
                      <button
                        onClick={() => removeSubTask(s.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-1"
                        aria-label="削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {subTasks.length === 0 && (
                  <p className="text-xs text-gray-400 italic">サブタスクがありません</p>
                )}
              </div>
              {!isLost && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubTaskText}
                    onChange={(e) => setNewSubTaskText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubTask(); } }}
                    placeholder="サブタスクを追加 (例: 養生作業)"
                    className="flex-1 px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                  <button
                    onClick={addSubTask}
                    disabled={!newSubTaskText.trim()}
                    className="px-3 py-2 bg-amber-500 text-white rounded-lg text-sm font-bold hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* タスクリスト */}
          <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-100 flex-1">
            <div className="flex items-center justify-between mb-4">
              <AssistTip text={"このフェーズで完了させるべき作業の TODO リスト。\n未完了タスクが残っていると次フェーズへ進めません（ガード機能）。\nチェックで完了化、ホバーでゴミ箱が出て削除可能。"} side="bottom">
                <h4 className="text-sm font-bold text-gray-700 flex items-center cursor-help">
                  <CheckSquare className="w-4 h-4 mr-2 text-purple-500" />
                  タスクリスト
                </h4>
              </AssistTip>
              <AssistTip text={"完了タスク数 / 全タスク数。\nすべてチェックされると「次フェーズへ進める」ボタンが有効化されます。"} side="left">
                <span className="text-xs font-bold text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-200 cursor-help">
                  {tasks.filter(t => t.completed).length} / {tasks.length}
                </span>
              </AssistTip>
            </div>
            <div className="space-y-2 mb-4">
              {tasks.map(task => (
                <div key={task.id} className="flex items-start group bg-white p-3 rounded-lg border border-gray-100 shadow-sm transition-all hover:border-purple-200">
                  <button
                    onClick={() => toggleTask(task.id)}
                    disabled={isLost}
                    className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-all ${
                      task.completed ? 'bg-purple-600 text-white border border-purple-600' : 'bg-white border-2 border-gray-300 hover:border-purple-400'
                    } ${isLost ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                  >
                    {task.completed && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <span className={`ml-3 text-sm flex-1 leading-snug transition-all ${
                    task.completed ? 'text-gray-400 line-through' : 'text-gray-800 font-medium'
                  }`}>
                    {task.text}
                  </span>
                  {isEditing && (
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 ml-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-sm text-gray-400 font-medium py-2">タスクはありません</p>
              )}
            </div>
            {isEditing && (
              <div className="flex items-center bg-white p-2 rounded-lg border-2 border-purple-100 focus-within:border-purple-300 transition-all">
                <input
                  type="text"
                  className="flex-1 bg-transparent px-2 py-1 text-sm outline-none text-gray-800 placeholder-gray-400"
                  placeholder="新しいタスクを入力..."
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addTask(); }}
                />
                <button
                  onClick={addTask}
                  disabled={!newTaskText.trim()}
                  className="ml-2 px-4 py-1.5 bg-purple-100 text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-xs font-bold hover:bg-purple-200 transition-colors"
                >
                  追加
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 関連リンク */}
        <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-5 flex flex-col h-full min-h-[16rem]">
          <AssistTip text={"このフェーズで参照するファイル/ページのリンク集。\n見積書 PDF、提案書 Google Docs、議事録、契約書ドラフト等を URL で添付。\n※ 提案書／見積書提出 から進めるには想定金額または1件以上のリンクが必要"} side="bottom">
            <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center cursor-help">
              <LinkIcon className="w-4 h-4 mr-2 text-purple-500" />
              関連リンク ({links.length})
            </h4>
          </AssistTip>
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
            {links.map(link => (
              <div
                key={link.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg group hover:border-purple-300 hover:shadow-md transition-all shadow-sm"
              >
                <div className="flex items-center space-x-3 overflow-hidden flex-1">
                  <div className="p-2 rounded-md flex-shrink-0 bg-blue-50 text-blue-600">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <div className="truncate flex-1">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-gray-800 hover:text-purple-600 hover:underline truncate block"
                    >
                      {link.title}
                    </a>
                    <p className="text-xs font-medium text-gray-500 truncate">{link.url}</p>
                  </div>
                </div>
                {isEditing ? (
                  <button
                    onClick={() => deleteLink(link.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors flex-shrink-0 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-md transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 ml-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}
            {links.length === 0 && (
              <div className="h-full flex items-center justify-center py-6">
                <p className="text-xs font-semibold text-gray-400">リンクがありません</p>
              </div>
            )}
          </div>
          {isEditing && (
            <div className="flex flex-col space-y-2 mt-auto bg-white p-3 rounded-lg border-2 border-purple-100 transition-all">
              <input
                type="text"
                className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-sm outline-none text-gray-800 placeholder-gray-400 focus:border-purple-300 focus:bg-white"
                placeholder="表示名（省略時はURLを表示）"
                value={newLinkTitle}
                onChange={(e) => setNewLinkTitle(e.target.value)}
              />
              <input
                type="url"
                className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-sm outline-none text-gray-800 placeholder-gray-400 focus:border-purple-300 focus:bg-white"
                placeholder="URL (https://...)"
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addLink(); }}
              />
              <button
                onClick={addLink}
                disabled={!newLinkUrl.trim()}
                className="w-full mt-1 py-2 bg-purple-100 text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-xs font-bold hover:bg-purple-200 transition-colors flex items-center justify-center"
              >
                <Plus className="w-3 h-3 mr-1" /> 追加
              </button>
            </div>
          )}
        </div>
      </div>

      {/* メモ・特記事項（画面下部に移動） */}
      <div className="mt-8">
        <AssistTip text={"このフェーズの自由記述メモ。\n背景・先方コメント・社内向け申し送り・注意事項などを残せます。\n編集モードで複数行入力可。Markdown はサポートされていません。"} side="bottom">
          <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center cursor-help">
            <FileText className="w-4 h-4 mr-2 text-purple-500" />
            メモ・特記事項
          </h4>
        </AssistTip>
        {isEditing ? (
          <textarea
            className="w-full h-32 p-5 bg-white border-2 border-purple-200 rounded-xl text-gray-800 text-sm focus:outline-none focus:ring-4 focus:ring-purple-50 transition-all resize-none leading-relaxed shadow-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="このフェーズに関するメモや申し送り事項を入力..."
          />
        ) : (
          <div className="w-full min-h-[8rem] p-5 bg-gray-50/80 border border-gray-100 rounded-xl text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
            {notes || <span className="text-gray-400 font-medium">メモはありません。</span>}
          </div>
        )}
      </div>

      {/* 次フェーズ確認ダイアログ */}
      {showConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-96 animate-in zoom-in-95 duration-200">
            <div className="flex items-center mb-4 text-purple-600">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center mr-3">
                <ChevronRight className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-gray-900">フェーズの進行</h4>
            </div>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              登録されているタスクが全て完了しています。<br /><br />
              ステータスを次のフェーズ「<span className="font-bold text-purple-700">{nextPhaseLabel || ''}</span>」へ進めてよろしいですか？
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-5 py-2 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => { setShowConfirm(false); onAdvancePhase(); }}
                className="px-5 py-2 rounded-full text-sm font-bold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm flex items-center"
              >
                はい、進める
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 前フェーズへ戻る 確認ダイアログ */}
      {showRevertConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-96 animate-in zoom-in-95 duration-200">
            <div className="flex items-center mb-4 text-amber-600">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mr-3">
                <ChevronLeft className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-gray-900">フェーズを戻す</h4>
            </div>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              ステータスを一つ前のフェーズ「<span className="font-bold text-amber-700">{prevPhaseLabel || ''}</span>」へ戻してよろしいですか？<br />
              <span className="text-xs text-gray-400">※ 各フェーズの入力内容（メモ・タスク・リンク）は保持されます。</span>
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRevertConfirm(false)}
                className="px-5 py-2 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => { setShowRevertConfirm(false); onRevertPhase && onRevertPhase(); }}
                className="px-5 py-2 rounded-full text-sm font-bold bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-sm flex items-center"
              >
                はい、戻す
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 本流へ合流 確認ダイアログ */}
      {showSkipConfirm && mainSkipTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-96 animate-in zoom-in-95 duration-200">
            <div className="flex items-center mb-4 text-sky-600">
              <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center mr-3">
                <ChevronRight className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-gray-900">本流フローへ合流</h4>
            </div>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              現在のサブフローを離脱し、本流の「<span className="font-bold text-sky-700">{mainSkipTarget}</span>」へ進みます。<br />
              <span className="text-xs text-gray-400">※ サブフローのメモ・タスク・リンクは保持されます。後でフェーズ進捗の図から再度参照可能です。</span>
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSkipConfirm(false)}
                className="px-5 py-2 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => { setShowSkipConfirm(false); onSkipToMain && onSkipToMain(); }}
                className="px-5 py-2 rounded-full text-sm font-bold bg-sky-600 text-white hover:bg-sky-700 transition-colors shadow-sm flex items-center"
              >
                はい、進む
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default PhaseDetailPanel;