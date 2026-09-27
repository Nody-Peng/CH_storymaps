"use client";
import { CLOSING_STATS, POLICIES, type Policy } from "@/public/data/balance-policies";
import { useMemo, useState } from "react";

const FONT = '"Noto Serif TC","Noto Serif",serif';
const BG = "#f2ede0";
const INK = "#1a2b4a";
const ORANGE = "#e8935a";
const GOLD = "#d4a843";
const PANEL_NAVY = "#1e3a5f";
const MUTED = "#8a8168";

const MAX_TILT = 14; // 度，全部政策關閉時的傾斜角

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

/* ── 政策切換卡片 ── */
function PolicyCard({
  p,
  enabled,
  onToggle,
}: {
  p: Policy;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        all: "unset",
        cursor: "pointer",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        padding: "14px 16px",
        borderRadius: 10,
        border: `1.5px solid ${enabled ? INK : "#ddd5c2"}`,
        background: enabled ? "#fff" : "rgba(255,255,255,0.4)",
        boxShadow: enabled ? "0 4px 14px rgba(26,43,74,0.08)" : "none",
        transition: "all .25s",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 22,
          height: 22,
          borderRadius: "50%",
          border: `2px solid ${enabled ? INK : "#c9c0a8"}`,
          background: enabled ? INK : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 2,
          transition: "all .2s",
        }}
      >
        {enabled && (
          <svg width={12} height={12} viewBox="0 0 12 12">
            <path
              d="M2 6l2.5 2.5L10 3"
              fill="none"
              stroke="#fff"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <div style={{ textAlign: "left" }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            marginBottom: 3,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: enabled ? ORANGE : MUTED,
              fontFamily: FONT,
            }}
          >
            {p.order}
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: INK,
              fontFamily: FONT,
            }}
          >
            {p.title}
          </span>
          <span style={{ fontSize: 11, color: MUTED, fontFamily: FONT }}>
            {p.tagline}
          </span>
        </div>
        <p
          style={{
            fontSize: 12,
            lineHeight: 1.75,
            color: "#4a4536",
            margin: 0,
            fontFamily: FONT,
          }}
        >
          {p.body}
        </p>
      </div>
    </button>
  );
}

/* ══════════════════════════════════════
   主元件：尋找下一個平衡木
══════════════════════════════════════ */
export default function BalanceBeam() {
  const [enabled, setEnabled] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setEnabled((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const sum = useMemo(
    () =>
      POLICIES.reduce((acc, p) => acc + (enabled.has(p.id) ? p.weight : 0), 0),
    [enabled],
  );

  const angle = -MAX_TILT + (sum / 100) * MAX_TILT; // -14 → 0

  const status =
    sum === 0
      ? "現況：傾斜失衡"
      : sum === 100
        ? "四項政策到位：找到平衡"
        : `逐步修正中・已修正 ${sum}%`;

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
      <style>{`* { box-sizing: border-box; } ::-webkit-scrollbar { display: none; }`}</style>

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
          綠能與糧食，不該是零和遊戲——點選下方四項政策，看看平衡木會怎麼變化
        </div>
      </header>

      <div
        style={{
          flex: 1,
          display: "flex",
          minHeight: 0,
        }}
      >
        {/* 左側：政策清單 */}
        <div
          style={{
            width: 400,
            flexShrink: 0,
            overflowY: "auto",
            padding: "20px 20px 32px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            borderRight: "1px solid #ddd5c2",
          }}
        >
          {POLICIES.map((p) => (
            <PolicyCard
              key={p.id}
              p={p}
              enabled={enabled.has(p.id)}
              onToggle={() => toggle(p.id)}
            />
          ))}
        </div>

        {/* 右側：平衡木舞台 */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            minWidth: 0,
          }}
        >
          <svg
            width={STAGE_W}
            height={STAGE_H}
            viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
            style={{ maxWidth: "100%", height: "auto" }}
          >
            {/* 地面 */}
            <line
              x1={0}
              y1={FULCRUM_Y + 40}
              x2={STAGE_W}
              y2={FULCRUM_Y + 40}
              stroke="#ddd5c2"
              strokeWidth={2}
            />
            {/* 支點三角形 */}
            <path
              d={`M ${FULCRUM_X - 22} ${FULCRUM_Y + 40} L ${FULCRUM_X} ${FULCRUM_Y - 4} L ${
                FULCRUM_X + 22
              } ${FULCRUM_Y + 40} Z`}
              fill="none"
              stroke={INK}
              strokeWidth={2.2}
              strokeLinejoin="round"
            />

            {/* 會旋轉的樑 + 重物群組 */}
            <g
              style={{
                transform: `rotate(${angle}deg)`,
                transformOrigin: `${FULCRUM_X}px ${FULCRUM_Y}px`,
                transition: "transform .6s cubic-bezier(.34,1.4,.4,1)",
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
            </g>
          </svg>

          <div
            style={{
              marginTop: 8,
              fontSize: 14,
              fontWeight: 700,
              color: sum === 100 ? "#3a6b4a" : INK,
              transition: "color .3s",
            }}
          >
            {status}
          </div>

          <div
            style={{
              marginTop: 4,
              fontSize: 11,
              color: MUTED,
              display: "flex",
              gap: 16,
            }}
          >
            <span>← 光電擴張</span>
            <span>農地與糧食安全 →</span>
          </div>

          {/* 收尾統計 + 引言 */}
          <div
            style={{
              marginTop: 20,
              maxWidth: 460,
              width: "100%",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 6,
                marginBottom: 14,
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
                  <div style={{ fontSize: 13, fontWeight: 800, color: INK }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 9, color: MUTED }}>{s.label}</div>
                </div>
              ))}
            </div>
            <p
              style={{
                fontSize: 12,
                lineHeight: 1.9,
                color: "#4a4536",
                margin: 0,
                textAlign: "center",
              }}
            >
              下一個 40 年，衛星將繼續記錄。我們希望它記錄的，是一個不同的故事——
              這取決於我們現在的選擇。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
