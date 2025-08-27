// 전기사용량 DB 연결 관련 js 
const express = require('express');
const axios = require('axios');
const mysql = require('mysql2/promise');
const router = express.Router();
const fs = require('fs'); // ★ 추가: 도커 감지용

// 추가: 컨테이너 내부에는 /.dockerenv 파일이 존재
function inDocker() {
  try { return fs.existsSync('/.dockerenv'); } catch { return false; }
}

// 최종 확정: 도커/로컬에 따라 호스트 고정 선택 (도커,로컬 구분없이 저장 가능)
const DB_HOST = inDocker()
  ? (process.env.DB_HOST_DOCKER || process.env.DB_HOST)
  : (process.env.DB_HOST_LOCAL  || process.env.DB_HOST);

const pool = mysql.createPool({
  host: DB_HOST, // ★ 변경됨
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

// ✅ 시간키 안전 접근 헬퍼: "0"/"00" 둘 다 지원
function getHourValue(obj, h) {
  const k1 = String(h);
  const k2 = String(h).padStart(2, '0');
  return Object.prototype.hasOwnProperty.call(obj || {}, k1)
    ? obj[k1]
    : obj?.[k2];
}

// health
router.get('/_ping', (req, res) => res.json({ ok: true, where: '/api/forecast/_ping' }));

router.post('/save', async (req, res) => {
  try {
    const {
      company_id,
      contract_kw,
      current_month_kwh,
      base_month,
      company_type,
      fee_type,
      plan_set,
      option_code,
    } = req.body || {};

    // 🔒 숫자 정규화(반올림): 계약전력 2자리, 사용량 3자리
    const roundN = (x, n) => Math.round(Number(x) * (10 ** n)) / (10 ** n);
    const ck  = Number.isFinite(Number(contract_kw))   ? roundN(contract_kw, 2)   : NaN;
    const cmk = Number.isFinite(Number(current_month_kwh)) ? roundN(current_month_kwh, 3) : NaN;

    // 1) validate
    const missing = [];
    if (!company_id) missing.push('company_id');
    if (!Number.isFinite(ck) || ck <= 0) missing.push('contract_kw');
    if (!Number.isFinite(cmk)) missing.push('current_month_kwh');
    if (missing.length) {
      return res.status(400).json({ ok: false, message: '필수값 누락/숫자 오류', missing });
    }

    // 2) 기준월 계산
    const toYYYYMM = d => `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}`;
    const addMonths = (d,n)=>{ const x=new Date(d); x.setMonth(x.getMonth()+n); return x; };

    const now = new Date();
    const ymThis = /^\d{6}$/.test(base_month || '') ? base_month : toYYYYMM(now);
    const ymNext = /^\d{6}$/.test(base_month || '')
      ? toYYYYMM(addMonths(new Date(base_month.slice(0,4), base_month.slice(4,6)-1, 1), 1))
      : toYYYYMM(addMonths(now, 1));

    // 3) 산업/일반 정규화
    const normalizeType = v => {
      if (v == null) return null;
      const s = String(v).toLowerCase();
      if (['산업용','i','ind','industrial'].includes(s)) return '산업용';
      if (['일반용','g','gen','general'].includes(s)) return '일반용';
      return String(v).trim();
    };
    const normType = normalizeType(company_type);

    // 4) 예측 호출 (current_month_kwh만 전달)  ← 반올림한 cmk 사용
    const baseUrl = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';
    const { data } = await axios.post(`${baseUrl}/predict`, {
      current_month_kwh: cmk
    });

    // 5) 응답 검증 + 행 생성
    const mustHours = Array.from({length:24}, (_,h)=>h);
    const getHour = (obj,h)=> obj?.[String(h)] ?? obj?.[String(h).padStart(2,'0')];

    const ht = data?.hourly_this_month || {};
    const hn = data?.hourly_next_month || {};
    if (!mustHours.every(h => getHour(ht,h)!=null) || !mustHours.every(h=>getHour(hn,h)!=null)) {
      return res.status(502).json({ ok:false, message:'예측 응답 24시간 누락' });
    }

    const rows = [];
    for (let h=0; h<24; h++) {
      const v = Number(getHour(ht,h));
      if (!Number.isFinite(v)) return res.status(502).json({ ok:false, message:`this_month 숫자 아님: ${h}` });
      rows.push([company_id, normType, fee_type, plan_set, option_code, ymThis, h, v, cmk, ck]);
    }
    for (let h=0; h<24; h++) {
      const v = Number(getHour(hn,h));
      if (!Number.isFinite(v)) return res.status(502).json({ ok:false, message:`next_month 숫자 아님: ${h}` });
      rows.push([company_id, normType, fee_type, plan_set, option_code, ymNext, h, v, cmk, ck]);
    }

    // 6) INSERT (append)
    const placeholders = rows.map(()=>'(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
    const sql = `
      INSERT INTO power_forecast_hourly
        (COMPANY_ID, COMPANY_TYPE, FEE_TYPE, PLAN_SET, OPTION_CODE,
         FORECAST_YM, HOUR, PRED_KWH, USED_KWH, CONTRACT_KW)
      VALUES ${placeholders}
    `;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(sql, rows.flat());
      await conn.commit();
      return res.json({ ok:true, saved_rows: rows.length, ym_this: ymThis, ym_next: ymNext });
    } catch (e) {
      await conn.rollback();
      return res.status(500).json({ ok:false, message:'DB error', detail: e?.message });
    } finally {
      conn.release();
    }
  } catch (err) {
    return res.status(500).json({ ok:false, message:'server error', detail: err?.message });
  }
});


// MYSQL에 2000개씩 페이지네이션하기 위한 코드 
router.get('/list', async (req, res) => {
  try {
    // 기본값: page=1, size=2000
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const size = Math.min(2000, Math.max(1, parseInt(req.query.size || '2000', 10)));
    const offset = (page - 1) * size;

    // 선택 필터 (없으면 전체 조회)
    const { company_id, ym, fee_type, plan_set } = req.query;

    const where = [];
    const params = [];

    if (company_id) { where.push('COMPANY_ID = ?'); params.push(company_id); }
    if (ym)         { where.push('FORECAST_YM = ?'); params.push(ym); }
    if (fee_type)   { where.push('FEE_TYPE = ?');    params.push(fee_type); }
    if (plan_set)   { where.push('PLAN_SET = ?');    params.push(plan_set); }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    // 정렬 기준: 최근 생성순(필요 시 INPUT_ID DESC로 바꿔도 OK)
    const sql = `
      SELECT 
        INPUT_ID, COMPANY_ID, COMPANY_TYPE, FEE_TYPE, PLAN_SET, OPTION_CODE,
        FORECAST_YM, HOUR, PRED_KWH, USED_KWH, CONTRACT_KW, CREATED
      FROM power_forecast_hourly
      ${whereSql}
      ORDER BY CREATED DESC
      LIMIT ? OFFSET ?
    `;

    // 총 개수도 함께 내려주면 프론트에서 페이지 계산 가능
    const countSql = `
      SELECT COUNT(*) AS total
      FROM power_forecast_hourly
      ${whereSql}
    `;

    const countParams = [...params];
    const listParams  = [...params, size, offset];

    const [[{ total }]] = await pool.query(countSql, countParams);
    const [rows] = await pool.query(sql, listParams);

    return res.json({ ok: true, page, size, total, rows });
  } catch (err) {
    console.error('[list] error:', err);
    return res.status(500).json({ ok: false, message: 'server error', detail: err?.message });
  }
});
module.exports = router;

// 전력사용량 데이터 관련 최종수정 완료 