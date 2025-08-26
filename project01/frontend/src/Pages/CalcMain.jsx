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

/* ====== 이 블록만 교체 (다른 코드/주석은 절대 수정 X) ====== */
const getChecked = (name) =>
  document.querySelector(`input[name="${name}"]:checked`)?.value ?? null;
const getSelect = (sel) =>
  document.querySelector(sel)?.value ?? null;

// 입력 요소에 연결된 라벨 텍스트를 가장 안전하게 뽑는 헬퍼
function _labelTextFor(input) {
  if (!input) return '';
  // <label for="id">
  if (input.id) {
    const byFor = document.querySelector(`label[for="${input.id}"]`);
    if (byFor?.textContent) return byFor.textContent.trim();
  }
  // 형제 라벨(라디오 옆에 바로 오는 label)
  if (input.nextElementSibling?.tagName === 'LABEL') {
    return (input.nextElementSibling.textContent || '').trim();
  }
  // 부모에 텍스트가 섞여 있는 경우
  const t = (input.parentElement?.textContent || '').trim();
  return t;
}

function readFeePlanOption(payload = {}) {
  // 1) payload 우선
  let feeType    = payload.feeType     ?? payload.fee_type     ?? null; // '갑'|'을'
  let planSet    = payload.planSet     ?? payload.plan_set     ?? null; // 'I'|'II'
  let optionCode = payload.optionCode  ?? payload.option_code  ?? null; // 예: '고압A 선택I' 또는 'b_select1'

  // 2) name이 잘 붙어 있는 경우 (가급적 먼저 시도)
  if (!feeType) {
    feeType =
      getChecked('feeType') ??
      getChecked('fee_type') ??
      getChecked('fee') ??
      getChecked('요금종별');
  }
  if (!planSet) {
    planSet =
      getChecked('planSet') ??
      getChecked('plan_set') ??
      getChecked('plan') ??
      getChecked('선택');
  }

  // 3) 라디오의 라벨 텍스트에서 직접 판별 (name/id가 불명확한 UI 대응)
  if (!feeType || !planSet) {
    const checkedRadios = Array.from(
      document.querySelectorAll('input[type="radio"]:checked')
    );

    for (const r of checkedRadios) {
      const txt = _labelTextFor(r).replace(/\s+/g, '');
      if (!feeType) {
        if (/^갑$|요금종별갑|^A$|gab/i.test(txt)) feeType = '갑';
        else if (/^을$|요금종별을|^B$|eul/i.test(txt)) feeType = '을';
      }
      if (!planSet) {
        if (/선택\(II\)|선택II|Ⅱ|^II$/i.test(txt)) planSet = 'II';
        else if (/선택\(I\)|선택I|Ⅰ|^I$/i.test(txt))  planSet = 'I';
      }
      if (feeType && planSet) break;
    }
  }

  // 4) OPTION_CODE: "전기요금" 박스(첫 번째 .box) 안의 <select>를 우선 탐색
  if (!optionCode) {
    // 전기요금 영역(첫 번째 .box) 안에서 select 찾기
    const billBox = document.querySelector('.grid-2x2 .box:first-child');
    const selInBox = billBox?.querySelector('select');

    // 박스 안에 없으면 문서 전체에서 첫 번째 select (다른 박스엔 일반적으로 없음)
    const anySelect = selInBox || document.querySelector('select');

    if (anySelect) {
      // value가 있으면 value, 없으면 표시 텍스트 사용
      optionCode =
        anySelect.value ||
        anySelect.options?.[anySelect.selectedIndex || 0]?.text ||
        null;
    }
  }

  console.log('[readFeePlanOption] resolved =>', { feeType, planSet, optionCode });
  return { feeType, planSet, optionCode };
}
/* =============================================================== */



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
    const left  = toNum(payload.lastMonth);     // 전달 실사용량(사용자 입력)
    const thisM = toNum(payload.thisMonth);     // 이번달(있으면)

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

    const domType     = readCompanyTypeFromDOM();
    const companyType = payload.companyType ?? payload.useType ?? domType ?? '산업용';

    // ✅ 추가: 요금종별/선택/옵션 읽어오기 (payload → DOM 순)
    const { feeType, planSet, optionCode } = readFeePlanOption(payload);

    console.log('[CalcMain] save payload =', {
      companyId, contractKw, currentMonthKwh, nextMonthKwh,
      baseMonth: payload.baseMonth, companyType, feeType, planSet, optionCode
    });

    try {
      const resp = await saveForecast({
        companyId,
        contractKw,
        currentMonthKwh,
        nextMonthKwh,
        baseMonth: payload.baseMonth,
        companyType,
        // ✅ 추가: 3개 필드 전달 ( feetype,planset,optioncode )
        feeType,
        planSet,
        optionCode,
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
