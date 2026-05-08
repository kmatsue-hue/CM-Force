import React, { createContext, useContext } from 'react';

// アシストモードのオン/オフを子ツリーへ伝える Context。
const AssistContext = createContext({ enabled: false });

export function AssistProvider({ enabled, children }) {
  return (
    <AssistContext.Provider value={{ enabled }}>
      {children}
    </AssistContext.Provider>
  );
}

export function useAssistMode() {
  return useContext(AssistContext);
}

/**
 * ボタンやタブを <AssistTip text="..."> でラップすると、
 * アシストモード ON のときだけホバーで吹き出しを表示する。
 *
 * - ラップ要素は inline-flex（既存レイアウトを壊しにくい）
 * - position は side prop で 'bottom' | 'top' | 'right' | 'left' 切替可
 * - aria-describedby は付与しない（簡易実装）
 *
 * 使い方:
 *   <AssistTip text={"案件を1つの画面で管理\n編集・進行・失注の操作はここから"}>
 *     <button>案件詳細</button>
 *   </AssistTip>
 */
export function AssistTip({ text, side = 'bottom', children, wrapClassName = '', wrapStyle }) {
  const { enabled } = useContext(AssistContext);
  if (!enabled || !text) {
    // OFF 時でもラッパーで配置を司っているケース（absolute 等）がある可能性に備え、
    // wrapClassName / wrapStyle が指定されていればラッパーは残す。
    if (wrapClassName || wrapStyle) {
      return <span className={wrapClassName} style={wrapStyle}>{children}</span>;
    }
    return children;
  }

  const tipPos = {
    bottom: 'left-1/2 top-full mt-2 -translate-x-1/2',
    top:    'left-1/2 bottom-full mb-2 -translate-x-1/2',
    right:  'left-full top-1/2 ml-2 -translate-y-1/2',
    left:   'right-full top-1/2 mr-2 -translate-y-1/2',
  }[side] || 'left-1/2 top-full mt-2 -translate-x-1/2';

  const arrowPos = {
    bottom: 'left-1/2 -top-1 -translate-x-1/2',
    top:    'left-1/2 -bottom-1 -translate-x-1/2',
    right:  'top-1/2 -left-1 -translate-y-1/2',
    left:   'top-1/2 -right-1 -translate-y-1/2',
  }[side] || 'left-1/2 -top-1 -translate-x-1/2';

  // wrapClassName に absolute/fixed/sticky が含まれているなら relative を付与しない
  // (Tailwind では position 系クラスが衝突すると CSS 順序勝ちで意図しない方が適用される)
  const hasOuterPositioning = /\b(absolute|fixed|sticky)\b/.test(wrapClassName);
  const baseClass = hasOuterPositioning ? 'group inline-flex' : 'relative group inline-flex';
  return (
    <span className={`${baseClass} ${wrapClassName}`} style={wrapStyle}>
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-[300] ${tipPos} hidden group-hover:block w-max max-w-[280px] bg-gray-900 text-white text-xs leading-relaxed font-medium px-3 py-2 rounded-lg shadow-xl whitespace-pre-line`}
      >
        {text}
        <span className={`absolute ${arrowPos} w-2 h-2 bg-gray-900 rotate-45`} />
      </span>
    </span>
  );
}
