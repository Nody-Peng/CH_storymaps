"use client";

import { useState } from "react";

// 複製頁面的完整網址，方便貼到 ArcGIS StoryMaps 的「內嵌」區塊
export default function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("複製這個網址：", url);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-full border border-[#1a2b4a]/25 px-3 py-1 text-xs text-[#1a2b4a]/80 transition-colors hover:border-[#1a2b4a] hover:text-[#1a2b4a]"
    >
      {copied ? "已複製 ✓" : "複製嵌入連結"}
    </button>
  );
}
