// 전력사용현황 - 전력계산

import React, { useState, useEffect } from 'react';


// 산업용 전력(갑) I
const POWER_RATE_GAP_I = [
    { key: "low", label: "저압", base: 5550, rate: { summer: 116.2, springFall: 94.4, winter: 114.5 } },
    { key: "a_select1", label: "고압A 선택I", base: 6490, rate: { summer: 124.8, springFall: 101.1, winter: 124.7 } },
    { key: "a_select2", label: "고압A 선택II", base: 7470, rate: { summer: 120, springFall: 96.5, winter: 118.2 } }
];

// 산업용 전력(갑) II - 구간별 요금 (경부하, 중간부하, 최대부하)
const POWER_RATE_GAP_II = [
    { key: "a_select1", label: "고압A 선택I", base: 6490, rates: {
        summer:   [95.7, 121.5, 155],   // [경부하, 중간부하, 최대부하]
        springFall: [95.7, 100.5, 119.7],
        winter:    [103.1, 120, 149.4]
    }},
    { key: "a_select2", label: "고압A 선택II", base: 7470, rates: {
        summer:   [90.8, 116.6, 150.1],
        springFall: [90.8, 95.6, 114.8],
        winter:    [98.2, 115.1, 144.5]
    }},
];

// 산업용 전력(을) - 구간별 요금 (경부하, 중간부하, 최대부하)
const POWER_RATE_EUL = [
    { key: "b_select1", label: "고압A 선택I", base: 7220, rates: {
        summer:   [116.4, 169.3, 251.4],
        springFall: [116.4, 138.9, 169.6],
        winter:    [123.4, 169.5, 227]
    }},
    { key: "b_select2", label: "고압A 선택II", base: 8320, rates: {
        summer:   [110.9, 163.8, 245.9],
        springFall: [110.9, 133.4, 164.1],
        winter:    [117.9, 164, 221.5]
    }},
    { key: "b_select3", label: "고압A 선택III", base: 9810, rates: {
        summer:   [110, 163.2, 233.5],
        springFall: [110, 132.1, 155.8],
        winter:    [117.3, 163.4, 210.3]
    }},
];

// 현재 계절 구하기
const getCurrentSeason = () => {
    const month = new Date().getMonth() + 1;
    if (month >= 6 && month <= 8) return 'summer';
    if ((month >= 3 && month <= 5) || (month >= 9 && month <= 10)) return 'springFall';
    return 'winter';
};

// 메인 컴포넌트
export default function PowerBill({ onCalculationComplete }) {
    const [mainType, setMainType] = useState('gap');     // "gap" or "eul"
    const [subType, setSubType] = useState('I');         // "I" or "II" (갑만)
    const [option, setOption] = useState('low');         // 옵션 키 값 (select box)
    const [season] = useState(getCurrentSeason());
    const [contractPower, setContractPower] = useState('');
    const [usage, setUsage] = useState('');              // 전체 사용량 (갑I)
    const [usageTimes, setUsageTimes] = useState({ 0: '', 1: '', 2: '' }); // [경,중,최대] (갑II, 을)
    const [result, setResult] = useState(null);
    const [view, setView] = useState('initial');

    // 타입/옵션 초기화 (라디오 변경시)
    useEffect(() => {
        setResult(null);
        setUsage('');
        setUsageTimes({ 0: '', 1: '', 2: '' });
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

    // 요금 계산
    const handleCalc = (e) => {
        e.preventDefault();
        if (!contractPower || isNaN(contractPower) || Number(contractPower) <= 0) {
            alert("계약전력을 입력하세요."); return;
        }

        let baseAmount = 0;
        let ratesData, selectedOption;
        let totalUsageKwh = 0; // 총 사용량

        if (mainType === 'gap') {
            if (subType === 'I') {
                // ---- (갑)I: 전체 사용량 한 칸
                if (!usage || isNaN(usage) || Number(usage) < 0) { alert("전력사용량을 입력하세요."); return; }
                ratesData = POWER_RATE_GAP_I;
                selectedOption = ratesData.find(v => v.key === option);
                if (!selectedOption) return;
                baseAmount = (Number(contractPower) * selectedOption.base) + (Number(usage) * selectedOption.rate[season]);
                totalUsageKwh = Number(usage);
            } else {
                // ---- (갑)II: 구간별(경,중,최대) 사용량
                ratesData = POWER_RATE_GAP_II;
                selectedOption = ratesData.find(v => v.key === option);
                if (!selectedOption) return;
                const sumUsage = Number(usageTimes[0] || 0) + Number(usageTimes[1] || 0) + Number(usageTimes[2] || 0);
                if (sumUsage <= 0) { alert("시간대별 사용량을 하나 이상 입력하세요."); return; }
                let energyCharge = 0;
                for (let i = 0; i < 3; i++) {
                    energyCharge += (Number(usageTimes[i]) || 0) * selectedOption.rates[season][i];
                }
                baseAmount = (Number(contractPower) * selectedOption.base) + energyCharge;
                totalUsageKwh = sumUsage;
            }
        } else {
            // ---- (을): 구간별(경,중,최대) 사용량
            ratesData = POWER_RATE_EUL;
            selectedOption = ratesData.find(v => v.key === option);
            if (!selectedOption) return;
            const sumUsage = Number(usageTimes[0] || 0) + Number(usageTimes[1] || 0) + Number(usageTimes[2] || 0);
            if (sumUsage <= 0) { alert("시간대별 사용량을 하나 이상 입력하세요."); return; }
            let energyCharge = 0;
            for (let i = 0; i < 3; i++) {
                energyCharge += (Number(usageTimes[i]) || 0) * selectedOption.rates[season][i];
            }
            baseAmount = (Number(contractPower) * selectedOption.base) + energyCharge;
            totalUsageKwh = sumUsage;
        }

        // 기타 부가요금 (전력기금, 부가세)
        const electricityFund = Math.floor(baseAmount * 0.037);
        const vat = Math.floor((baseAmount + electricityFund) * 0.1);
        const finalAmount = baseAmount + electricityFund + vat;

        setResult(finalAmount);
        setView('result');

        // 계산 완료 후, 부모로 사용량 전달 (그래프 표시용)
        onCalculationComplete(totalUsageKwh);
    };

    // 옵션 select용 함수
    const getRateOptions = () => {
        if (mainType === 'gap') {
            return subType === 'I' ? POWER_RATE_GAP_I : POWER_RATE_GAP_II;
        }
        return POWER_RATE_EUL;
    }

    // 렌더링
    return (
        <div className="power-calc-bg">
            <div className="power-calc-box">
                {view === 'initial' && (
                    <div className="initial-view">
                        <h3>이번 달 요금 계산하기</h3>
                        <p>예상 전기요금을 미리 계산해 보세요.</p>
                        <button className="main" onClick={() => setView('calculator')}>
                            계산기 열기
                        </button>
                    </div>
                )}
                {view === 'calculator' && (
                    <>
                        <h2>산업용 전력요금 계산기</h2>
                        <form onSubmit={handleCalc}>
                            <div className="row">
                                <label>요금종별:&nbsp;</label>
                                <label>
                                    <input type="radio" name="mainType" checked={mainType === "gap"} onChange={() => setMainType("gap")} />
                                    산업용(갑)
                                </label>
                                <label>
                                    <input type="radio" name="mainType" checked={mainType === "eul"} onChange={() => setMainType("eul")} style={{ marginLeft: 12 }} />
                                    산업용(을)
                                </label>
                            </div>
                            {mainType === 'gap' && (
                                <div className="row" style={{ margin: '10px 0' }}>
                                    <label>선택:&nbsp;</label>
                                    <label>
                                        <input type="radio" name="subType" checked={subType === "I"} onChange={() => setSubType("I")} />
                                        선택(I)
                                    </label>
                                    <label>
                                        <input type="radio" name="subType" checked={subType === "II"} onChange={() => setSubType("II")} style={{ marginLeft: 12 }} />
                                        선택(II)
                                    </label>
                                </div>
                            )}
                            <div className="row" style={{ margin: '10px 0' }}>
                                <label>옵션:&nbsp;</label>
                                <select value={option} onChange={e => setOption(e.target.value)}>
                                    {getRateOptions().map(opt =>
                                        <option value={opt.key} key={opt.key}>{opt.label}</option>
                                    )}
                                </select>
                            </div>
                            <div className="row">
                                <label>계약전력 (kW):&nbsp;</label>
                                <input type="number" min="0" value={contractPower} onChange={e => setContractPower(e.target.value)} required />
                            </div>
                            {(mainType === 'gap' && subType === 'I') ? (
                                <div className="row">
                                    <label>전력 사용량 (kWh):&nbsp;</label>
                                    <input type="number" min="0" value={usage} onChange={e => setUsage(e.target.value)} required />
                                </div>
                            ) : (
                                <div style={{ margin: '10px 0' }}>
                                    <label>시간대별 전력 사용량 (kWh):</label>
                                    <div className="row">경부하&nbsp; <input type="number" min="0" value={usageTimes[0]} onChange={e => setUsageTimes({ ...usageTimes, 0: e.target.value })} /></div>
                                    <div className="row">중간부하 <input type="number" min="0" value={usageTimes[1]} onChange={e => setUsageTimes({ ...usageTimes, 1: e.target.value })} /></div>
                                    <div className="row">최대부하 <input type="number" min="0" value={usageTimes[2]} onChange={e => setUsageTimes({ ...usageTimes, 2: e.target.value })} /></div>
                                </div>
                            )}
                            <button className="main" type="submit">요금 계산하기</button>
                        </form>
                    </>
                )}
                {view === 'result' && (
                    <div className="power-calc-result">
                        <h3>예상 전기요금</h3>
                        <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '20px 0' }}>
                            {result ? result.toLocaleString() : '계산 중...'}
                            <span style={{ fontSize: '1.2rem', marginLeft: '8px' }}>원</span>
                        </p>
                        <button className="main" onClick={() => setView('calculator')}>다시 계산하기</button>
                    </div>
                )}
            </div>
        </div>
    );
}
