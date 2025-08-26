// 탄소 사용 현황

import React, { useEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

// data: [{ month: "8월", value: kWh }, ...]
const Carbon = ({ data }) => {
  const chartId = useRef("CarbonChart").current;

  // kWh → CO₂(kg) 변환 계수
  const CO2_FACTOR = 0.4745;

  useEffect(() => {
    // 혹시 남아있는 차트 정리(메모리릭 방지)
    const prev = am5.registry.rootElements.find(
      (root) => root.dom && root.dom.id === chartId
    );
    if (prev) prev.dispose();

    let root = am5.Root.new(chartId);
    root.setThemes([am5themes_Animated.new(root)]);

    let chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: false,
        panY: false,
        wheelX: false,
        wheelY: false,
        pinchZoomX: false,
        paddingLeft: 0,
        paddingRight: 1,
      })
    );

    let cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
    cursor.lineY.set("visible", false);

    let xRenderer = am5xy.AxisRendererX.new(root, {
      minGridDistance: 30,
      minorGridEnabled: true,
    });
    xRenderer.labels.template.setAll({
      rotation: 0,
      centerY: am5.p50,
      centerX: am5.p50,
      paddingRight: 0,
    });
    xRenderer.grid.template.setAll({ location: 1 });

    let xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        maxDeviation: 0.3,
        categoryField: "month",
        renderer: xRenderer,
        tooltip: am5.Tooltip.new(root, {}),
      })
    );

    let yRenderer = am5xy.AxisRendererY.new(root, { strokeOpacity: 0.1 });
    let yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        maxDeviation: 0.3,
        renderer: yRenderer,
        min: 0,             // ✅ y축을 0부터 시작
        strictMinMax: false // 최대값은 데이터에 맞춰 자동 확장
      })
    );

    let series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: "탄소사용량",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "co2", // y축은 CO₂(kg)
        sequencedInterpolation: true,
        categoryXField: "month",
        tooltip: am5.Tooltip.new(root, {
          labelText: "{co2} kgCO₂",
        }),
      })
    );

    series.columns.template.setAll({
      cornerRadiusTL: 5,
      cornerRadiusTR: 5,
      strokeOpacity: 0,
      width: am5.percent(55),
    });
    series.columns.template.adapters.add("fill", (fill, target) => {
      return chart.get("colors").getIndex(series.columns.indexOf(target));
    });
    series.columns.template.adapters.add("stroke", (stroke, target) => {
      return chart.get("colors").getIndex(series.columns.indexOf(target));
    });

    // ⬇️ 왼쪽(전달) & 오른쪽(예측)만 사용
    const last = Array.isArray(data) && data[0] ? data[0] : { month: "전달", value: 0 };
    const pred = Array.isArray(data) && data[1] ? data[1] : { month: "예측", value: 0 };

    const processedData = [
      {
        month: String(last.month ?? "전달"),
        kwh: Number(last.value ?? 0),
        co2: Math.round(Number(last.value ?? 0) * CO2_FACTOR),
      },
      {
        month: String(pred.month ?? "예측"),
        kwh: Number(pred.value ?? 0),
        co2: Math.round(Number(pred.value ?? 0) * CO2_FACTOR),
      },
    ];

    xAxis.data.setAll(processedData);
    series.data.setAll(processedData);

    series.appear(1000);
    chart.appear(1000, 100);

    return () => {
      root.dispose();
    };
  }, [chartId, data]);

  return <div id={chartId} style={{ width: "100%", height: "200px" }}></div>;
};

export default Carbon;
