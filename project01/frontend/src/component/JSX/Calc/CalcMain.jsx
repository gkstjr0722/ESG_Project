import React from 'react'
import ElectricityUsageForecast from './ElectricityUsageForecast'
import PowerCalc from './CurrentBill'
import MonthlyUsageForecast from './MonthlyUsageForecast'
import AveragePower from './AveragePower'
import CarbonUsageStatus from './CarbonUsageStatus'

// 그냥 구분용 디자인
import '../../CSS/Calc.css';
import CurrentBill from './CurrentBill'

const CalcMain = () => {
  return (
    <>
        <h2>전력메인페이지</h2>

        {/* 내일 예측 사용량 */}
        <ElectricityUsageForecast/>
        <br /><br />

        {/* 한달 예측 사용량 */}
        <MonthlyUsageForecast/>
        <br /><br />

        {/* 평균 전력량 */}
        <AveragePower/>
        <br /><br />

        {/* 이번달 전기요금 */}
        <CurrentBill/>
        <br /><br />

        {/* 탄소 사용현황 */}
        <CarbonUsageStatus/>
    </>
  )
}

export default CalcMain