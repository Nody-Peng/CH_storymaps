"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";

interface YearPoint {
  year: number;
  area: number;
  rank: number;
}
type BumpData = Record<string, YearPoint[]>;

const COLORS: Record<string, string> = {
  農地:    "#8BC34A",
  建地:    "#FF7043",
  水體:    "#29B6F6",
  陸域森林: "#2E7D32",
  感潮灘地: "#80DEEA",
  紅樹林:  "#00695C",
  草生地:  "#AED581",
  裸地:   "#BCAAA4",
};

// Cubic bezier bump path
function bumpPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const x0 = points[i].x, y0 = points[i].y;
    const x1 = points[i + 1].x, y1 = points[i + 1].y;
    const mx = (x0 + x1) / 2;
    d += ` C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
  }
  return d;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function LandUsePage() {
  const [data, setData]         = useState<BumpData>({});
  const [years, setYears]       = useState<number[]>([]);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded]     = useState(false);
  const [hovered, setHovered]   = useState<string | null>(null);
  const rafRef   = useRef<number | null>(null);
  const startTs  = useRef<number | null>(null);
  const DURATION = 9000;

  useEffect(() => {
    fetch("/data/changhua_bump.json")
      .then(r => r.json())
      .then((json: BumpData) => {
        // 確保每條線的 year 都是 number
        const cleaned: BumpData = {};
        for (const [lt, pts] of Object.entries(json)) {
          cleaned[lt] = pts.map(p => ({ ...p, year: Number(p.year) }));
        }
        const allYears = Array.from(
          new Set(Object.values(cleaned).flatMap(pts => pts.map(p => p.year)))
        ).sort((a, b) => a - b);
        setData(cleaned);
        setYears(allYears);
        setLoaded(true);
      });
  }, []);

  const animate = useCallback((ts: number) => {
    if (startTs.current === null) startTs.current = ts;
    const p = Math.min((ts - startTs.current) / DURATION, 1);
    setProgress(p);
    if (p < 1) {
      rafRef.current = requestAnimationFrame(animate);
    } else {
      setTimeout(() => {
        startTs.current = null;
        setProgress(0);
        rafRef.current = requestAnimationFrame(animate);
      }, 2000);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [loaded, animate]);

  if (!loaded || years.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="text-gray-400 text-lg animate-pulse">載入中...</div>
      </div>
    );
  }

  // SVG 尺寸
  const W = 900, H = 540;
  const PAD = { top: 50, right: 150, bottom: 44, left: 56 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const landTypes = Object.keys(data);
  const totalRanks = landTypes.length;

  // 年份 index → X pixel
  const xByIdx = (idx: number) =>
    PAD.left + (idx / (years.length - 1)) * chartW;

  // rank → Y pixel（rank 1 最上）
  const yByRank = (rank: number) =>
    PAD.top + ((rank - 1) / (totalRanks - 1)) * chartH;

  // progress → 浮點年份 index
  const floatIdx = progress * (years.length - 1);
  const baseIdx  = Math.min(Math.floor(floatIdx), years.length - 2);
  const frac     = floatIdx - baseIdx;

  // 顯示年份（插值）
  const displayYear = Math.round(lerp(years[baseIdx], years[Math.min(baseIdx + 1, years.length - 1)], frac));

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center py-8 px-4">
      <div className="w-full max-w-4xl mb-4">
        <h1 className="text-2xl font-bold text-white">彰化縣土地利用排名變遷</h1>
        <p className="text-gray-400 text-sm mt-1">各土地類型面積排名 · 1985 – 2021</p>
      </div>

      <div className="w-full max-w-4xl bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">

          {/* 年份浮水印 */}
          <text x={W / 2} y={H / 2 + 30} textAnchor="middle"
            fontSize={130} fontWeight="900" fill="rgba(255,255,255,0.035)">
            {displayYear}
          </text>

          {/* rank 格線 */}
          {Array.from({ length: totalRanks }, (_, i) => i + 1).map(rank => (
            <line key={rank}
              x1={PAD.left} x2={PAD.left + chartW}
              y1={yByRank(rank)} y2={yByRank(rank)}
              stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
          ))}

          {/* X 軸年份 */}
          {years.map((y, i) => (
            <text key={y} x={xByIdx(i)} y={H - 10}
              textAnchor="middle" fontSize={11}
              fill={displayYear === y ? "#fff" : "rgba(255,255,255,0.3)"}
              fontWeight={displayYear === y ? "700" : "400"}>
              {y}
            </text>
          ))}

          {/* Y 軸排名 */}
          {Array.from({ length: totalRanks }, (_, i) => i + 1).map(rank => (
            <text key={rank} x={PAD.left - 10} y={yByRank(rank) + 4}
              textAnchor="end" fontSize={11} fill="rgba(255,255,255,0.3)">
              #{rank}
            </text>
          ))}

          {/* 各土地類型 */}
          {landTypes.map(lt => {
            const pts = data[lt];
            if (!pts || pts.length === 0) return null;
            const color = COLORS[lt] ?? "#aaa";
            const isHovered = hovered === lt;
            const opacity = hovered ? (isHovered ? 1 : 0.12) : 0.82;

            // 建立可見點（含插值末端）
            const visiblePts: { x: number; y: number }[] = [];

            for (let i = 0; i < pts.length; i++) {
              const ptYearIdx = years.indexOf(pts[i].year);
              if (ptYearIdx < 0) continue;

              if (ptYearIdx < baseIdx) {
                // 完全在動畫時間之前 → 直接加入
                visiblePts.push({ x: xByIdx(ptYearIdx), y: yByRank(pts[i].rank) });
              } else if (ptYearIdx === baseIdx) {
                // 當前區間起點
                visiblePts.push({ x: xByIdx(ptYearIdx), y: yByRank(pts[i].rank) });
                // 加入插值末端
                const nextPt = pts[i + 1];
                if (nextPt) {
                  const nextYearIdx = years.indexOf(nextPt.year);
                  if (nextYearIdx > baseIdx) {
                    const ix = lerp(xByIdx(ptYearIdx), xByIdx(nextYearIdx), frac);
                    const iy = yByRank(lerp(pts[i].rank, nextPt.rank, frac));
                    visiblePts.push({ x: ix, y: iy });
                  }
                }
                break;
              } else {
                break;
              }
            }

            if (visiblePts.length === 0) return null;

            const lastPt = visiblePts[visiblePts.length - 1];
            const d = bumpPath(visiblePts);

            return (
              <g key={lt} style={{ opacity }}
                onMouseEnter={() => setHovered(lt)}
                onMouseLeave={() => setHovered(null)}>
                {/* 線條 */}
                <path d={d} fill="none" stroke={color}
                  strokeWidth={isHovered ? 4.5 : 2.5}
                  strokeLinecap="round" />
                {/* 線頭點 */}
                <circle cx={lastPt.x} cy={lastPt.y}
                  r={isHovered ? 8 : 5} fill={color} />
                {/* 標籤 */}
                <text x={lastPt.x + 14} y={lastPt.y + 4}
                  fontSize={isHovered ? 14 : 12}
                  fontWeight={isHovered ? "700" : "500"}
                  fill={color}>
                  {lt}
                </text>
              </g>
            );
          })}

          {/* 時間游標線 */}
          <line
            x1={PAD.left + progress * chartW}
            x2={PAD.left + progress * chartW}
            y1={PAD.top - 12} y2={PAD.top + chartH + 12}
            stroke="rgba(255,255,255,0.18)"
            strokeWidth={1.5} strokeDasharray="4 3" />
        </svg>
      </div>

      <p className="mt-4 text-xs text-gray-600">
        資料來源：國土利用調查
      </p>
    </div>
  );
}