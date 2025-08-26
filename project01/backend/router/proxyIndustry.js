// 산업분류별 전력사용량 관련 js 
const express = require('express');
const axios = require('axios');
const router = express.Router();

const BASE = 'https://bigdata.kepco.co.kr/openapi/v1/powerUsage/industryType.do';

// 🔹 KEPCO API 키(직접 하드코딩)
//  - 실제 배포에서는 .env 권장하지만 요청대로 파일 내에 둠
const API_KEY_RAW =  process.env.KEPCOAPI_KEY;
const API_KEY_ENC = encodeURIComponent(API_KEY_RAW);

// ── 응답 항목 정규화(철자 차이/누락 방지)
const normalizeItem = (it = {}) => ({
  year: String(it.year || ''),
  month: String((it.month || '')).padStart(2, '0'),
  metro: it.metro ?? null,     // 시도명
  city: it.city ?? null,       // 시군구명
  biz: it.biz ?? null,         // 산업분류명
  custCnt: Number(it.custCnt ?? 0),
  powerUsage: Number((it.powerUsage ?? it.powerUseage) ?? 0),
  bill: Number(it.bill ?? 0),
  unitCost: Number(it.unitCost ?? 0),
});

// 응답에서 레코드 배열 꺼내기(data | totData 혼용 대응)
function extractRows(respData) {
  if (!respData) return [];
  if (Array.isArray(respData?.data)) return respData.data;
  if (Array.isArray(respData?.totData)) return respData.totData;
  if (Array.isArray(respData?.data?.data)) return respData.data.data;
  if (Array.isArray(respData?.totData?.data)) return respData.totData.data;
  return [];
}

// ── 한전 API 호출(헤더/파라미터/키 방식 조합으로 재시도)
async function callKepcoOnce(paramsBase, { keyName, useEncoded, withPaging, uaKind }) {
  const keyValue = useEncoded ? API_KEY_ENC : API_KEY_RAW;

  const params = {
    ...paramsBase,
    [keyName]: keyValue,
    returnType: 'json',
  };

  // 일부 케이스에서 pageNo/numOfRows 없으면 406 나는 경우가 있어 옵션으로 시도
  if (withPaging) {
    params.pageNo = 1;
    params.numOfRows = 9999;
  }

  // 헤더 조합: 한전 서버가 content negotiation을 까다롭게 타서 여러 조합 테스트
  const headersCandidates = {
    tight: { Accept: '*/*' },
    loose: { /* axios 기본 (application/json, text/plain, */ /*) */ },
    browsery: {
      Accept: '*/*',
      'User-Agent': 'Mozilla/5.0',
      Referer: 'https://bigdata.kepco.co.kr/',
    },
  };

  const headers = headersCandidates[uaKind] || headersCandidates.tight;

  console.log('[KEPCO] try', {
    keyName,
    useEncoded,
    withPaging,
    uaKind,
    keyPreview: keyValue.slice(0, 4) + '***',
    year: params.year,
    month: params.month,
    metroCd: params.metroCd || '',
    cityCd: params.cityCd || '',
    bizCd: params.bizCd || '',
  });

  const { data } = await axios.get(BASE, {
    params,
    timeout: 15000,
    headers,
    validateStatus: (s) => s >= 200 && s < 500, // 4xx라도 본문을 보고 판단
  });

  // 406 같은 경우에도 data가 HTML일 수 있으니 rows 추출 전에 체크
  if (typeof data === 'string' && data.includes('406 Not Acceptable')) {
    const err = new Error('KEPCO 406 Not Acceptable (HTML)');
    err.response = { status: 406, data };
    throw err;
  }

  return data;
}

// 제공된 paramsBase로 여러 조합을 순차 시도
async function callKepcoWithFallback(paramsBase) {
  const attempts = [
    // 키 이름/인코딩/페이징/헤더 조합을 여러 번 시도
    { keyName: 'apiKey',    useEncoded: false, withPaging: false, uaKind: 'tight' },
    { keyName: 'apiKey',    useEncoded: true,  withPaging: false, uaKind: 'tight' },
    { keyName: 'serviceKey',useEncoded: false, withPaging: false, uaKind: 'tight' },
    { keyName: 'serviceKey',useEncoded: true,  withPaging: false, uaKind: 'tight' },

    { keyName: 'apiKey',    useEncoded: false, withPaging: true,  uaKind: 'tight' },
    { keyName: 'apiKey',    useEncoded: true,  withPaging: true,  uaKind: 'tight' },

    { keyName: 'apiKey',    useEncoded: true,  withPaging: true,  uaKind: 'browsery' },
    { keyName: 'serviceKey',useEncoded: true,  withPaging: true,  uaKind: 'browsery' },
  ];

  let lastErr;
  for (const a of attempts) {
    try {
      const data = await callKepcoOnce(paramsBase, a);
      const rows = extractRows(data);
      const code = data?.resultCode ?? data?.header?.resultCode ?? null;

      if (rows.length > 0 || code === '00' || code === 'SUCCESS') {
        return { data, rows, meta: { tried: a } };
      }
      // 비정상 본문이라면 에러로 이어서 다음 시도
      lastErr = new Error('KEPCO returned empty rows');
      lastErr.upstream = data;
    } catch (e) {
      lastErr = e;
    }
  }
  if (lastErr) throw lastErr;
  throw new Error('KEPCO call failed with no error info');
}

// ── GET /kepco/industry
router.get('/industry', async (req, res) => {
  try {
    if (!API_KEY_RAW) {
      return res.status(500).json({ result: 0, message: 'KEPCO_API_KEY 누락' });
    }

    const { year, month, metroCd = '', cityCd = '', bizCd = '' } = req.query;

    if (!/^\d{4}$/.test(String(year || ''))) {
      return res.status(400).json({ result: 0, message: 'year=YYYY 필요' });
    }
    if (!/^\d{1,2}$/.test(String(month || ''))) {
      return res.status(400).json({ result: 0, message: 'month=MM 필요' });
    }

    const paramsBase = {
      year: String(year),
      month: String(month).padStart(2, '0'),
    };
    if (metroCd) paramsBase.metroCd = metroCd;
    if (cityCd)  paramsBase.cityCd  = cityCd;
    if (bizCd)   paramsBase.bizCd   = bizCd;

    console.log('[kepco/industry] paramsBase =', paramsBase);

    let resultPack;
    try {
      // 1차: 사용자가 준 필터 그대로
      resultPack = await callKepcoWithFallback(paramsBase);
    } catch (e1) {
      // 2차(선택): 필터가 전혀 없을 때, 최소 한 개 필터를 강제로 넣어서 재시도
      //   - 일부 월 데이터는 무필터로 406/빈응답이 나오는 사례가 있어 보정
      if (!metroCd && !cityCd && !bizCd) {
        const altParams = { ...paramsBase, bizCd: 'C' }; // 제조업 예시
        console.warn('[kepco/industry] retry with default bizCd=C');
        resultPack = await callKepcoWithFallback(altParams);
      } else {
        throw e1;
      }
    }

    const { data, rows, meta } = resultPack;
    const items = rows.map(normalizeItem);

    return res.json({
      result: 1,
      query: { ...paramsBase, metroCd, cityCd, bizCd },
      items,
      count: items.length,
      upstream: {
        tried: meta?.tried,
        resultCode: data?.resultCode ?? data?.header?.resultCode ?? null,
        resultMsg:  data?.resultMsg  ?? data?.header?.resultMsg  ?? null,
      },
    });
  } catch (e) {
    const upStatus = e?.response?.status || 0;
    const upBody = e?.response?.data;
    console.error('[proxyIndustry]/industry error:', upStatus, e?.message, upBody);
    return res.status(502).json({
      result: 0,
      message: 'KEPCO API 호출 실패',
      upStatus,
      upBody: typeof upBody === 'object' ? upBody : String(upBody || ''),
    });
  }
});

// ── GET /kepco/industry/series
router.get('/industry/series', async (req, res) => {
  try {
    if (!API_KEY_RAW) {
      return res.status(500).json({ result: 0, message: 'KEPCO_API_KEY 누락' });
    }

    const { from = '', to = '', metroCd = '', cityCd = '', bizCd = '' } = req.query;

    const mFrom = String(from).match(/^(\d{4})-(\d{2})$/);
    const mTo   = String(to).match(/^(\d{4})-(\d{2})$/);
    if (!mFrom || !mTo) {
      return res.status(400).json({ result: 0, message: 'from/to는 YYYY-MM 형식' });
    }

    const fy = +mFrom[1], fm = +mFrom[2];
    const ty = +mTo[1],   tm = +mTo[2];

    const ymList = [];
    for (let y = fy; y <= ty; y++) {
      const start = (y === fy ? fm : 1);
      const end   = (y === ty ? tm : 12);
      for (let mm = start; mm <= end; mm++) ymList.push({ y, mm });
    }

    const all = [];
    for (const { y, mm } of ymList) {
      const paramsBase = {
        year: String(y),
        month: String(mm).padStart(2, '0'),
      };
      if (metroCd) paramsBase.metroCd = metroCd;
      if (cityCd)  paramsBase.cityCd  = cityCd;
      if (bizCd)   paramsBase.bizCd   = bizCd;

      console.log('[kepco/industry/series] month =', paramsBase.year, paramsBase.month);
      try {
        let pack;
        try {
          pack = await callKepcoWithFallback(paramsBase);
        } catch (e1) {
          if (!metroCd && !cityCd && !bizCd) {
            const altParams = { ...paramsBase, bizCd: 'C' };
            console.warn('[series] retry with default bizCd=C');
            pack = await callKepcoWithFallback(altParams);
          } else {
            throw e1;
          }
        }
        pack.rows.map(normalizeItem).forEach(v => all.push(v));
      } catch (e) {
        const upStatus = e?.response?.status || 0;
        const upBody = e?.response?.data;
        console.error('[proxyIndustry]/series month error:', paramsBase.year, paramsBase.month, upStatus, e?.message, upBody);
      }
    }

    return res.json({
      result: 1,
      query: { from, to, metroCd, cityCd, bizCd },
      months: ymList.length,
      items: all,
      count: all.length,
    });
  } catch (e) {
    const upStatus = e?.response?.status || 0;
    const upBody = e?.response?.data;
    console.error('[proxyIndustry]/series error:', upStatus, e?.message, upBody);
    return res.status(502).json({
      result: 0,
      message: 'KEPCO API 호출 실패',
      upStatus,
      upBody: typeof upBody === 'object' ? upBody : String(upBody || ''),
    });
  }
});

module.exports = router;
