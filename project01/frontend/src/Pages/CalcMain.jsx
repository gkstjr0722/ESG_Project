import React from 'react'

// 그냥 구분용 디자인
// import '../CSS/Calc.css';
import '../CSS/Sub.css';
import ElecUsed from '../component/ElecUsed';
import MonthUsed from '../component/MonthUsed';
import PowerAVG from '../component/PowerAVG';
import PowerBill from '../component/PowerBill';
import Carbon from '../component/Carbon';

const CalcMain = () => {
  return (
    <>
        <h2>전력메인페이지</h2>

        {/* 내일 예측 사용량 */}
        <ElecUsed/>
        <br /><br />

        {/* 한달 예측 사용량 */}
        <MonthUsed/>
        <br /><br />

        {/* 평균 전력량 */}
        <PowerAVG/>
        <br /><br />

        {/* 이번달 전기요금 */}
        <PowerBill/>
        <br /><br />

        {/* 탄소 사용현황 */}
        <Carbon/>
    </>
  )
}

export default CalcMain