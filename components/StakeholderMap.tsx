"use client";
import {
  RELATIONS,
  STAKEHOLDERS,
  type Stakeholder,
} from "@/public/data/stakeholders";
import { useCallback, useEffect, useRef, useState } from "react";

const FONT = '"Noto Serif TC","Noto Serif",serif';
const BG = "#F9F7F0";
const ACCENT = "#78716c";
const R = 46;
const PANEL_W = 380;

/* ── 外部連結圖示 ── */
function ExtIcon() {
  return (
    <svg
      width={11}
      height={11}
      viewBox="0 0 12 12"
      fill="none"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M2 10L10 2M10 2H5M10 2V7"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── 關係線 ── */
function RelationLines({
  active,
  w,
  h,
  offsetX,
  offsetY,
}: {
  active: string | null;
  w: number;
  h: number;
  offsetX: number;
  offsetY: number;
}) {
  const pos = (id: string) => {
    const s = STAKEHOLDERS.find((s) => s.id === id);
    return s ? { x: s.x * w + offsetX, y: s.y * h + offsetY } : { x: 0, y: 0 };
  };

  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      <defs>
        <marker
          id="arr"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L6,3 z" fill="#c4bdb4" />
        </marker>
        <marker
          id="arr-hi"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L6,3 z" fill={ACCENT} />
        </marker>
      </defs>

      {RELATIONS.map((rel, i) => {
        const f = pos(rel.from);
        const t = pos(rel.to);
        const isHi = active === rel.from || active === rel.to;
        const dx = t.x - f.x,
          dy = t.y - f.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const ux = dx / dist,
          uy = dy / dist;
        const x1 = f.x + ux * (R + 4),
          y1 = f.y + uy * (R + 4);
        const x2 = t.x - ux * (R + 10),
          y2 = t.y - uy * (R + 10);
        const mx = (x1 + x2) / 2 - uy * 28;
        const my = (y1 + y2) / 2 + ux * 28;
        const lx = (x1 + x2) / 2 - uy * 18;
        const ly = (y1 + y2) / 2 + ux * 18;

        return (
          <g key={i}>
            <path
              d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
              fill="none"
              stroke={isHi ? ACCENT : "#ddd8d0"}
              strokeWidth={isHi ? 1.8 : 1}
              strokeDasharray={isHi ? "none" : "4 3"}
              markerEnd={isHi ? "url(#arr-hi)" : "url(#arr)"}
              opacity={active && !isHi ? 0.2 : 1}
              style={{ transition: "all .35s" }}
            />
            {isHi && (
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                fontSize={12}
                fill={ACCENT}
                fontFamily={FONT}
                fontWeight={600}
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {rel.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ── 節點 ── */
function Node({
  s,
  isActive,
  hasActive,
  onClick,
  w,
  h,
  offsetX,
  offsetY,
}: {
  s: Stakeholder;
  isActive: boolean;
  hasActive: boolean;
  onClick: () => void;
  w: number;
  h: number;
  offsetX: number;
  offsetY: number;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        position: "absolute",
        left: s.x * w + offsetX,
        top: s.y * h + offsetY,
        transform: "translate(-50%, -50%)",
        width: R * 2,
        height: R * 2,
        borderRadius: "50%",
        background: isActive ? "#fff" : "#faf7f2",
        border: `${isActive ? 2 : 1.5}px solid ${isActive ? "#292524" : "#c4bdb4"}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: isActive
          ? "0 0 0 4px #29252420, 0 8px 24px rgba(0,0,0,0.10)"
          : "0 2px 8px rgba(0,0,0,0.05)",
        opacity: hasActive && !isActive ? 0.4 : 1,
        transition:
          "left .35s cubic-bezier(.25,.8,.25,1), top .35s cubic-bezier(.25,.8,.25,1), opacity .3s, box-shadow .3s, border .3s",
        zIndex: isActive ? 10 : 2,
        userSelect: "none",
      }}
    >
      {s.label.split("\n").map((line, i) => (
        <span
          key={i}
          style={{
            fontSize: 11,
            fontWeight: isActive ? 700 : 600,
            color: isActive ? "#1c1917" : "#78716c",
            fontFamily: FONT,
            lineHeight: 1.4,
            textAlign: "center",
            transition: "color .3s",
          }}
        >
          {line}
        </span>
      ))}
    </div>
  );
}

/* ── 詳細面板 ── */
function DetailPanel({ s, onClose }: { s: Stakeholder; onClose: () => void }) {
  return (
    <div
      style={{
        position: "absolute",
        right: 0,
        top: 0,
        bottom: 0,
        width: PANEL_W,
        background: "#fff",
        borderLeft: "1px solid #e7e0d8",
        display: "flex",
        flexDirection: "column",
        zIndex: 20,
        boxShadow: "-8px 0 32px rgba(0,0,0,0.06)",
        animation: "slideIn .25s ease",
      }}
    >
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(20px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>

      <div style={{ height: 3, background: "#292524", flexShrink: 0 }} />

      <div
        style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid #f0ece6",
          flexShrink: 0,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#1c1917",
              margin: "0 0 4px",
              fontFamily: FONT,
              lineHeight: 1.3,
            }}
          >
            {s.label.replace("\n", "")}
          </h2>
          <p
            style={{
              fontSize: 11,
              color: "#a8a29e",
              margin: 0,
              fontFamily: FONT,
            }}
          >
            {s.role}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: "1px solid #e7e0d8",
            background: "#faf7f2",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            color: "#a8a29e",
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 24px",
          scrollbarWidth: "none",
        }}
      >
        <blockquote
          style={{
            margin: "0 0 20px",
            padding: "14px 16px",
            background: "#faf7f2",
            borderLeft: "3px solid #292524",
            borderRadius: "0 6px 6px 0",
          }}
        >
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.8,
              color: "#44403c",
              margin: "0 0 8px",
              fontFamily: FONT,
              fontStyle: "italic",
            }}
          >
            「{s.quote}」
          </p>
          <cite
            style={{
              fontSize: 10,
              color: "#a8a29e",
              fontFamily: FONT,
              fontStyle: "normal",
            }}
          >
            —— {s.quoteSource}
          </cite>
        </blockquote>

        {s.body.map((para, i) => (
          <p
            key={i}
            style={{
              fontSize: 13,
              lineHeight: 1.9,
              color: "#44403c",
              margin: "0 0 12px",
              fontFamily: FONT,
            }}
          >
            {para}
          </p>
        ))}

        <div
          style={{ height: 1, background: "#ede9e3", margin: "20px 0 16px" }}
        />

        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            color: "#b5afa8",
            margin: "0 0 10px",
            fontFamily: FONT,
          }}
        >
          相關報導與來源
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {s.news.map((item, i) => (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                padding: "10px 12px",
                background: "#faf7f2",
                border: "1px solid #ede9e3",
                borderRadius: 6,
                textDecoration: "none",
                transition: "all .15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f5f2ed";
                e.currentTarget.style.borderColor = "#ddd8d0";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#faf7f2";
                e.currentTarget.style.borderColor = "#ede9e3";
              }}
            >
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#44403c",
                    margin: "0 0 2px",
                    fontFamily: FONT,
                    lineHeight: 1.4,
                  }}
                >
                  {item.label}
                </p>
                <p
                  style={{
                    fontSize: 10,
                    color: "#a8a29e",
                    margin: 0,
                    fontFamily: FONT,
                  }}
                >
                  {item.hint}
                </p>
              </div>
              <ExtIcon />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   主元件
══════════════════════════════════════ */
export default function StakeholderMap() {
  const [active, setActive] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash && STAKEHOLDERS.find((s) => s.id === hash)) setActive(hash);
  }, []);

  const handleSelect = useCallback(
    (id: string) => {
      const next = active === id ? null : id;
      setActive(next);
      history.replaceState(
        null,
        "",
        next ? `#${next}` : window.location.pathname,
      );
    },
    [active],
  );

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActive(null);
        history.replaceState(null, "", window.location.pathname);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  const activeNode = STAKEHOLDERS.find((s) => s.id === active) ?? null;

  // ★ 水平：panel 開啟時整體左移，讓圖譜置中於剩餘空間
  const offsetX = active ? -(PANEL_W / 2) : 0;
  // ★ 垂直：固定往下偏移，讓圖譜整體下移（調整這個數字即可）
  const offsetY = size.h * 0.06;

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
          background: "rgba(250,247,242,0.96)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #e7e0d8",
          display: "flex",
          alignItems: "center",
          padding: "0 40px",
          height: 46,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#292524",
            letterSpacing: "-0.01em",
            fontFamily: FONT,
          }}
        >
          困在局裡的人們
        </span>
      </header>

      <div
        ref={wrapRef}
        style={{ flex: 1, position: "relative", overflow: "hidden" }}
      >
        {size.w > 0 && (
          <>
            <RelationLines
              active={active}
              w={size.w}
              h={size.h}
              offsetX={offsetX}
              offsetY={offsetY}
            />
            {STAKEHOLDERS.map((s) => (
              <Node
                key={s.id}
                s={s}
                isActive={active === s.id}
                hasActive={active !== null}
                onClick={() => handleSelect(s.id)}
                w={size.w}
                h={size.h}
                offsetX={offsetX}
                offsetY={offsetY}
              />
            ))}
          </>
        )}

        {activeNode && (
          <DetailPanel
            s={activeNode}
            onClose={() => {
              setActive(null);
              history.replaceState(null, "", window.location.pathname);
            }}
          />
        )}
      </div>
    </div>
  );
}
