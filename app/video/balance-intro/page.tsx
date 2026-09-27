// app/video/balance-intro/page.tsx
// 「尋找下一個平衡木」章節開場短片 — 供 ArcGIS StoryMaps 以「內嵌」區塊引用的純播放頁
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "尋找下一個平衡木｜彰化沿海土地變奏曲",
  description: "章節開場：引導式短片，邀請讀者往下閱讀並親手試玩平衡木（手繪線稿動畫，中英字幕）",
};

export default function Page() {
  return (
    <main className="flex h-screen w-full items-center justify-center bg-[#1a2b4a]">
      <video
        className="h-full w-full object-contain"
        src="/animations/10_balance_intro.mp4"
        poster="/animations/10_balance_intro_poster.jpg"
        controls
        playsInline
        preload="metadata"
      />
    </main>
  );
}
