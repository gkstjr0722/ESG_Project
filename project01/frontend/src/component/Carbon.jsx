import React, { useEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

// data: [{ month: "8월", value: kWh }, ...]
const Carbon = ({ data }) => {
  const chartId = useRef("CarbonChart").current;

  // kWh 데이터를 받아서 CO₂(kg)로 변환한 새 배열 생성
  const processedData = data.map(item => ({
    month: item.month,
    kwh: item.value,
    co2: Math.round(item.value * 0.4745), // 반올림 표시
  }));

  useEffect(() => {
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

    let series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: "탄소사용량",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "co2", // y축은 CO₂(kg)
        sequencedInterpolation: true,
        categoryXField: "month",
        tooltip: am5.Tooltip.new(root, {
          labelText: "{co2} kgCO₂"
        }),
      })
    );

    series.columns.template.setAll({
      cornerRadiusTL: 5, cornerRadiusTR: 5, strokeOpacity: 0,
    });
    series.columns.template.adapters.add("fill", (fill, target) => {
      return chart.get("colors").getIndex(series.columns.indexOf(target));
    });
    series.columns.template.adapters.add("stroke", (stroke, target) => {
      return chart.get("colors").getIndex(series.columns.indexOf(target));
    });

    xAxis.data.setAll(processedData);
    series.data.setAll(processedData);

    series.appear(1000);
    chart.appear(1000, 100);

    return () => {
      root.dispose();
    };
  }, [chartId, data, processedData]);

  return (
    <div id={chartId} style={{ width: "100%", height: "200px" }}></div>
  );
};

export default Carbon;
