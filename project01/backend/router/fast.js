// FAST API 관련 JS 
const express = require('express');
const axios = require('axios');

const router = express.Router();
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';

// 숫자 변환 헬퍼
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// 프론트에서 넘어오는 임의의 키(value/thisMonth/lastMonth/current_month_kwh 등)를
// FastAPI 표준키(current_month_kwh)로 매핑
function buildFastApiPayload(body = {}) {
  const candidates = [
    body.current_month_kwh,
     body.lastMonthKwh, 
    body.value,
    body.thisMonth,
    body.lastMonth,
    body.kwh,
    body.kWh,
  ];
  let base = null;
  for (const c of candidates) {
    const n = toNum(c);
    if (n !== null) { base = n; break; }
  }
  if (base === null) return { ok: false, reason: 'no_numeric_value', payload: body };
  return { ok: true, data: { current_month_kwh: base } };
}

router.get('/health', async (_req, res) => {
  try {
    const { data } = await axios.get(`${FASTAPI_URL}/health`, { timeout: 5000 });
    res.json(data); // 패스스루
  } catch (err) {
    res.status(502).json({ error: 'upstream_health_failed', detail: err?.response?.data || err.message });
  }
});

// 핵심: FastAPI 응답을 프론트가 쓰기 좋은 형태로 "정규화"해서 반환
router.post('/predict', async (req, res) => {
  console.log('[fast] /predict req.body =', req.body);

  const built = buildFastApiPayload(req.body);
  if (!built.ok) {
    return res.status(400).json({ error: 'bad_request_body', detail: built.reason, received: req.body });
  }
  const fastPayload = built.data;
  console.log('[fast] mapped payload =', fastPayload);

  try {
    const { data: upstream } = await axios.post(`${FASTAPI_URL}/predict`, fastPayload, {
      timeout: 20000,
      headers: { 'Content-Type': 'application/json' },
    });
    console.log('[fast] upstream resp =', upstream);

    // ── 정규화 ──────────────────────────────────────────────
    // 1) 다음달 총 사용량 → predicted_kwh 로 통일
    let predicted =
      toNum(upstream?.next_month_kwh) ??
      toNum(upstream?.predicted_kwh) ??
      toNum(upstream?.y) ??
      toNum(upstream?.data?.next_month_kwh) ??
      toNum(upstream?.data?.predicted_kwh) ??
      toNum(upstream?.data?.y);

    if (predicted === null) {
      return res.status(502).json({ error: 'invalid_upstream_payload', detail: upstream });
    }

    // 2) 시간대 데이터는 detail로 같이 전달(원하면 프론트에서 사용)
    const detail = {
      hourly_this_month: upstream?.hourly_this_month ?? upstream?.data?.hourly_this_month ?? null,
      hourly_next_month: upstream?.hourly_next_month ?? upstream?.data?.hourly_next_month ?? null,
      hourly_this_month_text: upstream?.hourly_this_month_text ?? upstream?.data?.hourly_this_month_text ?? null,
      hourly_next_month_text: upstream?.hourly_next_month_text ?? upstream?.data?.hourly_next_month_text ?? null,
    };

    return res.json({ predicted_kwh: predicted, detail });
    // ───────────────────────────────────────────────────────
  } catch (err) {
    const status = err?.response?.status || 502;
    return res.status(status).json({
      error: 'upstream_predict_failed',
      request_sent: fastPayload,
      detail: err?.response?.data || err.message,
    });
  }
});

module.exports = router;
