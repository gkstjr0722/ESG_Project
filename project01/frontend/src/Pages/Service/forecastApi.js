// 전기사용량 입력값 관련 프론트 API 헬퍼 
import axios from 'axios';
export async function saveForecast({
  companyId,
  contractKw,
  currentMonthKwh,
  baseMonth,     // 예: "202508"
  companyType,
  feeType,
  planSet,
  optionCode,
}) {
  // 프록시(vite.config.js)가 /api → http://localhost:3001 로 전달
  const url = '/api/forecast/save';

  // 🔒 숫자 안전화(+ 반올림 보정)
  const round = (v, n) => {
    const x = Number(v);
    return Number.isFinite(x) ? Number(x.toFixed(n)) : null;
  };

  const _ck  = round(contractKw, 2);     // 계약전력은 소수 2자리
  const _cmk = round(currentMonthKwh, 3); // 사용량은 소수 3자리

  const body = {
    company_id: String(companyId),
    contract_kw: (_ck != null && _ck > 0) ? _ck : 1,          // ← 0/NaN 방지
    current_month_kwh: (_cmk != null) ? _cmk : 0,             // ← NaN 방지
    base_month: baseMonth ?? null,
    company_type: companyType ?? null,
    fee_type: feeType ?? null,       // 갑/을 나누는 
    plan_set: planSet ?? null,       // 'I','II' 나눠주는 
    option_code: optionCode ?? null,
  };

  // 🔍 실제 전송 바디 확인
  console.log('[saveForecast] body →', body);

  try {
    const { data } = await axios.post(url, body);
    return data; // { ok:true, saved_rows:..., ... }
  } catch (err) {
    console.error('[saveForecast] axios error:', err?.message);
    console.error('[saveForecast] status/data:', err?.response?.status, err?.response?.data);
    throw err;
  }
}
