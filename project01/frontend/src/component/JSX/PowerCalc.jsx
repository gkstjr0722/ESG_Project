import React, { useState } from 'react';
import '../CSS/PowerCalc.css'; // 스타일 따로 관리 추천

const INDUSTRY_TYPES = [
  { key: 'a_high', label: '산업용(을) (고압A)', rate: 120 },   // kWh당 120원 예시
  { key: 'b_high', label: '산업용(을) (고압B)', rate: 110 },   // kWh당 110원 예시
  { key: 'low',    label: '산업용(갑) (저압)',  rate: 135 },   // kWh당 135원 예시
];

const PowerCalc = () => {
  const [usage, setUsage] = useState('');
  const [selectedType, setSelectedType] = useState(INDUSTRY_TYPES[0].key);
  const [fee, setFee] = useState(null);

  // 실제 계산
  const handleCalc = (e) => {
    e.preventDefault();
    if (!usage || isNaN(usage) || Number(usage) <= 0) {
      alert("전력 사용량을 올바르게 입력하세요.");
      return;
    }
    const typeObj = INDUSTRY_TYPES.find(t => t.key === selectedType);
    if (!typeObj) return;
    // 실제는 기본요금, 연료비조정, 기후환경요금 등 더 복잡!
    const result = Number(usage) * typeObj.rate;
    setFee(result);
  };

  return (
    <div className="power-calc-bg">
      <div className="power-calc-box">
        <h2>산업용 전력요금 계산기</h2>
        <form onSubmit={handleCalc}>
          <div>
            <label>전력 사용량 (kWh): </label>
            <input
              type="number"
              min="0"
              value={usage}
              onChange={e => setUsage(e.target.value)}
              required
            />
            <span> kWh</span>
          </div>
          <div style={{ margin: '18px 0' }}>
            <label>계약종별: </label>
            {INDUSTRY_TYPES.map(type => (
              <label key={type.key} style={{ marginRight: 16 }}>
                <input
                  type="radio"
                  name="type"
                  value={type.key}
                  checked={selectedType === type.key}
                  onChange={e => setSelectedType(e.target.value)}
                />
                {type.label}
              </label>
            ))}
          </div>
          <button className="main-btn" type="submit">
            요금 계산하기
          </button>
        </form>
        {fee !== null &&
          <div className="power-calc-result">
            <b>예상 요금:</b> {fee.toLocaleString()} 원
          </div>
        }
      </div>
    </div>
  );
};

export default PowerCalc;
