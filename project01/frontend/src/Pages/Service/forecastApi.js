// src/Pages/Service/forecastApi.js
import axios from 'axios';

export async function saveForecast({
  companyId,
  contractKw,
  currentMonthKwh,
  baseMonth,     // 예: "202508"
  companyType,
}) {
  // 프록시(vite.config.js)가 /api → http://localhost:3001 로 전달
  const url = '/api/forecast/save';

  const body = {
    company_id: String(companyId),
    contract_kw: Number(contractKw ?? 0),
    current_month_kwh: Number(currentMonthKwh ?? 0),
    base_month: baseMonth ?? null,
    company_type: companyType ?? null,
  };

  try {
    const { data } = await axios.post(url, body);
    return data; // { ok:true, saved_rows:..., ... }
  } catch (err) {
    console.error('[saveForecast] axios error:', err?.message);
    console.error('[saveForecast] status/data:', err?.response?.status, err?.response?.data);
    throw err;
  }
}
