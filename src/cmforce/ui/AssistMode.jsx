import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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

const SAFE_MARGIN = 8;          // 画面端からの最小マージン
const TIP_MAX_WIDTH = 280;
const GAP = 8;                  // 要素とツールチップの距離

/**
 * アシストツールチップ。
 * Portal で document.body に出すため、親の overflow:hidden に切り取られない。
 * 画面端付近では自動でサイドを反転 (top↔bottom, left↔right) し、
 * さらに水平/垂直方向に画面内へクランプして見切れを防ぐ。
 */
export function AssistTip({ text, side = 'bottom', children, wrapClassName = '', wrapStyle }) {
  // ※ Rules of Hooks: 早期 return より前に全ての hook を呼び出すこと。
  //   enabled の切替で hook 数が変動すると React error #310 になる。
  const { enabled } = useContext(AssistContext);
  const wrapperRef = useRef(null);
  const tipRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, side });

  // 開いている間にウィンドウが動いたら閉じる（位置ずれ防止）
  // 早期 return 前に置く必要があるため、内部で open フラグをチェック。
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  // wrapClassName に absolute/fixed/sticky が含まれているなら relative を付与しない
  // (Tailwind position 系クラスが衝突して意図しない方が適用される事故を防ぐ)
  const hasOuterPositioning = /\b(absolute|fixed|sticky)\b/.test(wrapClassName);
  const baseClass = hasOuterPositioning ? 'group inline-flex' : 'relative group inline-flex';

  // モード OFF または text 未指定 → ラッパーのみ返す
  if (!enabled || !text) {
    if (wrapClassName || wrapStyle) {
      return <span className={wrapClassName} style={wrapStyle}>{children}</span>;
    }
    return children;
  }

  // 表示位置を計算。ツールチップ実寸を計測してクランプ・反転する。
  const computePos = (preferredSide) => {
    if (!wrapperRef.current) return null;
    const rect = wrapperRef.current.getBoundingClientRect();
    const tipEl = tipRef.current;
    const tipW = tipEl ? Math.min(tipEl.offsetWidth, TIP_MAX_WIDTH) : TIP_MAX_WIDTH;
    const tipH = tipEl ? tipEl.offsetHeight : 80;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let actualSide = preferredSide;
    // 自動反転: 入りきらない方向だったら逆に
    if (preferredSide === 'top' && rect.top < tipH + GAP + SAFE_MARGIN) actualSide = 'bottom';
    if (preferredSide === 'bottom' && rect.bottom + tipH + GAP > vh - SAFE_MARGIN) actualSide = 'top';
    if (preferredSide === 'left' && rect.left < tipW + GAP + SAFE_MARGIN) actualSide = 'right';
    if (preferredSide === 'right' && rect.right + tipW + GAP > vw - SAFE_MARGIN) actualSide = 'left';

    let top = 0;
    let left = 0;
    if (actualSide === 'bottom') {
      top = rect.bottom + GAP;
      left = rect.left + rect.width / 2 - tipW / 2;
    } else if (actualSide === 'top') {
      top = rect.top - GAP - tipH;
      left = rect.left + rect.width / 2 - tipW / 2;
    } else if (actualSide === 'right') {
      top = rect.top + rect.height / 2 - tipH / 2;
      left = rect.right + GAP;
    } else { // left
      top = rect.top + rect.height / 2 - tipH / 2;
      left = rect.left - GAP - tipW;
    }

    // 画面内へクランプ
    left = Math.max(SAFE_MARGIN, Math.min(vw - SAFE_MARGIN - tipW, left));
    top  = Math.max(SAFE_MARGIN, Math.min(vh - SAFE_MARGIN - tipH, top));

    return { top, left, side: actualSide };
  };

  const handleEnter = () => {
    setOpen(true);
    // 1フレーム後にツールチップ実寸を計測して再配置
    requestAnimationFrame(() => {
      const next = computePos(side);
      if (next) setPos(next);
    });
  };

  const handleLeave = () => setOpen(false);

  return (
    <>
      <span
        ref={wrapperRef}
        className={`${baseClass} ${wrapClassName}`}
        style={wrapStyle}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onFocus={handleEnter}
        onBlur={handleLeave}
      >
        {children}
      </span>
      {open && createPortal(
        <span
          ref={tipRef}
          role="tooltip"
          className="pointer-events-none fixed z-[1000] bg-gray-900 text-white text-xs leading-relaxed font-medium px-3 py-2 rounded-lg shadow-xl whitespace-pre-line"
          style={{ top: pos.top, left: pos.left, maxWidth: TIP_MAX_WIDTH, width: 'max-content' }}
        >
          {text}
        </span>,
        document.body
      )}
    </>
  );
}
