// 한달 예측 사용량 그래프

import React, { useEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

// data: [{ month: "8월", value: kWh }, ...]
const MonthUsed = ({ data }) => {
  // 고유 id (중복 걱정 X)
  const chartId = useRef(`MonthUsedChart_${Math.random().toString(36).substring(2, 11)}`).current;

  useEffect(() => {
    // 혹시 남아있는 차트 정리(메모리릭 방지)
    const prev = am5.registry.rootElements.find(root => root.dom && root.dom.id === chartId);
    if (prev) prev.dispose();

    let root = am5.Root.new(chartId);
    root.setThemes([am5themes_Animated.new(root)]);

    let chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: false, panY: false, wheelX: false, wheelY: false,
        pinchZoomX: false, paddingLeft: 0, paddingRight: 1,
      })
    );

    let cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
    cursor.lineY.set("visible", false);

    let xRenderer = am5xy.AxisRendererX.new(root, {
      minGridDistance: 30, minorGridEnabled: true,
    });
    xRenderer.labels.template.setAll({
      rotation: 0, centerY: am5.p50, centerX: am5.p50, paddingRight: 0,
    });
    xRenderer.grid.template.setAll({ location: 1 });

    let xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        maxDeviation: 0.3, categoryField: "month",
        renderer: xRenderer, tooltip: am5.Tooltip.new(root, {}),
      })
    );

    let yRenderer = am5xy.AxisRendererY.new(root, { strokeOpacity: 0.1 });
    let yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, { maxDeviation: 0.3, renderer: yRenderer })
    );

    // ===== 공통 y축 범위 동기화 (전역 공유) =====
    const calcDomain = (vals) => {
      if (!vals.length) return null;
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const range = Math.max(1, max - min);
      const pad = Math.max(200, Math.round(range * 0.08)); // 8% or 최소 200kWh
      const niceMin = Math.floor((min - pad) / 100) * 100;
      const niceMax = Math.ceil((max + pad) / 10000) * 10000;
      return {
        min: Math.max(0, niceMin),
        max: niceMax > niceMin ? niceMax : niceMin + 1000,
      };
    };
    const applyDomain = (dom) => {
      if (!dom) return;
      yAxis.setAll({ min: dom.min, max: dom.max, strictMinMax: true });
    };
    const syncWithGlobal = (local) => {
      const g = window;
      const prev = g.__powerYDomain;
      const merged = prev
        ? { min: Math.min(prev.min, local.min), max: Math.max(prev.max, local.max) }
        : local;
      g.__powerYDomain = merged;
      g.dispatchEvent?.(new CustomEvent("powerYDomainUpdated", { detail: merged }));
      return merged;
    };
    const onGlobal = (e) => applyDomain(e.detail);
    window.addEventListener?.("powerYDomainUpdated", onGlobal);
    // ==========================================

    let series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: "월별 전력사용량",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "value",   // y축 = 전력사용량(kWh)
        sequencedInterpolation: true,
        categoryXField: "month",
        tooltip: am5.Tooltip.new(root, {
          labelText: "{value} kWh"
        }),
      })
    );

    series.columns.template.setAll({
      cornerRadiusTL: 5, cornerRadiusTR: 5, strokeOpacity: 0, width: am5.percent(55)
    });
    series.columns.template.adapters.add("fill", (fill, target) => {
      return chart.get("colors").getIndex(series.columns.indexOf(target));
    });
    series.columns.template.adapters.add("stroke", (stroke, target) => {
      return chart.get("colors").getIndex(series.columns.indexOf(target));
    });

    // 안전 보정: data 없거나 포맷 다른 경우 대비
    const safeData = Array.isArray(data)
      ? data.map(d => ({
          month: String(d?.month ?? ""),
          value: Number(d?.value ?? 0)
        }))
      : [];

    // 내 데이터로 범위 계산 → 전역에 합치고 → 적용
    const vals = safeData.map(d => Number(d.value || 0)).filter(Number.isFinite);
    const local = calcDomain(vals);
    const merged = syncWithGlobal(local);
    applyDomain(merged);

    xAxis.data.setAll(safeData);
    series.data.setAll(safeData);

    series.appear(1000);
    chart.appear(1000, 100);

    return () => {
      window.removeEventListener?.("powerYDomainUpdated", onGlobal);
      root.dispose();
    };
  }, [chartId, data]);

  return (
    <div id={chartId} style={{ width: "100%", height: "200px" }}></div>
  );
};

export default MonthUsed;
