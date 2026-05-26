
"""
LULCC GeoJSON / JSON 資料檢核腳本
用途：確認資料是否具備製作 Sankey 圖的基本條件
執行：python check_sankey.py your_file.geojson
      python check_sankey.py lulcc_data.json
"""

import json, sys, os
from collections import defaultdict

# ── 顏色輸出 ──────────────────────────────────────────────────
def ok(msg):   print(f"  ✅  {msg}")
def warn(msg): print(f"  ⚠️  {msg}")
def err(msg):  print(f"  ❌  {msg}")
def head(msg): print(f"\n{'─'*60}\n  {msg}\n{'─'*60}")

# ── 載入檔案 ──────────────────────────────────────────────────
def load_file(path):
    if not os.path.exists(path):
        err(f"找不到檔案：{path}"); sys.exit(1)
    with open(path, encoding="utf-8") as f:
        return json.load(f)

# ══════════════════════════════════════════════════════════════
# 模式 A：GeoJSON（每個 feature 有屬性欄位）
# ══════════════════════════════════════════════════════════════
def check_geojson(data):
    head("模式 A：GeoJSON 檢核")

    features = data.get("features", [])
    if not features:
        err("沒有 features，不是標準 GeoJSON"); return

    ok(f"共 {len(features)} 個 feature")

    # 取第一個 feature 的所有欄位
    sample_props = features[0].get("properties", {})
    print(f"\n  📋 欄位列表（共 {len(sample_props)} 個）：")
    for k, v in sample_props.items():
        print(f"       {k!r:30s} → 範例值: {str(v)[:40]}")

    # 找可能的「年份」欄位
    year_candidates = [k for k in sample_props if any(
        str(y) in str(k) for y in range(1980, 2030)
    )]
    lulc_candidates = [k for k in sample_props if any(
        kw in str(k).lower() for kw in
        ["class","lulc","lulcc","type","land","地覆","地類","類別","category","code"]
    )]

    print(f"\n  🗓  疑似年份相關欄位：{year_candidates or '（未找到）'}")
    print(f"  🗺  疑似地覆類別欄位：{lulc_candidates or '（未找到）'}")

    # 判斷是否有「兩個年份」的類別欄位（Sankey 最低需求）
    head("Sankey 基本條件檢核")

    if len(year_candidates) >= 2:
        ok(f"找到 {len(year_candidates)} 個年份欄位，可能支援跨年份 Sankey")
        # 嘗試統計轉換對
        from_col = year_candidates[0]
        to_col   = year_candidates[1]
        matrix = defaultdict(lambda: defaultdict(float))
        area_col = next((k for k in sample_props if "area" in k.lower() or "面積" in k), None)

        for f in features:
            p = f.get("properties", {})
            src = p.get(from_col)
            tgt = p.get(to_col)
            area = p.get(area_col, 1) if area_col else 1
            if src and tgt:
                matrix[str(src)][str(tgt)] += float(area or 1)

        print(f"\n  📊 轉換矩陣（{from_col} → {to_col}）：")
        all_classes = sorted(set(list(matrix.keys()) + [t for v in matrix.values() for t in v]))
        cross = 0
        for src, targets in sorted(matrix.items()):
            for tgt, val in sorted(targets.items()):
                marker = "🔄" if src.split("(")[0].strip() != tgt.split("(")[0].strip() else "  "
                print(f"       {marker} {src:20s} → {tgt:20s}  {val:>10.2f}")
                if src != tgt: cross += 1

        if cross > 0:
            ok(f"有 {cross} 條跨類別轉換流，✅ 可以做 Sankey！")
        else:
            err("所有流都是同類對同類，Sankey 圖不會有交叉流動")

    elif len(lulc_candidates) == 1:
        warn("只有一個地覆欄位，需要兩個不同年份的地覆欄位才能做 Sankey")
        warn("建議：在 GIS 中做空間 JOIN，把兩個年份的分類結果合併到同一個 feature")
    else:
        err("找不到明確的年份或地覆欄位，請確認欄位命名")

    # 幾何類型
    geom_types = set(f.get("geometry", {}).get("type","") for f in features)
    print(f"\n  📐 幾何類型：{geom_types}")
    if "Polygon" in geom_types or "MultiPolygon" in geom_types:
        ok("有面積幾何，可計算面積作為 Sankey 流量值")
    else:
        warn("非面積幾何，需要另外提供面積欄位")


# ══════════════════════════════════════════════════════════════
# 模式 B：已整理的 JSON（你現有的 lulcc_data.json 格式）
# ══════════════════════════════════════════════════════════════
def check_lulcc_json(data):
    head("模式 B：LULCC JSON 檢核")

    # 支援頂層有 "sankey" 包裝或直接是地區
    sankey = data.get("sankey", data)
    regions = list(sankey.keys())
    ok(f"找到地區：{regions}")

    for region in regions[:2]:  # 只檢核前兩個地區
        head(f"地區：{region}")
        periods = sankey[region]
        period_keys = list(periods.keys())
        ok(f"共 {len(period_keys)} 個時段：{period_keys}")

        cross_total = 0
        same_total  = 0

        for pk in period_keys:
            p = periods[pk]
            nodes = p.get("nodes", [])
            links = p.get("links", [])
            year_from = p.get("year_from")
            year_to   = p.get("year_to")

            cross = 0
            same  = 0
            for l in links:
                src_name = nodes[l["source"]]["name"] if isinstance(l["source"], int) else l["source"]
                tgt_name = nodes[l["target"]]["name"] if isinstance(l["target"], int) else l["target"]
                # 去掉年份括號比較類別
                src_cls = src_name.split("（")[0].strip()
                tgt_cls = tgt_name.split("（")[0].strip()
                if src_cls == tgt_cls:
                    same += 1
                else:
                    cross += 1

            status = "✅ 有跨類別" if cross > 0 else "❌ 全部同類"
            print(f"    {pk:15s}  nodes={len(nodes):2d}  links={len(links):2d}  "
                  f"同類={same}  跨類={cross}  {status}")
            cross_total += cross
            same_total  += same

        print()
        if cross_total == 0:
            err(f"{region}：所有時段的 links 都是同類對同類")
            err("→ 這是 Sankey 看不出變化的根本原因！")
            err("→ 需要提供包含跨類別轉換的 transition matrix")
            print("""
  💡 解決方案：
     在 QGIS / ArcGIS 中：
     1. 將兩個年份的地覆分類圖層做「Intersect」疊加分析
     2. 計算每個交叉多邊形的面積
     3. 以「年份A類別 × 年份B類別」分組加總面積
     4. 輸出格式範例：
        {
          "source": "農地",  // 1985 年類別
          "target": "建地",  // 1990 年類別
          "value": 234.5    // 轉換面積（公頃）
        }
""")
        else:
            ok(f"{region}：共 {cross_total} 條跨類別轉換，可以做有意義的 Sankey！")


# ══════════════════════════════════════════════════════════════
# 主程式
# ══════════════════════════════════════════════════════════════
def main():
    path = sys.argv[1] if len(sys.argv) > 1 else "lulcc_data.json"
    print(f"\n🔍 檢核檔案：{path}")
    data = load_file(path)

    if "type" in data and data["type"] == "FeatureCollection":
        check_geojson(data)
    else:
        check_lulcc_json(data)

    head("檢核完成")

if __name__ == "__main__":
    main()
