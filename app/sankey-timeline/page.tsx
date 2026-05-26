"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const C: Record<string, string> = {
  農地: "#8aab5a",
  陸域森林: "#3A6B35",
  草生地: "#c8b84a",
  感潮灘地: "#b8864e",
  紅樹林: "#5B9E8A",
  建地: "#c8604a",
  裸地: "#A0A0A0",
  水體: "#4A7AB8",
};
const CLASS_ORDER = [
  "農地",
  "陸域森林",
  "草生地",
  "感潮灘地",
  "紅樹林",
  "建地",
  "裸地",
  "水體",
];
const getColor = (cls: string) => C[cls] ?? "#888";
const FONT = '"Noto Serif TC","Noto Serif",serif';
const BG = "#F9F7F0";

const PERIOD_KEYS = [
  "1985→1990",
  "1990→1995",
  "1995→2000",
  "2000→2005",
  "2005→2010",
  "2010→2015",
  "2015→2018",
  "2018→2019",
  "2019→2020",
  "2020→2021",
  "2021→2022",
];
const YEARS = [
  "1985",
  "1990",
  "1995",
  "2000",
  "2005",
  "2010",
  "2015",
  "2018",
  "2019",
  "2020",
  "2021",
  "2022",
];

const REGION_MAP: Record<string, string> = {
  全部: "all",
  伸港鄉: "shengang",
  線西鄉: "xianxi",
  鹿港鎮: "lukang",
  福興鄉: "fuxing",
  芳苑鄉: "fangyuan",
  大城鄉: "dacheng",
};
const HASH_TO_REGION: Record<string, string> = Object.fromEntries(
  Object.entries(REGION_MAP).map(([k, v]) => [v, k]),
);
const REGIONS = Object.keys(REGION_MAP);

const NODE_W = 16;
const NODE_GAP = 10;
const PAD_TOP = 56;
const PAD_BOTTOM = 16;
const PAD_LEFT = 68;
const PAD_RIGHT = 68;
const CHART_H = 480;
const TL_HEIGHT = 58;
const TL_PAD_TOP = 16;
const DOT_R_SEL = 7;
const DOT_R_NOR = 4;
const LINE_Y = TL_PAD_TOP + DOT_R_SEL;

interface RawLink {
  source: number;
  target: number;
  value: number;
  from_class: string;
  to_class: string;
  is_change: boolean;
}
interface RawNode {
  name: string;
}
interface Period {
  nodes: RawNode[];
  links: RawLink[];
}
type SankeyData = Record<string, Record<string, Period>>;
type NodeGeo = {
  name: string;
  cls: string;
  year: string;
  x: number;
  y: number;
  h: number;
  area: number;
};
type Band = {
  path: string;
  color: string;
  isChange: boolean;
  srcName: string;
  tgtName: string;
  fromCls: string;
  toCls: string;
  value: number;
  pct: string;
  cx0: number;
  cy0: number;
  cx1: number;
  cy1: number;
  idx: number;
};

/* ── Tooltip 狀態型別，改用 SVG 座標系 ── */
interface TooltipState {
  svgX: number; // 在 SVG 內的 X（已含 scrollLeft）
  svgY: number; // 在 SVG 內的 Y（已含 scrollTop）
  html: string;
}

function scaleArea(
  area: number,
  total: number,
  usableH: number,
  allAreas: number[],
) {
  if (area <= 0) return 0;
  const lp = area / total;
  const lv = Math.log1p(area);
  const lt = allAreas.reduce((s, a) => s + Math.log1p(a), 0);
  return (0.65 * lp + 0.35 * (lv / lt)) * usableH;
}

function linkPath(
  x0: number,
  y0: number,
  h0: number,
  x1: number,
  y1: number,
  h1: number,
) {
  const mx = (x0 + x1) / 2;
  return [
    `M${x0} ${y0}`,
    `C${mx} ${y0},${mx} ${y1},${x1} ${y1}`,
    `L${x1} ${y1 + h1}`,
    `C${mx} ${y1 + h1},${mx} ${y0 + h0},${x0} ${y0 + h0}`,
    "Z",
  ].join(" ");
}

/* ══════════════════════════════════════════
   智慧 Tooltip 元件
   - 先以 opacity:0 渲染，量測自身尺寸後再翻轉
   - position 基於 scrollRef 容器的左上角
══════════════════════════════════════════ */
function SmartTooltip({
  svgX,
  svgY,
  html,
  scrollRef,
}: {
  svgX: number;
  svgY: number;
  html: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  const tipRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{
    left: number;
    top: number;
    opacity: number;
  }>({
    left: 0,
    top: 0,
    opacity: 0,
  });

  useEffect(() => {
    const tip = tipRef.current;
    const con = scrollRef.current;
    if (!tip || !con) return;

    const tw = tip.offsetWidth || 200;
    const th = tip.offsetHeight || 80;
    const cw = con.clientWidth;
    const ch = con.clientHeight;
    const sl = con.scrollLeft;

    /* svgX/svgY 是 SVG 座標，轉成容器可見區座標 */
    const visX = svgX - sl; // 相對容器左邊
    const visY = svgY; // 垂直無捲動

    const OFFSET = 14;
    let left = visX + OFFSET;
    let top = visY - OFFSET;

    /* 右側超出 → 翻到左邊 */
    if (left + tw > cw - 8) left = visX - tw - OFFSET;
    /* 左側超出 → 貼左 */
    if (left < 8) left = 8;
    /* 下方超出 → 翻到上方 */
    if (top + th > ch - 8) top = visY - th - OFFSET;
    /* 上方超出 → 貼頂 */
    if (top < 8) top = 8;

    setPos({ left, top, opacity: 1 });
  }, [svgX, svgY, scrollRef]);

  return (
    <div
      ref={tipRef}
      style={{
        position: "absolute",
        left: pos.left,
        top: pos.top,
        opacity: pos.opacity,
        transition: "opacity .12s",
        background: "rgba(255,255,255,.97)",
        border: "1px solid #e4ddd6",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 12,
        color: "#333",
        boxShadow: "0 6px 22px rgba(0,0,0,.1)",
        lineHeight: 1.8,
        pointerEvents: "none",
        zIndex: 99,
        fontFamily: FONT,
        maxWidth: 220,
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default function SankeyPage() {
  const [data, setData] = useState<SankeyData | null>(null);
  const [region, setRegion] = useState("全部");
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [centerIdx, setCenterIdx] = useState(0);
  const [colW, setColW] = useState(240);
  const [animated, setAnimated] = useState(true);

  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* Google Font */
  useEffect(() => {
    if (document.getElementById("noto-serif-tc")) return;
    const l = document.createElement("link");
    l.id = "noto-serif-tc";
    l.rel = "stylesheet";
    l.href =
      "https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;600;700&display=swap";
    document.head.appendChild(l);
  }, []);

  /* hash ↔ region */
  useEffect(() => {
    const sync = () => {
      const h = window.location.hash.replace("#", "");
      const r = HASH_TO_REGION[h];
      if (r) setRegion(r);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const changeRegion = useCallback((r: string) => {
    setRegion(r);
    window.history.replaceState(null, "", `#${REGION_MAP[r] ?? "all"}`);
  }, []);

  /* 量測寬度 */
  useLayoutEffect(() => {
    const measure = () => {
      if (!rootRef.current) return;
      const w = rootRef.current.getBoundingClientRect().width;
      setColW(Math.max(150, Math.floor((w - PAD_LEFT - PAD_RIGHT) / 3)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (rootRef.current) ro.observe(rootRef.current);
    return () => ro.disconnect();
  }, []);

  /* 資料 */
  useEffect(() => {
    fetch("/lulcc_data.json")
      .then((r) => r.json())
      .then((d) => setData(d.sankey ?? d));
  }, []);

  /* 幾何 */
  const { nodes, bands, totalW } = useMemo(() => {
    if (!data?.[region] || colW <= 0)
      return { nodes: [], bands: [], totalW: 0 };
    const totalW = PAD_LEFT + YEARS.length * colW + PAD_RIGHT;
    const innerH = CHART_H - PAD_TOP - PAD_BOTTOM;

    const nodeArea: Record<string, number> = {};
    PERIOD_KEYS.forEach((key) => {
      const p = data[region][key];
      if (!p) return;
      const srcT: Record<number, number> = {};
      const tgtT: Record<number, number> = {};
      p.links.forEach((l) => {
        srcT[l.source] = (srcT[l.source] ?? 0) + l.value;
        tgtT[l.target] = (tgtT[l.target] ?? 0) + l.value;
      });
      p.nodes.forEach((n, i) => {
        const a = Math.max(srcT[i] ?? 0, tgtT[i] ?? 0);
        if (a > 0) nodeArea[n.name] = Math.max(nodeArea[n.name] ?? 0, a);
      });
    });

    const nodeGeos: NodeGeo[] = [];
    YEARS.forEach((year, yi) => {
      const x = PAD_LEFT + yi * colW;
      const arr = CLASS_ORDER.map((cls) => ({
        cls,
        area: nodeArea[`${cls}（${year}）`] ?? 0,
      })).filter((d) => d.area > 0);
      if (!arr.length) return;
      const total = arr.reduce((s, d) => s + d.area, 0);
      const allAreas = arr.map((d) => d.area);
      const usableH = innerH - NODE_GAP * (arr.length - 1);
      let y = PAD_TOP;
      arr.forEach(({ cls, area }) => {
        const h = Math.max(4, scaleArea(area, total, usableH, allAreas));
        nodeGeos.push({ name: `${cls}（${year}）`, cls, year, x, y, h, area });
        y += h + NODE_GAP;
      });
    });

    const nodeMap = new Map(nodeGeos.map((n) => [n.name, n]));
    const bands: Band[] = [];
    const srcOff = new Map<string, number>();
    const tgtOff = new Map<string, number>();
    let bi = 0;

    PERIOD_KEYS.forEach((key) => {
      const p = data[region][key];
      if (!p) return;
      const srcTot: Record<number, number> = {};
      p.links.forEach((l) => {
        srcTot[l.source] = (srcTot[l.source] ?? 0) + l.value;
      });

      [...p.links]
        .sort((a, b) => {
          if (a.is_change !== b.is_change) return a.is_change ? 1 : -1;
          return (
            CLASS_ORDER.indexOf(a.to_class) - CLASS_ORDER.indexOf(b.to_class)
          );
        })
        .forEach((l) => {
          const sn = p.nodes[l.source].name;
          const tn = p.nodes[l.target].name;
          const src = nodeMap.get(sn);
          const tgt = nodeMap.get(tn);
          if (!src || !tgt) return;
          const hs = (l.value / src.area) * src.h;
          const ht = (l.value / tgt.area) * tgt.h;
          const so = srcOff.get(sn) ?? 0;
          const to = tgtOff.get(tn) ?? 0;
          const x0 = src.x + NODE_W,
            y0 = src.y + so;
          const x1 = tgt.x,
            y1 = tgt.y + to;
          bands.push({
            path: linkPath(x0, y0, hs, x1, y1, ht),
            color: getColor(l.from_class),
            isChange: l.is_change,
            srcName: sn,
            tgtName: tn,
            fromCls: l.from_class,
            toCls: l.to_class,
            value: l.value,
            pct: ((l.value / (srcTot[l.source] ?? 1)) * 100).toFixed(1),
            cx0: x0,
            cy0: y0 + hs / 2,
            cx1: x1,
            cy1: y1 + ht / 2,
            idx: bi++,
          });
          srcOff.set(sn, so + hs);
          tgtOff.set(tn, to + ht);
        });
    });

    return { nodes: nodeGeos, bands, totalW };
  }, [data, region, colW]);

  /* hover 相關節點 */
  const relatedNames = useMemo(() => {
    if (!hovered) return new Set<string>();
    const s = new Set<string>([hovered]);
    CLASS_ORDER.forEach((cls) => {
      if (hovered.includes(cls)) YEARS.forEach((y) => s.add(`${cls}（${y}）`));
    });
    bands.forEach((b) => {
      if (b.srcName === hovered || b.tgtName === hovered) {
        s.add(b.srcName);
        s.add(b.tgtName);
      }
    });
    return s;
  }, [hovered, bands]);

  /* ── Tooltip：改用 SVG 座標系，加上 scrollLeft 修正 ── */
  const handleBandEnter = useCallback((e: React.MouseEvent, b: Band) => {
    const rect = scrollRef.current?.getBoundingClientRect();
    const sl = scrollRef.current?.scrollLeft ?? 0;
    if (!rect) return;
    /* SVG 座標 = 視窗座標 - 容器左上角 + 橫向捲動量 */
    setTooltip({
      svgX: e.clientX - rect.left + sl,
      svgY: e.clientY - rect.top,
      html: [
        b.isChange
          ? `<span style="background:${getColor(b.fromCls)};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px">類別轉換</span>`
          : `<span style="background:#b0aba5;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px">維持不變</span>`,
        `<div style="margin-top:5px;font-size:13px"><b>${b.fromCls}</b> → <b>${b.toCls}</b></div>`,
        `<div style="color:#666;font-size:12px;margin-top:1px">面積 <b style="color:#333">${Math.round(b.value).toLocaleString()}</b> 公頃</div>`,
        `<div style="color:#666;font-size:12px">佔來源 ${b.fromCls} <b style="color:#333">${b.pct}%</b></div>`,
      ].join(""),
    });
  }, []);

  /* 捲動到指定年份 */
  const scrollToYear = useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(idx, YEARS.length - 1));
      setCenterIdx(clamped);
      const el = scrollRef.current;
      if (!el) return;
      const x = PAD_LEFT + clamped * colW + NODE_W / 2;
      el.scrollTo({
        left: Math.max(0, x - el.clientWidth / 2),
        behavior: "smooth",
      });
    },
    [colW],
  );

  useEffect(() => {
    if (colW > 0) scrollToYear(centerIdx);
  }, [colW]);

  /* 滾輪橫向捲動 */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const fn = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY * 1.1;
    };
    el.addEventListener("wheel", fn, { passive: false });
    return () => el.removeEventListener("wheel", fn);
  }, []);

  /* 鍵盤左右鍵 */
  const centerIdxRef = useRef(centerIdx);
  useEffect(() => {
    centerIdxRef.current = centerIdx;
  }, [centerIdx]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        scrollToYear(centerIdxRef.current + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        scrollToYear(centerIdxRef.current - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scrollToYear]);

  if (!data)
    return (
      <div
        style={{
          background: BG,
          width: "100%",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT,
        }}
      >
        <span style={{ color: "#a8a29e", fontSize: 14 }}>載入資料中…</span>
      </div>
    );

  const dotLeft = (i: number) =>
    YEARS.length <= 1 ? 0 : (i / (YEARS.length - 1)) * 100;
  const norDotTop = LINE_Y - DOT_R_NOR;
  const selDotTop = LINE_Y - DOT_R_SEL;

  return (
    <div
      ref={rootRef}
      style={{
        width: "100%",
        background: BG,
        fontFamily: FONT,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes flowAnim {
          from { stroke-dashoffset: 0; }
          to   { stroke-dashoffset: -260; }
        }
        .flowline {
          fill: none; stroke: rgba(255,255,255,0.5);
          stroke-linecap: round;
          animation: flowAnim linear infinite;
        }
        ::-webkit-scrollbar { display:none; }
      `}</style>

      {/* Header */}
      <div
        style={{
          padding: "9px 14px 8px",
          borderBottom: "1px solid #e8e2da",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#2b2b2b",
              marginBottom: 6,
            }}
          >
            彰化沿海地覆類別變遷　1985–2022
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              {REGIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => changeRegion(r)}
                  style={{
                    border: "none",
                    borderRadius: 20,
                    padding: "2px 9px",
                    fontSize: 11,
                    cursor: "pointer",
                    fontFamily: FONT,
                    background: region === r ? "#292524" : "#eee9e2",
                    color: region === r ? "#faf7f2" : "#7a736c",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
            <div style={{ width: 1, height: 13, background: "#ddd" }} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 9px" }}>
              {CLASS_ORDER.map((c) => (
                <span
                  key={c}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    color: "#5c5752",
                  }}
                >
                  <i
                    style={{
                      width: 8,
                      height: 8,
                      display: "inline-block",
                      background: getColor(c),
                      borderRadius: 2,
                    }}
                  />
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={() => setAnimated((v) => !v)}
          title={animated ? "關閉流動動畫" : "開啟流動動畫"}
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 6,
            border: "1px solid #ddd8d0",
            borderRadius: 20,
            padding: "4px 10px",
            background: animated ? "#292524" : "#eee9e2",
            color: animated ? "#faf7f2" : "#7a736c",
            fontSize: 11,
            cursor: "pointer",
            fontFamily: FONT,
            transition: "all .2s",
            whiteSpace: "nowrap",
          }}
        >
          <svg width={14} height={10} viewBox="0 0 14 10" fill="none">
            <path
              d="M1 5 Q3.5 1,6 5 Q8.5 9,11 5 Q12.5 2.5,14 5"
              stroke={animated ? "#faf7f2" : "#7a736c"}
              strokeWidth={1.5}
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          {animated ? "流動中" : "靜態"}
        </button>
      </div>

      {/* 圖表區 */}
      <div
        ref={scrollRef}
        style={{
          position: "relative",
          width: "100%",
          height: CHART_H,
          flexShrink: 0,
          overflowX: "auto",
          overflowY: "hidden",
          scrollbarWidth: "none",
        }}
      >
        <svg
          width={totalW}
          height={CHART_H}
          style={{ display: "block", background: BG }}
          onMouseLeave={() => {
            setHovered(null);
            setTooltip(null);
          }}
        >
          <defs>
            {bands.map((_, i) => (
              <clipPath key={i} id={`clip-${i}`}>
                <path d={bands[i].path} />
              </clipPath>
            ))}
          </defs>

          {YEARS.map((y, i) => (
            <text
              key={y}
              x={PAD_LEFT + i * colW + NODE_W / 2}
              y={PAD_TOP - 24}
              textAnchor="middle"
              style={{
                fontSize: 12,
                fontWeight: 700,
                fontFamily: FONT,
                fill: i === centerIdx ? "#4b4742" : "#bdb6ae",
              }}
            >
              {y}
            </text>
          ))}

          {bands.map((b, i) => {
            const lit =
              !hovered ||
              relatedNames.has(b.srcName) ||
              relatedNames.has(b.tgtName);
            const op = lit ? (b.isChange ? 0.55 : 0.11) : 0.02;
            const mx = (b.cx0 + b.cx1) / 2;
            const fp = `M${b.cx0} ${b.cy0} C${mx} ${b.cy0},${mx} ${b.cy1},${b.cx1} ${b.cy1}`;
            return (
              <g key={i}>
                <path
                  d={b.path}
                  fill={b.color}
                  opacity={op}
                  style={{ cursor: "crosshair", transition: "opacity .2s" }}
                  onMouseEnter={(e) => handleBandEnter(e, b)}
                  onMouseLeave={() => setTooltip(null)}
                />
                {b.isChange && lit && animated && (
                  <path
                    d={fp}
                    className="flowline"
                    clipPath={`url(#clip-${i})`}
                    strokeWidth={2.2}
                    strokeDasharray="18 24"
                    style={{ animationDuration: `${1.5 + (i % 8) * 0.13}s` }}
                  />
                )}
              </g>
            );
          })}

          {nodes.map((n) => {
            const active = !hovered || relatedNames.has(n.name);
            const isHov = hovered === n.name;
            const isFirst = n.year === YEARS[0];
            return (
              <g
                key={n.name}
                onMouseEnter={() => setHovered(n.name)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x={n.x}
                  y={n.y}
                  width={NODE_W}
                  height={n.h}
                  fill={getColor(n.cls)}
                  rx={2.5}
                  opacity={active ? 1 : 0.08}
                  style={{ transition: "opacity .2s" }}
                />
                {isHov && (
                  <rect
                    x={n.x - 1.5}
                    y={n.y - 1.5}
                    width={NODE_W + 3}
                    height={n.h + 3}
                    fill="none"
                    stroke={getColor(n.cls)}
                    strokeWidth={1.4}
                    rx={2.5}
                    opacity={0.8}
                  />
                )}
                {n.h >= 12 && (
                  <text
                    x={isFirst ? n.x - 6 : n.x + NODE_W + 6}
                    y={n.y + n.h / 2}
                    dominantBaseline="middle"
                    textAnchor={isFirst ? "end" : "start"}
                    style={{
                      fontSize: n.h >= 26 ? 12 : 9.5,
                      fontWeight: 600,
                      fontFamily: FONT,
                      fill: active ? getColor(n.cls) : "#ddd",
                      pointerEvents: "none",
                    }}
                  >
                    {n.cls}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* ── 智慧 Tooltip，傳入 scrollRef 做邊界計算 ── */}
        {tooltip && (
          <SmartTooltip
            svgX={tooltip.svgX}
            svgY={tooltip.svgY}
            html={tooltip.html}
            scrollRef={scrollRef}
          />
        )}
      </div>

      {/* 時間軸 */}
      <div
        style={{
          flexShrink: 0,
          height: TL_HEIGHT,
          borderTop: "1px solid #e8e2da",
          background: BG,
          position: "relative",
          paddingLeft: 16,
          paddingRight: 16,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            top: LINE_Y,
            height: 2,
            background: "#dfd8cf",
            borderRadius: 2,
            transform: "translateY(-50%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 16,
            top: LINE_Y,
            height: 2,
            width: `calc(${dotLeft(centerIdx)}% * (100% - 32px) / 100%)`,
            background: "#8b8077",
            borderRadius: 2,
            transform: "translateY(-50%)",
            transition: "width .25s ease",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            top: 0,
            bottom: 0,
          }}
        >
          {YEARS.map((y, i) => {
            const sel = i === centerIdx;
            const r = sel ? DOT_R_SEL : DOT_R_NOR;
            const dotT = sel ? selDotTop : norDotTop;
            return (
              <button
                key={y}
                onClick={() => scrollToYear(i)}
                style={{
                  position: "absolute",
                  left: `${dotLeft(i)}%`,
                  top: 0,
                  transform: "translateX(-50%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: FONT,
                }}
              >
                <div
                  style={{
                    width: r * 2,
                    height: r * 2,
                    borderRadius: "50%",
                    background: sel ? "#3f3934" : "#c8c0b8",
                    boxShadow: sel ? "0 0 0 3px rgba(63,57,52,.18)" : "none",
                    marginTop: dotT,
                    transition: "all .22s ease",
                  }}
                />
                <span
                  style={{
                    fontSize: sel ? 11 : 9.5,
                    fontWeight: sel ? 700 : 400,
                    color: sel ? "#3f3934" : "#b2a99f",
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                    transition: "all .22s ease",
                  }}
                >
                  {y}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 操作提示列（補完三種方式）── */}
      <div
        style={{
          flexShrink: 0,
          padding: "5px 16px 7px",
          background: BG,
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "6px 14px",
          borderTop: "1px solid #f0ece6",
        }}
      >
        {/* 滾輪 */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 10,
            color: "#b2a99f",
            fontFamily: FONT,
          }}
        >
          <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
            <rect
              x={4}
              y={1}
              width={6}
              height={10}
              rx={3}
              stroke="#c8c0b8"
              strokeWidth={1.2}
            />
            <line
              x1={7}
              y1={3.5}
              x2={7}
              y2={6}
              stroke="#c8c0b8"
              strokeWidth={1.2}
              strokeLinecap="round"
            />
          </svg>
          滾輪橫向滑動
        </span>
        {/* 鍵盤 */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 10,
            color: "#b2a99f",
            fontFamily: FONT,
          }}
        >
          {["←", "→"].map((k) => (
            <kbd
              key={k}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 18,
                height: 18,
                borderRadius: 3,
                border: "1px solid #d6d0c8",
                background: "#f5f2ed",
                fontSize: 10,
                color: "#8a8078",
                fontFamily: "monospace",
                boxShadow: "0 1px 0 #c8c0b8",
              }}
            >
              {k}
            </kbd>
          ))}
          鍵盤切換年份
        </span>
        {/* Hover */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 10,
            color: "#b2a99f",
            fontFamily: FONT,
          }}
        >
          <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
            <path
              d="M5 2 L5 9 L7 7.5 L8.5 11 L10 10.2 L8.5 6.8 L11 6.8 Z"
              stroke="#c8c0b8"
              strokeWidth={1.1}
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          Hover 查看變遷詳情
        </span>
        {/* 點擊時間軸 */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 10,
            color: "#b2a99f",
            fontFamily: FONT,
          }}
        >
          <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
            <circle cx={7} cy={9} r={2.5} stroke="#c8c0b8" strokeWidth={1.2} />
            <line
              x1={7}
              y1={1}
              x2={7}
              y2={5.5}
              stroke="#c8c0b8"
              strokeWidth={1.2}
              strokeLinecap="round"
            />
          </svg>
          點擊時間軸跳轉
        </span>
      </div>
    </div>
  );
}
