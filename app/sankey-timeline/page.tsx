"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import ReactECharts from "echarts-for-react";

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

const getColor = (cls: string) => C[cls] ?? "#888888";

interface RawLink {
  source:     number;
  target:     number;
  value:      number;
  from_class: string;
  to_class:   string;
  is_change:  boolean;
}
interface RawNode { name: string; }
interface Period {
  nodes:     RawNode[];
  links:     RawLink[];
  year_from: number;
  year_to:   number;
}
type SankeyData = Record<string, Record<string, Period>>;

const REGIONS = ["全部", "鹿港鎮", "線西鄉", "伸港鄉", "福興鄉", "芳苑鄉", "大城鄉"];
const PERIOD_KEYS = [
  "1985→1990","1990→1995","1995→2000","2000→2005",
  "2005→2010","2010→2015","2015→2018","2018→2019",
  "2019→2020","2020→2021","2021→2022",
];

const FONT          = '"Times New Roman","DFKai-SB","標楷體","BiauKai","Noto Sans TC",serif';
const AUTO_INTERVAL = 3200;

export default function SankeyPage() {
  const [data, setData]           = useState<SankeyData | null>(null);
  const [region, setRegion]       = useState("全部");
  const [periodIdx, setPeriodIdx] = useState(0);
  const [paused, setPaused]       = useState(false);
  // 只用來顯示年份標題的淡入，不控制圖表
  const [titleKey, setTitleKey]   = useState(0);

  useEffect(() => {
    fetch("/lulcc_data.json")
      .then(r => r.json())
      .then(d => setData(d.sankey ?? d));
  }, []);

  const availableKeys = useMemo(() => {
    if (!data?.[region]) return [];
    return PERIOD_KEYS.filter(k => data[region][k]);
  }, [data, region]);

  // 切換時段：只改 index，讓 ECharts 自己做平滑過渡
  const goTo = useCallback((idx: number) => {
    if (!availableKeys.length) return;
    const next = ((idx % availableKeys.length) + availableKeys.length) % availableKeys.length;
    setPeriodIdx(next);
    setTitleKey(k => k + 1); // 觸發年份標題淡入
  }, [availableKeys.length]);

  // 自動輪播
  useEffect(() => {
    if (paused || !availableKeys.length) return;
    const id = setInterval(() => {
      setPeriodIdx(p => {
        const next = (p + 1) % availableKeys.length;
        setTitleKey(k => k + 1);
        return next;
      });
    }, AUTO_INTERVAL);
    return () => clearInterval(id);
  }, [paused, availableKeys.length, region]);

  useEffect(() => { setPeriodIdx(0); setTitleKey(0); }, [region]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { setPaused(true); goTo(periodIdx + 1); }
      if (e.key === "ArrowLeft")  { setPaused(true); goTo(periodIdx - 1); }
      if (e.key === " ")          { e.preventDefault(); setPaused(p => !p); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [periodIdx, goTo]);

  const period = useMemo(() => {
    if (!data?.[region]) return null;
    const key = availableKeys[periodIdx];
    return key ? data[region][key] : null;
  }, [data, region, availableKeys, periodIdx]);

  const option = useMemo(() => {
    if (!period) return null;

    const nodes = period.nodes.map(n => {
      const cls = Object.keys(C).find(k => n.name.includes(k)) ?? "";
      return {
        name: n.name,
        itemStyle: { color: getColor(cls) },
        label: {
          position:   n.name.includes(`（${period.year_from}）`) ? "left" : "right",
          fontSize:   13,
          fontWeight: "bold",
          color:      "#333",
          fontFamily: FONT,
        },
      };
    });

    const sourceTotal: Record<string, number> = {};
    period.links.forEach(l => {
      const src = period.nodes[l.source].name;
      sourceTotal[src] = (sourceTotal[src] ?? 0) + l.value;
    });

    const links = period.links.map(l => {
      const srcName = period.nodes[l.source].name;
      const tgtName = period.nodes[l.target].name;
      const pct     = sourceTotal[srcName] > 0
        ? ((l.value / sourceTotal[srcName]) * 100).toFixed(1) : "0.0";
      return {
        source: srcName,
        target: tgtName,
        value:  l.value,
        _isChange:  l.is_change,
        _fromClass: l.from_class,
        _pct:       pct,
        lineStyle: {
          color:     getColor(l.from_class),
          opacity:   l.is_change ? 0.62 : 0.20,
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
            const d = params.data;
            const badge = d._isChange
              ? `<span style="background:#C83535;color:#fff;padding:1px 6px;border-radius:3px;font-size:11px">類別轉換</span>`
              : `<span style="background:#aaa;color:#fff;padding:1px 6px;border-radius:3px;font-size:11px">維持不變</span>`;
            return [
              badge,
              `<b>${d.source}</b> → <b>${d.target}</b>`,
              `面積：<b>${Math.round(d.value).toLocaleString()}</b> 公頃`,
              `佔來源 ${d._fromClass}：<b>${d._pct}%</b>`,
            ].join("<br/>");
          }
          return "";
        },
      },
      series: [{
        type:             "sankey",
        left:             "18%",
        right:            "18%",
        top:              60,
        bottom:           28,
        nodeWidth:        18,
        nodeGap:          16,
        layoutIterations: 0,
        nodeAlign:        "justify",
        // ✅ ECharts 內建平滑過渡，不閃
        animation:              true,
        animationDuration:      900,
        animationEasing:        "cubicInOut",
        animationDurationUpdate: 700,
        animationEasingUpdate:  "cubicInOut",
        data:  nodes,
        links: links,
        emphasis: {
          focus: "adjacency",
          lineStyle: { opacity: 0.9 },
        },
        label: {
          show: true, fontSize: 13, fontWeight: "bold",
          color: "#333", fontFamily: FONT,
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

      {/* ══ 頂部導覽列 ══ */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 199,
        background: "rgba(249,247,240,0.95)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #e7e0d8",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", height: 50, gap: 12,
      }}>
        <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700,
          color: "#2c2c2c", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
          彰化沿海　地覆類別變遷
        </span>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {REGIONS.map(r => (
            <button key={r} onClick={() => setRegion(r)} style={{
              padding: "3px 11px", borderRadius: 20, border: "none",
              fontSize: 12, fontFamily: FONT, cursor: "pointer",
              background: region === r ? "#292524" : "transparent",
              color:      region === r ? "#faf7f2" : "#78716c",
              transition: "all 0.2s",
            }}>{r}</button>
          ))}
        </div>
        <button onClick={() => setPaused(p => !p)} style={{
          padding: "4px 14px", borderRadius: 20,
          border: "1px solid #ccc", background: "none",
          fontSize: 12, fontFamily: FONT, cursor: "pointer",
          color: "#555", whiteSpace: "nowrap",
        }}>
          {paused ? "▶ 播放" : "⏸ 暫停"}
        </button>
      </header>

      {/* ══ 年份浮動標題（只有這個淡入，圖表不閃）══ */}
      <div
        key={titleKey}
        style={{
          position: "fixed", top: 56, left: 0, right: 0, zIndex: 100,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "0 19.5%", pointerEvents: "none",
          animation: "fadeIn 0.5s ease forwards",
        }}>
        <span style={{ fontFamily: FONT, fontSize: 24, fontWeight: 700,
          color: "#3a3a3a", letterSpacing: "0.06em" }}>{yearFrom}</span>
        <span style={{ fontFamily: FONT, fontSize: 13, color: "#bbb" }}>→</span>
        <span style={{ fontFamily: FONT, fontSize: 24, fontWeight: 700,
          color: "#3a3a3a", letterSpacing: "0.06em" }}>{yearTo}</span>
      </div>

      {/* fadeIn keyframe */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ══ 主圖表（不加 key，讓 ECharts 自己平滑過渡）══ */}
      <div style={{ flex: 1, paddingTop: 50 }}>
        {option && (
          <ReactECharts
            option={option}
            style={{ height: "100%", width: "100%" }}
            opts={{ renderer: "svg" }}
            notMerge={false}
          />
        )}
      </div>

      {/* ══ 底部時間軸 ══ */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 199,
        background: "rgba(249,247,240,0.96)", backdropFilter: "blur(8px)",
        borderTop: "1px solid #e7e0d8", padding: "10px 0 14px",
      }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 56px" }}>
          <div style={{ position: "relative", height: 20 }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: "50%",
              height: 1, background: "#ddd8d0", transform: "translateY(-50%)" }} />
            <div style={{
              position: "absolute", left: 0, top: "50%", height: 1,
              background: "#292524", transform: "translateY(-50%)",
              width: `${progress}%`, transition: "width 0.5s ease",
            }} />
            {availableKeys.map((k, i) => {
              const pct      = availableKeys.length > 1 ? (i / (availableKeys.length - 1)) * 100 : 50;
              const isActive = periodIdx === i;
              return (
                <button key={k} title={k}
                  onClick={() => { setPaused(true); goTo(i); }}
                  style={{
                    position: "absolute", left: `${pct}%`, top: "50%",
                    transform: "translate(-50%,-50%)",
                    width: isActive ? 13 : 7, height: isActive ? 13 : 7,
                    borderRadius: "50%",
                    background: isActive ? "#292524" : i < periodIdx ? "#292524" : "#d6d0c8",
                    border:  isActive ? "2px solid #F9F7F0" : "none",
                    outline: isActive ? "2px solid #292524" : "none",
                    cursor: "pointer", padding: 0, transition: "all 0.3s ease",
                  }} />
              );
            })}
          </div>
          <div style={{ position: "relative", height: 16, marginTop: 4 }}>
            {availableKeys.map((k, i) => {
              const pct      = availableKeys.length > 1 ? (i / (availableKeys.length - 1)) * 100 : 50;
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