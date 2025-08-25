// routes/forecast.js
const express = require('express');
const axios = require('axios');
const mysql = require('mysql2/promise');
const router = express.Router();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// utils
const toYYYYMM = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
const addMonths = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };

// company_type 정규화
function normalizeType(val) {
  if (val == null) return null;
  const v = String(val).trim().toLowerCase();
  if (['산업용', 'i', 'ind', 'industrial'].includes(v)) return '산업용';
  if (['일반용', 'g', 'gen', 'general'].includes(v)) return '일반용';
  return String(val).trim(); // 모르는 값이면 원문 저장
}

// health
router.get('/_ping', (req, res) => res.json({ ok: true, where: '/api/forecast/_ping' }));

router.post('/save', async (req, res) => {
  try {
    // 1) validate
    const { company_id, contract_kw, current_month_kwh, base_month, company_type } = req.body || {};
    console.log('[save] body =', req.body);

    const missing = [];
    if (!company_id) missing.push('company_id');
    if (!Number.isFinite(Number(contract_kw))) missing.push('contract_kw');
    if (!Number.isFinite(Number(current_month_kwh))) missing.push('current_month_kwh');
    if (missing.length) {
      return res.status(400).json({ ok: false, message: '필수값 누락/숫자 아님', missing });
    }

    const now = new Date();
    const ymThis = base_month?.match?.(/^\d{6}$/) ? base_month : toYYYYMM(now);
    const ymNext = base_month?.match?.(/^\d{6}$/)
      ? toYYYYMM(addMonths(new Date(base_month.slice(0, 4), base_month.slice(4, 6) - 1, 1), 1))
      : toYYYYMM(addMonths(now, 1));

    // company_type 정규화 (없으면 null)
    const normType = normalizeType(company_type);

    // 3) call FastAPI
    const baseUrl = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';
    const fastUrl = `${baseUrl}/predict`;
    const { data } = await axios.post(fastUrl, { current_month_kwh: Number(current_month_kwh) });
    console.log('[save] fastapi ok. keys this/next =',
      Object.keys(data?.hourly_this_month || {}).length,
      Object.keys(data?.hourly_next_month || {}).length
    );

    // 4) response check
    const mustHours = Array.from({ length: 24 }, (_, h) => String(h));
    const ht = data?.hourly_this_month || {};
    const hn = data?.hourly_next_month || {};
    const okThis = mustHours.every((h) => h in ht);
    const okNext = mustHours.every((h) => h in hn);
    if (!okThis || !okNext) {
      return res.status(502).json({
        ok: false,
        message: '예측 응답 24시간 누락',
        this_len: Object.keys(ht).length,
        next_len: Object.keys(hn).length,
      });
    }

    // 5) rows (COMPANY_TYPE 포함)
    const rows = [];
    for (let h = 0; h < 24; h++) {
      const v = Number(ht[String(h)]);
      if (!Number.isFinite(v)) return res.status(502).json({ ok: false, message: `this_month 숫자 아님: hour=${h}` });
      rows.push([company_id, normType, ymThis, h, v, Number(current_month_kwh), Number(contract_kw)]);
    }
    for (let h = 0; h < 24; h++) {
      const v = Number(hn[String(h)]);
      if (!Number.isFinite(v)) return res.status(502).json({ ok: false, message: `next_month 숫자 아님: hour=${h}` });
      rows.push([company_id, normType, ymNext, h, v, Number(current_month_kwh), Number(contract_kw)]);
    }
    console.log('[save] rows to insert =', rows.length); // 48

    // 6) INSERT ONLY (append)
    const placeholders = rows.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
    const sql = `
      INSERT INTO power_forecast_hourly
        (COMPANY_ID, COMPANY_TYPE, FORECAST_YM, HOUR, PRED_KWH, USED_KWH, CONTRACT_KW)
      VALUES ${placeholders}
    `;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [result] = await conn.query(sql, rows.flat());
      await conn.commit();
      console.log('[save] insert result =', result);
      return res.json({ ok: true, saved_rows: rows.length, ym_this: ymThis, ym_next: ymNext });
    } catch (e) {
      await conn.rollback();
      console.error('[save] db error:', e);
      return res.status(500).json({ ok: false, message: 'DB error', detail: e?.message });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('[save] fatal error:', err);
    return res.status(500).json({ ok: false, message: 'server error', detail: err?.message });
  }
});

module.exports = router;
