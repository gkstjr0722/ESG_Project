import React from "react";
import PowerBill from "../component/PowerBill"; // 원본 계산기 컴포넌트

// 이 파일 내부에 API 호출 포함(별도 파일 불필요)
async function predictNext({ current_month_kwh }) {
  const r = await fetch("/fast/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ current_month_kwh: Number(current_month_kwh) }),
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`predict ${r.status} ${r.statusText}: ${text}`);
  }
  const data = await r.json();
  // fast.js가 { predicted_kwh, detail }로 내려주도록 정규화했음
  const predicted =
    typeof data?.predicted_kwh === "number"
      ? data.predicted_kwh
      : (typeof data?.y === "number" ? data.y : null); // 혹시 백엔드가 바뀌었을 때 안전장치
  return { predicted, detail: data?.detail ?? null };
}

/**
 * PowerBill의 onCalculationComplete 콜백을 래핑해서
 * /fast/predict 결과를 thisMonth/fromApi로 주입.
 * CalcMain은 기존 로직 그대로 사용.
 */
export default function Model(props) {
  const { onCalculationComplete, ...rest } = props;

  const handle = async (payload) => {
    const out = { ...(payload || {}) };
    try {
      // 예측 입력 기준: thisMonth > lastMonth > value
      const base = Number(out.thisMonth ?? out.lastMonth ?? out.value);
      if (!Number.isNaN(base)) {
        const { predicted, detail } = await predictNext({ current_month_kwh: base });
        if (typeof predicted === "number") {
          out.thisMonth = predicted; // CalcMain의 "이번달(예측)"로 반영
          out.fromApi = true;
          // 필요하면 시간대 데이터도 함께 전달(향후 그래프 확장용)
          if (detail) out.aiDetail = detail;
        }
      }
    } catch (e) {
      console.warn("AI predict failed:", e?.message || e);
      // 실패 시에도 원래 payload는 그대로 전달하여 다른 API에 영향 X
    }
    onCalculationComplete?.(out);
  };

  return <PowerBill {...rest} onCalculationComplete={handle} />;
}
