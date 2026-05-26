"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import ReactECharts from "echarts-for-react";

// ── 色彩 ──────────────────────────────────────────────────────
const C: Record<string, string> = {
  建地:     "#C83535",
  感潮灘地: "#9B7B55",
  水體:     "#3A7DBF",
  紅樹林:   "#6DA896",
  草生地:   "#7DAF5E",
  裸地:     "#999999",
  農地:     "#C8A83A",
  陸域森林: "#3E8040",
};

const getColor = (name: string) => {
  for (const key of Object.keys(C)) {
    if (name.includes(key)) return C[key];
  }
  return "#888888";
};

// ── 型別 ──────────────────────────────────────────────────────
interface RawNode { name: string; }
interface RawLink {
  source: number;
  target: number;
  value: number;
  label: string;
  isSame?: boolean;
}
interface Period {
  nodes: RawNode[];
  links: RawLink[];
  year_from: number;
  year_to: number;
}
type SankeyData = Record<string, Record<string, Period>>;

const REGIONS = ["全部", "鹿港鎮", "線西鄉", "伸港鄉", "福興鄉", "芳苑鄉", "大城鄉"];

const PERIOD_KEYS = [
  "1985→1990","1990→1995","1995→2000","2000→2005",
  "2005→2010","2010→2015","2015→2018","2018→2019",
  "2019→2020","2020→2021","2021→2022",
];

const FONT = '"Times New Roman","DFKai-SB","標楷體","BiauKai","Noto Sans TC",serif';

const AUTO_INTERVAL = 2800;
const FADE_DURATION = 400;

export default function SankeyPage() {
  const [data, setData]           = useState<SankeyData | null>(null);
  const [region, setRegion]       = useState("全部");
  const [periodIdx, setPeriodIdx] = useState(0);
  const [opacity, setOpacity]     = useState(1);
  const [paused, setPaused]       = useState(false);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockRef   = useRef(false);

  useEffect(() => {
    fetch("/lulcc_sankey_v2.json")
      .then(r => r.json())
      .then(d => setData(d.sankey ?? d));
  }, []);

  const availableKeys = useMemo(() => {
    if (!data || !data[region]) return [];
    return PERIOD_KEYS.filter(k => data[region][k]);
  }, [data, region]);

  const goTo = useCallback((idx: number) => {
    if (lockRef.current) return;
    const len = availableKeys.length;
    if (!len) return;
    const next = ((idx % len) + len) % len;
    lockRef.current = true;
    setOpacity(0);
    setTimeout(() => {
      setPeriodIdx(next);
      setOpacity(1);
      setTimeout(() => { lockRef.current = false; }, FADE_DURATION);
    }, FADE_DURATION);
  }, [availableKeys.length]);

  // 自動輪播
  useEffect(() => {
    if (paused || !availableKeys.length) return;
    const id = setInterval(() => {
      setPeriodIdx(prev => {
        const next = (prev + 1) % availableKeys.length;
        setOpacity(0);
        setTimeout(() => setOpacity(1), FADE_DURATION);
        return next;
      });
    }, AUTO_INTERVAL);
    return () => clearInterval(id);
  }, [paused, availableKeys.length, region]);

  useEffect(() => { setPeriodIdx(0); }, [region]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { setPaused(true); goTo(periodIdx + 1); }
      if (e.key === "ArrowLeft")  { setPaused(true); goTo(periodIdx - 1); }
      if (e.key === " ")          { setPaused(p => !p); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [periodIdx, goTo]);

  const period = useMemo(() => {
    if (!data || !data[region]) return null;
    const key = availableKeys[periodIdx];
    return key ? data[region][key] : null;
  }, [data, region, availableKeys, periodIdx]);

  const option = useMemo(() => {
    if (!period) return null;

    const nodes = period.nodes.map(n => ({
      name: n.name,
      itemStyle: { color: getColor(n.name) },
      label: {
        position: n.name.includes(`（${period.year_from}）`) ? "left" : "right",
        fontSize: 13,
        fontWeight: "bold",
        color: "#333",
        fontFamily: FONT,
      },
    }));

    const sourceTotal: Record<string, number> = {};
    period.links.forEach(l => {
      const src = period.nodes[l.source].name;
      sourceTotal[src] = (sourceTotal[src] ?? 0) + l.value;
    });

    const links = period.links.map(l => {
      const srcName = period.nodes[l.source].name;
      const tgtName = period.nodes[l.target].name;
      const srcClass = Object.keys(C).find(k => srcName.includes(k)) ?? "";
      const tgtClass = Object.keys(C).find(k => tgtName.includes(k)) ?? "";
      const isSame   = srcClass !== "" && srcClass === tgtClass;
      const color    = getColor(srcName); // ✅ 永遠用來源節點的類別顏色

      return {
        source:  srcName,
        target:  tgtName,
        value:   l.value,
        _isSame: isSame,
        _pct:    sourceTotal[srcName] > 0
                   ? ((l.value / sourceTotal[srcName]) * 100).toFixed(1)
                   : "0.0",
        lineStyle: {
          color,
          opacity:   isSame ? 0.18 : 0.62, // ✅ 同類淡、跨類深，但都有顏色
          curveness: 0.5,
        },
      };
    });

    return {
      backgroundColor: "#F9F7F0",
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(255,255,255,0.97)",
        borderColor: "#e0e0e0",
        borderWidth: 1,
        textStyle: { fontFamily: FONT, fontSize: 13, color: "#333" },
        formatter: (params: any) => {
          if (params.dataType === "node") return `<b>${params.name}</b>`;
          if (params.dataType === "edge") {
            const d = params.data as any;
            const tag = d._isSame
              ? `<span style="color:#aaa">（維持不變）</span>`
              : `<span style="color:#C83535;font-weight:bold">▶ 類別轉換</span>`;
            return [
              `<b>${d.source}</b>`,
              `<span style="color:#999">↓</span>`,
              `<b>${d.target}</b>`,
              `面積：<b>${Math.round(d.value).toLocaleString()}</b> 公頃`,
              `佔來源：<b>${d._pct}%</b>　${tag}`,
            ].join("<br/>");
          }
          return "";
        },
      },
      series: [{
        type:             "sankey",
        left:             "18%",
        right:            "18%",
        top:              56,
        bottom:           32,
        nodeWidth:        18,
        nodeGap:          16,
        layoutIterations: 0,
        nodeAlign:        "justify",
        animation:        true,
        animationDuration: 600,
        animationEasing:  "cubicOut",
        data:  nodes,
        links: links,
        emphasis: {
          focus: "adjacency",
          lineStyle: { opacity: 0.9 },
        },
        label: {
          show:       true,
          fontSize:   13,
          fontWeight: "bold",
          color:      "#333",
          fontFamily: FONT,
        },
      }],
    };
  }, [period]);

  if (!data) {
    return (
      <div style={{ background: "#F9F7F0", height: "100vh", display: "flex",
        alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#a8a29e", fontFamily: FONT, fontSize: 16 }}>載入資料中…</p>
      </div>
    );
  }

  const currentKey = availableKeys[periodIdx] ?? "";
  const [yearFrom, yearTo] = currentKey.split("→");
  const progress = availableKeys.length > 1
    ? (periodIdx / (availableKeys.length - 1)) * 100 : 0;

  return (
    <div style={{ background: "#F9F7F0", height: "100vh", display: "flex",
      flexDirection: "column", overflow: "hidden" }}>

      {/* ── 頂部導覽 ── */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 199,
        background: "rgba(249,247,240,0.95)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #e7e0d8",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", height: 50, gap: 16,
      }}>
        <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700,
          color: "#2c2c2c", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
          彰化沿海六鄉鎮　地覆類別變遷
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          {REGIONS.map(r => (
            <button key={r} onClick={() => setRegion(r)}
              style={{
                padding: "3px 12px", borderRadius: 20, border: "none",
                fontSize: 12, fontFamily: FONT, cursor: "pointer",
                background: region === r ? "#292524" : "transparent",
                color:      region === r ? "#faf7f2" : "#78716c",
                transition: "all 0.2s",
              }}>
              {r}
            </button>
          ))}
        </div>
        <button onClick={() => setPaused(p => !p)}
          style={{
            padding: "4px 16px", borderRadius: 20,
            border: "1px solid #ccc", background: "none",
            fontSize: 12, fontFamily: FONT, cursor: "pointer",
            color: "#555", whiteSpace: "nowrap",
          }}>
          {paused ? "▶ 播放" : "⏸ 暫停"}
        </button>
      </header>

      {/* ── 年份大標題 ── */}
      <div style={{
        position: "fixed", top: 58, left: 0, right: 0, zIndex: 100,
        display: "flex", justifyContent: "space-between",
        padding: "0 19%", pointerEvents: "none",
        transition: `opacity ${FADE_DURATION}ms ease`,
        opacity,
      }}>
        <span style={{ fontFamily: FONT, fontSize: 22, fontWeight: 700,
          color: "#444", letterSpacing: "0.06em" }}>{yearFrom}</span>
        <span style={{ fontFamily: FONT, fontSize: 14, color: "#aaa",
          alignSelf: "center" }}>→</span>
        <span style={{ fontFamily: FONT, fontSize: 22, fontWeight: 700,
          color: "#444", letterSpacing: "0.06em" }}>{yearTo}</span>
      </div>

      {/* ── 主圖表 ── */}
      <div style={{
        flex: 1, paddingTop: 50,
        transition: `opacity ${FADE_DURATION}ms ease`,
        opacity,
      }}>
        {option && (
          <ReactECharts
            key={`${region}-${currentKey}`}
            option={option}
            style={{ height: "100%", width: "100%" }}
            opts={{ renderer: "svg" }}
            notMerge={true}
          />
        )}
      </div>

      {/* ── 底部時間軸 ── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 199,
        background: "rgba(249,247,240,0.96)", backdropFilter: "blur(8px)",
        borderTop: "1px solid #e7e0d8", padding: "10px 0 14px",
      }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 60px" }}>
          <div style={{ position: "relative", height: 20 }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: "50%",
              height: 1, background: "#ddd8d0", transform: "translateY(-50%)" }} />
            <div style={{
              position: "absolute", left: 0, top: "50%",
              height: 1, background: "#292524", transform: "translateY(-50%)",
              width: `${progress}%`, transition: "width 0.4s ease",
            }} />
            {availableKeys.map((k, i) => {
              const pct = availableKeys.length > 1
                ? (i / (availableKeys.length - 1)) * 100 : 50;
              const isActive = periodIdx === i;
              return (
                <button key={k}
                  onClick={() => { setPaused(true); goTo(i); }}
                  title={k}
                  style={{
                    position: "absolute",
                    left: `${pct}%`, top: "50%",
                    transform: "translate(-50%, -50%)",
                    width:  isActive ? 13 : 7,
                    height: isActive ? 13 : 7,
                    borderRadius: "50%",
                    background: isActive ? "#292524" : i < periodIdx ? "#292524" : "#d6d0c8",
                    border:  isActive ? "2px solid #F9F7F0" : "none",
                    outline: isActive ? "2px solid #292524" : "none",
                    cursor: "pointer", padding: 0,
                    transition: "all 0.3s ease",
                  }} />
              );
            })}
          </div>
          <div style={{ position: "relative", height: 16, marginTop: 4 }}>
            {availableKeys.map((k, i) => {
              const pct = availableKeys.length > 1
                ? (i / (availableKeys.length - 1)) * 100 : 50;
              const isActive = periodIdx === i;
              return (
                <button key={k}
                  onClick={() => { setPaused(true); goTo(i); }}
                  style={{
                    position: "absolute", left: `${pct}%`,
                    transform: "translateX(-50%)",
                    fontSize: isActive ? 11 : 10,
                    fontWeight: isActive ? 700 : 400,
                    color: isActive ? "#292524" : "#b5afa8",
                    whiteSpace: "nowrap", transition: "all 0.25s ease",
                    cursor: "pointer", background: "none",
                    border: "none", padding: 0, fontFamily: FONT,
                  }}>
                  {k.split("→")[0]}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}