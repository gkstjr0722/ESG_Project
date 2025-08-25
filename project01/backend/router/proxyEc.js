// backend/router/proxyEC.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');

const router = express.Router();
const PUB   = process.env.PUBLICDATA_KEY;   // 공공데이터 API 키 (.env)
const KAKAO = process.env.KAKAO_REST_KEY;
const path = require('path');
const fs = require('fs');    // 카카오 REST 키 (.env)

// ── (A) 전기공사업체 목록 프록시
//     + 간단 캐시(10분)로 호출/지연 줄이기
let _cache = { ts: 0, payload: null };
const LIST_TTL_MS = 1000 * 60 * 10;

router.get('/list', async (req, res) => {
  try {
    if (!PUB) {
      return res.status(500).json({ error: 'publicdata_key_missing' });
    }

    const page    = Number(req.query.page || 1);
    const perPage = Number(req.query.perPage || 200);

    // 캐시 히트이면 즉시 반환
    const now = Date.now();
    if (_cache.payload && (now - _cache.ts < LIST_TTL_MS)) {
      return res.json(_cache.payload);
    }

    // Swagger paths에서 확인한 실제 경로
    const url = 'https://api.odcloud.kr/api/15125370/v1/uddi:c84da3cf-95ac-48a0-9f36-867aef58e9df';

    const { data } = await axios.get(url, {
      params: {
        page,
        perPage,
        serviceKey: PUB,      // .env의 PUBLICDATA_KEY
        // odcloud는 기본이 JSON이라 returnType 불필요. 일부 데이터셋은 넣으면 0건 나오는 경우가 있어 제거.
        // returnType: 'JSON',
      },
      timeout: 20000,
    });

    // ── odcloud 다양한 응답 패턴 대응
    const raw =
      Array.isArray(data?.data)    ? data.data :
      Array.isArray(data?.records) ? data.records :
      Array.isArray(data)          ? data :
      (data?.response?.body?.items?.item ?? []);

    // ── ✅ 컬럼 매핑: 현재 데이터셋은 한글 키 사용
    //     id:   '등록번호' (고유키 용)
    //     name: '상호'     (업체명)
    //     addr: '소재지'   (지오코딩 주소)
    //     tel:  없음 → null
    const items = raw.map(x => ({
      id:   x['등록번호'],
      name: x['상호'],
      addr: x['소재지'],
      tel:  null,
    })).filter(v => v.addr && v.name);

    const payload = { page, perPage, count: items.length, items };

    // 캐시에 저장
    _cache = { ts: now, payload };

    res.json(payload);
  } catch (e) {
    console.error('[EC list error]', e?.response?.data || e.message);
    res.status(500).json({ error: 'publicdata_failed' });
  }
});

// ── (B) 지오코딩 프록시 (주소 → 좌표) : 키는 서버에서만 사용
router.get('/geocode', async (req, res) => {
  const query = (req.query.query || '').trim();
  if (!query) return res.status(400).json({ error: 'query_required' });

  try {
    if (!KAKAO) {
      return res.status(500).json({ error: 'kakao_key_missing' });
    }

    const { data } = await axios.get('https://dapi.kakao.com/v2/local/search/address.json', {
      params: { query },
      headers: { Authorization: `KakaoAK ${KAKAO}` },
      timeout: 10000,
    });

    // 🔎 콘솔에서 위도/경도 확인
    if (Array.isArray(data?.documents) && data.documents.length > 0) {
      const doc = data.documents[0];
      console.log(`[Geocode] query="${query}" → lat(y): ${doc.y}, lng(x): ${doc.x}`);
    } else {
      console.log(`[Geocode] query="${query}" → 결과 없음`);
    }

    res.json(data);
  } catch (e) {
    const status = e?.response?.status || 500;
    const detail = e?.response?.data || e.message;
    console.error('[geocode error]', detail);
    res.status(status).json({ error: 'geocode_failed', detail });
  }
});

// 미리 생성한 좌표 결과 파일 내려주기(build-ec-porints.js)
router.get('/points', (req, res) => {
  const file = path.join(__dirname, '..', 'data', 'ec_points.min.json');
  if (fs.existsSync(file)) {
    return res.sendFile(file);
  }
  return res.status(404).json({ error: 'points_not_found' });
});


module.exports = router;
