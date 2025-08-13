// PowerBill.jsx — 전기요금 계산기 (완성본)

import React, { useState, useEffect } from 'react';
import axios from 'axios';

/* -------------------- 단가 테이블 -------------------- */
// 산업용(갑) I
const POWER_RATE_GAP_I = [
  { key: "low",      label: "저압",          base: 5550, rate: { summer: 116.2, springFall: 94.4,  winter: 114.5 } },
  { key: "a_select1",label: "고압A 선택I",   base: 6490, rate: { summer: 124.8, springFall: 101.1, winter: 124.7 } },
  { key: "a_select2",label: "고압A 선택II",  base: 7470, rate: { summer: 120.0, springFall: 96.5,  winter: 118.2 } },
  { key: "b_gap1",   label: "고압B 선택I",   base: 6000, rate: { summer: 123.6, springFall: 100.0, winter: 123.2 } },
  { key: "b_gap2",   label: "고압B 선택II",  base: 6900, rate: { summer: 118.9, springFall: 95.4,  winter: 117.1 } },
];

// 산업용(갑) II  [경/중/최]
const POWER_RATE_GAP_II = [
  { key: "a_select1", label: "고압A 선택I",  base: 6490, rates: { summer:[95.7,121.5,155.0], springFall:[95.7,100.5,119.7], winter:[103.1,120.0,149.4] } },
  { key: "a_select2", label: "고압A 선택II", base: 7470, rates: { summer:[90.8,116.6,150.1], springFall:[90.8,95.6,114.8],  winter:[98.2,115.1,144.5] } },
  { key: "b_select1", label: "고압B 선택I",  base: 6000, rates: { summer:[92.5,120.1,153.9], springFall:[92.5,99.1,117.9],  winter:[99.7,117.7,146.4] } },
  { key: "b_select2", label: "고압B 선택II", base: 6900, rates: { summer:[88.0,115.6,149.4], springFall:[88.0,94.6,113.4],  winter:[95.2,113.2,141.9] } },
];

// 산업용(을)  [경/중/최]
const POWER_RATE_EUL = [
  { key:"a_select1_eul", label:"고압A 선택 I",  base: 7220, rates:{ summer:[116.4,169.3,251.4], springFall:[116.4,138.9,169.6], winter:[123.4,169.5,227.0] } },
  { key:"a_select2_eul", label:"고압A 선택 II", base: 8320, rates:{ summer:[110.9,163.8,245.9], springFall:[110.9,133.4,164.1], winter:[117.9,164.0,221.5] } },
  { key:"a_select3_eul", label:"고압A 선택 III",base: 9810, rates:{ summer:[110.0,163.2,233.5], springFall:[110.0,132.1,155.8], winter:[117.3,163.4,210.3] } },
  { key:"b_select1",     label:"고압B 선택 I",  base: 6630, rates:{ summer:[126.3,178.6,259.8], springFall:[126.3,148.6,178.9], winter:[133.3,178.6,234.8] } },
  { key:"b_select2",     label:"고압B 선택 II", base: 7380, rates:{ summer:[122.5,174.8,256.0], springFall:[122.5,144.8,175.1], winter:[129.5,174.8,231.0] } },
  { key:"b_select3",     label:"고압B 선택 III",base: 8190, rates:{ summer:[120.8,173.1,254.4], springFall:[120.8,143.2,173.5], winter:[127.9,173.1,229.3] } },
  { key:"c_select1",     label:"고압C 선택 I",  base: 6590, rates:{ summer:[125.8,178.7,259.6], springFall:[125.8,148.7,179.1], winter:[132.7,178.3,234.9] } },
  { key:"c_select2",     label:"고압C 선택 II", base: 7520, rates:{ summer:[121.1,174.0,254.9], springFall:[121.1,144.0,174.4], winter:[128.0,173.6,230.2] } },
  { key:"c_select3",     label:"고압C 선택 III",base: 8090, rates:{ summer:[120.0,172.9,253.8], springFall:[120.0,142.9,173.3], winter:[126.9,172.5,229.1] } },
];

/* -------------------- 공용 유틸 -------------------- */
const MONTH_LABELS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

const getSeason = () => {
  const m = new Date().getMonth() + 1;
  if (m >= 6 && m <= 8) return 'summer';
  if ((m >= 3 && m <= 5) || (m >= 9 && m <= 10)) return 'springFall';
  return 'winter';
};

const floorWon = v => Math.floor(v);
const roundWon = v => Math.round(v);
const floorTenWon = v => Math.floor(v / 10) * 10;

/* ---- 정규화 & 도우미 (교체본) ---- */
const OFF = ['23','00','01','02','03','04','05','06'];
const MID = ['07','08','09','12','13','14','15','16','17','18','22'];
const ON  = ['10','11','19','20','21'];

const unwrap = raw => (raw && raw.data && typeof raw.data === 'object' ? raw.data : raw);

const sum = (obj, keys) =>
  (obj ? keys.reduce((a,k)=>a + Number(obj[k] ?? obj[String(k)] ?? 0), 0) : 0);

// "['00 : 929.40', ...]" → { "00": 929.40, ... }
function parseHourTextArray(arr) {
  if (!Array.isArray(arr)) return null;
  const map = {};
  for (const line of arr) {
    if (typeof line !== 'string') continue;
    const i = line.indexOf(':');
    if (i < 0) continue;
    const hh = line.slice(0, i).trim().padStart(2,'0');
    const v  = Number(line.slice(i+1).trim());
    if (!Number.isNaN(v)) map[hh] = v;
  }
  return Object.keys(map).length ? map : null;
}

function normalizeToCalculatorShape(raw0) {
  const raw = unwrap(raw0);
  if (raw?.thisMonth || raw?.nextMonth) return raw;

  // 1) 이번달 시계열 (object → text 순)
  let ht = raw?.hourly_this_month ?? raw?.detail?.hourly_this_month ?? null;
  if (!ht) {
    const htText = raw?.hourly_this_month_text ?? raw?.detail?.hourly_this_month_text ?? null;
    ht = parseHourTextArray(htText);
  }

  // 2) 다음달 시계열 (object → text 순)
  let hn = raw?.hourly_next_month ?? raw?.detail?.hourly_next_month ?? null;
  if (!hn) {
    const hnText = raw?.hourly_next_month_text ?? raw?.detail?.hourly_next_month_text ?? null;
    hn = parseHourTextArray(hnText);
  }

  // 3) 이번달 합계/구간
  const off_t = sum(ht, OFF), mid_t = sum(ht, MID), on_t = sum(ht, ON);
  const thisSum = off_t + mid_t + on_t;
  const thisMonth = thisSum > 0
    ? { totalKwh: thisSum, times: [off_t, mid_t, on_t] }
    : { totalKwh: 0 };

   // 4) 다음달 합계/구간
  const off_n = sum(hn, OFF), mid_n = sum(hn, MID), on_n = sum(hn, ON);
  const nextSum = off_n + mid_n + on_n;

  // 💡 규칙: 시간대별(nextSum)이 있으면 그걸 **무조건 1순위**로 사용
  //         없을 때만 predicted_kwh / next_month_kwh / y를 사용
  let predicted =
    Number.isFinite(nextSum) && nextSum > 0
      ? nextSum
      : Number(raw?.next_month_kwh ?? raw?.predicted_kwh ?? raw?.y ?? 0);

  if (!Number.isFinite(predicted) || predicted <= 0) predicted = 0;

  const nextMonth = {
    totalKwh: predicted,
    ...(nextSum > 0 ? { times: [off_n, mid_n, on_n] } : {}),
  };

  // 디버깅 로그(일단 남겨두면 원인 파악 쉬움)
  console.log('[normalize] thisSum=', thisSum, ' nextSum=', nextSum,
              ' chosen next total=', nextMonth.totalKwh);

  return { thisMonth, nextMonth };
}

async function fetchPredictedUsage(apiUrl, payload) {
  let body = payload;
  if (apiUrl.startsWith('/fast')) {
    const n = Number(payload?.lastMonthKwh ?? payload?.current_month_kwh ?? 0);
    body = { current_month_kwh: n };
  }
  const { data } = await axios.post(apiUrl, body);
  const normalized = normalizeToCalculatorShape(data);
  console.log('[API raw]', data);
  console.log('[API normalized]', normalized);
  return normalized;
}
/* ---- /정규화 & 도우미 ---- */

/* -------------------- 컴포넌트 -------------------- */
export default function PowerBill({
  onCalculationComplete,
  predictApiUrl = '/fast/predict',
}) {
  // 상태들
  const [mainType, setMainType] = useState('gap');  // 'gap' | 'eul'
  const [subType,  setSubType]  = useState('I');    // 'I' | 'II' (갑일 때)
  const [option,   setOption]   = useState('low');  // 단가 옵션 키
  const [season]   = useState(getSeason());

  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const prevMonthIdx    = (currentMonthIdx - 1 + 12) % 12;
  const currentMonthLabel = MONTH_LABELS[currentMonthIdx];
  const prevMonthLabel    = MONTH_LABELS[prevMonthIdx];

  const [contractPower, setContractPower] = useState('');
  const [lastMonthKwh,  setLastMonthKwh]  = useState('');

  const [result,  setResult]  = useState(null);
  const [view,    setView]    = useState('initial');  // 'initial' | 'calculator' | 'result'
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  // UI 제약
  useEffect(() => {
    setResult(null);
    setError('');
    if (mainType === 'gap') { setSubType('I'); setOption('low'); }
    else { setSubType('II'); setOption('b_select1'); }
  }, [mainType]);

  useEffect(() => {
    if (mainType === 'gap') setOption(subType === 'I' ? 'low' : 'a_select1');
  }, [subType, mainType]);

  const getRateOptions = () => {
    if (mainType === 'gap') return subType === 'I' ? POWER_RATE_GAP_I : POWER_RATE_GAP_II;
    return POWER_RATE_EUL;
  };

  // 핵심: 계산 + 예측 호출
  const handleCalc = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!contractPower || Number(contractPower) <= 0) {
      alert('계약전력을 입력하세요.');
      return;
    }
    if (!lastMonthKwh || Number(lastMonthKwh) <= 0) {
      alert(`${prevMonthLabel} 전력사용량(kWh)을 입력하세요.`);
      return;
    }

    try {
      setLoading(true);

      const payload = {
        mainType, subType, option,
        contractPower: Number(contractPower),
        lastMonthKwh : Number(lastMonthKwh),
      };

    // 1) 예측 호출 (정규화: { thisMonth, nextMonth })
    const apiRes = await fetchPredictedUsage(predictApiUrl, payload);
    const tm = apiRes?.thisMonth || {};
    const nm = apiRes?.nextMonth || {}; 

    // 2) 다음달 예측 총량과 구간치
    const times = Array.isArray(nm.times) ? nm.times : null;   // ✅ 누락 보완
    const predictedTotal = Number(nm.totalKwh || 0);
    const predictionAvailable = Number.isFinite(predictedTotal) && predictedTotal > 0;

    // 3) 요금 계산 (예측값 기준) — (아래 로직은 그대로 OK)
    let baseCharge = 0;
    let energyCharge = 0;
    let selectedOption;


      if (mainType === 'gap') {
        if (subType === 'I') {
          selectedOption = POWER_RATE_GAP_I.find(v => v.key === option);
          baseCharge  = floorWon(Number(contractPower) * selectedOption.base);
          energyCharge = floorWon(predictedTotal * selectedOption.rate[season]);
        } else {
          selectedOption = POWER_RATE_GAP_II.find(v => v.key === option);
          baseCharge  = floorWon(Number(contractPower) * selectedOption.base);
          if (times && times.length === 3) {
            for (let i = 0; i < 3; i++) {
              energyCharge += floorWon((Number(times[i]) || 0) * selectedOption.rates[season][i]);
            }
          } else {
            // 구간치가 없으면 중간부하 단가로 근사
            const mid = selectedOption.rates[season][1];
            energyCharge = floorWon(predictedTotal * mid);
          }
        }
      } else {
        selectedOption = POWER_RATE_EUL.find(v => v.key === option);
        baseCharge = floorWon(Number(contractPower) * selectedOption.base);
        if (times && times.length === 3) {
          for (let i = 0; i < 3; i++) {
            energyCharge += floorWon((Number(times[i]) || 0) * selectedOption.rates[season][i]);
          }
        } else {
          const mid = selectedOption.rates[season][1];
          energyCharge = floorWon(predictedTotal * mid);
        }
      }

      let electricityTotal = baseCharge + energyCharge;
      const vat  = roundWon(electricityTotal * 0.1);
      const fund = floorTenWon(electricityTotal * 0.027);
      const finalAmount = floorTenWon(electricityTotal + vat + fund);

      // 4) 결과 반영
      setResult(predictionAvailable ? finalAmount : null);
      setView('result');

      console.log('[PowerBill] input(lastMonthKwh)=', Number(lastMonthKwh),
                  ' predicted(nm.totalKwh)=', predictedTotal,
                  ' fromApi=', predictionAvailable);

onCalculationComplete?.({
  lastMonth: Number(lastMonthKwh),       // 왼쪽 = 입력값
  thisMonth: Number(nm.totalKwh || 0),   // 오른쪽 = 예측값
  fromApi: predictionAvailable,
});

    } catch (err) {
      setError(err?.response?.data?.message || err.message || '예측 중 오류가 발생했습니다.');
      setResult(null);
      setView('result');

      // 실패 시: 왼쪽만 입력값으로 반영
      onCalculationComplete?.({
        lastMonth: Number.isFinite(Number(lastMonthKwh)) ? Number(lastMonthKwh) : 0,
        thisMonth: null,
        fromApi: false,
      });
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- UI -------------------- */
  return (
    <div className="power-calc-bg">
      <div className="power-calc-box">
        {view === 'initial' && (
          <div className="initial-view">
            <h3>전기요금 계산하기</h3>
            <p>{currentMonthLabel} 전기요금을 미리 계산해 보세요.</p>
            <button className="main" onClick={() => setView('calculator')}>계산기 열기</button>
          </div>
        )}

        {view === 'calculator' && (
          <>
            <h2>전기요금 계산기</h2>
            <form onSubmit={handleCalc}>
              <div className="row">
                <label>요금종별:&nbsp;</label>
                <label><input type="radio" checked={mainType==='gap'} onChange={()=>setMainType('gap')} /> 산업용(갑)</label>
                <label style={{marginLeft:12}}><input type="radio" checked={mainType==='eul'} onChange={()=>setMainType('eul')} /> 산업용(을)</label>
              </div>

              {mainType === 'gap' && (
                <div className="row">
                  <label>선택:&nbsp;</label>
                  <label><input type="radio" checked={subType==='I'} onChange={()=>setSubType('I')} /> 선택(I)</label>
                  <label style={{marginLeft:12}}><input type="radio" checked={subType==='II'} onChange={()=>setSubType('II')} /> 선택(II)</label>
                </div>
              )}

              <div className="row">
                <label>옵션:&nbsp;</label>
                <select value={option} onChange={e=>setOption(e.target.value)}>
                  {getRateOptions().map(opt => (
                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="row">
                <label>계약전력 (kW):&nbsp;</label>
                <input type="number" min="0" value={contractPower} onChange={e=>setContractPower(e.target.value)} required />
              </div>

              <div className="row">
                <label>{prevMonthLabel} 전력 사용량 (kWh):&nbsp;</label>
                <input type="number" min="0" value={lastMonthKwh} onChange={e=>setLastMonthKwh(e.target.value)} required />
              </div>

              {error && <div className="error">{error}</div>}
              <button className="main" type="submit">{loading ? '예측중...' : '요금 계산하기'}</button>
            </form>
          </>
        )}

        {view === 'result' && (
          <div className="power-calc-result">
            <h3>예상 전기요금</h3>
            <p className="result-amount">
              {result !== null ? result.toLocaleString() : '계산 중...'}
              <span className="unit">원</span>
            </p>
            <button className="main" onClick={() => setView('calculator')}>다시 계산하기</button>
          </div>
        )}
      </div>
    </div>
  );
}
