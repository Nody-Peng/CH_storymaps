#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
rebuild_sankey.py
從 lulcc_data.json 的 line 資料，用「按比例分配法」重建跨類別 Sankey JSON
用法：python rebuild_sankey.py lulcc_data.json
輸出：lulcc_sankey_v2.json（放在同目錄下）
"""

import json
import sys
import os
from collections import defaultdict

# ── 設定 ──────────────────────────────────────────────────
MIN_AREA     = 1.0    # 最小流量門檻（公頃），低於此值的 link 不輸出
SAME_OPACITY = 0.15   # 「不變」流向的透明度（給前端用）
CHANGE_OPACITY = 0.75 # 「轉變」流向的透明度

# 固定類別順序（節點垂直排序用）
LANDUSE_ORDER = ['農地', '陸域森林', '草生地', '感潮灘地', '紅樹林', '建地', '裸地', '水體']

# 類別顏色
COLORS = {
    '農地':   '#7db87d',
    '陸域森林':'#2d6a2d',
    '草生地': '#c8d96f',
    '感潮灘地':'#8ecae6',
    '紅樹林': '#1b4332',
    '建地':   '#e76f51',
    '裸地':   '#d4a373',
    '水體':   '#457b9d',
}

# ── 核心函式 ──────────────────────────────────────────────

def build_transition_matrix(area_t0: dict, area_t1: dict) -> list:
    """
    輸入：兩個年份的 {類別: 面積} dict
    輸出：[{source, target, value, isSame}, ...]
    
    邏輯（按比例分配法）：
    1. 計算每個類別的面積變化量（delta）
    2. 面積減少的類別 → 流出池
    3. 面積增加的類別 → 流入池
    4. 按增加量比例，將流出池分配給各增加類別
    5. 不變的部分（min(t0, t1)）→ 同類流向
    """
    classes = list(set(list(area_t0.keys()) + list(area_t1.keys())))
    
    # 計算 delta
    delta = {}
    for c in classes:
        a0 = area_t0.get(c, 0)
        a1 = area_t1.get(c, 0)
        delta[c] = a1 - a0  # 正 = 增加, 負 = 減少

    losers  = {c: -d for c, d in delta.items() if d < -MIN_AREA}  # 流出量（正值）
    gainers = {c:  d for c, d in delta.items() if d >  MIN_AREA}  # 流入量（正值）

    total_loss = sum(losers.values())
    total_gain = sum(gainers.values())

    links = []

    # ── 1. 同類「不變」流向 ──
    for c in classes:
        a0 = area_t0.get(c, 0)
        a1 = area_t1.get(c, 0)
        same_val = min(a0, a1)
        if same_val > MIN_AREA:
            links.append({
                "source": c,
                "target": c,
                "value":  round(same_val, 2),
                "isSame": True,
            })

    # ── 2. 跨類「轉變」流向 ──
    if total_loss < MIN_AREA or total_gain < MIN_AREA:
        return links  # 沒有顯著變化，只回傳同類流向

    # 用 total_loss 與 total_gain 的較小值做分配基準（守恆）
    transfer_pool = min(total_loss, total_gain)

    for src, loss in losers.items():
        src_share = loss / total_loss  # 這個 loser 貢獻多少比例的流出
        for tgt, gain in gainers.items():
            tgt_share = gain / total_gain  # 這個 gainer 吸收多少比例的流入
            val = transfer_pool * src_share * tgt_share
            if val > MIN_AREA:
                links.append({
                    "source": src,
                    "target": tgt,
                    "value":  round(val, 2),
                    "isSame": False,
                })

    return links


def build_sankey_period(area_t0: dict, area_t1: dict, year0: int, year1: int) -> dict:
    """
    建立單一時段的 Sankey nodes + links
    """
    links_raw = build_transition_matrix(area_t0, area_t1)

    # 收集所有用到的類別
    used = set()
    for l in links_raw:
        used.add(l["source"])
        used.add(l["target"])

    # 依固定順序建立節點
    ordered = [c for c in LANDUSE_ORDER if c in used]
    # 加上不在 LANDUSE_ORDER 裡的類別（保險）
    for c in used:
        if c not in ordered:
            ordered.append(c)

    node_list = []
    for c in ordered:
        node_list.append({
            "name":      f"{c}（{year0}）",
            "label":     c,
            "year":      year0,
            "itemStyle": {"color": COLORS.get(c, "#aaaaaa")},
        })
    for c in ordered:
        node_list.append({
            "name":      f"{c}（{year1}）",
            "label":     c,
            "year":      year1,
            "itemStyle": {"color": COLORS.get(c, "#aaaaaa")},
        })

    # 建立 name → index 對照
    name2idx = {n["name"]: i for i, n in enumerate(node_list)}

    link_list = []
    for l in links_raw:
        src_name = f"{l['source']}（{year0}）"
        tgt_name = f"{l['target']}（{year1}）"
        if src_name not in name2idx or tgt_name not in name2idx:
            continue
        link_list.append({
            "source":  name2idx[src_name],
            "target":  name2idx[tgt_name],
            "value":   l["value"],
            "label":   f"{l['source']} → {l['target']}",
            "isSame":  l["isSame"],
            "lineStyle": {
                "opacity":   SAME_OPACITY if l["isSame"] else CHANGE_OPACITY,
                "color":     COLORS.get(l["source"], "#aaaaaa"),
                "curveness": 0.5,
            }
        })

    return {"nodes": node_list, "links": link_list}


def rebuild_all(input_path: str, output_path: str):
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    line_data  = data.get("line", {})
    towns      = data.get("towns", list(line_data.keys()))
    years      = sorted(data.get("years", []))

    # 建立時段列表
    periods = [f"{years[i]}→{years[i+1]}" for i in range(len(years)-1)]

    new_sankey = {}

    for town in towns:
        if town not in line_data:
            print(f"  ⚠️  跳過 {town}（line 資料不存在）")
            continue

        town_line = line_data[town]  # {類別: {年份: 面積}}
        new_sankey[town] = {}

        for i in range(len(years) - 1):
            y0, y1 = years[i], years[i+1]
            period = f"{y0}→{y1}"

            # 取出兩年的面積 dict
            area_t0 = {cls: town_line[cls].get(str(y0), town_line[cls].get(y0, 0))
                       for cls in town_line}
            area_t1 = {cls: town_line[cls].get(str(y1), town_line[cls].get(y1, 0))
                       for cls in town_line}

            period_data = build_sankey_period(area_t0, area_t1, y0, y1)
            new_sankey[town][period] = period_data

            n_same   = sum(1 for l in period_data["links"] if l["isSame"])
            n_change = sum(1 for l in period_data["links"] if not l["isSame"])
            print(f"  {town:6s} {period}  nodes={len(period_data['nodes']):2d}  "
                  f"同類={n_same:2d}  跨類={n_change:2d}  "
                  f"{'✅' if n_change > 0 else '❌'}")

    # 組合輸出
    output = {
        "towns":          towns,
        "years":          years,
        "periods":        periods,
        "landuse_classes": LANDUSE_ORDER,
        "sankey":         new_sankey,
        "line":           line_data,  # 保留原始 line 資料
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n✅ 輸出完成：{output_path}")
    print(f"   共處理 {len(towns)} 個地區 × {len(periods)} 個時段")


# ── 主程式 ────────────────────────────────────────────────
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法：python rebuild_sankey.py <input.json> [output.json]")
        sys.exit(1)

    input_path  = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else "lulcc_sankey_v2.json"

    if not os.path.exists(input_path):
        print(f"❌ 找不到檔案：{input_path}")
        sys.exit(1)

    print(f"\n🔧 開始重建 Sankey 資料：{input_path}\n")
    rebuild_all(input_path, output_path)
