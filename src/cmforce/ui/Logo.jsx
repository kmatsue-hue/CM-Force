import React, { useState } from 'react';
// Vite が hash 付き URL に変換するため import で参照する。
// public/ に置くと SPA リライトで HTML が PNG として 1年キャッシュされる事故が起きるので
// src/assets/ に置いて asset pipeline 経由でハッシュ化する。
import logoUrl from '../../assets/cm-force-logo.png';

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
      src={logoUrl}
      alt={alt}
      className={className}
      draggable={false}
      onError={() => setErrored(true)}
    />
  );
};

export default Logo;
