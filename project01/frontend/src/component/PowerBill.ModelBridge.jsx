// PowerBill.ModelBridge.jsx
// 역할: 기존 PowerBill의 onCalculationComplete 콜백을 가로채
//       FastAPI( /fast/predict ) 예측값을 불러와 CalcMain이 기대하는
//       { thisMonth, fromApi } 형태로 주입한다.
// 주의: Model.jsx는 건드리지 않음. 다른 API들에도 영향 없음.

import React from 'react';
import PowerBill from './PowerBill';

/** 내부에 API 호출 유틸을 통합(별도 파일 불필요) */
async function callPredictAPI(current_month_kwh) {
  const r = await fetch('/fast/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ current_month_kwh: Number(current_month_kwh) }),
    // credentials: 'include', // 쿠키 필요하면 주석 해제
  });

  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(`predict ${r.status} ${r.statusText}: ${text}`);
  }

  const data = await r.json();

  // 백엔드 응답 키에 맞춰 자동 매핑: { predicted_kwh } 또는 { y }
  if (typeof data?.predicted_kwh === 'number') return data.predicted_kwh;
  if (typeof data?.y === 'number') return data.y;

  // 필요 시 여기서 추가 키 매핑
  // if (typeof data?.result === 'number') return data.result;

  return null;
}

export default function PowerBillModelBridge(props) {
  const { onCalculationComplete, ...rest } = props;

  // PowerBill이 콜백을 올려줄 때 가로채서 예측 호출 후, 결과를 thisMonth에 꽂아 올려준다.
  const handle = async (payload) => {
    const out = { ...(payload || {}) };

    try {
      // 예측의 입력 기준값: thisMonth > lastMonth > value(내부 계산값)
      const base = Number(out.thisMonth ?? out.lastMonth ?? out.value);
      if (!Number.isNaN(base)) {
        const predicted = await callPredictAPI(base);
        if (predicted !== null) {
          out.thisMonth = predicted; // CalcMain이 이번달 예측으로 사용
          out.fromApi = true;        // CalcMain이 "API 값"으로 인식
        }
      }
    } catch (e) {
      // 실패해도 다른 API/로직을 막지 않도록 조용히 통과
      console.warn('AI predict failed:', e?.message || e);
    }

    onCalculationComplete?.(out);
  };

  // 기존 PowerBill은 그대로 사용, 콜백만 래핑
  return <PowerBill {...rest} onCalculationComplete={handle} />;
}
