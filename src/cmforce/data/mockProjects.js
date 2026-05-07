// --- モックデータ ---
export const mockProjects = [
  {
    id: 'PRJ-2026-001',
    name: '特別養護老人ホーム 陽だまり 介護システム導入',
    status: '提案書／見積書提出',
    startDate: '2026-03-01',
    expectedCloseDate: '2026-05-15',
    rank: 'A',
    salesPattern: 'パターン2（分離）',
    updatedAt: '2026-04-09T10:00:00',
    summary: '新規開設に伴う、ベッドセンサーおよびナースコール連動システムの全面導入。',
    picSetup: '山田 太郎',
    endUser: {
      companyName: '社会福祉法人 陽だまり会',
      retailerName: '〇〇事務機株式会社',
      department: '施設長',
      contact: '03-1234-5678',
      address: '東京都世田谷区...',
      needsAndIssues: '夜間のスタッフ負担軽減、見守り品質の向上'
    },
    financial: {
      expectedRevenue: 4500000,
      wholesalePriceSetup: 3000000,
      retailPrice: 4500000
    },
    phaseDetails: {
      '案件スクリーニング': { notes: '初回ヒアリング完了。予算感は合う。', links: [], tasks: [] },
      'EUとの商談': { notes: '製品デモ実施。反応良好。', links: [{ id: 'l1', title: 'デモ時ヒアリングシート', url: 'https://example.com/demo' }], tasks: [{ id: 1, text: '次回アポイントの調整', completed: true }] },
      '現地調査': { notes: '配線ルートの確認。一部天井裏のアクセスが悪い箇所あり。', links: [{ id: 'l2', title: '現地調査報告書', url: 'https://example.com/report' }], tasks: [{ id: 1, text: '施設の図面受領', completed: true }, { id: 2, text: '工事業者との日程調整', completed: true }] },
      '設計': { notes: '配線ルート図、システム構成図作成。', links: [{ id: 'l3', title: 'システム構成図_v1', url: 'https://example.com/design' }], tasks: [{ id: 1, text: '機器構成リストの作成', completed: true }, { id: 2, text: 'ネットワーク要件の定義', completed: false }] },
      '提案書／見積書提出': {
        notes: '最終見積書の提出完了。来週火曜日に先方理事会にて決裁予定。\n分離発注パターンでの契約書案も並行して準備中。',
        links: [
          { id: 'l4', title: '陽だまり様_御見積書_最終版', url: 'https://example.com/quote' },
          { id: 'l5', title: '導入提案書_陽だまり様', url: 'https://example.com/proposal' },
          { id: 'l6', title: '分離発注_契約書ドラフト', url: 'https://example.com/contract' }
        ],
        tasks: [
          { id: 1, text: '見積書の社内稟議通過', completed: true },
          { id: 2, text: '契約書ドラフトの法務チェック依頼', completed: true },
          { id: 3, text: '理事会決裁結果の確認連絡', completed: false },
          { id: 4, text: '分離発注用契約書の正式版作成', completed: false }
        ]
      },
    },
    logs: [
      { id: 1, date: '2026-04-09', type: 'activity', content: '最終見積書の提出完了。来週火曜日に先方理事会にて決裁予定。', nextAction: '決裁結果の確認', nextDate: '2026-04-14' },
      { id: 2, date: '2026-03-25', type: 'activity', content: '現地調査実施。配線ルートの確認完了。', nextAction: 'システム構成図の作成', nextDate: '2026-03-30' },
      { id: 3, date: '2026-03-10', type: 'activity', content: '初回のオンライン商談。ニーズのヒアリングを実施。', nextAction: '概算見積の提示', nextDate: '2026-03-15' },
    ]
  },
  {
    id: 'PRJ-2026-002',
    name: '株式会社CareTech 卸売基本契約',
    status: 'EUとの商談',
    startDate: '2026-04-01',
    expectedCloseDate: '2026-06-30',
    rank: 'B',
    salesPattern: 'パターン1（完全卸し）',
    updatedAt: '2026-04-10T09:30:00',
    summary: '新規代理店開拓。複数施設への展開を想定。',
    picSetup: '佐藤 次郎',
    endUser: {
      companyName: '株式会社CareTech',
      retailerName: '直販（代理店開拓）',
      department: '営業推進部',
      contact: 'caretech@example.com',
      address: '大阪府大阪市...',
      needsAndIssues: '取扱商材の拡充、利益率の改善'
    },
    financial: {
      expectedRevenue: 12000000,
      wholesalePriceSetup: 8000000,
    },
    phaseDetails: {
      '案件発掘': { notes: '展示会での名刺交換。後日アポ取得。', links: [], tasks: [] },
      '案件スクリーニング': { notes: '先方の主要顧客層が当社のターゲットと合致。卸売契約の前向きな検討。', links: [], tasks: [] },
      'EUとの商談': {
        notes: 'CareTech社の営業部門向けに製品デモを実施。高い関心を寄せていただいた。\nまずは基本契約（NDA含む）の締結を進める。',
        links: [
          { id: 'l1', title: 'CareTech_会社案内', url: 'https://example.com/caretech-info' },
          { id: 'l2', title: '卸売基本契約書_案', url: 'https://example.com/wholesale-contract' }
        ],
        tasks: [
          { id: 1, text: 'NDAの締結', completed: false },
          { id: 2, text: '卸条件の提示', completed: false }
        ]
      },
    },
    logs: [
      { id: 1, date: '2026-04-10', type: 'alert', content: 'NDAの締結期限が迫っています。', nextAction: '法務部へ契約書のリーガルチェック催促', nextDate: '2026-04-11' },
      { id: 2, date: '2026-04-05', type: 'activity', content: '製品デモ実施。非常に高い関心を寄せていただいた。', nextAction: 'NDA締結・卸条件の提示', nextDate: '2026-04-12' },
    ]
  },
  {
    id: 'PRJ-2026-003',
    name: '〇〇クリニック 紹介案件',
    status: '一次保守',
    startDate: '2025-12-01',
    expectedCloseDate: '2026-02-28',
    rank: 'A',
    salesPattern: 'パターン3（完全紹介）',
    updatedAt: '2026-04-01T15:00:00',
    summary: '紹介による直接販売。納品完了し保守フェーズへ移行。',
    picSetup: '鈴木 花子',
    endUser: {
      companyName: '医療法人 〇〇クリニック',
      retailerName: 'メディカルサプライ株式会社',
      department: '院長',
      contact: '06-9876-5432',
      address: '兵庫県神戸市...',
      needsAndIssues: '受付業務の効率化'
    },
    financial: {
      expectedRevenue: 800000,
      directSalesPrice: 800000,
      referralFeeRate: 15,
      referralFeeAmount: 120000
    },
    phaseDetails: {
      '施工・納品': { notes: '現地への納品、ネットワーク設定完了。受付スタッフへの操作説明実施。', links: [{ id: 'l1', title: '納品受領書_サイン済', url: 'https://example.com/receipt' }], tasks: [{ id: 1, text: '検収書の回収', completed: true }] },
      '一次保守': {
        notes: '運用開始後1ヶ月のフォローアップ。順調に稼働中。\n一部設定の微調整依頼あり、リモートにて対応済み。',
        links: [
          { id: 'l2', title: '保守手順書', url: 'https://example.com/maintenance' }
        ],
        tasks: [
          { id: 1, text: '3ヶ月点検のスケジュール調整', completed: false }
        ]
      },
    },
    logs: [
      { id: 1, date: '2026-04-01', type: 'activity', content: '運用開始後1ヶ月のフォローアップミーティング。順調に稼働中。', nextAction: '3ヶ月点検のスケジュール調整', nextDate: '2026-06-01' },
      { id: 2, date: '2026-02-28', type: 'activity', content: 'システム納品・初期設定完了。', nextAction: '請求書の発行', nextDate: '2026-03-05' },
    ]
  }
];
