"use client";
import {
  BUDGET,
  CLOSING_STATS,
  POLICIES,
  type Policy,
} from "@/public/data/balance-policies";
import { useMemo, useRef, useState } from "react";

const FONT = '"Noto Serif TC","Noto Serif",serif';
const BG = "#f2ede0";
const INK = "#1a2b4a";
const ORANGE = "#e8935a";
const GOLD = "#d4a843";
const PANEL_NAVY = "#1e3a5f";
const MUTED = "#8a8168";
const GREEN = "#3a6b4a";
const RED = "#b8503f";

const MAX_TILT = 14; // 度，全部政策關閉時的傾斜角
const MAX_WEIGHT = POLICIES.reduce((a, p) => a + p.weight, 0); // 100

/* ── 太陽能板圖示（線稿風） ── */
function SolarIcon({ size = 46 }: { size?: number }) {
  const rows = 3,
    cols = 4;
  const w = size,
    h = size * 0.62;
  const cellW = w / cols,
    cellH = h / rows;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <rect
        x={0.5}
        y={0.5}
        width={w - 1}
        height={h - 1}
        rx={3}
        fill={PANEL_NAVY}
        stroke={INK}
        strokeWidth={1.4}
      />
      {Array.from({ length: rows - 1 }, (_, r) => (
        <line
          key={`r${r}`}
          x1={0}
          x2={w}
          y1={(r + 1) * cellH}
          y2={(r + 1) * cellH}
          stroke={INK}
          strokeWidth={0.8}
          opacity={0.6}
        />
      ))}
      {Array.from({ length: cols - 1 }, (_, c) => (
        <line
          key={`c${c}`}
          y1={0}
          y2={h}
          x1={(c + 1) * cellW}
          x2={(c + 1) * cellW}
          stroke={INK}
          strokeWidth={0.8}
          opacity={0.6}
        />
      ))}
    </svg>
  );
}

/* ── 稻穗圖示（線稿風） ── */
function RiceIcon({ size = 46 }: { size?: number }) {
  const w = size,
    h = size;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <line
        x1={w / 2}
        y1={h * 0.95}
        x2={w / 2}
        y2={h * 0.25}
        stroke={INK}
        strokeWidth={2}
        strokeLinecap="round"
      />
      {[0.3, 0.45, 0.6, 0.75].map((t, i) => {
        const y = h * (0.9 - t * 0.75);
        const dir = i % 2 === 0 ? 1 : -1;
        return (
          <path
            key={i}
            d={`M ${w / 2} ${y} Q ${w / 2 + dir * w * 0.32} ${y - h * 0.06} ${
              w / 2 + dir * w * 0.4
            } ${y - h * 0.02}`}
            fill="none"
            stroke={GOLD}
            strokeWidth={2}
            strokeLinecap="round"
          />
        );
      })}
      <circle cx={w / 2} cy={h * 0.2} r={h * 0.09} fill={GOLD} stroke={INK} strokeWidth={1} />
    </svg>
  );
}

type DragState = {
  id: string;
  dx: number;
  dy: number;
  moved: boolean;
} | null;

/* ── 可拖曳的政策籌碼（尚未啟用） ── */
function PolicyChip({
  p,
  afford,
  drag,
  rejecting,
  onPointerDown,
}: {
  p: Policy;
  afford: boolean;
  drag: DragState;
  rejecting: boolean;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>, id: string) => void;
}) {
  const isDragging = drag?.id === p.id;
  return (
    <div
      onPointerDown={(e) => afford && onPointerDown(e, p.id)}
      style={{
        position: "relative",
        cursor: afford ? "grab" : "not-allowed",
        userSelect: "none",
        touchAction: "none",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        padding: "14px 16px",
        borderRadius: 10,
        border: `1.5px solid ${afford ? INK : "#ddd5c2"}`,
        background: afford ? "#fff" : "rgba(255,255,255,0.35)",
        opacity: afford ? 1 : 0.55,
        boxShadow: isDragging
          ? "0 14px 28px rgba(26,43,74,0.22)"
          : "0 2px 6px rgba(26,43,74,0.04)",
        transform: isDragging
          ? `translate(${drag.dx}px, ${drag.dy}px) scale(1.03) rotate(${drag.dx * 0.02}deg)`
          : rejecting
            ? undefined
            : "translate(0,0)",
        animation: rejecting ? "chip-reject .4s ease" : undefined,
        transition: isDragging ? "none" : "transform .3s cubic-bezier(.34,1.56,.64,1), opacity .2s",
        zIndex: isDragging ? 50 : 1,
      }}
    >
      <div
        style={{
          flexShrink: 0,
          fontSize: 10,
          fontWeight: 700,
          color: ORANGE,
          width: 16,
        }}
      >
        {p.order}
      </div>
      <div style={{ textAlign: "left", flex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            marginBottom: 3,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, color: INK }}>{p.title}</span>
          <span style={{ fontSize: 11, color: MUTED }}>{p.tagline}</span>
        </div>
        <p style={{ fontSize: 12, lineHeight: 1.75, color: "#4a4536", margin: "0 0 8px" }}>
          {p.body}
        </p>
        <div style={{ display: "flex", gap: 10, fontSize: 10.5 }}>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 999,
              background: afford ? "#f2ede0" : "#eee9dc",
              color: INK,
              fontWeight: 700,
            }}
          >
            成本 {p.cost}
          </span>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 999,
              background: "rgba(212,168,67,0.2)",
              color: "#8a6d1f",
              fontWeight: 700,
            }}
          >
            修正力 +{p.weight}
          </span>
        </div>
        {!afford && (
          <p style={{ fontSize: 10.5, color: RED, margin: "6px 0 0" }}>
            政治能量不足，無法啟用
          </p>
        )}
      </div>
    </div>
  );
}

/* ── 已啟用的政策標籤（可點掉復原） ── */
function ActiveTag({ p, onRemove }: { p: Policy; onRemove: () => void }) {
  return (
    <button
      onClick={onRemove}
      style={{
        all: "unset",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 999,
        border: `1.5px solid ${INK}`,
        background: INK,
        color: "#fff",
        fontSize: 12,
        fontWeight: 700,
        animation: "chip-pop .35s cubic-bezier(.34,1.56,.64,1)",
        whiteSpace: "nowrap",
      }}
      title="點擊移除，退回政治能量"
    >
      {p.title}
      <span style={{ opacity: 0.7, fontWeight: 400 }}>×</span>
    </button>
  );
}

/* ══════════════════════════════════════
   主元件：尋找下一個平衡木
══════════════════════════════════════ */
export default function BalanceBeam() {
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());
  const [drag, setDrag] = useState<DragState>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });

  const usedBudget = useMemo(
    () => POLICIES.reduce((a, p) => a + (activeIds.has(p.id) ? p.cost : 0), 0),
    [activeIds],
  );
  const remaining = BUDGET - usedBudget;

  const weightSum = useMemo(
    () => POLICIES.reduce((a, p) => a + (activeIds.has(p.id) ? p.weight : 0), 0),
    [activeIds],
  );

  const oppositionSum = useMemo(
    () => POLICIES.reduce((a, p) => a + (activeIds.has(p.id) ? p.opposition : 0), 0),
    [activeIds],
  );

  const angle = -MAX_TILT + (weightSum / MAX_WEIGHT) * MAX_TILT;

  const status =
    weightSum === 0
      ? "現況：傾斜失衡"
      : weightSum >= 80
        ? "已接近政策能做到的最大平衡"
        : `逐步修正中・已修正 ${weightSum}%`;

  const oppositionLabel =
    oppositionSum === 0
      ? "尚無阻力"
      : oppositionSum < 35
        ? "阻力輕微"
        : oppositionSum < 60
          ? "阻力升高"
          : "阻力強烈";

  const oppositionColor =
    oppositionSum < 35 ? GREEN : oppositionSum < 60 ? ORANGE : RED;

  const inactivePolicies = POLICIES.filter((p) => !activeIds.has(p.id));
  const activePolicies = POLICIES.filter((p) => activeIds.has(p.id));

  function tryPlace(id: string) {
    const policy = POLICIES.find((p) => p.id === id)!;
    if (remaining < policy.cost) {
      setRejectId(id);
      window.setTimeout(() => setRejectId(null), 420);
      return;
    }
    setActiveIds((prev) => new Set(prev).add(id));
  }

  function removeActive(id: string) {
    setActiveIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function onChipPointerDown(e: React.PointerEvent<HTMLDivElement>, id: string) {
    e.currentTarget.setPointerCapture(e.pointerId);
    startPos.current = { x: e.clientX, y: e.clientY };
    setDrag({ id, dx: 0, dy: 0, moved: false });

    const el = e.currentTarget;

    const handleMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startPos.current.x;
      const dy = ev.clientY - startPos.current.y;
      setDrag({ id, dx, dy, moved: Math.hypot(dx, dy) > 6 });
    };

    const handleUp = (ev: PointerEvent) => {
      el.removeEventListener("pointermove", handleMove);
      el.removeEventListener("pointerup", handleUp);
      const zone = dropZoneRef.current?.getBoundingClientRect();
      const overZone =
        !!zone &&
        ev.clientX >= zone.left &&
        ev.clientX <= zone.right &&
        ev.clientY >= zone.top &&
        ev.clientY <= zone.bottom;

      setDrag(null);
      // 拖進天平區域，或只是輕點一下（沒有明顯拖曳位移），都視為嘗試放置
      const dx = ev.clientX - startPos.current.x;
      const dy = ev.clientY - startPos.current.y;
      const wasTap = Math.hypot(dx, dy) <= 6;
      if (overZone || wasTap) {
        tryPlace(id);
      }
    };

    el.addEventListener("pointermove", handleMove);
    el.addEventListener("pointerup", handleUp);
  }

  // 舞台幾何
  const STAGE_W = 420,
    STAGE_H = 260;
  const FULCRUM_X = STAGE_W / 2,
    FULCRUM_Y = STAGE_H * 0.72;
  const BEAM_HALF = 150,
    BEAM_Y = FULCRUM_Y - 14;

  return (
    <div
      style={{
        background: BG,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: FONT,
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
        @keyframes chip-reject {
          0%   { transform: translate(0,0) rotate(0deg); }
          25%  { transform: translate(-10px,0) rotate(-3deg); }
          50%  { transform: translate(8px,0) rotate(2deg); }
          75%  { transform: translate(-5px,0) rotate(-1deg); }
          100% { transform: translate(0,0) rotate(0deg); }
        }
        @keyframes chip-pop {
          0%   { transform: scale(.6); opacity: 0; }
          60%  { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <header
        style={{
          flexShrink: 0,
          background: "rgba(242,237,224,0.96)",
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid #ddd5c2`,
          padding: "14px 40px",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 800, color: INK }}>
          尋找下一個平衡木
        </div>
        <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
          你的政治能量只有 {BUDGET}，四項政策做不完——把籌碼拖到右邊的天平上，選出你的優先序
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* 左側：籌碼與已啟用清單 */}
        <div
          style={{
            width: 400,
            flexShrink: 0,
            overflowY: "auto",
            padding: "18px 20px 32px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            borderRight: "1px solid #ddd5c2",
          }}
        >
          {/* 預算條 */}
          <div style={{ marginBottom: 4 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: MUTED,
                marginBottom: 4,
              }}
            >
              <span>政治能量</span>
              <span style={{ fontWeight: 700, color: remaining === 0 ? RED : INK }}>
                {remaining} / {BUDGET}
              </span>
            </div>
            <div
              style={{
                height: 8,
                borderRadius: 999,
                background: "#e3dcc9",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(remaining / BUDGET) * 100}%`,
                  background: remaining === 0 ? RED : INK,
                  transition: "width .4s cubic-bezier(.34,1.2,.64,1), background .3s",
                }}
              />
            </div>
          </div>

          {activePolicies.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 4 }}>
              {activePolicies.map((p) => (
                <ActiveTag key={p.id} p={p} onRemove={() => removeActive(p.id)} />
              ))}
            </div>
          )}

          {inactivePolicies.map((p) => (
            <PolicyChip
              key={p.id}
              p={p}
              afford={remaining >= p.cost}
              drag={drag}
              rejecting={rejectId === p.id}
              onPointerDown={onChipPointerDown}
            />
          ))}
        </div>

        {/* 右側：平衡木舞台（同時是拖曳放置區） */}
        <div
          ref={dropZoneRef}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            minWidth: 0,
            position: "relative",
            outline: drag ? `2px dashed ${ORANGE}` : "2px dashed transparent",
            outlineOffset: -8,
            transition: "outline-color .2s",
          }}
        >
          {drag && (
            <div
              style={{
                position: "absolute",
                top: 12,
                fontSize: 11,
                color: ORANGE,
                fontWeight: 700,
              }}
            >
              放開，把它放上天平
            </div>
          )}

          <svg
            width={STAGE_W}
            height={STAGE_H}
            viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
            style={{ maxWidth: "100%", height: "auto" }}
          >
            <line
              x1={0}
              y1={FULCRUM_Y + 40}
              x2={STAGE_W}
              y2={FULCRUM_Y + 40}
              stroke="#ddd5c2"
              strokeWidth={2}
            />
            <path
              d={`M ${FULCRUM_X - 22} ${FULCRUM_Y + 40} L ${FULCRUM_X} ${FULCRUM_Y - 4} L ${
                FULCRUM_X + 22
              } ${FULCRUM_Y + 40} Z`}
              fill="none"
              stroke={INK}
              strokeWidth={2.2}
              strokeLinejoin="round"
            />

            <g
              style={{
                transform: `rotate(${angle}deg)`,
                transformOrigin: `${FULCRUM_X}px ${FULCRUM_Y}px`,
                transition: "transform .7s cubic-bezier(.32,1.7,.34,1)",
              }}
            >
              <line
                x1={FULCRUM_X - BEAM_HALF}
                y1={BEAM_Y}
                x2={FULCRUM_X + BEAM_HALF}
                y2={BEAM_Y}
                stroke={INK}
                strokeWidth={6}
                strokeLinecap="round"
              />
              <g transform={`translate(${FULCRUM_X - BEAM_HALF - 5}, ${BEAM_Y - 46})`}>
                <SolarIcon />
              </g>
              <g transform={`translate(${FULCRUM_X + BEAM_HALF - 40}, ${BEAM_Y - 46})`}>
                <RiceIcon />
              </g>
              {activePolicies.map((_, i) => (
                <circle
                  key={i}
                  cx={FULCRUM_X + BEAM_HALF - 20 - i * 12}
                  cy={BEAM_Y - 54}
                  r={4}
                  fill={GOLD}
                  stroke={INK}
                  strokeWidth={1}
                />
              ))}
            </g>
          </svg>

          <div
            style={{
              marginTop: 4,
              fontSize: 14,
              fontWeight: 700,
              color: weightSum >= 80 ? GREEN : INK,
              transition: "color .3s",
            }}
          >
            {status}
          </div>

          <div style={{ marginTop: 2, fontSize: 11, color: MUTED, display: "flex", gap: 16 }}>
            <span>← 光電擴張</span>
            <span>農地與糧食安全 →</span>
          </div>

          {/* 社會阻力量表 */}
          <div style={{ marginTop: 14, width: 280 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: MUTED,
                marginBottom: 4,
              }}
            >
              <span>社會阻力</span>
              <span style={{ fontWeight: 700, color: oppositionColor }}>
                {oppositionLabel}
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: "#e3dcc9", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(oppositionSum, 100)}%`,
                  background: oppositionColor,
                  transition: "width .5s cubic-bezier(.34,1.2,.64,1), background .3s",
                }}
              />
            </div>
            {activePolicies.length > 0 && (
              <div style={{ marginTop: 6, fontSize: 10.5, color: "#6b6450", lineHeight: 1.7 }}>
                {activePolicies.map((p) => p.reaction).join("；")}
              </div>
            )}
          </div>

          {/* 收尾統計 + 引言 */}
          <div style={{ marginTop: 16, maxWidth: 460, width: "100%" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 6,
                marginBottom: 12,
              }}
            >
              {CLOSING_STATS.map((s) => (
                <div
                  key={s.label}
                  title={s.hint}
                  style={{
                    background: "rgba(255,255,255,0.5)",
                    border: "1px solid #ddd5c2",
                    borderRadius: 8,
                    padding: "6px 4px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 800, color: INK }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: MUTED }}>{s.label}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, lineHeight: 1.9, color: "#4a4536", margin: 0, textAlign: "center" }}>
              下一個 40 年，衛星將繼續記錄。我們希望它記錄的，是一個不同的故事——
              這取決於我們現在的選擇。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
