// 전력사용현황 메인 페이지 (최종본)

import React, { useState } from 'react';
import '../CSS/Sub.css';
import MonthUsed from '../component/MonthUsed';
import PowerAVG from '../component/PowerAVG';
import PowerBill from '../component/PowerBill';   // ✅ component/PowerBill 에서 가져오기
import Carbon from '../component/Carbon';
import Header from '../component/Header';

const MONTH_LABELS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

const initialMonthlyUsageData = MONTH_LABELS.map(month => ({ month, value: 0 }));
const initialAvgUsageData     = MONTH_LABELS.map(month => ({ month, value: 0 }));

export default function CalcMain() {
  const [monthlyUsageData, setMonthlyUsageData] = useState(initialMonthlyUsageData);
  const [avgUsageData, setAvgUsageData]         = useState(initialAvgUsageData);
  const [avgActive, setAvgActive]               = useState(false);

  const now = new Date();
  const currentMonthIdx = now.getMonth();                    // 0~11
  const prevMonthIdx    = (currentMonthIdx - 1 + 12) % 12;   // 전달

// CalcMain.jsx
const handleCalculationComplete = (payload = {}) => {
  setAvgActive(true);

  // 1) 안전하게 숫자화(유효하지 않으면 null)
  const left  = Number.isFinite(Number(payload.lastMonth)) ? Number(payload.lastMonth) : null;   // 왼쪽(전달) = 입력값
  const right = Number.isFinite(Number(payload.thisMonth)) ? Number(payload.thisMonth) : null;   // 오른쪽(이번달) = 예측값

  console.log(
    '[CalcMain] onCalculationComplete -> lastMonth(left)=', left,
    ' thisMonth(right)=', right,
    ' fromApi=', Boolean(payload.fromApi)
  );

  // 2) 월별 사용량 업데이트
  setMonthlyUsageData(prev => {
    const nextArr = [...prev];
    if (left  !== null)  nextArr[prevMonthIdx]    = { ...nextArr[prevMonthIdx],    value: left  }; // 왼쪽
    if (right !== null)  nextArr[currentMonthIdx] = { ...nextArr[currentMonthIdx], value: right }; // 오른쪽
    return nextArr;
  });

  // 3) 평균 전력량 업데이트(동일한 규칙)
  setAvgUsageData(prev => {
    const nextArr = [...prev];
    if (left  !== null)  nextArr[prevMonthIdx]    = { ...nextArr[prevMonthIdx],    value: left  };
    if (right !== null)  nextArr[currentMonthIdx] = { ...nextArr[currentMonthIdx], value: right };
    return nextArr;
  });
};

// 그래프에 넘길 데이터 (그대로 유지)
const viewDataMonthly = [
  monthlyUsageData[prevMonthIdx],     // 왼쪽: 전달(=입력값)
  monthlyUsageData[currentMonthIdx],  // 오른쪽: 이번달(=예측값)
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
              predictApiUrl="/fast/predict"      // 백엔드 프록시
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
