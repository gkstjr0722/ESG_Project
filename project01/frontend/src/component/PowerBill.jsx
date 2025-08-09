// 전력사용현황 - 전력계산

import React, { useState, useEffect } from 'react';






// ===== 요금 단가 데이터 ============================================
// 산업용 전력(갑) I
const POWER_RATE_GAP_I = [
    { key: "low", label: "저압", base: 5550, rate: { summer: 116.2, springFall: 94.4, winter: 114.5 } },
    { key: "a_select1", label: "고압A 선택I", base: 6490, rate: { summer: 124.8, springFall: 101.1, winter: 124.7 } },
    { key: "a_select2", label: "고압A 선택II", base: 7470, rate: { summer: 120, springFall: 96.5, winter: 118.2 } }
];

// 산업용 전력(갑) II - 구간별 요금 / 순서대로(경부하, 중간부하, 최대부하)
const POWER_RATE_GAP_II = [
    { key: "a_select1", label: "고압A 선택I", base: 6490, rates: {
        summer:   [95.7, 121.5, 155],
        springFall: [95.7, 100.5, 119.7],
        winter:    [103.1, 120, 149.4]
    }},
    { key: "a_select2", label: "고압A 선택II", base: 7470, rates: {
        summer:   [90.8, 116.6, 150.1],
        springFall: [90.8, 95.6, 114.8],
        winter:    [98.2, 115.1, 144.5]
    }},
];

// 산업용 전력(을) - 구간별 요금 / 순서대로(경부하, 중간부하, 최대부하)
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
const floorWon = (value) => Math.floor(value); // 원단위 미만 절사
const roundWon = (value) => Math.round(value); // 원단위 반올림
const floorTenWon = (value) => Math.floor(value / 10) * 10; // 10원 미만 절사

// =======================================================






// =====  메인 컴포넌트  =========================
export default function PowerBill({ onCalculationComplete }) {
    const [mainType, setMainType] = useState('gap');     
    const [subType, setSubType] = useState('I');
    const [option, setOption] = useState('low'); 
    const [season] = useState(getCurrentSeason());
    const [contractPower, setContractPower] = useState('');
    const [usage, setUsage] = useState('');     
    const [usageTimes, setUsageTimes] = useState({ 0: '', 1: '', 2: '' })
    const [result, setResult] = useState(null);
    const [view, setView] = useState('initial');

    // 타입/옵션 초기화
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
    // =====================================================================







    // ===== 요금 계산 =========================================================
    const handleCalc = (e) => {
        e.preventDefault();
        if (!contractPower || Number(contractPower) <= 0) {
        alert("계약전력을 입력하세요.");
        return;
        }

        let baseCharge = 0; // ① 기본요금
        let energyCharge = 0; // ② 사용량요금
        let selectedOption;
        let totalUsageKwh = 0;

        if (mainType === 'gap') {
            if (subType === 'I') {
                // ---- (갑)I: 전체 사용량 한 칸
                if (!usage || Number(usage) <= 0) { alert("전력사용량을 입력하세요."); return; }
                selectedOption = POWER_RATE_GAP_I.find(v => v.key === option);
                baseCharge = floorWon(Number(contractPower) * selectedOption.base);
                energyCharge = floorWon(Number(usage) * selectedOption.rate[season]);
                totalUsageKwh = Number(usage);
            } else {
                // ---- (갑)II: 구간별(경,중,최대) 사용량
                selectedOption = POWER_RATE_GAP_II.find(v => v.key === option);
                const sumUsage = Number(usageTimes[0] || 0) + Number(usageTimes[1] || 0) + Number(usageTimes[2] || 0);
                if (sumUsage <= 0) { alert("시간대별 사용량을 입력하세요."); return; }
                baseCharge = floorWon(Number(contractPower) * selectedOption.base);
                for (let i = 0; i < 3; i++) {
                energyCharge += floorWon((Number(usageTimes[i]) || 0) * selectedOption.rates[season][i]);
                }
                totalUsageKwh = sumUsage;
            }
        } else {
            // ---- (을): 구간별(경,중,최대) 사용량
            selectedOption = POWER_RATE_EUL.find(v => v.key === option);
            const sumUsage = Number(usageTimes[0] || 0) + Number(usageTimes[1] || 0) + Number(usageTimes[2] || 0);
            if (sumUsage <= 0) { alert("시간대별 사용량을 입력하세요."); return; }
            baseCharge = floorWon(Number(contractPower) * selectedOption.base);
            for (let i = 0; i < 3; i++) {
                energyCharge += floorWon((Number(usageTimes[i]) || 0) * selectedOption.rates[season][i]);
            }
            totalUsageKwh = sumUsage;
        }

         // ③ 전기요금계 = 기본요금 + 사용량요금
        let electricityTotal = baseCharge + energyCharge;

        // ④ 부가가치세(원단위 미만 4사5입)
        const vat = roundWon(electricityTotal * 0.1);

        // ⑤ 전력산업기반기금(10원 미만 절사)
        const fund = floorTenWon(electricityTotal * 0.027);

        // ⑥ 청구요금 합계(10원 미만 절사)
        const finalAmount = floorTenWon(electricityTotal + vat + fund);

        setResult(finalAmount);
        setView('result');
        onCalculationComplete(totalUsageKwh);
    };

    // 옵션 선택용 함수
    const getRateOptions = () => {
        if (mainType === 'gap') {
            return subType === 'I' ? POWER_RATE_GAP_I : POWER_RATE_GAP_II;
        }
        return POWER_RATE_EUL;
    }
    // ========================================================================





    // 렌더링
    return (
        <div className="power-calc-bg">
            <div className="power-calc-box">
                {/* 1. 첫 페이지 */}
                {view === 'initial' && (
                <div className="initial-view">
                    <h3>이번 달 요금 계산하기</h3>
                    <p>예상 전기요금을 미리 계산해 보세요.</p>
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
                        <div className="row" style={{ margin: '10px 0' }}>
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

                {/* 3. 전기요금 결과 */}
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
