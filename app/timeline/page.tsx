/* ═══════════════════════════════════════════════
   app/timeline/page.tsx
   組裝層：只負責 import 資料 + 掛載元件
   ─ 要換資料 → 改 data/timeline-nodes.ts
   ─ 要改樣式 → 改 components/TimelineCarousel.tsx
═══════════════════════════════════════════════ */
import TimelineCarousel from "@/components/TimelineCarousel";
import { NODES } from "@/public/data/timeline-nodes";

export default function TimelinePage() {
  return <TimelineCarousel nodes={NODES} />;
}
