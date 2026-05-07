import React, { useState } from 'react';
import { LogIn } from 'lucide-react';
import { ROLE_LIST, ROLES } from '../data/roles.js';
import { ROLE_PASSWORDS } from '../data/auth.js';

const LoginScreen = ({ onLogin }) => {
  const [role, setRole] = useState(ROLES.KIKAKU);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    // 軽い遅延でブルートフォースを抑止（気休めだが体感も改善）
    setTimeout(() => {
      if (ROLE_PASSWORDS[role] === password) {
        onLogin(role);
      } else {
        setError('パスワードが正しくありません');
        setPassword('');
      }
      setBusy(false);
    }, 250);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-indigo-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-600 text-white mb-4 shadow-lg shadow-purple-600/25">
            <LogIn className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CM Force</h1>
          <p className="text-sm text-gray-500 mt-1">ロールとパスワードでログインしてください</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 space-y-5"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">所属ロール</label>
            <select
              value={role}
              onChange={(e) => { setRole(e.target.value); setError(''); }}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300"
            >
              {ROLE_LIST.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              autoFocus
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy || password.length === 0}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 text-white font-bold text-sm py-2.5 transition-colors hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogIn className="w-4 h-4" />
            {busy ? '確認中...' : 'ログイン'}
          </button>
        </form>

        <p className="text-[11px] text-gray-400 text-center mt-6">
          このログインはアクセスゲート用の簡易認証です。
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
