/* app/timeline-v2/page.tsx — 時間軸新版：直向捲動敘事 + 本研究衛星數據帳本
   舊版保留在 /timeline（兩版共用 public/data/timeline-nodes.ts 的文字） */
import type { Metadata } from "next";
import TimelineStory from "@/components/TimelineStory";
import { NODES } from "@/public/data/timeline-nodes";

export const metadata: Metadata = {
  title: "歷史的推手與失守的防線｜彰化沿海土地變奏曲",
  description: "從地下水超抽到國土計畫法：11 個轉折點，搭配 1985–2022 衛星影像土地帳本。",
};

export default function Page() {
  return <TimelineStory nodes={NODES} />;
}
