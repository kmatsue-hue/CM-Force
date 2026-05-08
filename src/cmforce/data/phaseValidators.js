import { CONSTRUCTION_PHASE } from './constructionSubtasks.js';

// フェーズごとの「次に進めるための条件」レジストリ。
// 各エントリは { check, message } の配列。check が false を返したら違反。
// check のシグネチャ: (project, currentPhaseDetail) => boolean
//   project        : 案件オブジェクト全体
//   phaseDetail    : project.phaseDetails[fromPhase] ?? {}
// 新しいフェーズに条件を追加したい場合は、ここに1ブロック足すだけで OK。
export const PHASE_ADVANCE_RULES = {
  // フェーズ3: EU との商談 → 次回アクション日付の入力
  'EUとの商談': [
    {
      check: (project) => {
        const lastLog = (project.logs ?? [])[0];
        return Boolean(lastLog?.nextDate?.trim?.());
      },
      message: '商談から進むには、活動ログに「次回アクション日付」を入力してください。',
    },
  ],

  // フェーズ6: 提案書／見積書提出 → 想定金額 OR 関連リンク
  '提案書／見積書提出': [
    {
      check: (project, detail) => {
        const hasEstimate = Number(project?.financial?.expectedRevenue) > 0;
        const hasLink = Array.isArray(detail?.links) && detail.links.length > 0;
        return hasEstimate || hasLink;
      },
      message: '提案書／見積書提出から進むには、「想定全体売上」の入力 または「関連リンク」の添付が必要です。',
    },
  ],

  // フェーズ8: 施工・納品 → サブタスクが全て完了していること
  [CONSTRUCTION_PHASE]: [
    {
      check: (project, detail) => {
        const subs = detail?.subTasks;
        if (!Array.isArray(subs) || subs.length === 0) return false;
        return subs.every((s) => s.completed);
      },
      message: '施工・納品から進むには、施工サブタスクをすべて完了してください。',
    },
  ],
};

// 違反したルールのメッセージ配列を返す。空配列なら進行可能。
export function validatePhaseAdvance(project, fromPhase) {
  const rules = PHASE_ADVANCE_RULES[fromPhase] ?? [];
  if (rules.length === 0) return [];
  const detail = project?.phaseDetails?.[fromPhase] ?? {};
  return rules.filter((rule) => !rule.check(project, detail)).map((rule) => rule.message);
}
