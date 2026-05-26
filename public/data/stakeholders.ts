export interface NewsItem {
  label: string;
  url: string;
  hint: string;
}

export interface Stakeholder {
  id: string;
  label: string; // "\n" 換行
  role: string;
  quote: string;
  quoteSource: string;
  body: string[];
  news: NewsItem[];
  /** 0–1 相對位置，基於完整畫布 */
  x: number;
  y: number;
}

export interface Relation {
  from: string;
  to: string;
  label: string;
}

export const STAKEHOLDERS: Stakeholder[] = [
  {
    id: "farmer",
    label: "農民",
    role: "土地的守護者，也是最大的受害者",
    quote:
      "一甲地種田一年收 3–5 萬，出租給光電業者一年收 30–40 萬。你叫我為了國家利益放棄這筆錢，你願意嗎？",
    quoteSource: "天下雜誌〈瘋狂光電發財夢〉2021",
    body: [
      "彰化沿海老農平均年齡超過 65 歲，農業繼承意願低落。農業收益與光電租金之間高達 10 倍的落差，讓「種電」成為無可迴避的經濟理性選擇。",
      "這不是道德問題，是算術問題。在現有的農業支持體系下，要求農民為了國家利益放棄 10 倍的收入差距，是一種不公平的要求。",
    ],
    news: [
      {
        label: "天下雜誌〈瘋狂光電發財夢〉",
        url: "https://www.cw.com.tw/article/5044072",
        hint: "農地租金 vs 光電租金落差調查",
      },
      {
        label: "上下游〈光電侵農大調查〉",
        url: "https://www.newsmarket.com.tw/solar-invasion/ch06/",
        hint: "農民在光電浪潮中的處境",
      },
      {
        label: "國家政策研究基金會 農地光電分析",
        url: "https://www.npf.org.tw/1/18409",
        hint: "光電租金 30 萬 vs 養殖租金 3–4 萬",
      },
    ],
    x: 0.2,
    y: 0.28,
  },
  {
    id: "resident",
    label: "在地居民\n與環保團體",
    role: "失去田園的見證者",
    quote:
      "彰化沿海的農地正在以肉眼可見的速度消失，但政府的回應速度遠遠跟不上破壞的速度。",
    quoteSource: "彰化縣環境保護聯盟 2020 年聲明",
    body: [
      "居民對農地違規使用的投訴案件在 2015–2022 年間持續增加，但往往石沉大海：「去檢舉，說要調查，調查完說沒問題。」",
      "彰化海岸早在 2009 年就被評為國際級重要濕地，但至今仍未完成正式公告，環保團體稱之為「保育之恥」。",
    ],
    news: [
      {
        label: "自由時報〈彰化農地違規工廠〉",
        url: "https://news.ltn.com.tw/news/life/breakingnews/2496367",
        hint: "彰化縣農地工廠約 6550 家、佔地約 1300 公頃",
      },
      {
        label: "台灣水鳥研究群〈保育之恥〉",
        url: "https://www.twsousa.org.tw/議題與行動/記者會/保育之恥-彰化沿海國際濕地延宕10年未劃定",
        hint: "彰化沿海國際濕地延宕 10 年未劃定",
      },
      {
        label: "公視《我們的島》彰化海岸濕地",
        url: "https://ourisland.pts.org.tw/content/8699",
        hint: "風頭水尾的濕落之地",
      },
    ],
    x: 0.2,
    y: 0.72,
  },
  {
    id: "solar",
    label: "光電業者",
    role: "逐利的開發者，也是政策的受益者",
    quote:
      "農地的地價比工業地便宜太多了，而且農地種電的法規比工業地寬鬆。從商業角度，當然選農地。",
    quoteSource: "今周刊〈規劃光電用地竟犧牲農地？〉2023",
    body: [
      "在「2025 非核家園」政策目標下，光電業者面臨龐大的裝置容量壓力。農地因地價低廉、法規相對寬鬆，成為最具商業吸引力的選址。",
      "部分業者透過「農業設施」名義規避審查，在農地上大規模設置太陽能板，實際農業生產幾乎為零。",
    ],
    news: [
      {
        label: "今周刊〈規劃光電用地竟犧牲農地？〉",
        url: "https://esg.businesstoday.com.tw/article/category/180694/post/202306200043/",
        hint: "學界批：政府劃設「綠能發展區」恐吃掉大半台北市面積",
      },
      {
        label: "上下游〈光電侵農大調查〉西岸篇",
        url: "https://www.newsmarket.com.tw/west-coast-solar/ch02/",
        hint: "彰化西海岸光電開發現況",
      },
      {
        label: "報導者〈農地上的太陽〉",
        url: "https://www.twreporter.org/a/land-unsuitable-for-farming-photovoltaic",
        hint: "不利農業經營區與光電開發的關係",
      },
    ],
    x: 0.8,
    y: 0.28,
  },
  {
    id: "factory",
    label: "工廠業者",
    role: "農地上的不速之客",
    quote:
      "工廠排放的廢水流進農田，我的稻子都死了。去檢舉，說要調查，調查完說沒問題。",
    quoteSource: "《聯合報》鹿港農民 2021",
    body: [
      "工廠管理輔導法 2019 年修正通過，對 2016 年 5 月 19 日前已存在的低污染未登記工廠，開放申請「特定工廠登記」。",
      "在彰化，2016 年前已有逾 6,550 家工廠座落農地，佔地超過 1,300 公頃。修法期間的「搶建預期」更加速了農地的破碎化。",
    ],
    news: [
      {
        label: "苦勞網〈工輔法三讀通過抗議〉",
        url: "https://www.coolloud.org.tw/node/93312",
        hint: "環保團體立法院外抗議現場",
      },
      {
        label: "經濟部工廠管理輔導法全文",
        url: "https://law.moea.gov.tw/LawContent.aspx?id=FL011071",
        hint: "特定工廠登記機制條文",
      },
      {
        label: "自由時報〈彰化農地工廠問題〉",
        url: "https://news.ltn.com.tw/news/life/breakingnews/2496367",
        hint: "6550 家農地工廠佔地 1300 公頃",
      },
    ],
    x: 0.8,
    y: 0.72,
  },
  {
    id: "government",
    label: "地方政府\n與農政機關",
    role: "制度的執行者，也是困境的共謀",
    quote: "我們人力不足，全縣農地面積這麼大，要逐一稽查根本不可能。",
    quoteSource: "《自由時報》彰化縣政府農業處官員 2022",
    body: [
      "地方政府的困境是真實的：人力不足、法規不完善、上位計畫未到位。在現有制度框架下，基層農政人員能做的確實有限。",
      "但這種「制度性的無奈」，不能成為農地持續流失的藉口。它揭示的，是一個需要從根本上重新設計的治理體系。",
    ],
    news: [
      {
        label: "公視新聞〈農地違規稽查困境〉",
        url: "https://news.pts.org.tw/article/786084",
        hint: "地方政府稽查農地違規的人力困境",
      },
      {
        label: "農業部農業發展條例修法說明",
        url: "https://www.moa.gov.tw/ws.php?id=2302",
        hint: "農地農有鬆綁的政策背景",
      },
      {
        label: "內政部國土管理署國土計畫資訊",
        url: "https://www.nlma.gov.tw/",
        hint: "2031 年國土計畫法全面施行說明",
      },
    ],
    x: 0.5,
    y: 0.5,
  },
  {
    id: "researcher",
    label: "學術研究者",
    role: "衛星的解讀者，警報的發出者",
    quote:
      "建地是有方向性、有針對性地在侵吞農地。農地的消失不是副作用，而是開發壓力精準鎖定的目標。",
    quoteSource: "彰化海岸土地利用變遷研究科普文章，1985–2022",
    body: [
      "本研究團隊利用 Landsat 長時間序列影像與連續變化偵測法（CCDC），追蹤 37 年間彰化沿海六鄉鎮每一塊土地的身份轉換。",
      "變遷強度分析顯示，2020–2022 年間農地被針對性侵占的速率達到隨機擴張理論值的 3 倍以上（Rtin 4.40% vs Wtn 1.40%）。衛星不說謊——這不是自然演變，而是系統性的資本流動。",
    ],
    news: [
      {
        label: "本研究科普文章",
        url: "https://esrpc.ncu.edu.tw/public/ftopic/ftopic_detail/22",
        hint: "透過衛星眼睛看彰化——37 年間的土地變遷",
      },
      {
        label: "CCDC 方法論文（Zhu & Woodcock 2014）",
        url: "https://doi.org/10.1016/j.rse.2014.01.011",
        hint: "連續變化偵測法原始論文",
      },
      {
        label: "變遷強度分析方法（Aldwaik & Pontius 2012）",
        url: "https://doi.org/10.1016/j.landurbplan.2012.02.010",
        hint: "Intensity Analysis 方法論文",
      },
    ],
    x: 0.5,
    y: 0.1,
  },
];

export const RELATIONS: Relation[] = [
  { from: "farmer", to: "solar", label: "出租農地" },
  { from: "farmer", to: "factory", label: "土地被侵占" },
  { from: "solar", to: "government", label: "申請許可" },
  { from: "factory", to: "government", label: "申請納管" },
  { from: "government", to: "farmer", label: "政策補貼不足" },
  { from: "resident", to: "government", label: "投訴檢舉" },
  { from: "researcher", to: "government", label: "提出警告" },
  { from: "researcher", to: "resident", label: "提供數據支持" },
  { from: "resident", to: "factory", label: "抗議反對" },
];
