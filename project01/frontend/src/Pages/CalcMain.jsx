// 전력사용현황 메인 페이지 (최종본, fixed)

import React, { useState } from 'react';
import '../CSS/Sub.css';
import MonthUsed from '../component/MonthUsed';
import PowerAVG from '../component/PowerAVG';
import PowerBill from '../component/PowerBill';
import Carbon from '../component/Carbon';
import Header from '../component/Header';
import { saveForecast } from '../Pages/Service/forecastApi';

const MONTH_LABELS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

const initialMonthlyUsageData = MONTH_LABELS.map(month => ({ month, value: 0 }));
const initialAvgUsageData     = MONTH_LABELS.map(month => ({ month, value: 0 }));

// 공용 유틸 (모듈 상단에 1회만 정의)
const toNum = (v, fallback = null) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const sumValues = (objOrArr) => {
  if (!objOrArr) return null;
  if (Array.isArray(objOrArr)) return objOrArr.reduce((a, v) => a + (Number(v) || 0), 0);
  if (typeof objOrArr === 'object') return Object.values(objOrArr).reduce((a, v) => a + (Number(v) || 0), 0);
  return null;
};

// ✅ DOM에서 라디오(산업용/일반용) 값 읽기 — PowerBill 없이도 동작
function readCompanyTypeFromDOM() {
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
  const anyChecked = document.querySelector('input[type="radio"]:checked');
  if (anyChecked) {
    const txt = (anyChecked.closest('label')?.textContent || '').trim();
    if (txt.includes('산업')) return '산업용';
    if (txt.includes('일반')) return '일반용';
  }
  return null;
}

export default function CalcMain() {
  const [monthlyUsageData, setMonthlyUsageData] = useState(initialMonthlyUsageData);
  const [avgUsageData, setAvgUsageData]         = useState(initialAvgUsageData);
  const [avgActive, setAvgActive]               = useState(false);

  const now = new Date();
  const currentMonthIdx = now.getMonth();                    // 0~11
  const prevMonthIdx    = (currentMonthIdx - 1 + 12) % 12;   // 전달
  const nextMonthIdx    = (currentMonthIdx + 1) % 12;        // 다음달

  const handleCalculationComplete = async (payload = {}) => {
    setAvgActive(true);

    // 전달/이번달/다음달 값 계산
    const left   = toNum(payload.lastMonth);     // 전달 실사용량(사용자 입력)
    const thisM  = toNum(payload.thisMonth);     // 이번달(있으면)

    // (선택) 시간대 합계로 보정
    const hourlyThis  = payload.hourlyThisMonth  ?? payload.hourly_this_month  ?? null;
    const hourlyNext  = payload.hourlyNextMonth  ?? payload.hourly_next_month  ?? null;
    const sumHourlyThis = sumValues(hourlyThis);
    const sumHourlyNext = sumValues(hourlyNext);

    const thisM_eff = thisM ?? (sumHourlyThis ?? null);

    // 다음달: nextMonthKwh → next_month_kwh → hourly_next_month 합계
    let nextM = toNum(
      payload.nextMonthKwh ?? payload.next_month_kwh ?? sumHourlyNext,
      null
    );
    if (nextM == null && payload.useThisAsNext === true) {
      nextM = thisM_eff;
    }

    console.log(
      '[CalcMain] onCalculationComplete ->',
      'last=', left,
      'this=', thisM_eff,
      'next=', nextM,
      'fromApi=', Boolean(payload.fromApi)
    );

    // 그래프 데이터 반영: 전달/이번달/다음달
    setMonthlyUsageData(prev => {
      const nextArr = [...prev];
      if (left       !== null) nextArr[prevMonthIdx]    = { ...nextArr[prevMonthIdx],    value: left };
      if (thisM_eff  !== null) nextArr[currentMonthIdx] = { ...nextArr[currentMonthIdx], value: thisM_eff };
      if (nextM      !== null) nextArr[nextMonthIdx]    = { ...nextArr[nextMonthIdx],    value: nextM };
      return nextArr;
    });

    setAvgUsageData(prev => {
      const nextArr = [...prev];
      if (left       !== null) nextArr[prevMonthIdx]    = { ...nextArr[prevMonthIdx],    value: left };
      if (thisM_eff  !== null) nextArr[currentMonthIdx] = { ...nextArr[currentMonthIdx], value: thisM_eff };
      if (nextM      !== null) nextArr[nextMonthIdx]    = { ...nextArr[nextMonthIdx],    value: nextM };
      return nextArr;
    });

    // DB 저장 호출 — 부족한 필드 보정(임시 기본값)
    const companyId       = payload.companyId ?? 'A001';
    const contractKw      = toNum(payload.contractKw, 20);
    const currentMonthKwh = toNum(payload.currentMonthKwh, thisM_eff ?? left ?? 0);
    const nextMonthKwh    = toNum(nextM, null);

    const domType   = readCompanyTypeFromDOM();
    const companyType = payload.companyType ?? payload.useType ?? domType ?? '산업용';

    console.log('[CalcMain] save payload =', {
      companyId, contractKw, currentMonthKwh, nextMonthKwh,
      baseMonth: payload.baseMonth, companyType
    });

    try {
      const resp = await saveForecast({
        companyId,
        contractKw,
        currentMonthKwh,
        nextMonthKwh,
        baseMonth: payload.baseMonth,
        companyType,
        hourlyThisMonth: hourlyThis ?? undefined, // (옵션) 원자료 보관
        hourlyNextMonth: hourlyNext ?? undefined, // (옵션) 원자료 보관
      });
      console.log('[CalcMain] saved to DB:', resp);
    } catch (e) {
      console.error('[CalcMain] saveForecast error:', e);
    }
  };

  // ✅ 한달 예측 사용량: "이번달 vs 다음달(예측)"
  const viewDataMonthly = [
    monthlyUsageData[currentMonthIdx],
    monthlyUsageData[nextMonthIdx],
  ];

  // 평균 전력량은 기존 로직 유지(필요 시 바꿔도 됨)
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
