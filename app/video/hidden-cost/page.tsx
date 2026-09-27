// app/video/hidden-cost/page.tsx
// 「當田消失之後」章節開場短片 — 供 ArcGIS StoryMaps 以「內嵌」區塊引用的純播放頁
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "當田消失之後｜彰化沿海土地變奏曲",
  description: "章節開場：那些沒有被計算進去的成本（手繪線稿動畫，中英字幕）",
};

export default function Page() {
  return (
    <main className="flex h-screen w-full items-center justify-center bg-[#1a2b4a]">
      <video
        className="h-full w-full object-contain"
        src="/animations/09_hidden_cost.mp4"
        poster="/animations/09_hidden_cost_poster.jpg"
        controls
        playsInline
        preload="metadata"
      />
    </main>
  );
}
