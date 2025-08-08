import React from 'react'

// 그냥 구분용 디자인
import '../CSS/Sub.css';
import MonthUsed from '../component/MonthUsed';
import PowerAVG from '../component/PowerAVG';
import PowerBill from '../component/PowerBill';
import Carbon from '../component/Carbon';
import Header from '../component/Header';

const CalcMain = () => {
  return (
    <>
      <Header/>
        <h2>전력메인페이지</h2>
        <div className='grid-2x2'>
          {/* 한달 예측 사용량 */}
          <div className='box'>
          <div>한달 예측 사용량</div>
            <MonthUsed/>
          </div>

          {/* 평균 전력량 */}
          <div className='box'>
            <div>평균 전력량</div>
            <PowerAVG/>
          </div>

          {/* 이번달 전기요금 */}
          <div className='box'>
            <div>전기요금</div>
            <PowerBill/> 
          </div>

          {/* 탄소 사용현황 */}
          <div className='box'>
            <div>탄소사용현황</div>
            <Carbon/>
          </div>
        </div>

    </>
  )
}

export default CalcMain