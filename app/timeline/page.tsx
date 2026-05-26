"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";

interface TimelineNode {
  id: number;
  year: string;
  tag: string;
  title: string;
  subtitle: string;
  body: string[];
  sources: { label: string; hint: string }[];
  mediaCaption: string;
  mediaType: "image" | "video" | "chart" | "empty";
  mediaSrc?: string;
}

const NODES: TimelineNode[] = [
  {
    id: 0, year: "1950–1970s", tag: "歷史背景",
    title: "地下水超抽的開始", subtitle: "彰化沿海地層下陷的遠因",
    body: ["戰後台灣農業快速擴張，彰化沿海農民大量抽取地下水灌溉，工業用水需求也急遽攀升。長期超抽導致地層下陷，為日後土地利用衝突埋下伏筆。"],
    sources: [{ label: "水利署老照片", hint: "搜尋「台灣早期 地下水 歷史照片」" }, { label: "公視《我們的島》", hint: "地層下陷專題歷史回顧片段" }],
    mediaCaption: "早期農村抽地下水歷史老照片 / 地層下陷黑白新聞照片", mediaType: "empty",
  },
  {
    id: 1, year: "1985", tag: "研究起點",
    title: "最後的完整農業景觀", subtitle: "本研究 LULCC 分析基準年",
    body: ["1985 年是本研究土地利用變遷分析的起始基準年，彰化沿海仍保有大面積完整農地，LULCC 分類圖顯示農地佔比最高，建地與工業用地尚未大規模擴張。"],
    sources: [{ label: "本研究產出", hint: "1985 年彰化沿海 LULCC 分類圖" }],
    mediaCaption: "1985 年彰化沿海 LULCC 土地利用分類圖（本研究產出）", mediaType: "chart",
  },
  {
    id: 2, year: "1995", tag: "政策轉折",
    title: "農地釋出方案", subtitle: "第一道防線的鬆動",
    body: ["行政院核定「農地釋出方案」，開放部分農地轉作非農業使用。此政策被視為台灣農地保護體系鬆動的起點，為後續大規模土地利用變遷開了先例。"],
    sources: [{ label: "國發會／國家圖書館", hint: "搜尋「農地釋出方案 民國84年」" }, { label: "聯合報／中國時報", hint: "「政院核定農地釋出方案」舊報紙標題" }],
    mediaCaption: "官方政策文件封面 / 舊報紙標題截圖", mediaType: "empty",
  },
  {
    id: 3, year: "2000", tag: "法規鬆綁",
    title: "農業發展條例修正", subtitle: "農地農有全面鬆綁",
    body: ["農業發展條例修正通過，廢除「農地農有」限制，非農民得以購買農地，農舍興建門檻大幅降低。修法後農地交易市場活絡，「豪華農舍」亂象隨之而來。"],
    sources: [{ label: "上下游新聞市集", hint: "農發條例修法後農地買賣廣告看板照片" }],
    mediaCaption: "農地旁「農地買賣」「農舍出售」廣告招牌照片", mediaType: "empty",
  },
  {
    id: 4, year: "2001", tag: "國際衝擊",
    title: "台灣正式加入 WTO", subtitle: "農業競爭力的結構性衝擊",
    body: ["台灣正式成為 WTO 會員，農產品市場全面開放，進口競爭壓力驟增。農業收益下滑加速農地廢耕與轉用意願，彰化沿海農地面積開始出現明顯下降趨勢。"],
    sources: [{ label: "中央通訊社歷史圖庫", hint: "搜尋「2001 台灣加入 WTO」" }],
    mediaCaption: "台灣加入 WTO 簽署歷史照片 / 農民抗議進口農產品畫面", mediaType: "empty",
  },
  {
    id: 5, year: "2011", tag: "發展真空",
    title: "國光石化撤案", subtitle: "彰化沿海發展真空的形成",
    body: ["萬人連署守護白海豚，馬英九總統宣布不支持國光石化案。撤案後，土地開發壓力並未消失，反而以更分散、更難管制的小型工廠與農地轉用形式持續蔓延。"],
    sources: [{ label: "環境資訊中心（TEIA）", hint: "搜尋「國光石化 撤案」抗爭照片" }, { label: "公視新聞網", hint: "「馬英九宣布不支持國光石化案」" }],
    mediaCaption: "反國光石化萬人連署抗議照片 / 總統宣布撤案新聞畫面", mediaType: "empty",
  },
  {
    id: 6, year: "2015–2019", tag: "搶建潮",
    title: "違章工廠就地合法的預期", subtitle: "工廠管理輔導法修法期間",
    body: ["工輔法修法討論期間，違章工廠業者預期就地合法，農地上大量鐵皮工廠搶在修法前趕工興建。空拍圖顯示彰化農田中央出現大量突兀的鐵皮廠房，農地破碎化程度急遽惡化。"],
    sources: [{ label: "地球公民基金會", hint: "「農地違章工廠搶建」空拍圖與新聞稿" }, { label: "彰化縣環境保護聯盟", hint: "農地工廠搶建期間現場紀錄" }],
    mediaCaption: "農田中央突兀鐵皮廠房空拍圖（施工中）", mediaType: "empty",
  },
  {
    id: 7, year: "2016", tag: "能源政策",
    title: "非核家園政策", subtitle: "農地種電浪潮的起點",
    body: ["政府推動非核家園，大力補貼太陽能發電，農地設置光電板成為農民新的收益來源。「農地種電」現象在彰化沿海迅速蔓延，大量農地實質上轉為能源用地，農業生產功能喪失。"],
    sources: [{ label: "《報導者》", hint: "《光電侵農大調查：失控的台灣淘金熱》主視覺" }, { label: "天下雜誌", hint: "〈瘋狂光電發財夢〉網頁截圖" }],
    mediaCaption: "農地與太陽能板一線之隔的對比空拍照", mediaType: "empty",
  },
  {
    id: 8, year: "2019", tag: "法規衝擊",
    title: "工廠管理輔導法正式修正通過", subtitle: "農地工廠大赦",
    body: ["工輔法三讀通過，2016 年 5 月前既存的違章工廠得申請納管取得合法地位。環保團體批評此舉形同「農地工廠大赦」，立法院外爆發大規模抗議。"],
    sources: [{ label: "苦勞網 / 環境資訊中心", hint: "搜尋「工輔法 三讀通過 抗議」" }],
    mediaCaption: "環保團體立法院外舉牌抗議照片", mediaType: "empty",
  },
  {
    id: 9, year: "2020–2022", tag: "研究發現",
    title: "針對性侵占的高峰期", subtitle: "本研究核心科學發現",
    body: ["本研究變遷強度分析顯示，2020–2022 年間農地流失速率達到研究期間最高峰。針對性指數（Intensity Index）> 3 的類別集中於農地→建地、農地→工業用地的轉換，顯示農地侵占具有高度針對性而非隨機。"],
    sources: [{ label: "本研究產出", hint: "變遷強度分析圖表（針對性指數長條圖）" }],
    mediaCaption: "2020–2022 年變遷強度分析圖（本研究產出）", mediaType: "chart",
  },
  {
    id: 10, year: "2031（預計）", tag: "未來展望",
    title: "國土計畫法全面施行", subtitle: "制度灰色地帶的最後機會？",
    body: ["國土計畫法預計 2031 年全面施行，農業發展地區將受到更嚴格的土地使用管制。然而各縣市計畫圖進度落後，農民反彈聲浪不斷，制度能否真正落實仍是未知數。"],
    sources: [{ label: "內政部國土管理署", hint: "官方「國土功能分區圖」圖例" }, { label: "近期新聞 2024–2025", hint: "國土計畫法展延爭議新聞標題" }],
    mediaCaption: "國土計畫法「農業發展地區」官方分區示意圖 / 展延爭議新聞標題", mediaType: "empty",
  },
];

const TAG_COLORS: Record<string, string> = {
  "歷史背景": "#78716c", "研究起點": "#15803d", "政策轉折": "#b45309",
  "法規鬆綁": "#c2410c", "國際衝擊": "#0369a1", "發展真空": "#0f766e",
  "搶建潮":   "#b91c1c", "能源政策": "#a16207", "法規衝擊": "#be123c",
  "研究發現": "#7c3aed", "未來展望": "#4338ca",
};

function MediaPlaceholder({ node }: { node: TimelineNode }) {
  if (node.mediaType === "image" && node.mediaSrc) {
    return (
      <figure style={{ margin: 0 }}>
        <img src={node.mediaSrc} alt={node.mediaCaption}
          style={{ width: "100%", maxHeight: 480, objectFit: "cover",
            borderRadius: 2, display: "block" }} />
        <figcaption style={{ fontSize: 12, color: "#a8a29e", marginTop: 8 }}>
          {node.mediaCaption}
        </figcaption>
      </figure>
    );
  }
  if (node.mediaType === "video" && node.mediaSrc) {
    return (
      <figure style={{ margin: 0 }}>
        <video src={node.mediaSrc} controls style={{ width: "100%", maxHeight: 480,
          borderRadius: 2, display: "block", background: "#e8e4de" }} />
        <figcaption style={{ fontSize: 12, color: "#a8a29e", marginTop: 8 }}>
          {node.mediaCaption}
        </figcaption>
      </figure>
    );
  }
  const bg = node.mediaType === "chart" ? "#ede9e3" : "#e8e4de";
  return (
    <div style={{ width: "100%", height: 360, background: bg, borderRadius: 2,
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#b5afa8", fontSize: 13, textAlign: "center",
        maxWidth: 400, lineHeight: 1.8, padding: "0 40px" }}>
        {node.mediaCaption}
      </p>
    </div>
  );
}

export default function TimelinePage() {
  const [current, setCurrent] = useState(0);
  const [phase, setPhase] = useState<"idle" | "out" | "in">("idle");
  const [slideDir, setSlideDir] = useState<1 | -1>(1); // 1=往右進, -1=往左進
  const nextIdRef = useRef(0);
  const wheelLock = useRef(false);
  const touchStartX = useRef(0);
  const animating = phase !== "idle";

  const goTo = useCallback((nextId: number, dir: 1 | -1) => {
    if (animating || nextId < 0 || nextId >= NODES.length || nextId === current) return;
    nextIdRef.current = nextId;
    setSlideDir(dir);
    setPhase("out");
  }, [animating, current]);

  // out → 換內容 → in
  useEffect(() => {
    if (phase === "out") {
      const t = setTimeout(() => {
        setCurrent(nextIdRef.current);
        setPhase("in");
      }, 240);
      return () => clearTimeout(t);
    }
    if (phase === "in") {
      const t = setTimeout(() => setPhase("idle"), 320);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const prev = useCallback(() => goTo(current - 1, -1), [current, goTo]);
  const next = useCallback(() => goTo(current + 1,  1), [current, goTo]);

  // 鍵盤
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft")  prev();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [next, prev]);

  // 滾輪（節流）
  useEffect(() => {
    const fn = (e: WheelEvent) => {
      e.preventDefault();
      if (wheelLock.current) return;
      wheelLock.current = true;
      const d = e.deltaY !== 0 ? e.deltaY : e.deltaX;
      if (d > 0) next(); else prev();
      setTimeout(() => { wheelLock.current = false; }, 750);
    };
    window.addEventListener("wheel", fn, { passive: false });
    return () => window.removeEventListener("wheel", fn);
  }, [next, prev]);

  // 觸控
  useEffect(() => {
    const onStart = (e: TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
    const onEnd   = (e: TouchEvent) => {
      const dx = touchStartX.current - e.changedTouches[0].clientX;
      if (Math.abs(dx) > 48) { if (dx > 0) next(); else prev(); }
    };
    window.addEventListener("touchstart", onStart);
    window.addEventListener("touchend",   onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend",   onEnd);
    };
  }, [next, prev]);

  const node = NODES[current];

  // 轉場樣式
  const outX  = slideDir * -48;   // 往哪個方向飛出
  const inX   = slideDir *  48;   // 從哪個方向飛入
  const contentStyle: React.CSSProperties =
    phase === "out" ? { opacity: 0, transform: `translateX(${outX}px)` }
  : phase === "in"  ? { opacity: 0, transform: `translateX(${inX}px)` }
  :                   { opacity: 1, transform: "translateX(0)" };

  const progress = (current / (NODES.length - 1)) * 100;

  return (
    <div style={{ background: "#faf7f2", height: "100vh", display: "flex",
      flexDirection: "column", overflow: "hidden", userSelect: "none" }}>

      {/* ── 頂部進度條 ── */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0,
        height: 2, background: "#e7e0d8", zIndex: 200 }}>
        <div style={{ height: "100%", background: "#292524",
          width: `${progress}%`, transition: "width 0.4s ease" }} />
      </div>

      {/* ── 頂部導覽列 ── */}
      <header style={{
        position: "fixed", top: 2, left: 0, right: 0, zIndex: 199,
        background: "rgba(250,247,242,0.93)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #e7e0d8",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "11px 48px", height: 46,
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#292524",
          letterSpacing: "-0.01em" }}>
          彰化農地變遷研究
        </span>
        <span style={{ fontSize: 12, color: "#a8a29e", fontVariantNumeric: "tabular-nums" }}>
          {current + 1} &nbsp;/&nbsp; {NODES.length}
        </span>
      </header>

      {/* ── 左右箭頭 ── */}
      {[
        { dir: -1 as const, side: "left",  label: "←", disabled: current === 0, onClick: prev },
        { dir:  1 as const, side: "right", label: "→", disabled: current === NODES.length - 1, onClick: next },
      ].map(({ side, label, disabled, onClick }) => (
        <button key={side} onClick={onClick} disabled={disabled}
          style={{
            position: "fixed", top: "50%", transform: "translateY(-50%)",
            [side]: 18, zIndex: 150,
            background: "none", border: "none",
            fontSize: 22, color: "#292524",
            opacity: disabled ? 0.12 : 0.35,
            cursor: disabled ? "default" : "pointer",
            padding: "16px 10px",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = disabled ? "0.12" : "0.35"; }}>
          {label}
        </button>
      ))}

      {/* ── 主內容 ── */}
      <div style={{ flex: 1, overflowY: "auto", paddingTop: 48, paddingBottom: 88 }}>
        <div style={{
          maxWidth: 960, margin: "0 auto", padding: "48px 80px",
          transition: "opacity 0.24s ease, transform 0.24s ease",
          ...contentStyle,
        }}>

          {/* 節點頭部 */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginBottom: 32 }}>
            <span style={{ fontSize: 88, fontWeight: 900, color: "#ede9e3",
              letterSpacing: "-0.05em", lineHeight: 1, flexShrink: 0 }}>
              {String(node.id + 1).padStart(2, "0")}
            </span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: TAG_COLORS[node.tag] ?? "#78716c", marginBottom: 5 }}>
                {node.tag}
              </div>
              <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.025em",
                margin: "0 0 6px", color: "#1c1917", lineHeight: 1.2 }}>
                {node.year}　{node.title}
              </h2>
              <p style={{ fontSize: 15, color: "#78716c", margin: 0 }}>
                {node.subtitle}
              </p>
            </div>
          </div>

          {/* 媒體 */}
          <MediaPlaceholder node={node} />

          {/* 正文 */}
          <div style={{ maxWidth: 680, marginTop: 28 }}>
            {node.body.map((para, i) => (
              <p key={i} style={{ fontSize: 16, lineHeight: 1.9,
                color: "#44403c", margin: "0 0 14px" }}>
                {para}
              </p>
            ))}
          </div>

          {/* 素材來源 */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 18px", marginTop: 20 }}>
            {node.sources.map((src, i) => (
              <span key={i} style={{ fontSize: 11, color: "#c4bdb4" }}>
                {src.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── 底部時間刻度尺 ── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 199,
        background: "rgba(250,247,242,0.95)", backdropFilter: "blur(8px)",
        borderTop: "1px solid #e7e0d8", padding: "10px 0 16px",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 80px" }}>

          {/* 軌道 + 點 */}
          <div style={{ position: "relative", height: 22 }}>
            {/* 背景線 */}
            <div style={{ position: "absolute", left: 0, right: 0, top: "50%",
              height: 1, background: "#ddd8d0", transform: "translateY(-50%)" }} />
            {/* 進度填充線 */}
            <div style={{
              position: "absolute", left: 0, top: "50%",
              height: 1, background: "#292524", transform: "translateY(-50%)",
              width: `${progress}%`, transition: "width 0.35s ease",
            }} />
            {/* 刻度點 */}
            {NODES.map((n, i) => {
              const pct = (i / (NODES.length - 1)) * 100;
              const isActive = current === i;
              const isPast   = i < current;
              return (
                <button key={n.id}
                  onClick={() => goTo(n.id, n.id > current ? 1 : -1)}
                  title={n.year}
                  style={{
                    position: "absolute",
                    left: `${pct}%`, top: "50%",
                    transform: "translate(-50%, -50%)",
                    width:  isActive ? 14 : 8,
                    height: isActive ? 14 : 8,
                    borderRadius: "50%",
                    background: isActive ? "#292524" : isPast ? "#292524" : "#d6d0c8",
                    border: isActive ? "2.5px solid #faf7f2" : "none",
                    outline: isActive ? "2px solid #292524" : "none",
                    cursor: "pointer", padding: 0,
                    transition: "all 0.3s ease",
                  }} />
              );
            })}
          </div>

          {/* 年份標籤 */}
          <div style={{ position: "relative", height: 18, marginTop: 5 }}>
            {NODES.map((n, i) => {
              const pct = (i / (NODES.length - 1)) * 100;
              const isActive = current === i;
              return (
                <button key={n.id}
                  onClick={() => goTo(n.id, n.id > current ? 1 : -1)}
                  style={{
                    position: "absolute",
                    left: `${pct}%`,
                    transform: "translateX(-50%)",
                    fontSize: isActive ? 11 : 10,
                    fontWeight: isActive ? 700 : 400,
                    color: isActive ? "#292524" : "#b5afa8",
                    whiteSpace: "nowrap",
                    transition: "all 0.25s ease",
                    cursor: "pointer",
                    background: "none", border: "none", padding: 0,
                  }}>
                  {n.year}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}