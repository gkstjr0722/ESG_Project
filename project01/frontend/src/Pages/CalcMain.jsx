// 전력사용현황 메인 페이지

import React, { useState } from 'react';
import '../CSS/Sub.css';
import MonthUsed from '../component/MonthUsed';
import PowerAVG from '../component/PowerAVG';
import PowerBill from '../component/PowerBill';
import Carbon from '../component/Carbon';
import Header from '../component/Header';

// 월 레이블
const MONTH_LABELS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

// 연간 데이터 생성
const initialMonthlyUsageData = MONTH_LABELS.map(month => ({ month, value: 0 }));
const initialAvgUsageData = MONTH_LABELS.map(month => ({ month, value: 0 }));

const CalcMain = () => {
  const [monthlyUsageData, setMonthlyUsageData] = useState(initialMonthlyUsageData);
  const [avgUsageData, setAvgUsageData] = useState(initialAvgUsageData);

  // 평균 전력량 API/값 노출 시점 제어
  const [avgActive, setAvgActive] = useState(false);

  // 이번달 index (0~11)
  const now = new Date();
  const currentMonthIdx = now.getMonth();
  // 전달 index (12개월 롤오버)
  const prevMonthIdx = (currentMonthIdx - 1 + 12) % 12;

  // PowerBill에서 계산 완료시 값 반영
  const handleCalculationComplete = (payload) => {
    // 계산 버튼 눌러 콜백이 오면 평균 전력량 활성화
    setAvgActive(true);

    let thisMonth = null;   // ✅ 기본 null → 예측 없으면 현재달 업데이트 안 함
    let lastMonth = null;
    let fromApi = false;

    if (payload && typeof payload === 'object') {
      if (payload.lastMonth !== undefined && payload.lastMonth !== null) {
        lastMonth = Number(payload.lastMonth);
      }
      if (payload.thisMonth !== undefined && payload.thisMonth !== null) {
        thisMonth = Number(payload.thisMonth);
      }
      fromApi = Boolean(payload.fromApi);
    }

    // 1) 월별 사용량 업데이트
    const updatedMonthly = [...monthlyUsageData];

    // 전달 값이 있으면 전달 달 반영
    if (lastMonth !== null) {
      updatedMonthly[prevMonthIdx] = {
        ...updatedMonthly[prevMonthIdx],
        value: lastMonth,
      };
    }

    // 이번달(예측)은 API가 제공했을 때만 반영 (없으면 0 유지)
    if (fromApi && thisMonth !== null && !Number.isNaN(thisMonth)) {
      updatedMonthly[currentMonthIdx] = {
        ...updatedMonthly[currentMonthIdx],
        value: thisMonth,
      };
    }
    setMonthlyUsageData(updatedMonthly);

    // 2) 평균 전력량 업데이트 (전달만 우리 입력값, 현재달은 API 있을 때만)
    const updatedAvg = [...avgUsageData];

    if (lastMonth !== null) {
      updatedAvg[prevMonthIdx] = {
        ...updatedAvg[prevMonthIdx],
        value: lastMonth,
      };
    }
    if (fromApi && thisMonth !== null && !Number.isNaN(thisMonth)) {
      updatedAvg[currentMonthIdx] = {
        ...updatedAvg[currentMonthIdx],
        value: thisMonth,
      };
    }
    setAvgUsageData(updatedAvg);
  };

  // 👉 **전달, 이번달만 보여주기 위한 배열**
  const viewDataMonthly = [
    monthlyUsageData[prevMonthIdx],     // 전달
    monthlyUsageData[currentMonthIdx],  // 이번달(예측) — API 없으면 0
  ];
  const viewDataAvg = [
    avgUsageData[prevMonthIdx],         // 전달
    avgUsageData[currentMonthIdx],      // 이번달(예측) — API 없으면 0
  ];

  return (
    <>
      <Header />
      <div className='grid-wrapper'>
        <div className='grid-2x2'>
          <div className='box'>
            <div>전기요금</div>
            <PowerBill onCalculationComplete={handleCalculationComplete} />
          </div>
          <div className='box'>
            <div>한달 예측 사용량</div>
            <MonthUsed data={viewDataMonthly} />
          </div>
          <div className='box'>
            <div>평균 전력량</div>
            <PowerAVG
              active={avgActive}              // ← 추가: 계산 후에만 값/API 활성
              data={viewDataAvg}
              targetYM={{ year: 2025, month: 5 }}
              labelForAvg="2025년 5월 산업 평균" // 광주광역시 기준 25년 5월이 가장 최근 데이터 
              filters={{ bizCd: 'O' , metroCd: '29'}}    // 광주광역시 : 29 , 서울 metroCd : 11 
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
};

export default CalcMain;
