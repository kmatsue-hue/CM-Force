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
import { DEPARTMENT_OPTIONS } from '../data/staff.js';
import Card from '../ui/Card.jsx';

// --- 担当者管理ビュー（営業企画専用） ---

const StaffView = ({ staff, onSave, onDelete }) => {
  const [editing, setEditing] = useState(null); // 編集中の id（'new' なら新規）
  const [draft, setDraft] = useState({ name: '', department: ROLES.SETUP, phone: '', email: '', note: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const startNew = () => {
    setDraft({ name: '', department: ROLES.SETUP, phone: '', email: '', note: '' });
    setEditing('new');
  };
  const startEdit = (s) => {
    setDraft({ name: s.name, department: s.department, phone: s.phone || '', email: s.email || '', note: s.note || '' });
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

  const filtered = useMemo(() => {
    return staff.filter(s => {
      if (deptFilter && s.department !== deptFilter) return false;
      if (searchTerm) {
        const t = searchTerm.toLowerCase();
        return [s.name, s.phone, s.email, s.note].some(v => (v || '').toLowerCase().includes(t));
      }
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name, 'ja'));
  }, [staff, searchTerm, deptFilter]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">担当者管理</h1>
          <p className="text-gray-500 text-sm mt-1">営業企画専用 ・ 全担当者の連絡先と所属を管理します。</p>
        </div>
        <button
          onClick={startNew}
          className="px-5 py-2.5 bg-purple-600 text-white rounded-full text-sm font-bold flex items-center shadow-sm hover:bg-purple-700 transition-colors"
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

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/60 border-y border-gray-100 text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">名前</th>
                <th className="px-4 py-3 font-semibold">所属</th>
                <th className="px-4 py-3 font-semibold">電話</th>
                <th className="px-4 py-3 font-semibold">メール</th>
                <th className="px-4 py-3 font-semibold">メモ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400 font-medium">担当者が登録されていません</td></tr>
              )}
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-purple-50/40 transition-colors">
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
          <form onSubmit={submit} className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">{editing === 'new' ? '担当者を追加' : '担当者を編集'}</h3>
              <button type="button" onClick={cancel} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">名前 <span className="text-red-500">*</span></label>
                <input required type="text" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}
                  placeholder="例：山田 太郎"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">所属</label>
                <select value={draft.department} onChange={e => setDraft({ ...draft, department: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-300">
                  {DEPARTMENT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">電話番号</label>
                  <input type="text" value={draft.phone} onChange={e => setDraft({ ...draft, phone: e.target.value })}
                    placeholder="例：090-1234-5678"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">メール</label>
                  <input type="email" value={draft.email} onChange={e => setDraft({ ...draft, email: e.target.value })}
                    placeholder="例：yamada@example.com"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">メモ</label>
                <textarea rows={2} value={draft.note} onChange={e => setDraft({ ...draft, note: e.target.value })}
                  placeholder="担当範囲・備考など"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
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