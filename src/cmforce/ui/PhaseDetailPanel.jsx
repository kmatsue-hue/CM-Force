import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Check,
  CheckSquare,
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

const PhaseDetailPanel = ({ phase, data, isLost, onUpdate, currentProjectPhase, onAdvancePhase, nextPhaseLabel, isAtBranchPoint, canStartKaientaiHere, onStartKaientai, canStartMarginHere, onStartMargin, onAddProjectLog }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(data?.notes || '');
  const [tasks, setTasks] = useState(data?.tasks || []);
  const [newTaskText, setNewTaskText] = useState('');
  const [links, setLinks] = useState(data?.links || []);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [marginAmount, setMarginAmount] = useState(data?.marginAmount ?? '');
  const [marginScheduledDate, setMarginScheduledDate] = useState(data?.marginScheduledDate || '');
  const isMarginPaymentPhase = phase === 'マージン支払';
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
    setIsEditing(false);
    setNewTaskText('');
    setNewLinkUrl('');
    setNewLinkTitle('');
  }, [phase, data]);

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
    <div className="mt-10 border-t border-gray-100 pt-8 animate-in fade-in slide-in-from-top-4 duration-500 relative">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center tracking-tight">
          <div className="w-1.5 h-6 bg-purple-600 rounded-full mr-3"></div>
          {phase} <span className="ml-2 text-sm font-semibold text-gray-400 uppercase tracking-wider">Details</span>
        </h3>
        <div className="flex items-center space-x-3">
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
          {isCurrentPhase && !isLastPhase && (
            <div className="relative group">
              <button
                onClick={() => {
                  if (hasIncompleteTasks || isLost) return;
                  // 分岐ポイントでは確認ダイアログを挟まず直接モーダルへ
                  if (isAtBranchPoint) { onAdvancePhase(); return; }
                  setShowConfirm(true);
                }}
                disabled={isLost || hasIncompleteTasks}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all shadow-sm flex items-center ${
                  isLost || hasIncompleteTasks
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                    : 'bg-green-600 text-white hover:bg-green-700 shadow-md border border-green-600'
                }`}
              >
                {isAtBranchPoint ? '次フェーズへ進める（分岐選択）' : '次フェーズへ進める'}
                {!hasIncompleteTasks && !isLost && <ChevronRight className="w-4 h-4 ml-1" />}
              </button>
              {hasIncompleteTasks && !isLost && (
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-max bg-gray-800 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-lg pointer-events-none z-50">
                  未完了のタスクがあるため進めません
                </div>
              )}
            </div>
          )}
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
            <h4 className="text-xs font-bold text-gray-600 mb-2 flex items-center">
              <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-purple-500" />
              活動ログをすばやく追加
            </h4>
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

          {/* タスクリスト */}
          <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-100 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-gray-700 flex items-center">
                <CheckSquare className="w-4 h-4 mr-2 text-purple-500" />
                タスクリスト
              </h4>
              <span className="text-xs font-bold text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-200">
                {tasks.filter(t => t.completed).length} / {tasks.length}
              </span>
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
          <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
            <LinkIcon className="w-4 h-4 mr-2 text-purple-500" />
            関連リンク ({links.length})
          </h4>
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
        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
          <FileText className="w-4 h-4 mr-2 text-purple-500" />
          メモ・特記事項
        </h4>
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
    </div>
  );
};


export default PhaseDetailPanel;