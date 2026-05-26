/* ═══════════════════════════════════════════════
   data/timeline-nodes.ts
   純資料層：只改這裡就能更新幻燈片內容
   ─ 新增節點：在 NODES 陣列加一筆
   ─ 換圖片：把 mediaType 改成 "image"，填入 mediaSrc
   ─ 換影片：mediaType 改成 "video"，填入 mediaSrc
   ─ 外部連結預覽：mediaType 改成 "link"，填入 mediaSrc（URL）
═══════════════════════════════════════════════ */

export type MediaType = "image" | "video" | "chart" | "empty" | "link";

export interface TimelineSource {
  label: string;
  hint: string;
  url?: string; // ← 新增：來源可附 URL
}

export interface TimelineNode {
  id: number;
  year: string;
  tag: string;
  title: string;
  subtitle: string;
  body: string[];
  sources: TimelineSource[];
  mediaCaption: string;
  mediaType: MediaType;
  mediaSrc?: string; // 圖片/影片路徑，或 "link" 時填外部 URL
  mediaLabel?: string; // "link" 類型時顯示的按鈕文字
}

export const NODES: TimelineNode[] = [
  {
    id: 0,
    year: "1950–1970s",
    tag: "歷史背景",
    title: "地下水超抽的開始",
    subtitle: "彰化沿海地層下陷的遠因",
    body: [
      "戰後台灣農業快速擴張，彰化沿海農民大量抽取地下水灌溉，工業用水需求也急遽攀升。長期超抽導致地層下陷，為日後土地利用衝突埋下伏筆。",
      "根據內政部國土署監測，彰化大城、芳苑沿海累積下陷量已超過 2 公尺，部分年度最大年下陷速率曾超過 12 公分。",
    ],
    sources: [
      {
        label: "公視《我們的島》地層下陷專題",
        hint: "水的賭局——彰化地下水超抽紀錄",
        url: "https://ourisland.pts.org.tw/content/676",
      },
      {
        label: "內政部國土署地層下陷報告",
        hint: "彰化嚴重地層下陷管制區說明",
        url: "https://www.nlma.gov.tw/uploads/files/57e1133bd34a0249ef60da401eaf6ffa.pdf",
      },
    ],
    mediaCaption: "點擊觀看：公視《我們的島》地層下陷專題報導",
    mediaType: "link",
    mediaSrc: "https://ourisland.pts.org.tw/content/676",
    mediaLabel: "觀看《我們的島》報導 →",
  },
  {
    id: 1,
    year: "1985",
    tag: "研究起點",
    title: "最後的完整農業景觀",
    subtitle: "本研究 LULCC 分析基準年",
    body: [
      "1985 年是本研究土地利用變遷分析的起始基準年，彰化沿海仍保有大面積完整農地，LULCC 分類圖顯示農地佔比最高，建地與工業用地尚未大規模擴張。",
    ],
    sources: [
      {
        label: "本研究產出",
        hint: "1985 年彰化沿海 LULCC 分類圖",
      },
    ],
    mediaCaption: "1985 年彰化沿海 LULCC 土地利用分類圖（本研究產出）",
    mediaType: "chart",
  },
  {
    id: 2,
    year: "1995",
    tag: "政策轉折",
    title: "農地釋出方案",
    subtitle: "第一道防線的鬆動",
    body: [
      "行政院核定「農地釋出方案」，規劃釋出約 7.5 萬公頃農地供非農業使用。此政策初衷為調整農業結構，卻意外引發農地變更炒作風潮，成為建地面積飆升的第一個「跳躍點」。",
      "本研究衛星數據顯示，建地面積在 1995–2000 年間出現第一次顯著加速增長，與此政策時間點高度吻合。",
    ],
    sources: [
      {
        label: "農業部農地釋出原則說明",
        hint: "農委會（現農業部）農地釋出方案官方說明",
        url: "https://www.moa.gov.tw/ws.php?id=7554",
      },
      {
        label: "主計總處農地運用研究報告",
        hint: "我國農地運用與變遷之研究",
        url: "https://ws.dgbas.gov.tw/public/attachment/4127101547zx60wrze.pdf",
      },
    ],
    mediaCaption: "農地釋出方案官方政策文件封面（截圖請自行補充）",
    mediaType: "empty",
  },
  {
    id: 3,
    year: "2000",
    tag: "法規鬆綁",
    title: "農業發展條例修正",
    subtitle: "農地農有全面鬆綁",
    body: [
      "農業發展條例修正通過，廢除「農地農有」限制，非農民得以購買農地，農舍興建門檻大幅降低。修法後農地交易市場活絡，「豪華農舍」亂象隨之而來。",
    ],
    sources: [
      {
        label: "農業部農業發展條例修法說明",
        hint: "農委會農業發展條例及相關法案修正重點",
        url: "https://www.moa.gov.tw/ws.php?id=2302",
      },
      {
        label: "上下游新聞市集",
        hint: "農發條例修法後農地買賣廣告看板相關報導",
        url: "https://www.newsmarket.com.tw/blog/18182/",
      },
    ],
    mediaCaption: "農地旁「農地買賣」廣告招牌照片（截圖請自行補充）",
    mediaType: "empty",
  },
  {
    id: 4,
    year: "2001",
    tag: "國際衝擊",
    title: "台灣正式加入 WTO",
    subtitle: "農業競爭力的結構性衝擊",
    body: [
      "台灣正式成為 WTO 會員，農產品市場全面開放，進口競爭壓力驟增。農業收益下滑加速農地廢耕與轉用意願，彰化沿海農地面積開始出現明顯下降趨勢。",
    ],
    sources: [
      {
        label: "農業部農業統計資料查詢系統",
        hint: "台灣農業生產與農地面積歷年統計",
        url: "https://agrstat.moa.gov.tw/sdweb/public/official/OfficialInformation.aspx",
      },
    ],
    mediaCaption:
      "台灣加入 WTO 歷史照片 / 農民抗議進口農產品畫面（截圖請自行補充）",
    mediaType: "empty",
  },
  {
    id: 5,
    year: "2011",
    tag: "發展真空",
    title: "國光石化撤案",
    subtitle: "彰化沿海發展真空的形成",
    body: [
      "萬人連署守護白海豚，馬英九總統宣布不支持國光石化案。撤案後，土地開發壓力並未消失，反而以更分散、更難管制的小型工廠與農地轉用形式持續蔓延。",
    ],
    sources: [
      {
        label: "環境資訊中心 國光石化撤案報導",
        hint: "2011 年國光石化撤案完整紀錄",
        url: "https://e-info.org.tw/node/65557",
      },
      {
        label: "公視《我們的島》彰化海岸濕地",
        hint: "風頭水尾的濕落之地",
        url: "https://ourisland.pts.org.tw/content/8699",
      },
    ],
    mediaCaption: "點擊觀看：公視《我們的島》彰化海岸濕地報導",
    mediaType: "link",
    mediaSrc: "https://ourisland.pts.org.tw/content/8699",
    mediaLabel: "觀看《我們的島》報導 →",
  },
  {
    id: 6,
    year: "2015–2019",
    tag: "搶建潮",
    title: "違章工廠就地合法的預期",
    subtitle: "工廠管理輔導法修法期間",
    body: [
      "工輔法修法討論期間，違章工廠業者預期就地合法，農地上大量鐵皮工廠搶在修法前趕工興建。彰化統計顯示 2016 年前已有逾 6,550 家工廠座落農地，佔地超過 1,300 公頃。",
    ],
    sources: [
      {
        label: "自由時報 彰化農地違規工廠報導",
        hint: "彰化農地工廠約 6550 家、佔地約 1300 公頃",
        url: "https://news.ltn.com.tw/news/life/breakingnews/2496367",
      },
      {
        label: "地球公民基金會",
        hint: "農地違章工廠搶建空拍圖與新聞稿",
        url: "https://www.cet-taiwan.org/",
      },
    ],
    mediaCaption: "農田中央突兀鐵皮廠房空拍圖（截圖請自行補充）",
    mediaType: "empty",
  },
  {
    id: 7,
    year: "2016",
    tag: "能源政策",
    title: "非核家園政策",
    subtitle: "農地種電浪潮的起點",
    body: [
      "政府以「2025 非核家園」為目標，規劃再生能源裝置容量達 27 GW，其中太陽光電約 20 GW。農地設置光電板成為農民新的收益來源——一甲地農業年收益約 3–5 萬元，但出租給光電業者年租金可達 30–60 萬元，差距高達 10 倍以上。",
      "「農地種電」現象在彰化沿海迅速蔓延，大量農地實質上轉為能源用地，農業生產功能喪失。",
    ],
    sources: [
      {
        label: "上下游《光電侵農大調查》",
        hint: "農電共生可行嗎？前車之鑒不可不慎",
        url: "https://www.newsmarket.com.tw/solar-invasion/ch07/",
      },
      {
        label: "公視《我們的島》農地種電",
        hint: "光電找出路｜真正的農電共生有辦法嗎？",
        url: "https://ourisland.pts.org.tw/content/10790",
      },
      {
        label: "YouTube 農地上的發電夢（公視）",
        hint: "農業與太陽光電的結合完整影片",
        url: "https://www.youtube.com/watch?v=o2nQ-51VZ-k",
      },
    ],
    mediaCaption: "點擊觀看：公視《我們的島》農地種電完整報導影片",
    mediaType: "video",
    // 注意：YouTube 需轉為 embed 格式才能直接播放
    // 若要直接嵌入請改為：
    // mediaType: "link",
    // mediaSrc: "https://www.youtube.com/watch?v=o2nQ-51VZ-k",
    mediaSrc: "https://www.youtube.com/watch?v=o2nQ-51VZ-k",
    mediaLabel: "觀看完整報導影片 →",
  },
  {
    id: 8,
    year: "2019",
    tag: "法規衝擊",
    title: "工廠管理輔導法正式修正通過",
    subtitle: "農地工廠大赦",
    body: [
      "工輔法三讀通過，2016 年 5 月 19 日前已存在的低污染未登記工廠，得申請「特定工廠登記」取得就地合法緩衝期；但 2016 年 5 月 20 日後新增者不得納管，須斷水斷電並拆除。",
      "環保團體批評此舉形同「農地工廠大赦」，立法院外爆發大規模抗議。",
    ],
    sources: [
      {
        label: "經濟部工廠管理輔導法修正條文",
        hint: "工廠管理輔導法法條全文",
        url: "https://law.moea.gov.tw/LawContent.aspx?id=FL011071",
      },
      {
        label: "苦勞網 工輔法三讀抗議報導",
        hint: "環保團體立法院外抗議現場",
        url: "https://www.coolloud.org.tw/node/93312",
      },
      {
        label: "環境資訊中心 工輔法修法評析",
        hint: "工廠管理輔導法修法對農地影響",
        url: "https://e-info.org.tw/node/218049",
      },
    ],
    mediaCaption: "點擊閱讀：苦勞網工輔法三讀抗議現場報導",
    mediaType: "link",
    mediaSrc: "https://www.coolloud.org.tw/node/93312",
    mediaLabel: "閱讀抗議現場報導 →",
  },
  {
    id: 9,
    year: "2020–2022",
    tag: "研究發現",
    title: "針對性侵占的高峰期",
    subtitle: "本研究核心科學發現",
    body: [
      "本研究變遷強度分析顯示，2020–2022 年間農地被針對性侵占的速率達到隨機擴張理論值的 3 倍以上（Rtin 4.40% vs Wtn 1.40%），是整個 37 年研究期間最為劇烈的時期。",
      "COVID-19 疫情期間，土地交易反而更加活躍，資本加速流向邊緣農地。農地的消失不是隨機發生，而是有方向性、有針對性的系統性過程。",
    ],
    sources: [
      {
        label: "本研究產出",
        hint: "變遷強度分析圖表（針對性指數長條圖）",
      },
      {
        label: "芳苑光電爭議：上下游新聞",
        hint: "兩大跨國資本，享近 600 公頃開發權",
        url: "https://today.line.me/tw/v3/article/2DOypGX",
      },
    ],
    mediaCaption: "2020–2022 年變遷強度分析圖（本研究產出）",
    mediaType: "chart",
  },
  {
    id: 10,
    year: "2031（預計）",
    tag: "未來展望",
    title: "國土計畫法全面施行",
    subtitle: "制度灰色地帶的最後機會？",
    body: [
      "國土計畫法預計 2031 年全面施行，農業發展地區將受到更嚴格的土地使用管制。然而各縣市計畫圖進度落後，農民反彈聲浪不斷，制度能否真正落實仍是未知數。",
      "在舊法已失效、新法未到位的漫長過渡期，資本仍在制度縫隙中持續流動。",
    ],
    sources: [
      {
        label: "內政部國土管理署國土計畫資訊網",
        hint: "國土功能分區圖說明",
        url: "https://www.nlma.gov.tw/",
      },
      {
        label: "今周刊 國土計畫法爭議報導",
        hint: "國土計畫法引發農民反彈 2024–2025",
        url: "https://www.businesstoday.com.tw/article/category/183027/post/202308160023/",
      },
      {
        label: "環境資訊中心 國土計畫法分析",
        hint: "國土計畫法農業用地保護機制評析",
        url: "https://e-info.org.tw/node/236324",
      },
    ],
    mediaCaption: "點擊閱讀：國土計畫法展延爭議最新報導",
    mediaType: "link",
    mediaSrc:
      "https://www.businesstoday.com.tw/article/category/183027/post/202308160023/",
    mediaLabel: "閱讀國土計畫法爭議報導 →",
  },
];
