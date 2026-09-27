// app/page.tsx
// 首頁：列出所有互動圖表與影片頁，並提供可貼進 StoryMaps 的嵌入連結
import Link from "next/link";
import CopyLinkButton from "@/components/CopyLinkButton";

const FONT = '"Noto Serif TC","Noto Serif",serif';
const STORY_URL = "https://storymaps.arcgis.com/stories/e9dbb148694d4dfa8650fc523840a31e";

type Entry = { href: string; title: string; desc: string; kind: string };

const GROUPS: { heading: string; note: string; items: Entry[] }[] = [
  {
    heading: "敘事脈絡",
    note: "制度、事件與人",
    items: [
      {
        href: "/video/land-name",
        title: "開場片：這片土地的名字",
        desc: "手繪線稿動畫，約 110 秒，中英字幕。從台灣地圖走到彰化沿海六鄉鎮，帶出泥灘地、蚵田、地層下陷三個事實。",
        kind: "影片",
      },
      {
        href: "/timeline",
        title: "歷史的推手與失守的防線",
        desc: "政策與事件時間軸，共 11 個節點：從 1950 年代地下水超抽、1995 農地釋出、2000 農發條例修正、2016 農地種電，到 2031 年國土計畫法施行。",
        kind: "時間軸",
      },
      {
        href: "/stakeholders",
        title: "困在局裡的人們",
        desc: "利害關係人關係圖：農民、居民、光電業者、工廠業者、官員與研究者的立場、引言與彼此關係。",
        kind: "關係圖",
      },
      {
        href: "/video/voices",
        title: "開場片：各界的聲音",
        desc: "手繪線稿動畫，約 100 秒，中英字幕。適合放在「困在局裡的人們」章節開頭。",
        kind: "影片",
      },
    ],
  },
  {
    heading: "數據視覺化",
    note: "1985–2022 衛星影像土地利用分析",
    items: [
      {
        href: "/sankey",
        title: "地覆類別變遷圖",
        desc: "1985 與 2022 兩端對照：六鄉鎮的農地、建地、水體等各類土地流向了哪裡。",
        kind: "桑基圖",
      },
      {
        href: "/sankey-timeline",
        title: "分期土地流向",
        desc: "把 1985→2022 拆成 11 個時期，逐期看土地如何轉換；可切換全區或個別鄉鎮。",
        kind: "桑基圖",
      },
      {
        href: "/landuse",
        title: "土地利用排名變遷",
        desc: "各類土地面積的名次如何隨年份改變，動畫呈現農地與建地的消長。",
        kind: "排名圖",
      },
    ],
  },
];

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-[#f2ede0] text-[#1a2b4a]" style={{ fontFamily: FONT }}>
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-8 sm:py-20">
        <header className="border-b border-[#1a2b4a]/20 pb-10">
          <p className="text-sm tracking-[0.3em] text-[#e8935a]">STORYMAP WIDGETS</p>
          <h1 className="mt-3 text-3xl font-bold leading-snug sm:text-4xl">
            《風光》之下
            <span className="block text-xl font-semibold text-[#1a2b4a]/80 sm:text-2xl">彰化沿海 40 年的土地變奏曲</span>
          </h1>
          <p className="mt-5 max-w-2xl leading-8 text-[#1a2b4a]/75">
            這裡收錄故事中使用的互動圖表與影片。每一頁都可以單獨開啟，也可以複製連結，貼到 ArcGIS StoryMaps 的「內嵌」區塊。
          </p>
          <a
            href={STORY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block rounded-full bg-[#1a2b4a] px-5 py-2 text-sm text-[#f2ede0] transition-opacity hover:opacity-85"
          >
            閱讀完整故事 ↗
          </a>
        </header>

        {GROUPS.map((group) => (
          <section key={group.heading} className="mt-12">
            <div className="flex items-baseline gap-3">
              <h2 className="text-xl font-bold">{group.heading}</h2>
              <span className="text-sm text-[#1a2b4a]/55">{group.note}</span>
            </div>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => (
                <li
                  key={item.href}
                  className="flex flex-col rounded-lg border border-[#1a2b4a]/15 bg-[#f8f5ec] p-5 transition-colors hover:border-[#1a2b4a]/45"
                >
                  <span className="self-start rounded-sm bg-[#d4a843]/25 px-2 py-0.5 text-xs text-[#1a2b4a]/80">{item.kind}</span>
                  <Link href={item.href} className="mt-3 text-lg font-bold leading-snug hover:text-[#e8935a]">
                    {item.title}
                  </Link>
                  <p className="mt-2 flex-1 text-sm leading-7 text-[#1a2b4a]/70">{item.desc}</p>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <code className="truncate text-xs text-[#1a2b4a]/50">{item.href}</code>
                    <CopyLinkButton path={item.href} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <footer className="mt-16 border-t border-[#1a2b4a]/20 pt-6 text-xs text-[#1a2b4a]/50">
          資料：本研究團隊衛星影像分析（1985–2022）與新聞查證
        </footer>
      </div>
    </main>
  );
}
