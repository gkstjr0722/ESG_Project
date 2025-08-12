// 산업분류별 전력사용량 관련 js 
const express = require('express');
const axios = require('axios');
const router = express.Router();

const BASE = 'https://bigdata.kepco.co.kr/openapi/v1/powerUsage/industryType.do';
const API_KEY = process.env.KEPCO_API_KEY;

// ── 공통 유틸: 응답 항목 정규화(철자 차이/누락 방지)
const normalizeItem = (it = {}) => ({
  year: String(it.year || ''),
  month: String((it.month || '')).padStart(2, '0'),
  metro: it.metro ?? null,     // 시도명
  city: it.city ?? null,       // 시군구명
  biz: it.biz ?? null,         // 산업분류명
  custCnt: Number(it.custCnt ?? 0),
  powerUsage: Number((it.powerUsage ?? it.powerUseage) ?? 0), // 문서에 혼용 가능성
  bill: Number(it.bill ?? 0),
  unitCost: Number(it.unitCost ?? 0),
});

// ── GET /kepco/industry : 단일 연월 조회
// 예) /kepco/industry?year=2024&month=11&metroCd=11&cityCd=680&bizCd=C
router.get('/industry', async (req, res) => {
  try {
    if (!API_KEY) return res.status(500).json({ result: 0, message: 'KEPCO_API_KEY 누락' });

    const { year, month, metroCd = '', cityCd = '', bizCd = '' } = req.query;

    if (!/^\d{4}$/.test(String(year || ''))) {
      return res.status(400).json({ result: 0, message: 'year=YYYY 필요' });
    }
    if (!/^\d{1,2}$/.test(String(month || ''))) {
      return res.status(400).json({ result: 0, message: 'month=MM 필요' });
    }

    const params = {
      apiKey: API_KEY,
      returnType: 'json',
      year: String(year),
      month: String(month).padStart(2, '0'),
    };
    if (metroCd) params.metroCd = metroCd;
    if (cityCd) params.cityCd = cityCd;
    if (bizCd) params.bizCd = bizCd;

    const { data } = await axios.get(BASE, { params, timeout: 15000 });

    // metroCd 미선택이면 totData, 선택이면 data 로 온다 → 통일
    const raw = Array.isArray(data?.data) ? data.data
              : Array.isArray(data?.totData) ? data.totData
              : [];

    return res.json({
      result: 1,
      query: { year: params.year, month: params.month, metroCd, cityCd, bizCd },
      items: raw.map(normalizeItem),
      count: raw.length,
    });
  } catch (e) {
    console.error('[proxyIndustry]/industry error:', e?.response?.status, e?.message);
    return res.status(502).json({ result: 0, message: 'KEPCO API 호출 실패' });
  }
});

// ── GET /kepco/industry/series : 월 범위(YYYY-MM ~ YYYY-MM) 반복 조회
// 예) /kepco/industry/series?from=2024-01&to=2024-12&metroCd=11&bizCd=C
router.get('/industry/series', async (req, res) => {
  try {
    if (!API_KEY) return res.status(500).json({ result: 0, message: 'KEPCO_API_KEY 누락' });

    const { from = '', to = '', metroCd = '', cityCd = '', bizCd = '' } = req.query;

    const mFrom = String(from).match(/^(\d{4})-(\d{2})$/);
    const mTo   = String(to).match(/^(\d{4})-(\d{2})$/);
    if (!mFrom || !mTo) {
      return res.status(400).json({ result: 0, message: 'from/to는 YYYY-MM 형식' });
    }

    const fy = +mFrom[1], fm = +mFrom[2];
    const ty = +mTo[1],   tm = +mTo[2];

    // 조회할 연월 리스트 만들기
    const ymList = [];
    for (let y = fy; y <= ty; y++) {
      const start = (y === fy ? fm : 1);
      const end   = (y === ty ? tm : 12);
      for (let mm = start; mm <= end; mm++) ymList.push({ y, mm });
    }

    // 순차 호출(레이트리밋 대비). 필요 시 지연 추가 가능.
    const all = [];
    for (const { y, mm } of ymList) {
      const { data } = await axios.get(BASE, {
        params: {
          apiKey: API_KEY,
          returnType: 'json',
          year: String(y),
          month: String(mm).padStart(2, '0'),
          metroCd, cityCd, bizCd,
        },
        timeout: 15000,
      });

      const raw = Array.isArray(data?.data) ? data.data
                : Array.isArray(data?.totData) ? data.totData
                : [];
      raw.map(normalizeItem).forEach(v => all.push(v));
      // await new Promise(r=>setTimeout(r, 150)); // 필요하면 언주석
    }

    return res.json({
      result: 1,
      query: { from, to, metroCd, cityCd, bizCd },
      months: ymList.length,
      items: all,     // 여러 달의 레코드들
      count: all.length,
    });
  } catch (e) {
    console.error('[proxyIndustry]/series error:', e?.response?.status, e?.message);
    return res.status(502).json({ result: 0, message: 'KEPCO API 호출 실패' });
  }
});

module.exports = router;

// 산업분류별 api 관련 js 