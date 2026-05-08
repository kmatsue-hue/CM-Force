import React, { useState } from 'react';

// CM Force ロゴ。public/cm-force-logo.png を参照する。
// Vite では public/ 配下のファイルはルートパス(/)で配信される。
// ファイルが存在しない・読み込み失敗時はテキストフォールバックを表示。
const Logo = ({ className = 'h-8 w-auto', alt = 'CM Force' }) => {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <span className={`inline-flex items-center font-extrabold tracking-tight text-gray-900 ${className}`}>
        CM Force
      </span>
    );
  }

  return (
    <img
      src="/cm-force-logo.png"
      alt={alt}
      className={className}
      draggable={false}
      onError={() => setErrored(true)}
    />
  );
};

export default Logo;
