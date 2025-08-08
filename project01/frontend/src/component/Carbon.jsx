// 탄소사용현황

import React, { useEffect } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

const Carbon = () => {
  useEffect(() => {
    // Root 생성
    let root = am5.Root.new("Carbon");

    // 테마
    root.setThemes([am5themes_Animated.new(root)]);

    // XYChart
    let chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: false, // X축 드래그로 이동
        panY: false, // Y축 드래그로 이동
        wheelX: false, // 휠로 X축 이동
        wheelY: false, // 휠로 X축 확대/축소
        pinchZoomX: false, // 터치 확대/축소
        paddingLeft: 0,
        paddingRight: 1,
      })
    );

    // 커서
    let cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
    cursor.lineY.set("visible", false);

    // X축
    let xRenderer = am5xy.AxisRendererX.new(root, {
      minGridDistance: 30, // 카테고리 최소 간격
      minorGridEnabled: true, // 보조그리드 표시
    });

    xRenderer.labels.template.setAll({
      rotation: 0, // X축 라벨 회전
      centerY: am5.p50, // 라벨 중심 Y
      centerX: am5.p50, // 라벨 중심 X
      paddingRight: 0, // 라벨 우측 여백
    });

    xRenderer.grid.template.setAll({
      location: 1,
    });

    let xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        maxDeviation: 0.3,
        categoryField: "month", // X축 필드 명
        renderer: xRenderer,
        tooltip: am5.Tooltip.new(root, {}),
      })
    );

    // Y축
    let yRenderer = am5xy.AxisRendererY.new(root, {
      strokeOpacity: 0.1, // Y축 라인 옅게
    });

    let yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        maxDeviation: 0.3,
        renderer: yRenderer,
      })
    );

    // 시리즈(막대)
    let series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: "탄소사용량",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "value", // Y축 값
        sequencedInterpolation: true,
        categoryXField: "month", // X축 값
        tooltip: am5.Tooltip.new(root, {
          labelText: "{valueY}", // 툴팁 표시 형식
        }),
      })
    );

    // 막대 모양 스타일
    series.columns.template.setAll({
      cornerRadiusTL: 5, // 좌상단 모서리 둥글게
      cornerRadiusTR: 5, // 우상단 모서리 둥글게
      strokeOpacity: 0, // 외곽선 투명
    });

    // 막대 색상 자동 변경
    series.columns.template.adapters.add("fill", function (fill, target) {
      return chart.get("colors").getIndex(series.columns.indexOf(target));
    });
    series.columns.template.adapters.add("stroke", function (stroke, target) {
      return chart.get("colors").getIndex(series.columns.indexOf(target));
    });

    // 데이터
    let data = [
      { month: "1월", value: 2025 },
      { month: "2월", value: 1882 },
      { month: "3월", value: 1809 },
      { month: "4월", value: 1322 },
      { month: "5월", value: 1122 },
      { month: "6월", value: 1114 },
      { month: "7월", value: 984 },
      { month: "8월", value: 711 },
      { month: "9월", value: 665 },
      { month: "10월", value: 443 },
      { month: "11월", value: 441 },
      { month: "12월", value: 441 },
    ];

    // X축/ 시리즈에 데이터 할당
    xAxis.data.setAll(data);
    series.data.setAll(data);

    // 차트/시리즈 애니메이션 등장
    series.appear(1000);
    chart.appear(1000, 100);

    // cleanup
    return () => {
      root.dispose();
    };
  }, []);

  // 반드시 이 div의 id와 루트 생성시 id가 같아야 함!
  return (
    <div id="Carbon" style={{ width: "100%", height: "300px" }}></div>
  );
};

export default Carbon;
