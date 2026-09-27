export interface Policy {
  id: string;
  order: number;
  title: string;
  tagline: string;
  body: string;
  /** 啟用後對平衡木的「修正力道」，滿分 100 即完全打平 */
  weight: number;
  /** 需要花費的政治能量（總預算 BUDGET），越激烈的政策成本越高 */
  cost: number;
  /** 啟用後帶來的社會阻力，0–100 */
  opposition: number;
  /** 誰會反彈／需要承擔的一句話 */
  reaction: string;
}

/** 政治能量總預算：四項政策成本合計 125，故無法一次全部啟用，必須取捨 */
export const BUDGET = 100;

export const POLICIES: Policy[] = [
  {
    id: "cap",
    order: 1,
    title: "農地總量絕對管制",
    tagline: "設立紅線底限",
    body: "設立彰化沿海農地的「紅線底限」，任何個案變更都不得突破此底限。以衛星監測作為即時預警機制，一旦農地面積接近底限，立即觸發管制機制。",
    weight: 30,
    cost: 45,
    opposition: 35,
    reaction: "光電業者與地方政府反彈最大",
  },
  {
    id: "siting",
    order: 2,
    title: "光電選址強制轉向",
    tagline: "非農地優先",
    body: "修改法規，要求光電業者優先評估「已開發工業區屋頂」、「廢棄工業地」、「停車場」等非農業用地。只有在這些選項確實不可行的情況下，才允許申請農地種電，且需通過更嚴格的審查。",
    weight: 25,
    cost: 35,
    opposition: 25,
    reaction: "光電業者開發成本上升",
  },
  {
    id: "pes",
    order: 3,
    title: "農地生態系統服務給付（PES）",
    tagline: "讓保護農地划算",
    body: "建立合理的農地保護補償機制，讓農民保留農地能獲得接近光電租金的收益。這筆費用，可以從光電業者的「農地轉用稅」或「生態補償基金」中支應——讓保護農地的人，不再是唯一付出代價的人。",
    weight: 25,
    cost: 15,
    opposition: 5,
    reaction: "阻力最小，但需要穩定財源支撐",
  },
  {
    id: "spatial-plan",
    order: 4,
    title: "加速國土計畫法落實",
    tagline: "不能等到 2031 年",
    body: "不能等到 2031 年。在過渡期間，應立即強化農業用地變更的審查標準，並賦予地方政府更多的農地保護工具。",
    weight: 20,
    cost: 30,
    opposition: 15,
    reaction: "地方政府執行負擔增加",
  },
];

export const CLOSING_STATS = [
  { label: "農地減少", value: "－26%", hint: "約 6,302 公頃，相當於一整個彰化市" },
  { label: "建地增加", value: "＋205%", hint: "翻了三倍以上" },
  { label: "感潮灘地", value: "24 倍", hint: "陸地的眼淚" },
  { label: "近岸水體", value: "－58%", hint: "消失的漁場" },
  { label: "紅樹林", value: "12 倍", hint: "生態的悖論" },
];
