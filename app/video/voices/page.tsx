// app/video/voices/page.tsx
// 章節開場片「各界的聲音」— 供 ArcGIS StoryMaps 以「嵌入」區塊引用的純播放頁
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "各界的聲音｜困在局裡的人們",
  description: "彰化沿海土地變遷：六種立場的聲音（手繪線稿動畫，中英字幕）",
};

export default function Page() {
  return (
    <main className="flex h-screen w-full items-center justify-center bg-[#1a2b4a]">
      <video
        className="h-full w-full object-contain"
        src="/animations/08_voices.mp4"
        poster="/animations/08_voices_poster.jpg"
        controls
        playsInline
        preload="metadata"
      />
    </main>
  );
}
