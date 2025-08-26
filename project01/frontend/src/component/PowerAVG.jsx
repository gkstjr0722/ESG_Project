// 평균 전력량 그래프

import React, { useEffect, useRef, useState } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import axios from "axios";

// ⚠️ 프록시(vite.config.js)의 '/kepco' 경로를 타도록 항상 상대경로 사용
const api = axios.create({ baseURL: "/" });
const ENDPOINT = "/kepco/industry";

// ▶︎ 추가: 간단 캐시(메모리)
const cache = new Map();

const PowerAVG = ({
  data,
  kepcoValue = 0,
  filters = {},
  labelForAvg = "산업 평균",
  targetYM,
  active = false, // ← 추가: 계산 버튼 누르기 전엔 API 호출 않음
}) => {
  const chartId = useRef(`PowerAVG_${Math.random().toString(36).slice(2)}`).current;

  const [avgVal, setAvgVal] = useState(Number(kepcoValue || 0));
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // ▶︎ 동일 조건 중복 호출 방지용 키
  const lastKeyRef = useRef("");

  const ymLabel =
    (labelForAvg && String(labelForAvg).trim()) ||
    (targetYM && Number(targetYM?.year) && Number(targetYM?.month)
      ? `${targetYM.year}-${String(targetYM.month).padStart(2, "0")} 산업 평균`
      : "산업 평균");

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const fetchAvg = async () => {
      // 활성화되기 전에는 API를 호출하지 않음(차트는 0값으로만 렌더)
      if (!active) {
        setLoading(false);
        setErr("");
        return;
      }

      if (Number(kepcoValue) > 0) {
        setAvgVal(Number(kepcoValue));
        setErr("");
        return;
      }

      setLoading(true);
      setErr("");

      // 조회 연월 계산
      let year, month;
      if (targetYM && Number(targetYM.year) && Number(targetYM.month)) {
        year = Number(targetYM.year);
        month = String(Number(targetYM.month)).padStart(2, "0");
      } else {
        const now = new Date();
        const curYear = now.getFullYear();
        const curMonth = now.getMonth() + 1;
        const prev = new Date(curYear, curMonth - 2, 1);
        year = prev.getFullYear();
        month = String(prev.getMonth() + 1).padStart(2, "0");
      }

      // ▶︎ 키 만들기
      const key = [
        year,
        month,
        filters?.metroCd || "",
        filters?.cityCd || "",
        filters?.bizCd || "",
        Number(kepcoValue) || 0,
      ].join("|");

      // ▶︎ 같은 조건이면 재호출 스킵
      if (lastKeyRef.current === key) {
        setLoading(false);
        return;
      }
      lastKeyRef.current = key;

      // ▶︎ 캐시 확인
      if (cache.has(key)) {
        const cachedVal = cache.get(key);
        setAvgVal(cachedVal);
        setErr("");
        setLoading(false);
        return;
      }

      try {
        const params = { year, month };
        if (filters.metroCd) params.metroCd = String(filters.metroCd);
        if (filters.cityCd) params.cityCd = String(filters.cityCd);
        if (filters.bizCd) params.bizCd = String(filters.bizCd);

        const { data: res } = await api.get(ENDPOINT, {
          params,
          timeout: 15000,
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        if (res?.result !== 1) {
          console.warn("[PowerAVG] backend non-success:", res?.upStatus, res?.message);
          if (!cancelled) {
            setAvgVal(0);
            setErr(res?.message || "KEPCO 평균 조회 실패");
          }
          return;
        }

        const items = Array.isArray(res?.items) ? res.items : [];
        console.log("[PowerAVG] /kepco/industry params:", params);
        console.log("[PowerAVG] result count:", items.length, "upstream:", res?.upstream);

        if (items.length === 0) {
          if (!cancelled) {
            setAvgVal(0);
            setErr("해당 조건의 산업 평균 데이터가 없습니다.");
          }
          return;
        }

        // 가중평균(kWh/고객) = Σ사용량 / Σ고객수
        const totals = items.reduce(
          (acc, it) => {
            const usage = Number(it?.powerUsage || 0);
            const cust = Number(it?.custCnt || 0);
            acc.usage += usage;
            acc.cust += cust;
            return acc;
          },
          { usage: 0, cust: 0 }
        );

        let avgPerCustomer = 0;
        if (totals.cust > 0) {
          avgPerCustomer = totals.usage / totals.cust;
        } else {
          const sum = items.reduce((a, it) => a + Number(it?.powerUsage || 0), 0);
          avgPerCustomer = items.length ? sum / items.length : 0;
        }

        const rounded = Math.round(avgPerCustomer);
        if (!cancelled) {
          setAvgVal(rounded);
          setErr("");
          // ▶︎ 성공 응답만 캐시
          cache.set(key, rounded);
        }
      } catch (e) {
        if (!cancelled) {
          console.error("[PowerAVG] KEPCO 평균 조회 실패:", e?.response?.status, e?.message, e?.response?.data);
          setAvgVal(0);
          setErr("KEPCO 평균 조회 실패");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAvg();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [
    // 객체 전체가 아니라 “필드”만 추적 → 리렌더시 불필요 호출 방지
    active,            // ← 추가
    kepcoValue,
    filters.metroCd,
    filters.cityCd,
    filters.bizCd,
    targetYM?.year,
    targetYM?.month,
  ]);

  // 차트 렌더링
  useEffect(() => {
    const prevRoot = am5.registry.rootElements.find((r) => r.dom && r.dom.id === chartId);
    if (prevRoot) prevRoot.dispose();

    const root = am5.Root.new(chartId);
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
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

    if (loading || err) {
      root.container.children.push(
        am5.Label.new(root, {
          text: loading ? "로딩 중..." : err,
          fontSize: 14,
          centerX: am5.p50,
          centerY: am5.p50,
          x: am5.p50,
          y: am5.p50,
          background: am5.RoundedRectangle.new(root, {
            cornerRadiusTL: 8,
            cornerRadiusTR: 8,
            cornerRadiusBL: 8,
            cornerRadiusBR: 8,
            fillOpacity: 0.05,
          }),
          paddingTop: 8,
          paddingBottom: 8,
          paddingLeft: 12,
          paddingRight: 12,
        })
      );
    }

    const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
    cursor.lineY.set("visible", false);

    const xRenderer = am5xy.AxisRendererX.new(root, {
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

    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        maxDeviation: 0.3,
        categoryField: "month",
        renderer: xRenderer,
        tooltip: am5.Tooltip.new(root, {}),
      })
    );

    const yRenderer = am5xy.AxisRendererY.new(root, { strokeOpacity: 0.1 });
    const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { maxDeviation: 0.3, renderer: yRenderer }));

    // ===== 공통 y축 범위 동기화 (전역 공유) =====
    const calcDomain = (vals) => {
      if (!vals.length) return null;
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const range = Math.max(1, max - min);
      const pad = Math.max(200, Math.round(range * 0.08));
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

    const series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: "평균전력량",
        xAxis,
        yAxis,
        valueYField: "value",
        sequencedInterpolation: true,
        categoryXField: "month",
        tooltip: am5.Tooltip.new(root, { labelText: "{valueY} kWh" }),
      })
    );

    series.columns.template.setAll({ cornerRadiusTL: 5, cornerRadiusTR: 5, strokeOpacity: 0, width: am5.percent(55)});
    series.columns.template.adapters.add("fill", (fill, target) => chart.get("colors").getIndex(series.columns.indexOf(target)));
    series.columns.template.adapters.add("stroke", (stroke, target) => chart.get("colors").getIndex(series.columns.indexOf(target)));

    const prevItem = Array.isArray(data) && data.length > 0
      ? { month: String(data[0]?.month ?? "전달"), value: Number(data[0]?.value ?? 0) }
      : { month: "전달", value: 0 };

    const avgItem = { month: ymLabel, value: Number(avgVal ?? 0) };

    const chartData = [prevItem, avgItem];

    // 내 데이터(전달값+평균)로 범위 계산 → 전역에 합치고 → 적용
    const vals = chartData.map(d => Number(d.value || 0)).filter(Number.isFinite);
    const local = calcDomain(vals);
    const merged = syncWithGlobal(local);
    applyDomain(merged);

    xAxis.data.setAll(chartData);
    series.data.setAll(chartData);

    series.appear(800);
    chart.appear(800, 80);

    return () => {
      window.removeEventListener?.("powerYDomainUpdated", onGlobal);
      root.dispose();
    };
  }, [data, avgVal, loading, err, ymLabel, chartId]);

  return <div id={chartId} style={{ width: "100%", height: "200px" }} />;
};

export default PowerAVG;
