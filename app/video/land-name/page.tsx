// app/video/land-name/page.tsx
// 全片開場／第一章「這片土地的名字」— 供 ArcGIS StoryMaps 以「內嵌」區塊引用的純播放頁
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "這片土地的名字｜彰化沿海土地變奏曲",
  description: "全片開場：彰化沿海六鄉鎮與三個你可能不知道的事實（手繪線稿動畫，中英字幕）",
};

export default function Page() {
  return (
    <main className="flex h-screen w-full items-center justify-center bg-[#1a2b4a]">
      <video
        className="h-full w-full object-contain"
        src="/animations/01_land_name.mp4"
        poster="/animations/01_land_name_poster.jpg"
        controls
        playsInline
        preload="metadata"
      />
    </main>
  );
}
