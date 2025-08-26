// 전력 사용량 데이터 DB 저장 관련 API 헬퍼 파일
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export async function saveForecast({
  companyId,
  contractKw,
  currentMonthKwh,
  baseMonth,
  companyType,           // ✅ 받아서
}) {
  const url = API_BASE ? `${API_BASE}/api/forecast/save` : `/api/forecast/save`;

  try {
    const { data } = await axios.post(url, {
      company_id: companyId,
      contract_kw: Number(contractKw),
      current_month_kwh: Number(currentMonthKwh),
      base_month: baseMonth,
      company_type: companyType ?? null,   // ✅ 백엔드로 전달
    });
    return data; // { ok:true, saved_rows:48, ym_this, ym_next }
  } catch (err) {
    // 에러 원인 바로 보이게 로그
    console.error('[saveForecast] axios error:', err?.message);
    console.error('[saveForecast] status/data:', err?.response?.status, err?.response?.data);
    throw err;
  }
}
