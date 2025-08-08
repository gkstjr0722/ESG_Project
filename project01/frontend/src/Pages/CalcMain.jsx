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

  // 이번달 index (0~11)
  const now = new Date();
  const currentMonthIdx = now.getMonth();
  // 다음달 index (12월 → 1월 롤오버 처리)
  const nextMonthIdx = (currentMonthIdx + 1) % 12;

  // PowerBill에서 계산 완료시 이번달만 값 반영
  const handleCalculationComplete = (totalKwh) => {
    // 1. 예측 사용량(이번달)
    const updatedMonthly = [...monthlyUsageData];
    updatedMonthly[currentMonthIdx] = {
      ...updatedMonthly[currentMonthIdx],
      value: totalKwh,
    };
    setMonthlyUsageData(updatedMonthly);

    // 2. 평균 전력량(이번달)
    const updatedAvg = [...avgUsageData];
    updatedAvg[currentMonthIdx] = {
      ...updatedAvg[currentMonthIdx],
      value: totalKwh,
    };
    setAvgUsageData(updatedAvg);
  };

  // 👉 **이번달, 다음달만 보여주기 위한 배열**
  const viewDataMonthly = [
    monthlyUsageData[currentMonthIdx],
    monthlyUsageData[nextMonthIdx]
  ];
  const viewDataAvg = [
    avgUsageData[currentMonthIdx],
    avgUsageData[nextMonthIdx]
  ];

  return (
    <>
      <Header />
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
          <PowerAVG data={viewDataAvg} />
        </div>
        <div className='box'>
          <div>탄소사용현황</div>
          <Carbon data={viewDataMonthly} />
        </div>
      </div>
    </>
  );
};

export default CalcMain;
