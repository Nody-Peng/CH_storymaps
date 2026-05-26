"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";

const C: Record<string, string> = {
  農地:     "#8aab5a",
  陸域森林: "#3A6B35",
  草生地:   "#c8b84a",
  感潮灘地: "#b8864e",
  紅樹林:   "#5B9E8A",
  建地:     "#c8604a",
  裸地:     "#A0A0A0",
  水體:     "#4A7AB8",
};
const CLASS_ORDER = ["農地","陸域森林","草生地","感潮灘地","紅樹林","建地","裸地","水體"];
const getColor = (cls: string) => C[cls] ?? "#888";

const FONT = '"Noto Serif TC", "Noto Serif", serif';
const BG   = "#F9F7F0";

const PERIOD_KEYS = [
  "1985→1990","1990→1995","1995→2000","2000→2005",
  "2005→2010","2010→2015","2015→2018","2018→2019",
  "2019→2020","2020→2021","2021→2022",
];
const ALL_YEARS = ["1985","1990","1995","2000","2005","2010","2015","2018","2019","2020","2021","2022"];
const REGIONS   = ["全部","鹿港鎮","線西鄉","伸港鄉","福興鄉","芳苑鄉","大城鄉"];

const COL_W      = 480;
const PAD_LEFT   = 130;
const PAD_RIGHT  = 130;
const PAD_TOP    = 72;
const PAD_BOTTOM = 40;
const NODE_W     = 20;
const NODE_GAP   = 14;
const CHART_H    = 860;

interface RawLink {
  source: number; target: number; value: number;
  from_class: string; to_class: string; is_change: boolean;
}
interface RawNode { name: string; }
interface Period {
  nodes: RawNode[]; links: RawLink[];
  year_from: number; year_to: number;
}
type SankeyData = Record<string, Record<string, Period>>;

function scaleArea(area: number, total: number, usableH: number, allAreas: number[]): number {
  if (area <= 0) return 0;
  const linearPct = area / total;
  const logVal    = Math.log1p(area);
  const logTotal  = allAreas.reduce((s, a) => s + Math.log1p(a), 0);
  const logPct    = logVal / logTotal;
  return (0.65 * linearPct + 0.35 * logPct) * usableH;
}

function linkPath(x0: number, y0: number, h0: number, x1: number, y1: number, h1: number) {
  const mx = (x0 + x1) / 2;
  return [
    `M ${x0} ${y0}`,
    `C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`,
    `L ${x1} ${y1 + h1}`,
    `C ${mx} ${y1 + h1}, ${mx} ${y0 + h0}, ${x0} ${y0 + h0}`,
    "Z",
  ].join(" ");
}

export default function SankeyPage() {
  const [data, setData]       = useState<SankeyData | null>(null);
  const [region, setRegion]   = useState("全部");
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; html: string } | null>(null);
  const svgRef    = useRef<SVGSVGElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Google Font ───────────────────────────────────
  useEffect(() => {
    if (document.getElementById("noto-serif-tc-link")) return;
    const link = document.createElement("link");
    link.id   = "noto-serif-tc-link";
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;600;700&display=swap";
    document.head.appendChild(link);
  }, []);

  // ── 滾輪橫向捲動 ──────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      // 若是純水平滾動（觸控板左右）直接放行
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY * 1.2;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    fetch("/lulcc_data.json")
      .then(r => r.json())
      .then(d => setData(d.sankey ?? d));
  }, []);

  const { nodes, bands, totalW } = useMemo(() => {
    if (!data?.[region]) return { nodes: [], bands: [], totalW: 0 };

    const totalW = PAD_LEFT + ALL_YEARS.length * COL_W + PAD_RIGHT;
    const innerH = CHART_H - PAD_TOP - PAD_BOTTOM;

    const nodeArea: Record<string, number> = {};
    PERIOD_KEYS.forEach(key => {
      const p = data[region][key];
      if (!p) return;
      const srcT: Record<number, number> = {};
      const tgtT: Record<number, number> = {};
      p.links.forEach(l => {
        srcT[l.source] = (srcT[l.source] ?? 0) + l.value;
        tgtT[l.target] = (tgtT[l.target] ?? 0) + l.value;
      });
      p.nodes.forEach((n, i) => {
        const a = Math.max(srcT[i] ?? 0, tgtT[i] ?? 0);
        if (a > 0) nodeArea[n.name] = Math.max(nodeArea[n.name] ?? 0, a);
      });
    });

    type NodeGeo = { name: string; cls: string; year: string; x: number; y: number; h: number; area: number; };
    const nodeGeos: NodeGeo[] = [];

    ALL_YEARS.forEach((year, yi) => {
      const x = PAD_LEFT + yi * COL_W;
      const clsWithArea = CLASS_ORDER
        .map(cls => ({ cls, area: nodeArea[`${cls}（${year}）`] ?? 0 }))
        .filter(d => d.area > 0);
      if (!clsWithArea.length) return;

      const totalArea = clsWithArea.reduce((s, d) => s + d.area, 0);
      const allAreas  = clsWithArea.map(d => d.area);
      const usableH   = innerH - NODE_GAP * (clsWithArea.length - 1);
      let curY = PAD_TOP;

      clsWithArea.forEach(({ cls, area }) => {
        const h = Math.max(5, scaleArea(area, totalArea, usableH, allAreas));
        nodeGeos.push({ name: `${cls}（${year}）`, cls, year, x, y: curY, h, area });
        curY += h + NODE_GAP;
      });
    });

    const nodeMap = new Map(nodeGeos.map(n => [n.name, n]));

    type Band = {
      path: string; color: string; isChange: boolean;
      srcName: string; tgtName: string;
      fromCls: string; toCls: string;
      value: number; pct: string;
    };
    const bands: Band[] = [];
    const srcOffset = new Map<string, number>();
    const tgtOffset = new Map<string, number>();

    PERIOD_KEYS.forEach(key => {
      const p = data[region][key];
      if (!p) return;
      const srcTotals: Record<number, number> = {};
      p.links.forEach(l => { srcTotals[l.source] = (srcTotals[l.source] ?? 0) + l.value; });

      const sorted = [...p.links].sort((a, b) => {
        if (a.is_change !== b.is_change) return a.is_change ? 1 : -1;
        return CLASS_ORDER.indexOf(a.to_class) - CLASS_ORDER.indexOf(b.to_class);
      });

      sorted.forEach(l => {
        const srcName = p.nodes[l.source].name;
        const tgtName = p.nodes[l.target].name;
        const src = nodeMap.get(srcName);
        const tgt = nodeMap.get(tgtName);
        if (!src || !tgt) return;

        const bh_src = (l.value / src.area) * src.h;
        const bh_tgt = (l.value / tgt.area) * tgt.h;
        const so = srcOffset.get(srcName) ?? 0;
        const to = tgtOffset.get(tgtName) ?? 0;

        bands.push({
          path: linkPath(src.x + NODE_W, src.y + so, bh_src, tgt.x, tgt.y + to, bh_tgt),
          color: getColor(l.from_class),
          isChange: l.is_change,
          srcName, tgtName,
          fromCls: l.from_class, toCls: l.to_class,
          value: l.value,
          pct: ((l.value / (srcTotals[l.source] ?? 1)) * 100).toFixed(1),
        });
        srcOffset.set(srcName, so + bh_src);
        tgtOffset.set(tgtName, to + bh_tgt);
      });
    });

    return { nodes: nodeGeos, bands, totalW };
  }, [data, region]);

  const relatedNames = useMemo(() => {
    if (!hovered) return new Set<string>();
    const s = new Set<string>([hovered]);
    CLASS_ORDER.forEach(cls => {
      if (hovered.includes(cls)) ALL_YEARS.forEach(y => s.add(`${cls}（${y}）`));
    });
    bands.forEach(b => {
      if (b.srcName === hovered || b.tgtName === hovered) {
        s.add(b.srcName); s.add(b.tgtName);
      }
    });
    return s;
  }, [hovered, bands]);

  const handleBandEnter = useCallback((e: React.MouseEvent, b: any) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({
      x: e.clientX - rect.left + 16,
      y: e.clientY - rect.top - 12,
      html: [
        b.isChange
          ? `<span style="background:${getColor(b.fromCls)};color:#fff;padding:2px 9px;border-radius:4px;font-size:11px;font-family:${FONT}">類別轉換</span>`
          : `<span style="background:#aaa;color:#fff;padding:2px 9px;border-radius:4px;font-size:11px;font-family:${FONT}">維持不變</span>`,
        `<div style="margin-top:6px;font-size:14px;font-family:${FONT}"><b>${b.fromCls}</b> → <b>${b.toCls}</b></div>`,
        `<div style="color:#666;font-size:12px;margin-top:2px;font-family:${FONT}">面積 <b style="color:#333">${Math.round(b.value).toLocaleString()}</b> 公頃</div>`,
        `<div style="color:#666;font-size:12px;font-family:${FONT}">佔來源 ${b.fromCls} <b style="color:#333">${b.pct}%</b></div>`,
      ].join(""),
    });
  }, []);

  if (!data) return (
    <div style={{
      background: BG, width: "100%", padding: "48px 0",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: FONT,
    }}>
      <p style={{ color: "#a8a29e", fontSize: 16 }}>載入資料中…</p>
    </div>
  );

  return (
    // ── 最外層：寬度 100%，高度自動撐開，不鎖死 vh ──
    <div style={{
      background: BG,
      width: "100%",
      display: "flex",
      flexDirection: "column",
      fontFamily: FONT,
    }}>

      {/* ── Header ── */}
      <div style={{
        background: BG,
        borderBottom: "1px solid #e7e0d8",
        padding: "10px 20px 8px",
      }}>
        {/* 第一行：標題 */}
        <div style={{
          fontSize: 15, fontWeight: 700,
          color: "#2c2c2c", letterSpacing: ".04em",
          marginBottom: 8,
        }}>
          彰化沿海地覆類別變遷　1985–2022
        </div>

        {/* 第二行：地區切換 + 圖例（自動換行）*/}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          {/* 地區按鈕 */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            {REGIONS.map(r => (
              <button key={r} onClick={() => setRegion(r)} style={{
                padding: "3px 11px", borderRadius: 20, border: "none",
                fontSize: 12, fontFamily: FONT, cursor: "pointer",
                background: region === r ? "#292524" : "#ede9e3",
                color:      region === r ? "#faf7f2" : "#78716c",
                transition: "all 0.18s",
              }}>{r}</button>
            ))}
          </div>

          {/* 分隔 */}
          <div style={{ width: 1, height: 18, background: "#ddd", margin: "0 4px" }} />

          {/* 圖例（自動換行）*/}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", alignItems: "center" }}>
            {CLASS_ORDER.map(cls => (
              <button key={cls}
                onMouseEnter={() => setHovered(`${cls}（1985）`)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  background: "none", border: "none", cursor: "pointer", padding: 0,
                  opacity: hovered && !hovered.includes(cls) ? 0.3 : 1,
                  transition: "opacity .2s", fontFamily: FONT,
                }}>
                <div style={{ width: 10, height: 10, borderRadius: 2,
                  background: getColor(cls), flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#555", whiteSpace: "nowrap" }}>{cls}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 圖表捲動區：水平捲動，垂直也可捲 ── */}
      <div
        ref={scrollRef}
        style={{
          width: "100%",
          overflowX: "auto",
          overflowY: "auto",          // ← 垂直捲軸開啟
          position: "relative",
          // 讓捲動區高度自適應，最小 400px，最大 90vh
          maxHeight: "90vh",
          minHeight: 400,
          scrollbarWidth: "thin",
          scrollbarColor: "#ccc #f5f3ee",
          cursor: "default",
        }}
      >
        <svg
          ref={svgRef}
          width={totalW}
          height={CHART_H}
          style={{ display: "block", background: BG }}
          onMouseLeave={() => { setHovered(null); setTooltip(null); }}
        >
          <defs>
            <style>{`text { font-family: 'Noto Serif TC', 'Noto Serif', serif; }`}</style>
          </defs>

          {/* 年份標籤 */}
          {ALL_YEARS.map((y, i) => (
            <text key={y}
              x={PAD_LEFT + i * COL_W + NODE_W / 2}
              y={PAD_TOP - 30}
              textAnchor="middle"
              fontFamily={FONT} fontSize={14} fontWeight={700}
              fill="#aaa" letterSpacing="0.08em"
            >{y}</text>
          ))}

          {/* 刻度線 */}
          {ALL_YEARS.map((_, i) => (
            <line key={i}
              x1={PAD_LEFT + i * COL_W + NODE_W / 2} y1={PAD_TOP - 18}
              x2={PAD_LEFT + i * COL_W + NODE_W / 2} y2={PAD_TOP - 6}
              stroke="#ddd" strokeWidth={1.5}
            />
          ))}

          {/* 流向帶 */}
          {bands.map((b, i) => {
            const lit = !hovered ||
              relatedNames.has(b.srcName) || relatedNames.has(b.tgtName);
            return (
              <path key={i} d={b.path} fill={b.color}
                opacity={lit ? (b.isChange ? 0.58 : 0.14) : 0.025}
                style={{ transition: "opacity 0.2s", cursor: "crosshair" }}
                onMouseEnter={e => handleBandEnter(e, b)}
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })}

          {/* 節點 */}
          {nodes.map(n => {
            const isActive = !hovered || relatedNames.has(n.name);
            const isHov    = hovered === n.name;
            const isFirst  = n.year === ALL_YEARS[0];
            return (
              <g key={n.name} style={{ cursor: "pointer" }}
                onMouseEnter={() => setHovered(n.name)}
                onMouseLeave={() => setHovered(null)}
              >
                <rect x={n.x} y={n.y} width={NODE_W} height={n.h}
                  fill={getColor(n.cls)} opacity={isActive ? 1 : 0.12}
                  rx={3} style={{ transition: "opacity 0.2s" }}
                />
                {isHov && (
                  <rect x={n.x - 2} y={n.y - 2}
                    width={NODE_W + 4} height={n.h + 4}
                    fill="none" stroke={getColor(n.cls)}
                    strokeWidth={2} rx={3} opacity={0.85}
                  />
                )}
                {n.h >= 14 && (
                  <text
                    x={isFirst ? n.x - 9 : n.x + NODE_W + 9}
                    y={n.y + n.h / 2}
                    textAnchor={isFirst ? "end" : "start"}
                    dominantBaseline="middle"
                    fontFamily={FONT}
                    fontSize={n.h >= 30 ? 13 : 10}
                    fontWeight={600}
                    fill={isActive ? getColor(n.cls) : "#ddd"}
                    style={{ transition: "fill 0.2s", pointerEvents: "none" }}
                  >{n.cls}</text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div style={{
            position: "absolute", left: tooltip.x, top: tooltip.y,
            background: "rgba(255,255,255,0.98)",
            border: "1px solid #e4ddd6", borderRadius: 9,
            padding: "10px 16px", fontFamily: FONT,
            fontSize: 13, color: "#333",
            pointerEvents: "none", zIndex: 999,
            boxShadow: "0 8px 28px rgba(0,0,0,0.10)",
            lineHeight: 1.85, minWidth: 175,
          }}
            dangerouslySetInnerHTML={{ __html: tooltip.html }}
          />
        )}
      </div>

      {/* ── 底部提示 ── */}
      <div style={{
        padding: "6px 20px",
        borderTop: "1px solid #ece8e0",
        display: "flex", flexWrap: "wrap",
        gap: "4px 24px", justifyContent: "center",
      }}>
        {[
          "滾輪左右捲動瀏覽時間軸",
          "Hover 節點 → 追蹤同類別全時段",
          "Hover 流向帶 → 查看面積與比例",
        ].map(t => (
          <span key={t} style={{ fontSize: 11, color: "#bbb" }}>{t}</span>
        ))}
      </div>
    </div>
  );
}