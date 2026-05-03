"use client";

import React, { useEffect, useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import Head from 'next/head';

// ── Color palette ──────────────────────────────────────────────
const C = {
  農地:    '#C8A83A',
  森林:    '#3E8040',
  草地:    '#7DAF5E',
  感潮灘地: '#9B7B55',
  紅樹林:  '#6DA896',
  建地:    '#C83535',
  裸地:    '#999999',
  水體:    '#3A7DBF',
};

// ── Nodes with depth (0 = left 1985, 1 = right 2022) ──────────
const NODES = [
  // ── LEFT (1985) ───────────────────────────────────────────
  { name: '農地(24,190公頃)',  depth: 0, color: C.農地,    lbl: 'left'  as const },
  { name: '森林(497公頃)',     depth: 0, color: C.森林,    lbl: 'left'  as const },
  { name: '草地(50公頃)',      depth: 0, color: C.草地,    lbl: 'left'  as const },
  { name: '感潮灘地(418公頃)', depth: 0, color: C.感潮灘地, lbl: 'left'  as const },
  { name: '紅樹林(50公頃)',    depth: 0, color: C.紅樹林,  lbl: 'left'  as const },
  { name: '建地(3,018公頃)',   depth: 0, color: C.建地,    lbl: 'left'  as const },
  { name: '水體(19,196公頃)',  depth: 0, color: C.水體,    lbl: 'left'  as const },
  // ── RIGHT (2022) ──────────────────────────────────────────
  { name: '農地(17,888公頃)',     depth: 1, color: C.農地,    lbl: 'right' as const },
  { name: '森林(850公頃)',        depth: 1, color: C.森林,    lbl: 'right' as const },
  { name: '草地(11公頃)',         depth: 1, color: C.草地,    lbl: 'right' as const },
  { name: '感潮灘地(10,419公頃)', depth: 1, color: C.感潮灘地, lbl: 'right' as const },
  { name: '紅樹林(36公頃)',       depth: 1, color: C.紅樹林,  lbl: 'right' as const },
  { name: '建地(9,222公頃)',      depth: 1, color: C.建地,    lbl: 'right' as const },
  { name: '裸地(890公頃)',        depth: 1, color: C.裸地,    lbl: 'right' as const },
  { name: '水體(8,103公頃)',      depth: 1, color: C.水體,    lbl: 'right' as const },
];

// ── Balanced values ──────────────────────────────────────────
const RAW_LINKS = [
  { source: '農地(24,190公頃)',  target: '農地(17,888公頃)',     value: 17000, isSame: true,  color: C.農地    },
  { source: '農地(24,190公頃)',  target: '森林(850公頃)',         value: 353,   isSame: false, color: C.農地    },
  { source: '農地(24,190公頃)',  target: '草地(11公頃)',          value: 11,    isSame: false, color: C.農地    },
  { source: '農地(24,190公頃)',  target: '建地(9,222公頃)',       value: 5000,  isSame: false, color: C.農地    },
  { source: '農地(24,190公頃)',  target: '裸地(890公頃)',         value: 490,   isSame: false, color: C.農地    },
  { source: '農地(24,190公頃)',  target: '水體(8,103公頃)',       value: 1336,  isSame: false, color: C.農地    },
  { source: '森林(497公頃)',     target: '森林(850公頃)',         value: 497,   isSame: true,  color: C.森林    },
  { source: '草地(50公頃)',      target: '草地(11公頃)',          value: 50,    isSame: true,  color: C.草地    },
  { source: '感潮灘地(418公頃)', target: '感潮灘地(10,419公頃)', value: 418,   isSame: true,  color: C.感潮灘地 },
  { source: '紅樹林(50公頃)',    target: '紅樹林(36公頃)',        value: 50,    isSame: true,  color: C.紅樹林  },
  { source: '建地(3,018公頃)',   target: '建地(9,222公頃)',       value: 3018,  isSame: true,  color: C.建地    },
  { source: '水體(19,196公頃)',  target: '農地(17,888公頃)',      value: 888,   isSame: false, color: C.水體    },
  { source: '水體(19,196公頃)',  target: '感潮灘地(10,419公頃)', value: 10001, isSame: false, color: C.水體    },
  { source: '水體(19,196公頃)',  target: '紅樹林(36公頃)',        value: 36,    isSame: false, color: C.水體    },
  { source: '水體(19,196公頃)',  target: '建地(9,222公頃)',       value: 1204,  isSame: false, color: C.水體    },
  { source: '水體(19,196公頃)',  target: '裸地(890公頃)',         value: 400,   isSame: false, color: C.水體    },
  { source: '水體(19,196公頃)',  target: '水體(8,103公頃)',       value: 6667,  isSame: true,  color: C.水體    },
];

export default function SankeyPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const option = useMemo(() => {
    const nodes = NODES.map(n => ({
      name:      n.name,
      depth:     n.depth,
      itemStyle: { color: n.color },
      label:     { position: n.lbl },
    }));

    const links = RAW_LINKS.map(l => ({
      source: l.source,
      target: l.target,
      value:  l.value,
      lineStyle: {
        color:     l.color,
        opacity:   l.isSame ? 0.15 : 0.45,
        curveness: 0.5,
      },
    }));

    const commonLayout = {
      left: '22%',
      right: '22%',
      top: 90,
      bottom: 30,
      nodeWidth: 18,
      nodeGap: 12,
      layoutIterations: 0,
      nodeAlign: 'justify' as const,
    };

    return {
      backgroundColor: '#ffffff',
      title: {
        text: '1985–2022 彰化沿海六鄉鎮地覆類別變遷圖',
        left: 'center',
        top: 18,
        textStyle: {
          fontSize: 24,
          fontWeight: '400',
          color: '#2c2c2c',
          fontFamily: '"Noto Sans TC", "Microsoft JhengHei", sans-serif',
        },
      },
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        backgroundColor: 'rgba(255,255,255,0.97)',
        borderColor: '#e0e0e0',
        borderWidth: 1,
        textStyle: {
          fontFamily: '"Noto Sans TC", "Microsoft JhengHei", sans-serif',
          fontSize: 13,
          color: '#333',
        },
        formatter: (params: any) => {
          if (params.dataType === 'node') return `<b>${params.name}</b>`;
          if (params.dataType === 'edge') {
            return `${params.data.source}<br/>↓<br/>${params.data.target}<br/>面積：${Math.round(params.data.value).toLocaleString()} 公頃`;
          }
          return '';
        },
      },
      animation: true,
      animationDuration: 1500,
      animationEasing: 'cubicOut',
      series: [
        // Series 0: STATIC nodes and labels (no animation)
        {
          type: 'sankey',
          ...commonLayout,
          animation: false,
          data: nodes,
          links: links.map(l => ({ ...l, lineStyle: { opacity: 0 } })),
          label: {
            show: true,
            fontSize: 13,
            color: '#333',
            fontFamily: '"Noto Sans TC", "Microsoft JhengHei", sans-serif',
          },
          itemStyle: { opacity: 1 },
          emphasis: { focus: 'adjacency' as const },
        },
        // Series 1: ANIMATED flows
        {
          type: 'sankey',
          ...commonLayout,
          animation: true,
          data: nodes.map(n => ({ ...n, label: { show: false }, itemStyle: { opacity: 0 } })),
          links: links,
          label: { show: false },
          itemStyle: { opacity: 0 },
          lineStyle: { curveness: 0.5 },
          emphasis: {
            focus: 'adjacency' as const,
            lineStyle: { opacity: 0.8 }
          }
        },
      ],
    };
  }, []);

  if (!mounted) return null;

  return (
    <>
      <Head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&display=swap"
        />
      </Head>

      {/* Year labels */}
      <div
        style={{
          position: 'absolute',
          top: 66,
          left: '22%',
          right: '22%',
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0 6px',
          zIndex: 10,
          pointerEvents: 'none',
          fontFamily: '"Noto Sans TC", "Microsoft JhengHei", sans-serif',
          fontSize: 15,
          fontWeight: 500,
          color: '#666',
          letterSpacing: '0.05em',
        }}
      >
        <span>1985</span>
        <span>2022</span>
      </div>

      <div style={{ width: '100%', height: '100vh', background: '#fff', position: 'relative' }}>
        <ReactECharts
          option={option}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
          notMerge={true}
        />
      </div>
    </>
  );
}
