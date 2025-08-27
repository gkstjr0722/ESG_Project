// 전기요금 계산기

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

// 일반용(갑) I — 단일단가
const J_POWER_RATE_GAP_I = [
  { key:"j_low",       label:"저압전력",     base: 6160, rate:{ summer:132.4, springFall:91.9,  winter:119.0 } },
  { key:"j_a_sel1",    label:"고압A 선택I",  base: 7170, rate:{ summer:142.6, springFall:98.6,  winter:130.3 } },
  { key:"j_a_sel2",    label:"고압A 선택II", base: 8230, rate:{ summer:138.6, springFall:94.3,  winter:125.0 } },
  { key:"j_b_sel1",    label:"고압B 선택I",  base: 7170, rate:{ summer:140.5, springFall:97.5,  winter:127.3 } },
  { key:"j_b_sel2",    label:"고압B 선택II", base: 8230, rate:{ summer:135.2, springFall:92.2,  winter:122.0 } },
];
// 일반용(갑) II — 경/중/최
const J_POWER_RATE_GAP_II = [
  { key:"j_a_sel1", label:"고압A 선택I", base:7170, rates:{ summer:[89.4,140.6,163.1], springFall:[89.4,96.8,108.1], winter:[98.1,128.5,143.3] } },
  { key:"j_a_sel2", label:"고압A 선택II", base:8230, rates:{ summer:[84.1,135.3,157.8], springFall:[84.1,91.5,102.8], winter:[92.8,123.2,138.0] } },
  { key:"j_b_sel1", label:"고압B 선택I", base:7170, rates:{ summer:[88.8,137.4,153.8], springFall:[88.8,94.7,100.1], winter:[97.8,125.1,139.3] } },
  { key:"j_b_sel2", label:"고압B 선택II", base:8230, rates:{ summer:[83.5,132.1,148.5], springFall:[83.5,89.4,94.8], winter:[92.5,119.8,134.0] } },
];
// 일반용(을) — 경/중/최
const J_POWER_RATE_EUL = [
  { key:"j_a_sel1_e", label:"고압A 선택 I",  base:7220, rates:{ summer:[92.8,145.7,227.8], springFall:[92.8,115.3,146.0], winter:[99.8,145.9,203.4] } },
  { key:"j_a_sel2_e", label:"고압A 선택 II", base:8320, rates:{ summer:[87.3,140.2,222.3], springFall:[87.3,109.8,140.5], winter:[94.3,140.4,197.9] } },
  { key:"j_a_sel3_e", label:"고압A 선택 III",base:9810, rates:{ summer:[86.4,139.6,209.9], springFall:[86.4,108.5,132.2], winter:[93.7,139.8,186.7] } },
  { key:"j_b_sel1_e", label:"고압B 선택 I",  base:6630, rates:{ summer:[95.9,148.2,229.4], springFall:[95.9,118.2,148.5], winter:[102.9,148.2,204.4] } },
  { key:"j_b_sel2_e", label:"고압B 선택 II", base:7380, rates:{ summer:[92.1,144.4,225.6], springFall:[92.1,114.4,144.7], winter:[99.1,144.4,200.6] } },
  { key:"j_b_sel3_e", label:"고압B 선택 III",base:8190, rates:{ summer:[90.4,142.7,224.0], springFall:[90.4,112.8,143.1], winter:[97.5,142.7,198.9] } },
];
// --------------------------------------------------------------------------

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

  let ht = raw?.hourly_this_month ?? raw?.detail?.hourly_this_month ?? null;
  if (!ht) {
    const htText = raw?.hourly_this_month_text ?? raw?.detail?.hourly_this_month_text ?? null;
    ht = parseHourTextArray(htText);
  }

  let hn = raw?.hourly_next_month ?? raw?.detail?.hourly_next_month ?? null;
  if (!hn) {
    const hnText = raw?.hourly_next_month_text ?? raw?.detail?.hourly_next_month_text ?? null;
    hn = parseHourTextArray(hnText);
  }

  const off_t = sum(ht, OFF), mid_t = sum(ht, MID), on_t = sum(ht, ON);
  const thisSum = off_t + mid_t + on_t;
  const thisMonth = thisSum > 0
    ? { totalKwh: thisSum, times: [off_t, mid_t, on_t] }
    : { totalKwh: 0 };

  const off_n = sum(hn, OFF), mid_n = sum(hn, MID), on_n = sum(hn, ON);
  const nextSum = off_n + mid_n + on_n;

  let predicted =
    Number.isFinite(nextSum) && nextSum > 0
      ? nextSum
      : Number(raw?.next_month_kwh ?? raw?.predicted_kwh ?? raw?.y ?? 0);

  if (!Number.isFinite(predicted) || predicted <= 0) predicted = 0;

  const nextMonth = {
    totalKwh: predicted,
    ...(nextSum > 0 ? { times: [off_n, mid_n, on_n] } : {}),
  };

  return { thisMonth, nextMonth };
}

async function fetchPredictedUsage(apiUrl, payload) {
  let body = payload;
  if (apiUrl.startsWith('/fast')) {
    const n = Number(payload?.lastMonthKwh ?? payload?.current_month_kwh ?? 0);
    body = { current_month_kwh: n };
  }
  const { data } = await axios.post(apiUrl, body);
  return normalizeToCalculatorShape(data);
}
/* ---- /정규화 & 도우미 ---- */

/* -------------------- 컴포넌트 -------------------- */
export default function PowerBill({
  onCalculationComplete,
  predictApiUrl = '/fast/predict',
}) {

  const [mainType, setMainType] = useState('gap');  // 'gap' | 'eul'
  const [subType,  setSubType]  = useState('I');    // 'I' | 'II'
  const [option,   setOption]   = useState('low');
  const [season]   = useState(getSeason());

  // 산업/일반 토글만 담당
  const [useGeneral, setUseGeneral] = useState(false); // false=산업용, true=일반용

  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const prevMonthIdx    = (currentMonthIdx - 1 + 12) % 12;

  // ✅ 25일 컷오프: 예측 대상/입력 대상 월 라벨
  const isCutoff = now.getDate() >= 25;
  const targetMonthIdx = isCutoff ? (currentMonthIdx + 1) % 12 : currentMonthIdx; // 예측
  const usageMonthIdx  = isCutoff ? currentMonthIdx : prevMonthIdx;               // 입력
  const targetMonthLabel = MONTH_LABELS[targetMonthIdx];
  const usageMonthLabel  = MONTH_LABELS[usageMonthIdx];

  const [contractPower, setContractPower] = useState('');
  const [lastMonthKwh,  setLastMonthKwh]  = useState('');

  const [result,  setResult]  = useState(null);
  const [view,    setView]    = useState('initial');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setResult(null);
    setError('');
    if (mainType === 'gap') { setSubType('I'); setOption(useGeneral ? 'j_low' : 'low'); }
    else { setSubType('II'); setOption(useGeneral ? 'j_a_sel1_e' : 'a_select1_eul'); }
  }, [mainType, useGeneral]);

  useEffect(() => {
    if (mainType === 'gap') setOption(subType === 'I' ? (useGeneral?'j_low':'low') : (useGeneral?'j_a_sel1':'a_select1'));
  }, [subType, mainType, useGeneral]);

  const getRateOptions = () => {
    if (mainType === 'gap') return subType === 'I'
      ? (useGeneral ? J_POWER_RATE_GAP_I : POWER_RATE_GAP_I)
      : (useGeneral ? J_POWER_RATE_GAP_II: POWER_RATE_GAP_II);
    return useGeneral ? J_POWER_RATE_EUL : POWER_RATE_EUL;
  };

  const handleCalc = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!contractPower || Number(contractPower) <= 0) { alert('계약전력을 입력하세요.'); return; }
    if (!lastMonthKwh || Number(lastMonthKwh) <= 0) { alert(`${usageMonthLabel} 전력사용량(kWh)을 입력하세요.`); return; }

    try {
      setLoading(true);

      const payload = {
        mainType, subType, option,
        contractPower: Number(contractPower),
        lastMonthKwh : Number(lastMonthKwh),
      };

      const apiRes = await fetchPredictedUsage(predictApiUrl, payload);
      const tm = apiRes?.thisMonth || {};           // 이번 달 합계(시간대 합에서 계산됨)
      const nm = apiRes?.nextMonth || {};           // 다음 달 예측
      const thisTimes = Array.isArray(tm.times) ? tm.times : null;
      const nextTimes = Array.isArray(nm.times) ? nm.times : null;
      const thisTotal = Number(tm.totalKwh || 0);   // 이번 달 총량
      const nextTotal = Number(nm.totalKwh || 0);   // 다음 달 총량(예측)
      const predictionAvailable = Number.isFinite(nextTotal) && nextTotal > 0;

      let baseCharge = 0;
      let energyCharge = 0;

      if (mainType === 'gap') {
        if (subType === 'I') {
          const table = useGeneral ? J_POWER_RATE_GAP_I : POWER_RATE_GAP_I;
          const selected = table.find(v => v.key === option);
          baseCharge   = floorWon(Number(contractPower) * selected.base);
          energyCharge = floorWon(nextTotal * selected.rate[season]);     // 다음 달 기준
        } else {
          const table = useGeneral ? J_POWER_RATE_GAP_II : POWER_RATE_GAP_II;
          const selected = table.find(v => v.key === option);
          baseCharge = floorWon(Number(contractPower) * selected.base);
          if (nextTimes && nextTimes.length === 3) {
            for (let i = 0; i < 3; i++) {
              energyCharge += floorWon((Number(nextTimes[i]) || 0) * selected.rates[season][i]);
            }
          } else {
            energyCharge = floorWon(nextTotal * selected.rates[season][1]); // 다음 달 기준(중간)
          }
        }
      } else {
        const table = useGeneral ? J_POWER_RATE_EUL : POWER_RATE_EUL;
        const selected = table.find(v => v.key === option);
        baseCharge = floorWon(Number(contractPower) * selected.base);
        if (nextTimes && nextTimes.length === 3) {
          for (let i = 0; i < 3; i++) {
            energyCharge += floorWon((Number(nextTimes[i]) || 0) * selected.rates[season][i]);
          }
        } else {
          // 🔧 버그 픽스: predictedTotal → nextTotal
          energyCharge = floorWon(nextTotal * selected.rates[season][1]);
        }
      }

      let electricityTotal = baseCharge + energyCharge;
      const vat  = roundWon(electricityTotal * 0.1);
      const fund = floorTenWon(electricityTotal * 0.027);
      const finalAmount = floorTenWon(electricityTotal + vat + fund);

      setResult(predictionAvailable ? finalAmount : null);
      setView('result');

      onCalculationComplete?.({
        lastMonth: Number(lastMonthKwh),      // 전달/사용월 실사용량(입력)
        thisMonth: thisTotal,                 // 이번 달(시간대 합)
        nextMonthKwh: nextTotal,              // 다음 달 예측 총량
        hourlyThisMonth: thisTimes ?? undefined,
        hourlyNextMonth: nextTimes ?? undefined,
        fromApi: predictionAvailable,
      });

    } catch (err) {
      setError(err?.response?.data?.message || err.message || '예측 중 오류가 발생했습니다.');
      setResult(null);
      setView('result');
      onCalculationComplete?.({ lastMonth: Number(lastMonthKwh) || 0, thisMonth: null, fromApi: false });
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
            {/* ✅ 25일 컷오프 적용 */}
            <p>{targetMonthLabel} 전기요금을 미리 계산해 보세요.</p>
            <button className="main" onClick={() => setView('calculator')}>계산기 열기</button>
          </div>
        )}

        {view === 'calculator' && (
          <>
            <h2>전기요금 계산기</h2>
            <form onSubmit={handleCalc}>
              <div className="row">
                <label>용도:&nbsp;</label>
                <label><input type="radio" checked={!useGeneral} onChange={()=>setUseGeneral(false)} /> 산업용</label>
                <label><input type="radio" checked={useGeneral} onChange={()=>setUseGeneral(true)} /> 일반용</label>
              </div>

              <div className="row">
                <label>요금종별:&nbsp;</label>
                <label><input type="radio" checked={mainType==='gap'} onChange={()=>setMainType('gap')} /> 갑</label>
                <label><input type="radio" checked={mainType==='eul'} onChange={()=>setMainType('eul')} /> 을</label>
              </div>

              {mainType === 'gap' && (
                <div className="row">
                  <label>선택:&nbsp;</label>
                  <label><input type="radio" checked={subType==='I'} onChange={()=>setSubType('I')} /> 선택(I)</label>
                  <label><input type="radio" checked={subType==='II'} onChange={()=>setSubType('II')} /> 선택(II)</label>
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
                {/* ✅ 25일 컷오프 적용 */}
                <label>{usageMonthLabel} 전력 사용량 (kWh):&nbsp;</label>
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
