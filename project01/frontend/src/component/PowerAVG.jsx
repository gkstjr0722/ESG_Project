// 평균 전력량

import React, { useEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

// 🔥 부모로부터 data를 props로 받음
const PowerAVG = ({ data }) => {
  const chartRef = useRef(null);
  const xAxisRef = useRef(null);
  const seriesRef = useRef(null);

  useEffect(() => {
    let root = am5.Root.new("PowerAVG");
    root.setThemes([am5themes_Animated.new(root)]);

    let chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: false, panY: false, wheelX: false, wheelY: false,
        pinchZoomX: false, paddingLeft: 0, paddingRight: 1,
      })
    );
    chartRef.current = chart;

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
    xAxisRef.current = xAxis;

    let yRenderer = am5xy.AxisRendererY.new(root, { strokeOpacity: 0.1 });
    let yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, { maxDeviation: 0.3, renderer: yRenderer, })
    );

    let series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: "평군전력량", xAxis: xAxis, yAxis: yAxis,
        valueYField: "value", sequencedInterpolation: true,
        categoryXField: "month",
        tooltip: am5.Tooltip.new(root, { labelText: "{valueY} kWh" }),
      })
    );
    seriesRef.current = series;

    series.columns.template.setAll({
      cornerRadiusTL: 5, cornerRadiusTR: 5, strokeOpacity: 0,
    });
    series.columns.template.adapters.add("fill", (fill, target) => {
      return chart.get("colors").getIndex(series.columns.indexOf(target));
    });
    series.columns.template.adapters.add("stroke", (stroke, target) => {
      return chart.get("colors").getIndex(series.columns.indexOf(target));
    });

    // 차트 최초 데이터
    xAxis.data.setAll(data);
    series.data.setAll(data);

    series.appear(1000);
    chart.appear(1000, 100);

    return () => {
      root.dispose();
    };
  }, [data]); // ⭐️ data가 바뀔 때마다 차트 전체 다시 그림

  // 만약 차트 자체 재생성이 부담스럽다면, 아래처럼 차트 객체 유지 + data만 갱신하는 useEffect를 유지할 수도 있음
  /*
  useEffect(() => {
    if (xAxisRef.current && seriesRef.current) {
        xAxisRef.current.data.setAll(data);
        seriesRef.current.data.setAll(data);
    }
  }, [data]);
  */

  return (
    <div id="PowerAVG" style={{ width: "100%", height: "200px" }}></div>
  );
};

export default PowerAVG;
