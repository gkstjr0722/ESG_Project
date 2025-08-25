// 전력사용현황 메인 페이지 (최종본)

import React, { useState } from 'react';
import '../CSS/Sub.css';
import MonthUsed from '../component/MonthUsed';
import PowerAVG from '../component/PowerAVG';
import PowerBill from '../component/PowerBill';   // ✅ component/PowerBill 에서 가져오기
import Carbon from '../component/Carbon';
import Header from '../component/Header';
import { saveForecast } from '../Pages/Service/forecastApi';

const MONTH_LABELS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

const initialMonthlyUsageData = MONTH_LABELS.map(month => ({ month, value: 0 }));
const initialAvgUsageData     = MONTH_LABELS.map(month => ({ month, value: 0 }));

// ✅ DOM에서 라디오(산업용/일반용) 값 읽기 — PowerBill 없이도 동작
function readCompanyTypeFromDOM() {
  // 자주 쓰는 네이밍 시도
  const sels = [
    'input[name="useType"]:checked',
    'input[name="usageType"]:checked',
    '#useType-industrial:checked',
    '#useType-general:checked',
  ];
  for (const sel of sels) {
    const el = document.querySelector(sel);
    if (el) {
      const raw = (el.value || el.getAttribute('data-value') || el.id || '').toLowerCase();
      if (/(산업|industrial|ind)\b/.test(raw)) return '산업용';
      if (/(일반|general|gen)\b/.test(raw))    return '일반용';
    }
  }
  // 라벨 텍스트로 최후 확인
  const anyChecked = document.querySelector('input[type="radio"]:checked');
  if (anyChecked) {
    const txt = (anyChecked.closest('label')?.textContent || '').trim();
    if (txt.includes('산업')) return '산업용';
    if (txt.includes('일반')) return '일반용';
  }
  return null; // 못 찾으면 null
}

export default function CalcMain() {
  const [monthlyUsageData, setMonthlyUsageData] = useState(initialMonthlyUsageData);
  const [avgUsageData, setAvgUsageData]         = useState(initialAvgUsageData);
  const [avgActive, setAvgActive]               = useState(false);

  const now = new Date();
  const currentMonthIdx = now.getMonth();                    // 0~11
  const prevMonthIdx    = (currentMonthIdx - 1 + 12) % 12;   // 전달

  const handleCalculationComplete = async (payload = {}) => { // ✅ async 유지
    setAvgActive(true);

    const left  = Number.isFinite(Number(payload.lastMonth)) ? Number(payload.lastMonth) : null;
    const right = Number.isFinite(Number(payload.thisMonth)) ? Number(payload.thisMonth) : null;

    console.log(
      '[CalcMain] onCalculationComplete -> lastMonth(left)=', left,
      ' thisMonth(right)=', right,
      ' fromApi=', Boolean(payload.fromApi)
    );

    setMonthlyUsageData(prev => {
      const nextArr = [...prev];
      if (left  !== null)  nextArr[prevMonthIdx]    = { ...nextArr[prevMonthIdx],    value: left  };
      if (right !== null)  nextArr[currentMonthIdx] = { ...nextArr[currentMonthIdx], value: right };
      return nextArr;
    });

    setAvgUsageData(prev => {
      const nextArr = [...prev];
      if (left  !== null)  nextArr[prevMonthIdx]    = { ...nextArr[prevMonthIdx],    value: left  };
      if (right !== null)  nextArr[currentMonthIdx] = { ...nextArr[currentMonthIdx], value: right };
      return nextArr;
    });

    // 4) DB 저장 호출 — 부족한 필드 보정(임시 기본값)
    const companyId       = payload.companyId ?? 'A001';
    const contractKw      = Number.isFinite(Number(payload.contractKw))
                            ? Number(payload.contractKw) : 20;
    const currentMonthKwh = Number.isFinite(Number(payload.currentMonthKwh))
                            ? Number(payload.currentMonthKwh)
                            : (left ?? 0);

    // ✅ DOM에서 업종 읽기 → payload값이 있으면 우선, 없으면 DOM값, 마지막에 기본값
    const domType   = readCompanyTypeFromDOM();
    const companyType = payload.companyType ?? payload.useType ?? domType ?? '산업용';

    console.log('[CalcMain] save payload =', {
      companyId, contractKw, currentMonthKwh, baseMonth: payload.baseMonth, companyType
    });

    try {
      const resp = await saveForecast({
        companyId,
        contractKw,
        currentMonthKwh,
        baseMonth: payload.baseMonth,
        companyType, // ✅ 백엔드로 전송
      });
      console.log('[CalcMain] saved to DB:', resp);
    } catch (e) {
      console.error('[CalcMain] saveForecast error:', e);
    }
  };

  // 그래프에 넘길 데이터 (그대로 유지)
  const viewDataMonthly = [
    monthlyUsageData[prevMonthIdx],
    monthlyUsageData[currentMonthIdx],
  ];
  const viewDataAvg = [
    avgUsageData[prevMonthIdx],
    avgUsageData[currentMonthIdx],
  ];

  return (
    <>
      <Header />
      <div className='grid-wrapper'>
        <div className='grid-2x2'>
          <div className='box'>
            <div>전기요금</div>
            <PowerBill
              predictApiUrl="/fast/predict"
              onCalculationComplete={handleCalculationComplete}
            />
          </div>

          <div className='box'>
            <div>한달 예측 사용량</div>
            <MonthUsed data={viewDataMonthly} />
          </div>

          <div className='box'>
            <div>평균 전력량</div>
            <PowerAVG
              active={avgActive}
              data={viewDataAvg}
              targetYM={{ year: 2025, month: 5 }}
              labelForAvg="2025년 5월 산업 평균"
              filters={{ bizCd: 'O', metroCd: '29' }}
            />
          </div>

          <div className='box'>
            <div>탄소사용현황</div>
            <Carbon data={viewDataMonthly} />
          </div>
        </div>
      </div>
    </>
  );
}
