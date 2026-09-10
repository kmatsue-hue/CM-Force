import React, { useState } from 'react';
import { LogIn } from 'lucide-react';
import { ROLE_LIST, ROLES } from '../data/roles.js';
import { ROLE_PASSWORDS } from '../data/auth.js';
import Logo from '../ui/Logo.jsx';

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
    <div className="auralis-login min-h-screen px-4 sm:px-8 py-5 sm:py-7">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-[1400px] flex-col overflow-hidden rounded-[28px] border border-[#e0e0db] bg-white/80 shadow-[0_20px_70px_rgba(0,0,0,0.06)] backdrop-blur-sm">
        <header className="flex h-16 items-center justify-between border-b border-[#e7e7e2] px-5 sm:px-8">
          <Logo className="h-10 w-auto" />
          <span className="rounded-full bg-black px-4 py-2 text-[11px] font-bold text-white">Secure workspace</span>
        </header>
        <main className="grid flex-1 items-center gap-10 px-6 py-12 sm:px-12 lg:grid-cols-[1.25fr_.75fr] lg:px-20">
          <section className="max-w-3xl">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.22em] text-gray-400">Sales relationship platform</p>
            <h1 className="text-[clamp(3rem,7vw,6.8rem)] font-black leading-[0.98] tracking-[-0.065em] text-black">
              <span className="block">案件は、</span>
              <span className="mt-[0.14em] block">生きている。</span>
            </h1>
            <p className="mt-7 max-w-lg text-sm font-medium leading-7 text-gray-500 sm:text-base">
              案件、会話、次のアクションをひとつの場所へ。チームの判断を軽くし、顧客との時間に集中できる営業基盤です。
            </p>
            <div aria-hidden="true" className="pointer-events-none relative mt-10 h-32 w-full max-w-[640px] overflow-hidden sm:h-44">
              <div
                className="absolute inset-x-[10%] top-[28%] h-16 rounded-full blur-3xl sm:h-24"
                style={{
                  background: 'radial-gradient(circle, rgba(139,92,246,0.42) 0%, rgba(167,139,250,0.26) 38%, rgba(216,180,254,0.12) 58%, transparent 76%)',
                }}
              />
              <div
                className="absolute left-[24%] top-[12%] h-12 w-[40%] rounded-full blur-2xl sm:h-16"
                style={{
                  background: 'radial-gradient(circle, rgba(196,181,253,0.42) 0%, rgba(192,132,252,0.18) 54%, transparent 78%)',
                }}
              />
              <div className="absolute inset-x-[18%] bottom-[24%] h-px bg-gradient-to-r from-transparent via-violet-300/70 to-transparent opacity-80" />
            </div>
          </section>
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md justify-self-end rounded-[24px] border border-[#deded9] bg-white p-6 shadow-[0_18px_55px_rgba(0,0,0,0.07)] sm:p-8"
        >
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Welcome back</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-gray-950">CM Force にログイン</h2>
          </div>
          <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">所属ロール</label>
            <select
              value={role}
              onChange={(e) => { setRole(e.target.value); setError(''); }}
              className="w-full bg-[#f7f7f4] border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-500"
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
              className="w-full bg-[#f7f7f4] border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-500"
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
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-black text-white font-bold text-sm py-3 transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogIn className="w-4 h-4" />
            {busy ? '確認中...' : 'ログイン'}
          </button>
          </div>
          <p className="mt-6 text-center text-[11px] text-gray-400">
            このログインはアクセスゲート用の簡易認証です。
          </p>
        </form>
        </main>
        <footer className="flex items-center justify-between border-t border-[#e7e7e2] px-5 py-4 text-[10px] font-semibold text-gray-400 sm:px-8">
          <span>CM Force</span>
          <span className="inline-flex items-center gap-2"><i className="h-1.5 w-1.5 rounded-full bg-emerald-500" />System operational</span>
        </footer>
      </div>
    </div>
  );
};

export default LoginScreen;
