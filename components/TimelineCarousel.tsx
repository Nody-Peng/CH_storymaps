"use client";
import type { TimelineNode } from "@/data/timeline-nodes";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const FONT = '"Noto Serif TC","Noto Serif",serif';
const BG = "#F9F7F0";
const ACCENT = "#78716c";

/* ── 外部連結圖示 ── */
function ExternalLinkIcon() {
  return (
    <svg
      width={13}
      height={13}
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

/* ── 媒體佔位 ── */
function MediaPlaceholder({
  node,
  active,
}: {
  node: TimelineNode;
  active: boolean;
}) {
  const bg = node.mediaType === "chart" ? "#ede9e3" : "#e8e4de";

  /* 圖片 */
  if (node.mediaType === "image" && node.mediaSrc) {
    return (
      <figure style={{ margin: 0, width: "100%", height: "100%" }}>
        <img
          src={node.mediaSrc}
          alt={node.mediaCaption}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: 4,
            display: "block",
          }}
        />
      </figure>
    );
  }

  /* 影片（YouTube embed） */
  if (node.mediaType === "video" && node.mediaSrc) {
    // 自動把 youtube.com/watch?v=XXX 轉成 embed 格式
    const embedSrc = node.mediaSrc.includes("youtube.com/watch")
      ? node.mediaSrc.replace("watch?v=", "embed/").split("&")[0]
      : node.mediaSrc.includes("youtu.be/")
        ? node.mediaSrc.replace("youtu.be/", "www.youtube.com/embed/")
        : node.mediaSrc;

    return active ? (
      <div
        style={{
          width: "100%",
          aspectRatio: "16/9",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <iframe
          src={embedSrc}
          style={{ width: "100%", height: "100%", border: "none" }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          title={node.mediaCaption}
        />
      </div>
    ) : (
      <div
        style={{
          width: "100%",
          aspectRatio: "16/9",
          borderRadius: 4,
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: 11, color: "#c4bdb4", fontFamily: FONT }}>
          影片載入中…
        </span>
      </div>
    );
  }

  /* 外部連結預覽卡 */
  if (node.mediaType === "link" && node.mediaSrc) {
    return (
      <a
        href={node.mediaSrc}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          minHeight: 160,
          background: active ? "#fff" : bg,
          border: `1px solid ${active ? "#ddd8d0" : "#ede9e3"}`,
          borderRadius: 6,
          padding: "18px 20px",
          textDecoration: "none",
          cursor: "pointer",
          transition: "all .2s",
          boxSizing: "border-box",
        }}
        onMouseEnter={(e) => {
          if (active) e.currentTarget.style.background = "#f5f2ed";
        }}
        onMouseLeave={(e) => {
          if (active) e.currentTarget.style.background = "#fff";
        }}
      >
        {/* 上方：媒體說明文字 */}
        <p
          style={{
            fontSize: 13,
            lineHeight: 1.7,
            color: active ? "#44403c" : "#b5afa8",
            margin: 0,
            fontFamily: FONT,
            flex: 1,
          }}
        >
          {node.mediaCaption}
        </p>

        {/* 下方：按鈕列 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 16,
            paddingTop: 12,
            borderTop: `1px solid ${active ? "#ede9e3" : "#f0ece6"}`,
          }}
        >
          {/* 來源 domain */}
          <span
            style={{
              fontSize: 10,
              color: "#b5afa8",
              fontFamily: FONT,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "55%",
            }}
          >
            {(() => {
              try {
                return new URL(node.mediaSrc!).hostname.replace("www.", "");
              } catch {
                return "";
              }
            })()}
          </span>

          {/* 閱讀原文按鈕 */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
              fontWeight: 600,
              color: active ? ACCENT : "#c4bdb4",
              fontFamily: FONT,
              transition: "color .2s",
            }}
          >
            {node.mediaLabel ?? "閱讀原文"}
            <ExternalLinkIcon />
          </span>
        </div>
      </a>
    );
  }

  /* 圖表 / 空白佔位 */
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 180,
        background: bg,
        borderRadius: 4,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `1px solid ${active ? "#ddd8d0" : "#ede9e3"}`,
        transition: "border-color .3s",
      }}
    >
      <p
        style={{
          color: active ? "#b5afa8" : "#d0cbc4",
          fontSize: 12,
          textAlign: "center",
          maxWidth: 260,
          lineHeight: 1.8,
          padding: "0 20px",
          fontFamily: FONT,
          transition: "color .3s",
        }}
      >
        {node.mediaCaption}
      </p>
    </div>
  );
}

/* ── Props ── */
interface TimelineCarouselProps {
  nodes: TimelineNode[];
}

/* ══════════════════════════════════════
   TimelineCarousel 元件
══════════════════════════════════════ */
export default function TimelineCarousel({ nodes }: TimelineCarouselProps) {
  const [current, setCurrent] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const wheelLock = useRef(false);
  const touchStartX = useRef(0);
  const programmaticScroll = useRef(false);

  /* Google Font */
  useEffect(() => {
    if (document.getElementById("noto-serif-tc-tl")) return;
    const l = document.createElement("link");
    l.id = "noto-serif-tc-tl";
    l.rel = "stylesheet";
    l.href =
      "https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;600;700;900&display=swap";
    document.head.appendChild(l);
  }, []);

  /* 捲動到指定卡片 */
  const scrollToCard = useCallback((idx: number) => {
    const card = cardRefs.current[idx];
    const track = trackRef.current;
    if (!card || !track) return;
    programmaticScroll.current = true;
    const trackW = track.clientWidth;
    const cardW = card.offsetWidth;
    const cardL = card.offsetLeft;
    track.scrollTo({
      left: cardL - (trackW - cardW) / 2,
      behavior: "smooth",
    });
    setTimeout(() => {
      programmaticScroll.current = false;
    }, 600);
  }, []);

  const goTo = useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(idx, nodes.length - 1));
      setCurrent(clamped);
      scrollToCard(clamped);
    },
    [nodes.length, scrollToCard],
  );

  /* 初始置中 */
  useLayoutEffect(() => {
    scrollToCard(0);
  }, [scrollToCard]);

  /* IntersectionObserver */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (programmaticScroll.current) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = cardRefs.current.findIndex((c) => c === entry.target);
            if (idx !== -1) setCurrent(idx);
          }
        });
      },
      { root: track, threshold: 0.6 },
    );
    cardRefs.current.forEach((c) => {
      if (c) observer.observe(c);
    });
    return () => observer.disconnect();
  }, [nodes]);

  /* 鍵盤 */
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goTo(current + 1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(current - 1);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [current, goTo]);

  /* 滾輪 */
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const fn = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 0.5) return;
      e.preventDefault();
      if (wheelLock.current) return;
      wheelLock.current = true;
      if (e.deltaY > 0) goTo(current + 1);
      else goTo(current - 1);
      setTimeout(() => {
        wheelLock.current = false;
      }, 700);
    };
    el.addEventListener("wheel", fn, { passive: false });
    return () => el.removeEventListener("wheel", fn);
  }, [current, goTo]);

  /* 觸控 */
  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };
    const onEnd = (e: TouchEvent) => {
      const dx = touchStartX.current - e.changedTouches[0].clientX;
      if (Math.abs(dx) > 48) {
        if (dx > 0) goTo(current + 1);
        else goTo(current - 1);
      }
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
  }, [current, goTo]);

  const progress = nodes.length > 1 ? (current / (nodes.length - 1)) * 100 : 0;
  const node = nodes[current];

  return (
    <div
      style={{
        background: BG,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: FONT,
        userSelect: "none",
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      {/* 頂部進度條 */}
      <div style={{ height: 2, background: "#e7e0d8", flexShrink: 0 }}>
        <div
          style={{
            height: "100%",
            background: "#292524",
            width: `${progress}%`,
            transition: "width 0.4s ease",
          }}
        />
      </div>

      {/* Header */}
      <header
        style={{
          flexShrink: 0,
          background: "rgba(250,247,242,0.96)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #e7e0d8",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
          歷史的推手與失守的防線
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: ACCENT,
              background: `${ACCENT}18`,
              padding: "2px 9px",
              borderRadius: 20,
              transition: "all .3s",
              fontFamily: FONT,
            }}
          >
            {node.tag}
          </span>
          <span
            style={{
              fontSize: 11,
              color: "#b5afa8",
              fontVariantNumeric: "tabular-nums",
              fontFamily: FONT,
            }}
          >
            {current + 1} / {nodes.length}
          </span>
        </div>
      </header>

      {/* Carousel 軌道 */}
      <div
        ref={trackRef}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          overflowX: "scroll",
          overflowY: "hidden",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          gap: 28,
          padding: "24px 0",
        }}
      >
        <div
          style={{
            flexShrink: 0,
            width: "calc((100vw - min(72vw, 960px)) / 2)",
            minWidth: 20,
          }}
        />

        {nodes.map((n, i) => {
          const isActive = i === current;
          const dist = Math.abs(i - current);
          const scale = isActive ? 1 : dist === 1 ? 0.9 : 0.82;
          const opacity = isActive ? 1 : dist === 1 ? 0.4 : 0.2;
          const blurPx = isActive ? 0 : dist === 1 ? 1 : 2;

          return (
            <div
              key={n.id}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              onClick={() => goTo(i)}
              style={{
                flexShrink: 0,
                width: "min(72vw, 960px)",
                scrollSnapAlign: "center",
                cursor: isActive ? "default" : "pointer",
                transform: `scale(${scale})`,
                opacity,
                filter: blurPx > 0 ? `blur(${blurPx}px)` : "none",
                transition:
                  "transform .4s cubic-bezier(.25,.8,.25,1), opacity .4s ease, filter .4s ease",
                transformOrigin: "center center",
                background: isActive ? "#fff" : BG,
                borderRadius: 8,
                border: `1px solid ${isActive ? "#ddd8d0" : "#ede9e3"}`,
                boxShadow: isActive
                  ? "0 8px 40px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)"
                  : "none",
                overflow: "hidden",
                maxHeight: isActive
                  ? "calc(100vh - 180px)"
                  : "calc(100vh - 200px)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* 頂部色條 */}
              <div
                style={{
                  height: 3,
                  flexShrink: 0,
                  background: ACCENT,
                  opacity: isActive ? 1 : 0.35,
                  transition: "opacity .4s",
                }}
              />

              {/* 卡片主體：左右並排 */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "row",
                  overflowY: isActive ? "auto" : "hidden",
                  scrollbarWidth: "none",
                }}
              >
                {/* 左欄：媒體 */}
                <div
                  style={{
                    flexShrink: 0,
                    width: "44%",
                    padding: "28px 0 28px 28px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 14,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 42,
                        fontWeight: 900,
                        color: isActive ? "#ede9e3" : "#f0ece6",
                        letterSpacing: "-0.05em",
                        lineHeight: 1,
                        fontFamily: FONT,
                        transition: "color .4s",
                      }}
                    >
                      {String(n.id + 1).padStart(2, "0")}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.14em",
                        color: isActive ? ACCENT : "#c4bdb4",
                        fontFamily: FONT,
                        transition: "color .4s",
                      }}
                    >
                      {n.tag}
                    </span>
                  </div>

                  <div style={{ flex: 1, minHeight: 160 }}>
                    <MediaPlaceholder node={n} active={isActive} />
                  </div>

                  {/* 來源列表（含 URL 連結） */}
                  {isActive && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        marginTop: 12,
                      }}
                    >
                      {n.sources.map((src, si) =>
                        src.url ? (
                          <a
                            key={si}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 10,
                              color: "#a8a29e",
                              textDecoration: "none",
                              fontFamily: FONT,
                              transition: "color .15s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.color = ACCENT)
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.color = "#a8a29e")
                            }
                          >
                            <ExternalLinkIcon />
                            {src.label}
                          </a>
                        ) : (
                          <span
                            key={si}
                            style={{
                              fontSize: 10,
                              color: "#c4bdb4",
                              fontFamily: FONT,
                            }}
                          >
                            {src.label}
                          </span>
                        ),
                      )}
                    </div>
                  )}
                </div>

                {/* 右欄：文字 */}
                <div
                  style={{
                    flex: 1,
                    padding: "28px 28px 28px 24px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ marginBottom: 20 }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        color: isActive ? ACCENT : "#c4bdb4",
                        marginBottom: 6,
                        fontFamily: FONT,
                        transition: "color .4s",
                      }}
                    >
                      {n.year}
                    </div>
                    <h2
                      style={{
                        fontSize: 24,
                        fontWeight: 800,
                        letterSpacing: "-0.02em",
                        margin: "0 0 6px",
                        lineHeight: 1.3,
                        color: isActive ? "#1c1917" : "#a8a29e",
                        fontFamily: FONT,
                        transition: "color .4s",
                      }}
                    >
                      {n.title}
                    </h2>
                    <p
                      style={{
                        fontSize: 13,
                        margin: 0,
                        color: isActive ? "#78716c" : "#c4bdb4",
                        fontFamily: FONT,
                        transition: "color .4s",
                        lineHeight: 1.6,
                      }}
                    >
                      {n.subtitle}
                    </p>
                  </div>

                  <div
                    style={{
                      height: 1,
                      background: "#ede9e3",
                      marginBottom: 18,
                      flexShrink: 0,
                      opacity: isActive ? 1 : 0.4,
                    }}
                  />

                  <div style={{ flex: 1 }}>
                    {n.body.map((para, pi) => (
                      <p
                        key={pi}
                        style={{
                          fontSize: 14,
                          lineHeight: 1.9,
                          color: isActive ? "#44403c" : "#b5afa8",
                          margin: "0 0 12px",
                          fontFamily: FONT,
                          transition: "color .4s",
                          display: "-webkit-box",
                          WebkitLineClamp: isActive ? undefined : 3,
                          WebkitBoxOrient: "vertical",
                          overflow: isActive ? "visible" : "hidden",
                        }}
                      >
                        {para}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <div
          style={{
            flexShrink: 0,
            width: "calc((100vw - min(72vw, 960px)) / 2)",
            minWidth: 20,
          }}
        />
      </div>

      {/* 底部時間軸 */}
      <div
        style={{
          flexShrink: 0,
          background: "rgba(250,247,242,0.96)",
          backdropFilter: "blur(8px)",
          borderTop: "1px solid #e7e0d8",
          padding: "10px 0 12px",
        }}
      >
        <div
          style={{
            width: "min(72vw, 960px)",
            margin: "0 auto",
            padding: "0 8px",
          }}
        >
          <div style={{ position: "relative", height: 22 }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: "50%",
                height: 1,
                background: "#ddd8d0",
                transform: "translateY(-50%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "50%",
                height: 1,
                background: "#292524",
                transform: "translateY(-50%)",
                width: `${progress}%`,
                transition: "width 0.35s ease",
              }}
            />
            {nodes.map((n, i) => {
              const pct = nodes.length > 1 ? (i / (nodes.length - 1)) * 100 : 0;
              const isActive = current === i;
              const isPast = i < current;
              return (
                <button
                  key={n.id}
                  onClick={() => goTo(i)}
                  title={n.year}
                  style={{
                    position: "absolute",
                    left: `${pct}%`,
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: isActive ? 13 : 7,
                    height: isActive ? 13 : 7,
                    borderRadius: "50%",
                    background: isActive
                      ? "#292524"
                      : isPast
                        ? "#292524"
                        : "#d6d0c8",
                    border: isActive ? "2px solid #faf7f2" : "none",
                    outline: isActive ? "2px solid #292524" : "none",
                    cursor: "pointer",
                    padding: 0,
                    transition: "all 0.3s ease",
                  }}
                />
              );
            })}
          </div>

          <div style={{ position: "relative", height: 18, marginTop: 4 }}>
            {nodes.map((n, i) => {
              const pct = nodes.length > 1 ? (i / (nodes.length - 1)) * 100 : 0;
              const isActive = current === i;
              const dist = Math.abs(i - current);
              return (
                <button
                  key={n.id}
                  onClick={() => goTo(i)}
                  style={{
                    position: "absolute",
                    left: `${pct}%`,
                    transform: "translateX(-50%)",
                    fontSize: isActive ? 11 : 9.5,
                    fontWeight: isActive ? 700 : 400,
                    color: isActive
                      ? "#292524"
                      : dist <= 2
                        ? "#b5afa8"
                        : "#d6d0c8",
                    whiteSpace: "nowrap",
                    transition: "all 0.25s ease",
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    padding: 0,
                    fontFamily: FONT,
                  }}
                >
                  {n.year}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 操作提示 */}
      <div
        style={{
          flexShrink: 0,
          padding: "4px 40px 6px",
          background: BG,
          borderTop: "1px solid #f0ece6",
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "4px 16px",
        }}
      >
        {[
          { icon: "← →", label: "鍵盤切換" },
          { icon: "⇅", label: "滾輪切換" },
          { icon: "☞", label: "點擊卡片或時間軸" },
        ].map(({ icon, label }) => (
          <span
            key={label}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 10,
              color: "#c4bdb4",
              fontFamily: FONT,
            }}
          >
            <kbd
              style={{
                fontSize: 10,
                color: "#a8a29e",
                fontFamily: "monospace",
                background: "#f5f2ed",
                border: "1px solid #d6d0c8",
                borderRadius: 3,
                padding: "1px 5px",
                boxShadow: "0 1px 0 #c8c0b8",
              }}
            >
              {icon}
            </kbd>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
