import React, { useState, useMemo } from 'react';
import {
  Edit,
  Filter,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { ROLES } from '../data/roles.js';
import { DEPARTMENT_OPTIONS, nextStaffNumber } from '../data/staff.js';
import { CHAR_CLASSES } from '../../quest/data/users.js';
import CharacterIcon from '../../quest/ui/CharacterIcon.jsx';
import Card from '../ui/Card.jsx';

// --- 担当者管理ビュー（営業企画専用） ---

const StaffView = ({ staff, onSave, onDelete }) => {
  const [editing, setEditing] = useState(null); // 編集中の id（'new' なら新規）
  const [draft, setDraft] = useState({ staffNumber: '', name: '', department: ROLES.EIGYO, questCharacterType: 'hero', phone: '', email: '', note: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const startNew = () => {
    setDraft({ staffNumber: nextStaffNumber(staff), name: '', department: ROLES.EIGYO, questCharacterType: 'hero', phone: '', email: '', note: '' });
    setEditing('new');
  };
  const startEdit = (s) => {
    setDraft({
      staffNumber: s.staffNumber,
      name: s.name,
      department: s.department,
      questCharacterType: s.questCharacterType || 'hero',
      phone: s.phone || '',
      email: s.email || '',
      note: s.note || '',
    });
    setEditing(s.id);
  };
  const cancel = () => { setEditing(null); };
  const submit = (e) => {
    e?.preventDefault();
    if (!draft.name.trim()) return;
    const id = editing === 'new' ? `STF-${String(Date.now()).slice(-6)}` : editing;
    onSave({ id, ...draft });
    setEditing(null);
  };
  const changeQuestJob = (member, questCharacterType) => {
    onSave({ ...member, questCharacterType });
  };

  const filtered = useMemo(() => {
    return staff.filter(s => {
      if (deptFilter && s.department !== deptFilter) return false;
      if (searchTerm) {
        const t = searchTerm.toLowerCase();
        return [s.staffNumber, s.name, s.phone, s.email, s.note].some(v => (v || '').toLowerCase().includes(t));
      }
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name, 'ja'));
  }, [staff, searchTerm, deptFilter]);

  return (
    <div className="space-y-6">
      <header className="mobile-page-hero flex flex-wrap items-end justify-between gap-6 rounded-[28px] border border-[#e4e4df] bg-white/80 px-6 py-8 sm:px-10 sm:py-12">
        <div>
          <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.2em] text-gray-400">People directory</p>
          <h1 className="text-4xl font-black text-black tracking-[-0.045em] sm:text-6xl">担当者管理</h1>
          <p className="text-gray-500 text-sm mt-4">営業企画専用 ・ 連絡先、所属、Kaientai Questの職業を管理します。</p>
        </div>
        <button
          onClick={startNew}
          className="px-5 py-2.5 bg-black text-white rounded-full text-sm font-bold flex items-center hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" /> 担当者を追加
        </button>
      </header>

      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="名前・連絡先・メモで検索..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-300"
          >
            <option value="">すべての部署</option>
            {DEPARTMENT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <span className="text-xs font-semibold text-gray-400 ml-1 tabular-nums">{filtered.length} 名</span>
        </div>

        <div className="space-y-2 sm:hidden">
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm font-medium text-gray-400">担当者が登録されていません</p>
          )}
          {filtered.map(s => (
            <div key={s.id} className="rounded-2xl border border-gray-100 bg-[#fafaf8] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-extrabold text-white">
                  {s.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-gray-900">{s.name}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">{s.department}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-purple-700">{s.staffNumber}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-purple-100 bg-purple-50/60 p-2.5">
                    <CharacterIcon type={s.questCharacterType || 'hero'} size={38} />
                    <label className="min-w-0 flex-1">
                      <span className="mb-1 block text-[10px] font-bold text-purple-700">Kaientai Quest 職業</span>
                      <select
                        value={s.questCharacterType || 'hero'}
                        onChange={event => changeQuestJob(s, event.target.value)}
                        className="w-full rounded-lg border border-purple-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-300"
                      >
                        {CHAR_CLASSES.map(character => (
                          <option key={character.type} value={character.type}>{character.name}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <p className="mt-2 break-all text-xs text-gray-600">{s.phone || '電話番号未登録'}</p>
                  <p className="mt-1 break-all text-xs text-gray-500">{s.email || 'メール未登録'}</p>
                  {s.note && <p className="mt-2 text-xs leading-relaxed text-gray-400">{s.note}</p>}
                </div>
              </div>
              <div className="mt-3 flex justify-end gap-2 border-t border-gray-100 pt-3">
                <button onClick={() => startEdit(s)} className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700">
                  <Edit className="mr-1 inline h-3 w-3" />編集
                </button>
                <button onClick={() => { if (window.confirm(`${s.name} を削除しますか？`)) onDelete(s.id); }} className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600">
                  <Trash2 className="mr-1 inline h-3 w-3" />削除
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/60 border-y border-gray-100 text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">担当者番号</th>
                <th className="px-4 py-3 font-semibold">名前</th>
                <th className="px-4 py-3 font-semibold">所属</th>
                <th className="px-4 py-3 font-semibold">Quest職業</th>
                <th className="px-4 py-3 font-semibold">電話</th>
                <th className="px-4 py-3 font-semibold">メール</th>
                <th className="px-4 py-3 font-semibold">メモ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400 font-medium">担当者が登録されていません</td></tr>
              )}
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-purple-50/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-purple-700">{s.staffNumber}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center text-xs font-extrabold">
                        {s.name.charAt(0)}
                      </div>
                      <span className="font-bold text-gray-900">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full">{s.department}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <CharacterIcon type={s.questCharacterType || 'hero'} size={34} />
                      <select
                        value={s.questCharacterType || 'hero'}
                        onChange={event => changeQuestJob(s, event.target.value)}
                        className="min-w-[124px] rounded-lg border border-purple-100 bg-purple-50 px-2.5 py-1.5 text-xs font-bold text-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-300"
                        aria-label={`${s.name}のKaientai Quest職業`}
                      >
                        {CHAR_CLASSES.map(character => (
                          <option key={character.type} value={character.type}>{character.name}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 tabular-nums">{s.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{s.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{s.note || '—'}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => startEdit(s)} className="px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 border border-purple-100 rounded-full hover:bg-purple-100 mr-1.5">
                      <Edit className="w-3 h-3 inline mr-1" />編集
                    </button>
                    <button onClick={() => { if (window.confirm(`${s.name} を削除しますか？`)) onDelete(s.id); }} className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-full hover:bg-red-100">
                      <Trash2 className="w-3 h-3 inline mr-1" />削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 編集モーダル */}
      {editing && (
        <div className="mobile-sheet fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/40 p-3 backdrop-blur-sm sm:p-4">
          <form onSubmit={submit} className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-3">
              <h3 className="text-base font-bold text-gray-900">{editing === 'new' ? '担当者を追加' : '担当者を編集'}</h3>
              <button type="button" onClick={cancel} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 py-4">
              <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-[0.85fr_1.15fr]">
                <div>
                  <label className="mb-1 block text-xs font-bold text-gray-700">担当者番号 <span className="ml-1 text-[10px] font-normal text-gray-400">自動採番</span></label>
                  <input readOnly type="text" value={draft.staffNumber}
                    className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-3 py-2 font-mono text-sm font-bold text-purple-700" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-gray-700">名前 <span className="text-red-500">*</span></label>
                  <input required type="text" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}
                    placeholder="例：山田 太郎"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-700">所属</label>
                <select value={draft.department} onChange={e => setDraft({ ...draft, department: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-300">
                  {DEPARTMENT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                  <label className="block text-xs font-bold text-gray-700">Kaientai Quest 職業</label>
                  <span className="text-[10px] font-medium text-gray-400">キャラクターを選択</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 min-[520px]:grid-cols-4">
                  {CHAR_CLASSES.map(character => (
                    <button
                      key={character.type}
                      type="button"
                      onClick={() => setDraft({ ...draft, questCharacterType: character.type })}
                      className={`flex flex-col items-center rounded-xl border-2 px-1.5 py-2 text-[11px] font-bold leading-tight ${
                        draft.questCharacterType === character.type
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-100 bg-white text-gray-500'
                      }`}
                    >
                      <CharacterIcon type={character.type} size={30} className="mb-1" />
                      {character.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-gray-700">電話番号</label>
                  <input type="text" value={draft.phone} onChange={e => setDraft({ ...draft, phone: e.target.value })}
                    placeholder="例：090-1234-5678"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-gray-700">メール</label>
                  <input type="email" value={draft.email} onChange={e => setDraft({ ...draft, email: e.target.value })}
                    placeholder="例：yamada@example.com"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-700">メモ</label>
                <textarea rows={1} value={draft.note} onChange={e => setDraft({ ...draft, note: e.target.value })}
                  placeholder="担当範囲・備考など"
                  className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
            </div>
            <div className="flex shrink-0 justify-end gap-3 border-t border-gray-100 px-5 py-3">
              <button type="button" onClick={cancel} className="px-5 py-2 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-100">キャンセル</button>
              <button type="submit" className="px-5 py-2 rounded-full text-sm font-bold bg-purple-600 text-white hover:bg-purple-700 shadow-sm">保存する</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};


export default StaffView;
