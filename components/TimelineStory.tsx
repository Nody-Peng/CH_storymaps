"use client";
/* ═══════════════════════════════════════════════
   components/TimelineStory.tsx — 時間軸新版（/timeline-v2）
   直向捲動敘事：左側固定「土地帳本」（本研究衛星數據），右側逐張節點卡片。
   讀到哪一年，帳本上的標記與區間就跟到哪一年。
   ─ 文字：public/data/timeline-nodes.ts（與舊版 /timeline 共用）
   ─ 插畫、分類、數據區間、延伸頁面：public/data/timeline-v2-extra.ts
═══════════════════════════════════════════════ */
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { TimelineNode } from "@/public/data/timeline-nodes";
import { CATEGORY_COLOR, EXTRA } from "@/public/data/timeline-v2-extra";

const FONT = '"Noto Serif TC","Noto Serif",serif';
const PAPER = "#f2ede0";
const INK = "#1a2b4a";
const ORANGE = "#e8935a";
const GOLD = "#d4a843";

type Series = { year: number; farm: number; built: number }[];

const fmt = (n: number) => Math.round(n).toLocaleString("zh-TW");
const pct = (a: number, b: number) => `${b >= a ? "+" : "−"}${Math.abs(((b - a) / a) * 100).toFixed(0)}%`;
const signed = (n: number) => `${n >= 0 ? "+" : "−"}${fmt(Math.abs(n))}`;

function useLedger() {
  const [series, setSeries] = useState<Series | null>(null);
  useEffect(() => {
    fetch("/lulcc_data.json")
      .then((r) => r.json())
      .then((d) => {
        const all = d.line["全部"];
        const years = Object.keys(all["農地"]).map(Number).sort((a, b) => a - b);
        setSeries(years.map((y) => ({ year: y, farm: all["農地"][y], built: all["建地"][y] })));
      })
      .catch(() => setSeries(null));
  }, []);
  return series;
}

const at = (s: Series, y: number) => s.find((p) => p.year === y);

/* 「衛星怎麼說」：用對照區間算出農地與建地的增減 */
function satelliteSays(s: Series | null, win: [number, number] | null, note?: string) {
  if (!s) return null;
  if (!win) return { head: "衛星紀錄之前", lines: ["本研究的衛星影像分析自 1985 年開始，這一段還沒有逐期的土地分類紀錄。"] };
  const [a, b] = win;
  const A = at(s, a), B = at(s, b);
  if (!A || !B) return null;
  if (a === b)
    return {
      head: `${a} 年${note ? `（${note}）` : ""}`,
      lines: [`農地 ${fmt(A.farm)} 公頃・建地 ${fmt(A.built)} 公頃`],
    };
  return {
    head: `${a} → ${b}${note ? `（${note}）` : ""}`,
    lines: [`建地 ${signed(B.built - A.built)} 公頃（${pct(A.built, B.built)}）`, `農地 ${signed(B.farm - A.farm)} 公頃（${pct(A.farm, B.farm)}）`],
  };
}

/* ── 土地帳本：農地 vs 建地（1985–2022） ── */
function Ledger({ series, win, compact }: { series: Series | null; win: [number, number] | null; compact?: boolean }) {
  const W = 600, H = compact ? 200 : 360, L = 58, R = 18, T = 20, B = 34;
  const x = (y: number) => L + ((y - 1985) / (2022 - 1985)) * (W - L - R);
  const y = (v: number) => T + (1 - v / 26000) * (H - T - B);
  if (!series) return <div style={{ height: H, display: "flex", alignItems: "center", justifyContent: "center", color: "#9a927f", fontSize: 13 }}>載入衛星數據中…</div>;
  const path = (k: "farm" | "built") => series.map((p, i) => `${i ? "L" : "M"}${x(p.year).toFixed(1)} ${y(p[k]).toFixed(1)}`).join("");
  const area = (k: "farm" | "built") => `${path(k)}L${x(2022)} ${y(0)}L${x(1985)} ${y(0)}Z`;
  const [a, b] = win ?? [1985, 1985];
  const inRange = !!win;
  const end = at(series, b);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="彰化沿海農地與建地面積 1985–2022">
      {[0, 5000, 10000, 15000, 20000, 25000].map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke={INK} strokeOpacity={0.08} />
          <text x={L - 8} y={y(v) + 4} fontSize={11} textAnchor="end" fill={INK} fillOpacity={0.5}>{v === 0 ? "0" : `${v / 1000}k`}</text>
        </g>
      ))}
      {[1985, 1995, 2005, 2015, 2022].map((yr) => (
        <text key={yr} x={x(yr)} y={H - 12} fontSize={11} textAnchor="middle" fill={INK} fillOpacity={0.55}>{yr}</text>
      ))}
      {inRange && (
        <rect x={x(a) - (a === b ? 6 : 0)} y={T} width={Math.max(12, x(b) - x(a))} height={H - T - B} fill={ORANGE} fillOpacity={0.14} rx={4} />
      )}
      <path d={area("farm")} fill={GOLD} fillOpacity={0.18} />
      <path d={area("built")} fill={ORANGE} fillOpacity={0.14} />
      <path d={path("farm")} fill="none" stroke={GOLD} strokeWidth={3.2} strokeLinejoin="round" />
      <path d={path("built")} fill="none" stroke={ORANGE} strokeWidth={3.2} strokeLinejoin="round" />
      {series.map((p) => (
        <g key={p.year}>
          <circle cx={x(p.year)} cy={y(p.farm)} r={3} fill={PAPER} stroke={GOLD} strokeWidth={1.6} />
          <circle cx={x(p.year)} cy={y(p.built)} r={3} fill={PAPER} stroke={ORANGE} strokeWidth={1.6} />
        </g>
      ))}
      {inRange && end && (
        <g transform={`translate(${x(b).toFixed(1)} 0)`}>
          <line x1={0} x2={0} y1={T} y2={H - B} stroke={INK} strokeWidth={1.4} strokeDasharray="4 4" />
          <circle cx={0} cy={y(end.farm)} r={6} fill={GOLD} stroke={INK} strokeWidth={1.5} />
          <circle cx={0} cy={y(end.built)} r={6} fill={ORANGE} stroke={INK} strokeWidth={1.5} />
        </g>
      )}
      {!inRange && (
        <text x={L + 10} y={T + 18} fontSize={13} fill={INK} fillOpacity={0.6}>← 這一段發生在衛星紀錄開始之前</text>
      )}
      <text x={W - R} y={y(series[0].farm) - 10} fontSize={12} textAnchor="end" fill={GOLD} fontWeight={700}>農地</text>
      <text x={W - R} y={y(series[series.length - 1].built) - 10} fontSize={12} textAnchor="end" fill={ORANGE} fontWeight={700}>建地</text>
    </svg>
  );
}

function LedgerPanel({ series, node, compact }: { series: Series | null; node: TimelineNode | null; compact?: boolean }) {
  const ex = node ? EXTRA[node.id] : null;
  const win = ex ? ex.window : [1985, 2022] as [number, number];
  const said = node && ex ? satelliteSays(series, ex.window, ex.windowNote) : null;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: compact ? 13 : 15, fontWeight: 900, color: INK, letterSpacing: "0.04em" }}>土地帳本</span>
        <span style={{ fontSize: 11, color: "#8a7a5a" }}>彰化沿海六鄉鎮・本研究衛星影像分析（公頃）</span>
      </div>
      <Ledger series={series} win={node ? win : [1985, 2022]} compact={compact} />
      {!compact && said && (
        <div style={{ marginTop: 10, fontSize: 13, color: INK, lineHeight: 1.7 }}>
          <b style={{ color: "#8a7a5a" }}>{said.head}</b>
          <br />
          {said.lines.join("　")}
        </div>
      )}
    </div>
  );
}

/* ── YouTube：點了才載入 ── */
function VideoLink({ src, label }: { src: string; label: string }) {
  const [on, setOn] = useState(false);
  const embed = src.includes("watch?v=") ? src.replace("watch?v=", "embed/").split("&")[0] : src;
  if (on)
    return (
      <div style={{ aspectRatio: "16/9", borderRadius: 8, overflow: "hidden", marginTop: 12 }}>
        <iframe src={`${embed}?autoplay=1`} style={{ width: "100%", height: "100%", border: 0 }} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen title={label} />
      </div>
    );
  return (
    <button onClick={() => setOn(true)} style={btn(true)}>
      ▶ {label}
    </button>
  );
}

const btn = (solid = false): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, marginRight: 8, padding: "7px 14px", borderRadius: 999,
  border: `1px solid ${solid ? INK : "rgba(26,43,74,.3)"}`, background: solid ? INK : "transparent", color: solid ? PAPER : INK,
  fontSize: 13, fontFamily: FONT, cursor: "pointer", textDecoration: "none",
});

/* ── 單張節點卡片 ── */
function NodeCard({ node, series, index, total, refCb, active }: { node: TimelineNode; series: Series | null; index: number; total: number; refCb: (el: HTMLElement | null) => void; active: boolean }) {
  const ex = EXTRA[node.id];
  const color = CATEGORY_COLOR[ex.category];
  const said = satelliteSays(series, ex.window, ex.windowNote);
  return (
    <article
      ref={refCb}
      data-id={node.id}
      style={{
        background: "#fbf8f1", borderRadius: 14, border: `1px solid ${active ? "rgba(26,43,74,.28)" : "rgba(26,43,74,.12)"}`,
        boxShadow: active ? "0 14px 40px rgba(26,43,74,.12)" : "0 2px 10px rgba(26,43,74,.04)", overflow: "hidden",
        transition: "box-shadow .4s, border-color .4s, transform .4s", transform: active ? "translateY(-2px)" : "none",
      }}
    >
      <div style={{ position: "relative" }}>
        <img src={ex.img} alt={`${node.title}（示意插畫）`} width={960} height={600} loading={index < 2 ? "eager" : "lazy"} style={{ width: "100%", height: "auto", display: "block" }} />
        <span style={{ position: "absolute", right: 10, bottom: 8, fontSize: 10, color: INK, opacity: 0.55, background: "rgba(242,237,224,.85)", padding: "1px 6px", borderRadius: 4 }}>示意插畫</span>
        <span style={{ position: "absolute", left: 14, top: 12, background: color, color: "#fff", fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 999, letterSpacing: "0.08em" }}>{node.tag}</span>
      </div>
      <div style={{ padding: "22px 26px 26px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 30, fontWeight: 900, color, letterSpacing: "-0.01em" }}>{node.year}</span>
          <span style={{ fontSize: 12, color: "#9a927f" }}>{String(index + 1).padStart(2, "0")} / {total}</span>
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: INK, margin: "6px 0 4px", lineHeight: 1.35 }}>{node.title}</h2>
        <p style={{ fontSize: 14, color: "#6b6352", margin: 0 }}>{node.subtitle}</p>
        <div style={{ height: 1, background: "rgba(26,43,74,.1)", margin: "16px 0" }} />
        {node.body.map((p, i) => (
          <p key={i} style={{ fontSize: 15.5, lineHeight: 1.95, color: "#2c3444", margin: "0 0 12px" }}>{p}</p>
        ))}
        {said && (
          <div style={{ marginTop: 6, borderLeft: `4px solid ${ORANGE}`, background: "rgba(232,147,90,.08)", padding: "10px 14px", borderRadius: "0 8px 8px 0" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#a4572a", letterSpacing: "0.06em" }}>衛星怎麼說　{said.head}</div>
            {said.lines.map((l) => (
              <div key={l} style={{ fontSize: 15, fontWeight: 700, color: INK, marginTop: 3 }}>{l}</div>
            ))}
          </div>
        )}
        <div style={{ marginTop: 6 }}>
          {node.mediaType === "video" && node.mediaSrc && <VideoLink src={node.mediaSrc} label={node.mediaLabel ?? "觀看影片"} />}
          {node.mediaType === "link" && node.mediaSrc && (
            <a href={node.mediaSrc} target="_blank" rel="noopener noreferrer" style={btn(true)}>
              {node.mediaLabel ?? "閱讀報導"} ↗
            </a>
          )}
          {ex.related.map((r) => (
            <Link key={r.href + r.label} href={r.href} style={btn()}>
              延伸：{r.label} →
            </Link>
          ))}
        </div>
        {node.sources.length > 0 && (
          <details style={{ marginTop: 14 }}>
            <summary style={{ fontSize: 12, color: "#8a7a5a", cursor: "pointer" }}>資料來源（{node.sources.length}）</summary>
            <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 12.5, lineHeight: 1.9, color: "#5a5344" }}>
              {node.sources.map((s) => (
                <li key={s.label}>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: INK }}>
                      {s.label}
                    </a>
                  ) : (
                    s.label
                  )}
                  <span style={{ color: "#9a927f" }}>　{s.hint}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </article>
  );
}

/* ══════════════════════════════════════ */
export default function TimelineStory({ nodes }: { nodes: TimelineNode[] }) {
  const series = useLedger();
  const [activeId, setActiveId] = useState<number | null>(null);
  const cardEls = useRef<Map<number, HTMLElement>>(new Map());

  useEffect(() => {
    if (document.getElementById("noto-serif-tc-tl")) return;
    const l = document.createElement("link");
    l.id = "noto-serif-tc-tl";
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;600;700;900&display=swap";
    document.head.appendChild(l);
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActiveId(Number((e.target as HTMLElement).dataset.id));
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    cardEls.current.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [nodes]);

  const active = nodes.find((n) => n.id === activeId) ?? null;
  const first = series?.[0], last = series?.[series.length - 1];
  const hook = useMemo(() => {
    if (!first || !last) return null;
    return {
      farmLoss: first.farm - last.farm,
      farmPct: ((first.farm - last.farm) / first.farm) * 100,
      builtX: last.built / first.built,
    };
  }, [first, last]);
  const jump = (id: number) => cardEls.current.get(id)?.scrollIntoView({ behavior: "smooth", block: "center" });

  return (
    <div style={{ background: PAPER, color: INK, fontFamily: FONT, minHeight: "100vh" }}>
      <style>{`
        .tl-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 28px; }
        .tl-side { position: sticky; top: 0; z-index: 5; background: rgba(242,237,224,.96); backdrop-filter: blur(6px); padding: 10px 16px 8px; border-bottom: 1px solid rgba(26,43,74,.12); }
        .tl-side .full { display: none; }
        .tl-cards { display: flex; flex-direction: column; gap: 36px; padding: 8px 16px 40px; }
        @media (min-width: 1024px) {
          .tl-grid { grid-template-columns: minmax(0, 42fr) minmax(0, 58fr); gap: 40px; max-width: 1320px; margin: 0 auto; padding: 0 32px; }
          .tl-side { top: 0; align-self: start; height: 100vh; display: flex; flex-direction: column; justify-content: center; border: 0; background: transparent; backdrop-filter: none; padding: 0; }
          .tl-side .full { display: block; }
          .tl-side .mini { display: none; }
          .tl-cards { padding: 18vh 0 30vh; gap: 56px; }
        }
        .tl-dot { width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid ${INK}; background: transparent; padding: 0; cursor: pointer; }
      `}</style>

      {/* ── 開場 ── */}
      <header style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <img src="/timeline-v2/hero.jpg" alt="同一片海岸：1985 與 2022（示意插畫）" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.55 }} />
        <div style={{ position: "relative", maxWidth: 760, margin: "0 16px", background: "rgba(242,237,224,.9)", borderRadius: 16, padding: "36px 32px", border: "1px solid rgba(26,43,74,.15)", textAlign: "center" }}>
          <p style={{ fontSize: 13, letterSpacing: "0.3em", color: ORANGE, margin: 0 }}>1950s — 2031</p>
          <h1 style={{ fontSize: "clamp(30px, 5vw, 50px)", fontWeight: 900, margin: "10px 0 6px", lineHeight: 1.25 }}>歷史的推手與失守的防線</h1>
          <p style={{ fontSize: 16, color: "#5a5344", margin: "0 0 20px" }}>是哪些政策與事件，一步步推動了彰化沿海的土地變遷？</p>
          {hook ? (
            <div style={{ display: "flex", justifyContent: "center", gap: 28, flexWrap: "wrap", margin: "8px 0 4px" }}>
              <div>
                <div style={{ fontSize: 34, fontWeight: 900, color: "#8a6d2a" }}>−{fmt(hook.farmLoss)}</div>
                <div style={{ fontSize: 13, color: "#5a5344" }}>公頃農地（−{hook.farmPct.toFixed(0)}%）</div>
              </div>
              <div>
                <div style={{ fontSize: 34, fontWeight: 900, color: "#b0452f" }}>×{hook.builtX.toFixed(1)}</div>
                <div style={{ fontSize: 13, color: "#5a5344" }}>建地面積成長</div>
              </div>
            </div>
          ) : (
            <div style={{ height: 64 }} />
          )}
          <p style={{ fontSize: 12, color: "#8a7a5a", margin: "6px 0 22px" }}>1985 → 2022・彰化沿海六鄉鎮・本研究衛星影像分析</p>
          <button onClick={() => jump(nodes[0].id)} style={{ ...btn(true), marginTop: 0, fontSize: 15, padding: "10px 22px" }}>
            往下捲動，走過 11 個轉折點 ↓
          </button>
        </div>
      </header>

      {/* ── 主體 ── */}
      <div className="tl-grid">
        <aside className="tl-side">
          <div className="mini">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <b style={{ fontSize: 14 }}>{active ? `${active.year}｜${active.title}` : "土地帳本"}</b>
              <span style={{ fontSize: 11, color: "#8a7a5a" }}>{active ? `${nodes.indexOf(active) + 1}/${nodes.length}` : ""}</span>
            </div>
            <LedgerPanel series={series} node={active} compact />
          </div>
          <div className="full">
            <LedgerPanel series={series} node={active} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 22 }}>
              {nodes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => jump(n.id)}
                  title={`${n.year} ${n.title}`}
                  className="tl-dot"
                  style={{ background: n.id === activeId ? CATEGORY_COLOR[EXTRA[n.id].category] : "transparent", width: n.id === activeId ? 14 : 10, height: n.id === activeId ? 14 : 10 }}
                />
              ))}
            </div>
            <p style={{ fontSize: 12, color: "#8a7a5a", marginTop: 10, lineHeight: 1.7 }}>
              帳本上的色帶是目前這一段對照的衛星觀測區間。<br />數據：本研究 LULC 分類（1985–2022，共 12 期）。
            </p>
          </div>
        </aside>
        <main className="tl-cards">
          {nodes.map((n, i) => (
            <NodeCard
              key={n.id}
              node={n}
              series={series}
              index={i}
              total={nodes.length}
              active={n.id === activeId}
              refCb={(el) => {
                if (el) cardEls.current.set(n.id, el);
                else cardEls.current.delete(n.id);
              }}
            />
          ))}
        </main>
      </div>

      {/* ── 結尾 ── */}
      <footer style={{ background: INK, color: PAPER, padding: "64px 16px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, margin: "0 0 10px" }}>防線一道道鬆動之後，土地流向了哪裡？</h2>
          <p style={{ fontSize: 15, opacity: 0.8, margin: "0 0 26px" }}>用衛星數據看每一期的土地流向，或聽聽困在局裡的人們怎麼說。</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { href: "/sankey-timeline", label: "分期土地流向" },
              { href: "/sankey", label: "1985 → 2022 地覆變遷圖" },
              { href: "/stakeholders", label: "困在局裡的人們" },
            ].map((l) => (
              <Link key={l.href} href={l.href} style={{ ...btn(), color: PAPER, borderColor: "rgba(242,237,224,.5)", marginTop: 0, fontSize: 14, padding: "9px 18px" }}>
                {l.label} →
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
