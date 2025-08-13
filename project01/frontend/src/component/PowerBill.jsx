// 전기요금 계산기

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// ===== 요금 단가 데이터 ============================================
// 산업용 전력(갑) I
const POWER_RATE_GAP_I = [
  { key: "low", label: "저압", base: 5550, rate: { summer: 116.2, springFall: 94.4, winter: 114.5 } },
  { key: "a_select1", label: "고압A 선택I", base: 6490, rate: { summer: 124.8, springFall: 101.1, winter: 124.7 } },
  { key: "a_select2", label: "고압A 선택II", base: 7470, rate: { summer: 120, springFall: 96.5, winter: 118.2 } },
  { key: "b_gap1", label: "고압B 선택I", base: 6000, rate: { summer: 123.6, springFall: 100.0, winter: 123.2 } },
  { key: "b_gap2", label: "고압B 선택II", base: 6900, rate: { summer: 118.9, springFall: 95.4, winter: 117.1 } }
];

// 산업용 전력(갑) II - 구간별 요금 / 순서대로(경부하, 중간부하, 최대부하)
const POWER_RATE_GAP_II = [
  // 고압A
  { key: "a_select1", label: "고압A 선택I", base: 6490, rates: {
      summer:     [95.7, 121.5, 155.0],
      springFall: [95.7, 100.5, 119.7],
      winter:     [103.1, 120.0, 149.4]
  }},
  { key: "a_select2", label: "고압A 선택II", base: 7470, rates: {
      summer:     [90.8, 116.6, 150.1],
      springFall: [90.8, 95.6, 114.8],
      winter:     [98.2, 115.1, 144.5]
  }},
  // 고압B
  { key: "b_select1", label: "고압B 선택I", base: 6000, rates: {
      summer:     [92.5, 120.1, 153.9],
      springFall: [92.5, 99.1, 117.9],
      winter:     [99.7, 117.7, 146.4]
  }},
  { key: "b_select2", label: "고압B 선택II", base: 6900, rates: {
      summer:     [88.0, 115.6, 149.4],
      springFall: [88.0, 94.6, 113.4],
      winter:     [95.2, 113.2, 141.9]
  }},
];

// 산업용 전력(을) - 구간별 요금 / 순서대로(경부하, 중간부하, 최대부하)
const POWER_RATE_EUL = [
  // ✅ 고압A (추가)
  { key: "a_select1_eul", label: "고압A 선택 I", base: 7220, rates: {
      summer:     [116.4, 169.3, 251.4],
      springFall: [116.4, 138.9, 169.6],
      winter:     [123.4, 169.5, 227.0],
  }},
  { key: "a_select2_eul", label: "고압A 선택 II", base: 8320, rates: {
      summer:     [110.9, 163.8, 245.9],
      springFall: [110.9, 133.4, 164.1],
      winter:     [117.9, 164.0, 221.5],
  }},
  { key: "a_select3_eul", label: "고압A 선택 III", base: 9810, rates: {
      summer:     [110.0, 163.2, 233.5],
      springFall: [110.0, 132.1, 155.8],
      winter:     [117.3, 163.4, 210.3],
  }},
  // 고압B
  { key: "b_select1", label: "고압B 선택 I", base: 6630, rates: {
      summer:     [126.3, 178.6, 259.8],
      springFall: [126.3, 148.6, 178.9],
      winter:     [133.3, 178.6, 234.8],
  }},
  { key: "b_select2", label: "고압B 선택 II", base: 7380, rates: {
      summer:     [122.5, 174.8, 256.0],
      springFall: [122.5, 144.8, 175.1],
      winter:     [129.5, 174.8, 231.0],
  }},
  { key: "b_select3", label: "고압B 선택 III", base: 8190, rates: {
      summer:     [120.8, 173.1, 254.4],
      springFall: [120.8, 143.2, 173.5],
      winter:     [127.9, 173.1, 229.3],
  }},
  // 고압C
  { key: "c_select1", label: "고압C 선택 I", base: 6590, rates: {
      summer:     [125.8, 178.7, 259.6],
      springFall: [125.8, 148.7, 179.1],
      winter:     [132.7, 178.3, 234.9],
  }},
  { key: "c_select2", label: "고압C 선택 II", base: 7520, rates: {
      summer:     [121.1, 174.0, 254.9],
      springFall: [121.1, 144.0, 174.4],
      winter:     [128.0, 173.6, 230.2],
  }},
  { key: "c_select3", label: "고압C 선택 III", base: 8090, rates: {
      summer:     [120.0, 172.9, 253.8],
      springFall: [120.0, 142.9, 173.3],
      winter:     [126.9, 172.5, 229.1],
  }},
];
// ===============================================================

// ===== 계절 계산 ===========================================================
const getCurrentSeason = () => {
  const month = new Date().getMonth() + 1;
  if (month >= 6 && month <= 8) return 'summer';
  if ((month >= 3 && month <= 5) || (month >= 9 && month <= 10)) return 'springFall';
  return 'winter';
};
// ===================================================================

// ===== 반올림/절사 함수 ======================================
const floorWon = (value) => Math.floor(value);
const roundWon = (value) => Math.round(value);
const floorTenWon = (value) => Math.floor(value / 10) * 10;
// =======================================================

/** === API 연결 시켜야 함!!! ================== */
async function fetchPredictedUsage(apiUrl, payload) {
  const { data } = await axios.post(apiUrl, payload);
  return data;
}
// ===========================================

// =====  메인 컴포넌트  =========================
export default function PowerBill({ onCalculationComplete, predictApiUrl = '/api/predict-usage' }) {
  const [mainType, setMainType] = useState('gap');
  const [subType, setSubType] = useState('I');
  const [option, setOption] = useState('low');
  const [season] = useState(getCurrentSeason());

  // 전달/현재달 라벨 (문구만 동적 표기)
  const MONTH_LABELS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const prevMonthIdx = (currentMonthIdx - 1 + 12) % 12;
  const currentMonthLabel = MONTH_LABELS[currentMonthIdx];
  const prevMonthLabel = MONTH_LABELS[prevMonthIdx];

  const [contractPower, setContractPower] = useState('');
  const [lastMonthKwh, setLastMonthKwh] = useState('');

  const [result, setResult] = useState(null);
  const [view, setView] = useState('initial');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setResult(null);
    setError('');
    if (mainType === 'gap') {
      setSubType('I');
      setOption('low');
    } else {
      setSubType('II');
      setOption('b_select1');
    }
  }, [mainType]);

  useEffect(() => {
    if (mainType === 'gap') {
      setOption(subType === 'I' ? 'low' : 'a_select1');
    }
  }, [subType]);

  const handleCalc = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!contractPower || Number(contractPower) <= 0) {
      alert("계약전력을 입력하세요.");
      return;
    }
    if (!lastMonthKwh || Number(lastMonthKwh) <= 0) {
      alert(`${prevMonthLabel} 전력사용량(kWh)을 입력하세요.`);
      return;
    }

    try{
      setLoading(true);

      const payload = {
        mainType, subType, option,
        contractPower: Number(contractPower),
        lastMonthKwh: Number(lastMonthKwh)
      };
      const apiRes = await fetchPredictedUsage(predictApiUrl, payload);

      const thisMonth = apiRes?.thisMonth || {};
      const times = Array.isArray(thisMonth.times) ? thisMonth.times : null;
      const totalUsageKwhFromApi = Number(thisMonth.totalKwh || 0);

      let baseCharge = 0;
      let energyCharge = 0;
      let selectedOption;
      let totalUsageKwh = 0;

      // ✅ 예측 유효성 판단
      let predictionAvailable = false;

      if (mainType === 'gap') {
        if (subType === 'I') {
          if (Number.isFinite(totalUsageKwhFromApi) && totalUsageKwhFromApi > 0
              && totalUsageKwhFromApi !== Number(lastMonthKwh)) { // 저번달과 동일하면 예측없음으로 간주
            predictionAvailable = true;
            selectedOption = POWER_RATE_GAP_I.find(v => v.key === option);
            baseCharge = floorWon(Number(contractPower) * selectedOption.base);
            energyCharge = floorWon(totalUsageKwhFromApi * selectedOption.rate[season]);
            totalUsageKwh = totalUsageKwhFromApi;
          }
        } else {
          selectedOption = POWER_RATE_GAP_II.find(v => v.key === option);
          const hasValidTimes = Array.isArray(times) && times.length === 3 && times.some(v => Number(v) > 0);
          const sumTimes = hasValidTimes ? times.reduce((a,b)=>a+Number(b||0),0) : 0;
          if (hasValidTimes && sumTimes !== Number(lastMonthKwh)) {
            predictionAvailable = true;
            baseCharge = floorWon(Number(contractPower) * selectedOption.base);
            for (let i = 0; i < 3; i++) {
              energyCharge += floorWon((Number(times[i]) || 0) * selectedOption.rates[season][i]);
            }
            totalUsageKwh = sumTimes;
          }
        }
      } else {
        selectedOption = POWER_RATE_EUL.find(v => v.key === option);
        const hasValidTimes = Array.isArray(times) && times.length === 3 && times.some(v => Number(v) > 0);
        const sumTimes = hasValidTimes ? times.reduce((a,b)=>a+Number(b||0),0) : 0;
        if (hasValidTimes && sumTimes !== Number(lastMonthKwh)) {
          predictionAvailable = true;
          baseCharge = floorWon(Number(contractPower) * selectedOption.base);
          for (let i = 0; i < 3; i++) {
            energyCharge += floorWon(Number(times[i] || 0) * selectedOption.rates[season][i]);
          }
          totalUsageKwh = sumTimes;
        }
      }

      if (predictionAvailable) {
        let electricityTotal = baseCharge + energyCharge;
        const vat = roundWon(electricityTotal * 0.1);
        const fund = floorTenWon(electricityTotal * 0.027);
        const finalAmount = floorTenWon(electricityTotal + vat + fund);

        setResult(finalAmount);
        setView('result');

        onCalculationComplete && onCalculationComplete({
          thisMonth: totalUsageKwh,
          lastMonth: Number(lastMonthKwh),
          fromApi: true
        });
      } else {
        // ✅ 예측 부재: 결과 화면은 띄우되 '계산 중...'만 표시
        setResult(null);
        setView('result');

        onCalculationComplete && onCalculationComplete({
          thisMonth: null,
          lastMonth: Number(lastMonthKwh),
          fromApi: false
        });
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || '예측 중 오류가 발생했습니다.');
      // ✅ 실패해도 결과 화면 유지 + 금액 비표시
      setResult(null);
      setView('result');

      // ✅ 그래프는 '저번달'만 갱신
      onCalculationComplete && onCalculationComplete({
        thisMonth: null,
        lastMonth: Number(lastMonthKwh),
        fromApi: false
      });
    } finally {
      setLoading(false);
    }
  };

  const getRateOptions = () => {
    if (mainType === 'gap') {
      return subType === 'I' ? POWER_RATE_GAP_I : POWER_RATE_GAP_II;
    }
    return POWER_RATE_EUL;
  }

  return (
    <div className="power-calc-bg">
      <div className="power-calc-box">
        {/* 1. 첫 페이지 */}
        {view === 'initial' && (
          <div className="initial-view">
            <h3>전기요금 계산하기</h3>
            <p>{currentMonthLabel} 전기요금을 미리 계산해 보세요.</p>
            <button className="main" onClick={() => setView('calculator')}>
              계산기 열기
            </button>
          </div>
        )}

        {/* 2. 계산하는 곳 */}
        {view === 'calculator' && (
          <>
            <h2>전기요금 계산기</h2>
            <form onSubmit={handleCalc}>
              <div className="row">
                <label>요금종별:&nbsp;</label>
                <label>
                  <input type="radio" checked={mainType === "gap"} onChange={() => setMainType("gap")} />
                  산업용(갑)
                </label>
                <label>
                  <input type="radio" checked={mainType === "eul"} onChange={() => setMainType("eul")} style={{ marginLeft: 12 }} />
                  산업용(을)
                </label>
              </div>
              {mainType === 'gap' && (
                <div className="row">
                  <label>선택:&nbsp;</label>
                  <label>
                    <input type="radio" checked={subType === "I"} onChange={() => setSubType("I")} />
                    선택(I)
                  </label>
                  <label>
                    <input type="radio" checked={subType === "II"} onChange={() => setSubType("II")} style={{ marginLeft: 12 }} />
                    선택(II)
                  </label>
                </div>
              )}
              <div className="row">
                <label>옵션:&nbsp;</label>
                <select value={option} onChange={e => setOption(e.target.value)}>
                  {getRateOptions().map(opt =>
                    <option value={opt.key} key={opt.key}>{opt.label}</option>
                  )}
                </select>
              </div>

              {/* 전달 사용량만 입력 (라벨만 전달월로 동적 표기) */}
              <div className="row">
                <label>계약전력 (kW):&nbsp;</label>
                <input type="number" min="0" value={contractPower} onChange={e => setContractPower(e.target.value)} required />
              </div>
              <div className="row">
                <label>{prevMonthLabel} 전력 사용량 (kWh):&nbsp;</label>
                <input type="number" min="0" value={lastMonthKwh} onChange={e => setLastMonthKwh(e.target.value)} required />
              </div>

              {error && <div className='error'>{error}</div>}

              <button className="main" type="submit">{loading ? '예측중...' : '요금 계산하기'}</button>
            </form>
          </>
        )}

        {/* 전기요금 결과 */}
        {view === 'result' && (
          <div className="power-calc-result">
            <h3>예상 전기요금</h3>
            <p className='result-amount'>
              {result !== null ? result.toLocaleString() : '계산 중...'}
              <span className='unit'>원</span>
            </p>
            <button className="main" onClick={() => setView('calculator')}>다시 계산하기</button>
          </div>
        )}
      </div>
    </div>
  );
}
