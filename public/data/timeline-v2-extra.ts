/* ═══════════════════════════════════════════════
   data/timeline-v2-extra.ts
   時間軸新版（/timeline-v2）的補充設定：插畫、分類色、衛星數據對照區間、延伸頁面
   ─ 文字內容沿用 timeline-nodes.ts（舊版 /timeline 共用同一份資料）
   ─ window：用本研究 LULC 數據（lulcc_data.json → line.全部）對照的年份區間
═══════════════════════════════════════════════ */

export type Category = "history" | "research" | "policy" | "global" | "vacuum" | "rush" | "energy" | "future";

export const CATEGORY_COLOR: Record<Category, string> = {
  history: "#8a7a5a",
  research: "#5e7d4a",
  policy: "#c8703f",
  global: "#1e3a5f",
  vacuum: "#b58a2a",
  rush: "#b0452f",
  energy: "#2d5c96",
  future: "#1a2b4a",
};

export interface NodeExtra {
  img: string;
  category: Category;
  /** 衛星數據對照區間；null 表示在衛星紀錄範圍之外 */
  window: [number, number] | null;
  /** 對照區間的說明（例如「2001 年最近的觀測區間」） */
  windowNote?: string;
  related: { href: string; label: string }[];
}

export const EXTRA: Record<number, NodeExtra> = {
  0: { img: "/timeline-v2/n0.jpg", category: "history", window: null, related: [{ href: "/video/land-name", label: "開場片：這片土地的名字" }] },
  1: { img: "/timeline-v2/n1.jpg", category: "research", window: [1985, 1985], related: [{ href: "/sankey", label: "1985 → 2022 地覆類別變遷圖" }, { href: "/landuse", label: "土地利用排名變遷" }] },
  2: { img: "/timeline-v2/n2.jpg", category: "policy", window: [1995, 2000], related: [{ href: "/sankey-timeline", label: "分期土地流向：1995→2000" }] },
  3: { img: "/timeline-v2/n3.jpg", category: "policy", window: [2000, 2005], related: [{ href: "/sankey-timeline", label: "分期土地流向：2000→2005" }] },
  4: { img: "/timeline-v2/n4.jpg", category: "global", window: [2000, 2005], windowNote: "最接近 2001 年的觀測區間", related: [{ href: "/landuse", label: "土地利用排名變遷" }] },
  5: { img: "/timeline-v2/n5.jpg", category: "vacuum", window: [2010, 2015], related: [{ href: "/stakeholders", label: "困在局裡的人們" }] },
  6: { img: "/timeline-v2/n6.jpg", category: "rush", window: [2015, 2019], related: [{ href: "/stakeholders", label: "困在局裡的人們：工廠業者" }] },
  7: { img: "/timeline-v2/n7.jpg", category: "energy", window: [2015, 2020], windowNote: "涵蓋 2016 年的觀測區間", related: [{ href: "/stakeholders", label: "困在局裡的人們：光電業者" }, { href: "/video/voices", label: "開場片：各界的聲音" }] },
  8: { img: "/timeline-v2/n8.jpg", category: "policy", window: [2019, 2022], related: [{ href: "/stakeholders", label: "困在局裡的人們" }] },
  9: { img: "/timeline-v2/n9.jpg", category: "research", window: [2020, 2022], related: [{ href: "/sankey-timeline", label: "分期土地流向：2020→2022" }, { href: "/landuse", label: "土地利用排名變遷" }] },
  10: { img: "/timeline-v2/n10.jpg", category: "future", window: [2022, 2022], windowNote: "本研究最新觀測", related: [{ href: "/stakeholders", label: "困在局裡的人們" }] },
};
