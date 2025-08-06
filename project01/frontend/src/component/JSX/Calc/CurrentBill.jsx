import React, { useState } from 'react';

const POWER_RATE_I = [
  {
    key: "low", label: "저압", base: 5550,
    rate: { summer: 116.2, springFall: 94.4, winter: 114.5 }
  },
  { key: "a_select1", label: "고압A 선택I", base: 6490,
    rate: { summer: 124.8, springFall: 101.1, winter: 124.7 }
  },
  { key: "a_select2", label: "고압A 선택II", base: 7470,
    rate: { summer: 120.0, springFall: 96.5, winter: 120.5 }
  },
  { key: "b_select1", label: "고압B 선택I", base: 6160,
    rate: { summer: 118.0, springFall: 95.4, winter: 117.2 }
  },
  { key: "b_select2", label: "고압B 선택II", base: 7140,
    rate: { summer: 113.0, springFall: 91.0, winter: 112.0 }
  }
];

const POWER_RATE_II = [
  {
    key: "a_select1", label: "고압A 선택I", base: 6490,
    rates: {
      summer: [95.7, 121.5, 155.0],
      springFall: [75.0, 95.7, 119.7],
      winter: [103.1, 130.0, 149.4]
    }
  },
  {
    key: "a_select2", label: "고압A 선택II", base: 7470,
    rates: {
      summer: [90.0, 116.6, 150.0],
      springFall: [70.0, 91.5, 115.0],
      winter: [98.2, 125.8, 144.0]
    }
  },
  {
    key: "b_select1", label: "고압B 선택I", base: 6000,
    rates: {
      summer: [99.7, 120.1, 151.5],
      springFall: [77.5, 93.4, 117.1],
      winter: [105.5, 130.9, 151.2]
    }
  },
  {
    key: "b_select2", label: "고압B 선택II", base: 6980,
    rates: {
      summer: [95.0, 115.0, 149.4],
      springFall: [72.5, 89.0, 111.5],
      winter: [101.0, 126.0, 144.8]
    }
  }
];

const SEASONS = [
  { key: "summer", label: "여름철 (6~8월)" },
  { key: "springFall", label: "봄·가을철 (3~5, 9~10월)" },
  { key: "winter", label: "겨울철 (11~2월)" }
];

export default function CurrentBill() {
  const [type, setType] = useState("I");
  const [option, setOption] = useState("low");
  const [season, setSeason] = useState("summer");
  const [contractPower, setContractPower] = useState("");
  const [usage, setUsage] = useState(""); // 갑I용
  const [usageTimes, setUsageTimes] = useState({ 0: "", 1: "", 2: "" }); // 갑II용
  const [result, setResult] = useState(null);

  // type 바뀔 때 옵션 초기화
  React.useEffect(() => {
    setOption(type === "I" ? "low" : "a_select1");
    setResult(null);
    setUsage(""); setUsageTimes({ 0: "", 1: "", 2: "" });
  }, [type]);

  const handleCalc = (e) => {
    e.preventDefault();
    if (!contractPower || isNaN(contractPower) || Number(contractPower) <= 0) {
      alert("계약전력을 입력하세요."); return;
    }
    if (type === "I") {
      if (!usage || isNaN(usage) || Number(usage) <= 0) {
        alert("전력사용량을 입력하세요."); return;
      }
      const item = POWER_RATE_I.find(v => v.key === option);
      const amount = Number(contractPower) * item.base + Number(usage) * item.rate[season];
      setResult(amount);
    } else {
      const item = POWER_RATE_II.find(v => v.key === option);
      let sum = 0;
      for (let i = 0; i < 3; ++i) {
        const v = usageTimes[i];
        if (!v || isNaN(v) || Number(v) < 0) {
          alert("시간대별 사용량을 입력하세요."); return;
        }
        sum += Number(v) * item.rates[season][i];
      }
      sum += Number(contractPower) * item.base;
      setResult(sum);
    }
  };

  return (
    <div className='box'>
      <div className="power-calc-bg">
        <div className="power-calc-box">
          <h2>산업용(갑) 전력요금 계산기</h2>
          <form onSubmit={handleCalc}>
            <div className="row">
              <label>요금종별:&nbsp;</label>
              <label><input type="radio" name="type" checked={type==="I"} onChange={()=>setType("I")} /> 갑I</label>
              <label><input type="radio" name="type" checked={type==="II"} onChange={()=>setType("II")} style={{marginLeft:12}} /> 갑II</label>
            </div>
            <div className="row" style={{margin:'10px 0'}}>
              <label>옵션:&nbsp;</label>
              <select value={option} onChange={e=>setOption(e.target.value)}>
                {(type === "I" ? POWER_RATE_I : POWER_RATE_II).map(opt=>
                  <option value={opt.key} key={opt.key}>{opt.label}</option>
                )}
              </select>
            </div>
            <div className="row">
              <label>계절:&nbsp;</label>
              <select value={season} onChange={e=>setSeason(e.target.value)}>
                {SEASONS.map(s=>
                  <option value={s.key} key={s.key}>{s.label}</option>
                )}
              </select>
            </div>
            <div className="row">
              <label>계약전력 (kW):&nbsp;</label>
              <input type="number" min="0" value={contractPower} onChange={e=>setContractPower(e.target.value)} required />
            </div>
            {type === "I" ? (
              <div className="row">
                <label>전력 사용량 (kWh):&nbsp;</label>
                <input type="number" min="0" value={usage} onChange={e=>setUsage(e.target.value)} required />
              </div>
            ) : (
              <div style={{margin:'10px 0'}}>
                <label>시간대별 전력 사용량 (kWh):</label>
                <div className="row">경부하&nbsp; <input type="number" min="0" value={usageTimes[0]} onChange={e=>setUsageTimes({...usageTimes,0:e.target.value})} required /></div>
                <div className="row">중간부 <input type="number" min="0" value={usageTimes[1]} onChange={e=>setUsageTimes({...usageTimes,1:e.target.value})} required /></div>
                <div className="row">최대부하 <input type="number" min="0" value={usageTimes[2]} onChange={e=>setUsageTimes({...usageTimes,2:e.target.value})} required /></div>
                <p>시간대 : 경부하(22시~08시), 중간부하(08~16시), 최대부하(16시~22시)
                  <br></br>
                  ※ 제주특별자치도의 시간대별 구분은 모든 계절에 적용
                </p>
              </div>
            )}
            <button className="main" type="submit">요금 계산하기</button>
          </form>
          {result !== null && (
            <div className="power-calc-result">
              <b>예상 요금:</b> {result.toLocaleString()} 원
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
