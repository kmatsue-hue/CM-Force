import React from 'react';
import { AlertCircle, Check } from 'lucide-react';
import {
  PHASES,
  BRANCH_PHASE,
  MERGE_PHASE,
  KAIENTAI_SUB,
  MARGIN_BRANCH_PHASE,
  MARGIN_MERGE_PHASE,
  isBranchablePattern,
  isMarginBranchablePattern,
} from '../data/phases.js';
import { AssistTip } from './AssistMode.jsx';

// 各フェーズの説明（アシストモード時にホバー表示）
const PHASE_DESCRIPTIONS = {
  '案件発掘':         '見込み顧客や引き合いを最初に拾う段階。\n次の行動: 担当者・連絡先を案件メモに登録し、初回コンタクトを設定。',
  '案件スクリーニング': '予算・規模・本気度から進めるか判断する段階。\n次の行動: 案件ランク (A/B/C) を仮置き → ヒアリング項目を整理。',
  'EUとの商談':       'エンドユーザーと直接対話する段階。\n次の行動: 議事録をメモに残し「次回アクション日付」を活動ログに記録（進行に必須）。',
  '現地調査':         '導入予定先を実地で確認する段階。\n次の行動: 写真・図面リンクを添付、必要機材リストを作成。',
  '設計':            '構成・機器・配線を設計する段階。\n次の行動: 設計図 / 構成図のリンクを添付、社内レビュー予定を入れる。',
  '提案書／見積書提出': '正式な提案＋見積りを提出する段階。\n次の行動: 「想定全体売上」入力 もしくは 提案資料リンク添付（進行に必須）。',
  '販売契約締結':     '契約書を交わし受注確定させる段階。\n次の行動: 契約書ドラフト / 法務確認 / 押印スケジュールを決定。',
  '施工・納品':       '実際の機器設置・配線・テストを行う段階。\n次の行動: サブタスク（配線・設置・NW・テスト）を全完了させる（進行に必須）。',
  '一次保守':         '稼働開始後のフォロー期間。最終フェーズです。\n次の行動: 定期点検 / 障害対応 / 追加提案を別案件として起票。',
};

const phaseHint = (phase) => PHASE_DESCRIPTIONS[phase] ||
  `フェーズ「${phase}」をクリックすると右側の詳細パネルがこのフェーズの内容に切り替わります。`;

// アローダイヤグラム（詳細画面用）
// グループ定義:
//   介援隊      → PHASES[0..1]  (案件発掘・案件スクリーニング)  青枠
//   セットアップ → PHASES[2..8]  (EUとの商談〜一次保守)          朱色枠
const PHASE_GROUPS = [
  { label: '介援隊',      from: 0, to: 1, border: 'rgba(59,130,246,0.4)',  color: '#6b9fd4' },
  { label: 'セットアップ', from: 2, to: 8, border: 'rgba(224,90,43,0.4)',   color: '#d4845a' },
];

const ArrowDiagram = ({ currentPhase, selectedPhase, onSelectPhase, phaseDetails, kaientaiFlow, marginFlow, marginSteps = [], salesPattern }) => {
  const currentIndex = PHASES.indexOf(currentPhase);
  const N = PHASES.length; // 9
  const subActive = !!kaientaiFlow?.active;
  const subCompleted = !!kaientaiFlow?.completed;
  const branchableHere = isBranchablePattern(salesPattern);
  const branchPhaseIdx = PHASES.indexOf(BRANCH_PHASE);
  const showSubRow = branchableHere && (subActive || subCompleted || currentIndex >= branchPhaseIdx);

  // マージン支払サブフロー（上方向の分岐・全パターン対応）
  const marginBranchable = isMarginBranchablePattern(salesPattern);
  const marginActive    = !!marginFlow?.active;
  const marginCompleted = !!marginFlow?.completed;
  const marginBranchIdx = PHASES.indexOf(MARGIN_BRANCH_PHASE);
  const marginMergeIdx  = PHASES.indexOf(MARGIN_MERGE_PHASE);
  const showMarginRow   = marginBranchable && marginSteps.length > 0 && (marginActive || marginCompleted || currentIndex >= marginBranchIdx);

  const halfPct   = 100 / (2 * N);
  const progressW = (currentIndex / N) * 100;
  const overallPct = Math.round(((currentIndex + 1) / N) * 100);

  // 完了/合計（本流のみカウント。サブ中は本流カウントは branchPhaseIdx まで完了扱い）
  const doneCount = subActive ? branchPhaseIdx + 1 : currentIndex;
  const groupStyle = (from, to) => ({
    left:  `${(from / N) * 100}%`,
    right: `${((N - 1 - to) / N) * 100}%`,
  });

  return (
    <div className="w-full">
      <div className="w-full overflow-x-auto pb-4">
        <div className="relative min-w-[1020px] w-full pb-3">

          {/* ── マージン支払サブフロー（上方向の分岐） ── */}
          {showMarginRow && (() => {
            const startPct = (marginBranchIdx + 0.5) / N * 100;
            const endPct   = (marginMergeIdx + 0.5) / N * 100;
            const isPair   = marginSteps.length > 1;
            const midPct   = isPair ? (startPct + endPct) / 2 : startPct;
            const branchOn = marginActive || marginCompleted;
            const NODE_R = 28;
            const CONTAINER_H = 130;
            const NODE_CY = 106;       // 円下端を容器下端に合わせる（CONTAINER_H - NODE_R）
            return (
              <div className="relative" style={{ height: CONTAINER_H, marginBottom: -52 /* 上部ラベル領域とちょうど接続する程度に詰める */ }}>
                {/* 分岐ラベル（サブノードの上部） */}
                <div className="absolute z-10 flex items-center gap-1.5 text-[11px] font-extrabold tracking-widest uppercase whitespace-nowrap"
                     style={{
                       left: `${midPct}%`,
                       top: 8,
                       transform: 'translateX(-50%)',
                       color: branchOn ? '#c2410c' : '#94a3b8',
                     }}>
                  <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: branchOn ? '#f97316' : '#fed7aa' }} />
                  マージン支払サブフロー
                  {!isPair && <span className="ml-1 text-[9px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full">パターン②: ゴール</span>}
                </div>

                {/* 水平線（pair の場合のみ。サブノード中心を貫通） */}
                {isPair && (
                  <div
                    className="absolute pointer-events-none rounded-full"
                    style={{
                      top: NODE_CY - 1.5,
                      left: `${startPct}%`,
                      right: `${100 - endPct}%`,
                      height: 3,
                      zIndex: 0,
                      opacity: 0.45,
                      background: branchOn
                        ? 'linear-gradient(to right, #f97316, #fb923c)'
                        : 'repeating-linear-gradient(to right, #fed7aa 0 4px, transparent 4px 8px)',
                    }}
                  />
                )}

                {/* サブフェーズ（各ノードの中心を縦パイプ位置=横線の角に揃える） */}
                {marginSteps.map((mPh, i) => {
                  const xPct = isPair ? (i === 0 ? startPct : endPct) : startPct;
                  const isCurrentM = marginActive && marginFlow.sub === i;
                  const isDoneM    = marginCompleted || (marginActive && i < marginFlow.sub);
                  const isSelM     = selectedPhase === mPh;
                  const incomplete = (phaseDetails?.[mPh]?.tasks || []).filter(t => !t.completed).length;
                  return (
                    <AssistTip
                      key={mPh}
                      text={mPh === 'マージン支払'
                        ? 'マージン支払フェーズ。\n金額・支払予定日を入力してから次へ進めます。'
                        : '販売店への支払フェーズ。\n振込/支払証憑のリンクを残しておくと後で楽です。'}
                      side="top"
                      wrapClassName="absolute"
                      wrapStyle={{ bottom: CONTAINER_H - (NODE_CY + NODE_R), left: `${xPct}%`, transform: 'translateX(-50%)', zIndex: 10 }}
                    >
                    <button
                      onClick={() => onSelectPhase(mPh)}
                      className="flex flex-col items-center group focus:outline-none"
                    >
                      <div className="mt-1 h-4 mb-2">
                        {isCurrentM && (
                          <span className="text-[9px] font-extrabold text-orange-700 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full">進行中</span>
                        )}
                        {!isDoneM && !isCurrentM && incomplete > 0 && (
                          <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-md">未完 {incomplete}</span>
                        )}
                      </div>
                      <div className={[
                        'mb-2 text-[11px] text-center px-2 py-1 rounded-md leading-snug whitespace-nowrap',
                        isSelM     ? 'bg-orange-100 text-orange-900 font-extrabold ring-1 ring-orange-300/60' :
                        isCurrentM ? 'text-orange-700 font-bold' :
                        isDoneM    ? 'text-gray-700 font-semibold' : 'text-orange-400 font-medium',
                      ].join(' ')}>
                        {mPh}
                      </div>
                      <div className="relative w-12 h-12 flex items-center justify-center">
                        {isCurrentM && (
                          <>
                            <span className="absolute inset-0 rounded-full bg-orange-400 opacity-60 animate-ping" />
                            <span className="absolute inset-0 rounded-full bg-orange-500 opacity-30 animate-ping" style={{ animationDelay: '0.6s' }} />
                          </>
                        )}
                        <div className={[
                          'relative z-10 flex items-center justify-center rounded-full font-extrabold transition-all duration-300',
                          'w-12 h-12 text-sm',
                          isDoneM    ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-200' : '',
                          isCurrentM ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-2xl shadow-orange-300 ring-4 ring-white outline outline-2 outline-orange-300 scale-110' : '',
                          (!isDoneM && !isCurrentM) ? 'bg-white text-orange-400 border-2 border-orange-200 group-hover:border-orange-400' : '',
                        ].join(' ')}>
                          {isDoneM
                            ? <Check className="w-5 h-5 text-emerald-300 drop-shadow-[0_0_6px_rgba(52,211,153,1)]" strokeWidth={3.5} />
                            : <span className="text-xs">M.{i + 1}</span>}
                        </div>
                      </div>
                    </button>
                    </AssistTip>
                  );
                })}
              </div>
            );
          })()}

          <div className="relative pt-7">

          {/* ── フェーズ ── */}
          <div className="relative flex items-start w-full pt-6 pb-2">
            {/* 背景線（円中心 = pt-6(24) + 上部ラベル領域(96) + 円半径(26) = 146） */}
            <div className="absolute h-1 bg-gray-100 rounded-full pointer-events-none"
                 style={{ top: 24 + 96 + 16 + 32 - 2, left: `${halfPct}%`, right: `${halfPct}%`, opacity: 0.6 }} />
            {/* 進捗線（グラデーション） */}
            {currentIndex > 0 && (
              <div className="absolute h-1 bg-gradient-to-r from-purple-400 via-purple-600 to-indigo-600 rounded-full pointer-events-none transition-all duration-700"
                   style={{ top: 24 + 96 + 16 + 32 - 2, left: `${halfPct}%`, width: `${progressW}%`, opacity: 0.5 }} />
            )}

            {PHASES.map((phase, index) => {
              const isCompleted = index < currentIndex;
              const isActive    = index === currentIndex;
              const isPending   = index > currentIndex;
              const isSelected  = selectedPhase === phase;
              const incomplete  = (phaseDetails?.[phase]?.tasks || []).filter(t => !t.completed).length;
              const taskTotal   = (phaseDetails?.[phase]?.tasks || []).length;
              const isBranchAnchor = showSubRow && (index === branchPhaseIdx || index === PHASES.indexOf(MERGE_PHASE));
              // マージン縦パイプは「施工・納品」のみから上へ伸ばす（一次保守には繋げない）
              const isMarginAnchor = showMarginRow && index === marginBranchIdx;

              return (
                <AssistTip key={phase} text={phaseHint(phase)} side={index < N / 2 ? 'right' : 'left'} wrapClassName="flex-1">
                <button
                  onClick={() => onSelectPhase(phase)}
                  className="relative flex flex-col items-center w-full group focus:outline-none px-1"
                >
                  {/* 上部ラベル領域（タスク → ステータス → フェーズ名 / 下端を円に揃える） */}
                  <div className="flex flex-col items-center justify-end h-[96px] w-full mb-4">
                    {/* 未完了タスク */}
                    <div className="h-5 mb-1">
                      {incomplete > 0 && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5" />未完 {incomplete}
                        </span>
                      )}
                    </div>
                    {/* ステータス */}
                    <div className="h-5 mb-1.5 flex items-center">
                      {isActive && (
                        <span className="text-[10px] font-extrabold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">進行中</span>
                      )}
                      {isPending && incomplete === 0 && taskTotal === 0 && (
                        <span className="text-[10px] font-bold text-gray-400">—</span>
                      )}
                    </div>
                    {/* フェーズ名 */}
                    <div className={[
                      'text-xs text-center px-2 py-1 rounded-lg leading-snug max-w-[110px] transition-all',
                      isSelected  ? 'bg-purple-100 text-purple-900 font-extrabold ring-1 ring-purple-300/60 shadow-sm' :
                      isActive    ? 'text-purple-700 font-bold' :
                      isCompleted ? 'text-gray-700 font-semibold' :
                                    'text-gray-400 font-medium',
                    ].join(' ')}>
                      {phase}
                    </div>
                  </div>

                  {/* 円ノード（ラッパーに pipe を相対配置） */}
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    {/* 進行中の波紋（ノード全体から拡散） */}
                    {isActive && (
                      <>
                        <span className="absolute inset-0 rounded-full bg-purple-400 opacity-60 animate-ping" />
                        <span className="absolute inset-0 rounded-full bg-purple-500 opacity-30 animate-ping" style={{ animationDelay: '0.6s' }} />
                      </>
                    )}
                    <div className={[
                      'relative z-10 flex items-center justify-center rounded-full font-extrabold transition-all duration-300',
                      'w-16 h-16 text-base',
                      isCompleted ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-200' : '',
                      isActive    ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-2xl shadow-purple-300 ring-4 ring-white outline outline-2 outline-purple-300 scale-110' : '',
                      isPending   ? 'bg-white text-gray-400 border-2 border-gray-200 group-hover:border-purple-300 group-hover:text-purple-500 group-hover:scale-105' : '',
                    ].join(' ')}>
                      {isCompleted
                        ? <Check className="w-6 h-6 text-emerald-300 drop-shadow-[0_0_6px_rgba(52,211,153,1)]" strokeWidth={3.5} />
                        : <span>{index + 1}</span>}
                    </div>

                    {/* 介援隊サブフローへの縦パイプ（円下端から下に伸ばす） */}
                    {isBranchAnchor && (
                      <div
                        className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                        style={{
                          top: '100%',  // 円の直下から開始
                          width: 3,
                          height: 80,
                          zIndex: 0,
                          opacity: 0.45,
                          background: subActive || subCompleted
                            ? 'linear-gradient(to bottom, #3b82f6, #6366f1)'
                            : 'repeating-linear-gradient(to bottom, #cbd5e1 0 4px, transparent 4px 8px)',
                          borderRadius: 9999,
                        }}
                      />
                    )}

                    {/* マージン支払サブフローへの縦パイプ（円上端から上に伸ばす・オレンジ） */}
                    {isMarginAnchor && (
                      <div
                        className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                        style={{
                          bottom: '100%',
                          width: 3,
                          height: 130, // 本流円上端 → マージン水平線まで（コンパクト化）

                          zIndex: 0,
                          opacity: 0.45,
                          background: marginActive || marginCompleted
                            ? 'linear-gradient(to top, #f97316, #fb923c)'
                            : 'repeating-linear-gradient(to top, #fed7aa 0 4px, transparent 4px 8px)',
                          borderRadius: 9999,
                        }}
                      />
                    )}
                  </div>
                </button>
                </AssistTip>
              );
            })}
          </div>

          {/* ── 介援隊サブフロー ── */}
          {showSubRow && (() => {
            const startPct = (branchPhaseIdx + 0.5) / N * 100;
            const endPct   = (PHASES.indexOf(MERGE_PHASE) + 0.5) / N * 100;
            const midPct   = (startPct + endPct) / 2;
            const branchActive = subActive || subCompleted;
            const stroke = branchActive ? '#2563eb' : '#cbd5e1';
            // ノード中心の Y 位置（px）。本流ノードから垂直パイプで降りた先で水平線と接続。
            const NODE_R  = 28;          // 円半径 (w-12 = 48px)
            const NODE_CY = 80;          // サブ行内のノード中心 Y
            const CONTAINER_H = 220;     // ノード下のラベル + 分岐ラベル領域
            return (
              <div className="relative" style={{ height: CONTAINER_H, marginTop: -6 /* 縦パイプ下端と水平線をぴったり接続 */ }}>
                {/* 水平線（サブノード中心を貫通し、本流からの縦パイプと接続） */}
                <div
                  className="absolute pointer-events-none rounded-full"
                  style={{
                    top: NODE_CY - 1.5,
                    left: `${startPct}%`,
                    right: `${100 - endPct}%`,
                    height: 3,
                    zIndex: 0,
                    opacity: 0.45,
                    background: branchActive
                      ? 'linear-gradient(to right, #3b82f6, #6366f1)'
                      : 'repeating-linear-gradient(to right, #cbd5e1 0 4px, transparent 4px 8px)',
                  }}
                />

                {/* サブフェーズ（円中心が NODE_CY に来るよう top で揃える） */}
                <div className="absolute inset-x-0 flex" style={{ top: NODE_CY - NODE_R, paddingLeft: `${startPct}%`, paddingRight: `${100 - endPct}%` }}>
                  <div className="flex items-start w-full justify-around gap-4">
                    {KAIENTAI_SUB.map((subPh, i) => {
                      const isCurrentSub = subActive && kaientaiFlow.sub === i;
                      const isDoneSub = subCompleted || (subActive && i < kaientaiFlow.sub);
                      const isSelectedSub = selectedPhase === subPh;
                      const incomplete = (phaseDetails?.[subPh]?.tasks || []).filter(t => !t.completed).length;
                      return (
                        <AssistTip
                          key={subPh}
                          text={subPh.includes('見積書')
                            ? '介援隊サブフロー：見積書提出。\n介援隊本部経由のスキーム時のみ通過するステップです。'
                            : '介援隊サブフロー：納品。\nこのステップ完了後、本流の「施工・納品」へ合流します。'}
                          side="bottom"
                        >
                        <button
                          onClick={() => onSelectPhase(subPh)}
                          className="relative flex flex-col items-center group focus:outline-none"
                        >
                          <div className="relative w-12 h-12 flex items-center justify-center">
                            {/* 進行中の波紋（ノード全体から拡散） */}
                            {isCurrentSub && (
                              <>
                                <span className="absolute inset-0 rounded-full bg-blue-400 opacity-60 animate-ping" />
                                <span className="absolute inset-0 rounded-full bg-blue-500 opacity-30 animate-ping" style={{ animationDelay: '0.6s' }} />
                              </>
                            )}
                            <div className={[
                              'relative z-10 flex items-center justify-center rounded-full font-extrabold transition-all duration-300',
                              'w-12 h-12 text-sm',
                              isDoneSub    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200' : '',
                              isCurrentSub ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-2xl shadow-blue-300 ring-4 ring-white outline outline-2 outline-blue-300 scale-110' : '',
                              (!isDoneSub && !isCurrentSub) ? 'bg-white text-blue-400 border-2 border-blue-200 group-hover:border-blue-400' : '',
                            ].join(' ')}>
                              {isDoneSub
                                ? <Check className="w-5 h-5 text-emerald-300 drop-shadow-[0_0_6px_rgba(52,211,153,1)]" strokeWidth={3.5} />
                                : <span className="text-xs">6.{i + 1}</span>}
                            </div>
                          </div>
                          <div className={[
                            'mt-2 text-[11px] text-center px-2 py-1 rounded-md leading-snug whitespace-nowrap',
                            isSelectedSub ? 'bg-blue-100 text-blue-900 font-extrabold ring-1 ring-blue-300/60' :
                            isCurrentSub  ? 'text-blue-700 font-bold' :
                            isDoneSub     ? 'text-gray-700 font-semibold' : 'text-blue-400 font-medium',
                          ].join(' ')}>
                            {subPh.replace('介援隊：', '')}
                          </div>
                          <div className="mt-1 h-4">
                            {isCurrentSub && (
                              <span className="text-[9px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">進行中</span>
                            )}
                            {!isDoneSub && !isCurrentSub && incomplete > 0 && (
                              <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-md">未完 {incomplete}</span>
                            )}
                          </div>
                        </button>
                        </AssistTip>
                      );
                    })}
                  </div>
                </div>

                {/* 分岐ラベル（サブノードの下部に配置・枠なし） */}
                <div className="absolute z-10 flex items-center gap-1.5 text-[11px] font-extrabold tracking-widest uppercase whitespace-nowrap"
                     style={{
                       left: `${midPct}%`,
                       top: NODE_CY + NODE_R + 84,
                       transform: 'translateX(-50%)',
                       color: branchActive ? '#1d4ed8' : '#94a3b8',
                     }}>
                  <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: branchActive ? '#3b82f6' : '#cbd5e1' }} />
                  介援隊サブフロー
                </div>
              </div>
            );
          })()}
          </div>
        </div>
      </div>
    </div>
  );
};

// フェーズ詳細パネル

export default ArrowDiagram;
export { PHASE_GROUPS };