// 한달 예측 사용량

import React, { useEffect } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

const MonthUsed = () => {
  useEffect(() => {
    // 1. 차트 루트 생성
    let root = am5.Root.new("MonthUsed");

    // 2. 테마 적용 (애니메이션)
    root.setThemes([am5themes_Animated.new(root)]);

    // 3. XY 차트 생성 (패닝, 확대/축소 등 옵션)
    let chart = root.container.children.push(am5xy.XYChart.new(root, {
      panX: false,
      panY: false,
      wheelX: false,
      wheelY: false,
      pinchZoomX: false,
      paddingLeft: 0
    }));

    // 4. 커서(마우스 추적선)
    let cursor = chart.set("cursor", am5xy.XYCursor.new(root, {
      behavior: "none"
    }));
    cursor.lineY.set("visible", false);

    // 5. 데이터 생성 함수
    let date = new Date();
    date.setHours(0, 0, 0, 0);
    let value = 100;

    function generateData() {
      value = Math.round((Math.random() * 10 - 5) + value);
      am5.time.add(date, "month", 1);
      return {
        date: date.getTime(),
        value: value
      };
    }

    function generateDatas(count) {
      let data = [];
      for (let i = 0; i < count; ++i) {
        data.push(generateData());
      }
      return data;
    }

    // 6. X, Y축 생성
    let xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
      maxDeviation: 0.5,
      baseInterval: {
        timeUnit: "month",
        count: 1
      },
      renderer: am5xy.AxisRendererX.new(root, {
        minGridDistance: 80,
        minorGridEnabled: true,
        pan: "zoom"
      }),
      tooltip: am5.Tooltip.new(root, {})
    }));

    xAxis.get("dateFormats")["month"] = "M월";
    xAxis.get("periodChangeDateFormats")["month"] = "M월";

    let yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
      maxDeviation: 1,
      renderer: am5xy.AxisRendererY.new(root, {
        pan: "zoom"
      })
    }));

    // 7. 부드러운 라인 시리즈 생성
    let series = chart.series.push(am5xy.SmoothedXLineSeries.new(root, {
      name: "Series",
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: "value",
      valueXField: "date",
      sequencedInterpolation: true,
      tooltip: am5.Tooltip.new(root, {
        labelText: "{valueY}"
      })
    }));

    // 라인 스타일
    series.strokes.template.setAll({
      strokeWidth: 2,
    });

    // 데이터 점(원)
    series.bullets.push(function () {
      return am5.Bullet.new(root, {
        locationY: 0,
        sprite: am5.Circle.new(root, {
          radius: 4,
          stroke: root.interfaceColors.get("background"),
          strokeWidth: 2,
          fill: series.get("fill")
        })
      });
    });

    // 8. 가로 스크롤바 추가
    // chart.set("scrollbarX", am5.Scrollbar.new(root, {
    //   orientation: "horizontal"
    // }));

    // 9. 차트에 데이터 입력
    let data = generateDatas(3);
    series.data.setAll(data);

    // 10. Smoothing 조절 슬라이더 컨테이너(플롯영역 하단)
    let container = chart.plotContainer.children.push(am5.Container.new(root, {
      layout: root.horizontalLayout,
      position: "absolute",
      x: 20,
      y: am5.percent(100),
      centerY: am5.percent(100),
      width: am5.percent(30),
      paddingLeft: 30,
      paddingRight: 30,
      paddingTop: 20,
      paddingBottom: 30
    }));

    // Smoothing 라벨 추가
    container.children.push(am5.Label.new(root, {
      text: "Smoothing:",
      centerY: am5.percent(50),
      paddingBottom: 10
    }));

    // Smoothing 슬라이더 추가 (부드러움 조절)
    let smoothingSlider = container.children.push(am5.Slider.new(root, {
      orientation: "horizontal",
      centerY: am5.percent(50),
      start: 1 - series.get("tension", 0.5)
    }));

    // 슬라이더 움직일 때 부드러움(tension) 조절
    smoothingSlider.on("start", function (start) {
      series.set("tension", 1 - start);
    });

    // 11. 애니메이션 효과
    series.appear(1000);
    chart.appear(1000, 100);

    // 12. 컴포넌트 unmount시 차트 해제(메모리누수 방지)
    return () => {
      root.dispose();
    };
  }, []);

  // 반드시 이 id와 위에서 생성한 루트 id가 같아야 함!
  return (
    <div id="MonthUsed" style={{ width: "100%", height: "400px" }}></div>
  );
};

export default MonthUsed;
