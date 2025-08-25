require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const PUB   = process.env.PUBLICDATA_KEY;
const KAKAO = process.env.KAKAO_REST_KEY;


// 🔧 데이터 저장 원하는 규모 설정 (필요에 따라 조절)
const PER_PAGE     = 1000;   // odcloud는 보통 1000까지 OK
const MAX_PAGES    = 999;    // 충분히 크게
const MAX_GEOCODE  = 20000;   // 지오코딩해서 저장할 개수 상한 (시간/쿼터 고려해서 정해)
const SLEEP_MS     = 100;    // 100ms면 초당 ~10건 (안전)

const url = 'https://api.odcloud.kr/api/15125370/v1/uddi:c84da3cf-95ac-48a0-9f36-867aef58e9df';
const geocoderUrl = 'https://dapi.kakao.com/v2/local/search/address.json';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchAllContractors() {
  const all = [];
  let totalCount = null;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data } = await axios.get(url, {
      params: { page, perPage: PER_PAGE, serviceKey: PUB },
      timeout: 20000,
    });

    const chunk = Array.isArray(data?.data) ? data.data : [];
    if (totalCount == null) totalCount = data?.totalCount ?? null;

    console.log(`📥 page=${page} count=${chunk.length}${totalCount ? ` / total=${totalCount}` : ''}`);
    all.push(...chunk);

    if (!chunk.length) break;                          // 더 없음
    if (totalCount && all.length >= totalCount) break; // 전량 수집 완료
  }

  console.log(`📌 총 ${all.length} 건 수집 완료`);
  return all;
}

async function geocodeAddress(addr) {
  const res = await axios.get(geocoderUrl, {
    params: { query: addr },
    headers: { Authorization: `KakaoAK ${KAKAO}` },
    timeout: 10000,
  });
  const doc = res?.data?.documents?.[0];
  if (!doc) return null;
  return { lat: Number(doc.y), lng: Number(doc.x) }; // Kakao: y=lat, x=lng
}

async function main() {
  try {
    console.log('⚡ 스크립트 시작: 전기공사업체 데이터 수집 중...');
    const raw = await fetchAllContractors();

    const results = [];
    for (let i = 0; i < raw.length; i++) {
      if (results.length >= MAX_GEOCODE) break; // 상한 도달 시 중지

      const row = raw[i];
      const addr = row['소재지'];
      if (!addr) continue;

      try {
        const pos = await geocodeAddress(addr);
        if (pos) {
          results.push({
            id:   row['등록번호'],
            name: row['상호'],
            addr,
            lat:  pos.lat,
            lng:  pos.lng,
          });
          console.log(`[Geocode ${i + 1}] ${addr} → lat: ${pos.lat}, lng: ${pos.lng}`);
        } else {
          console.warn(`[Geocode ${i + 1}] 결과 없음: ${addr}`);
        }
      } catch (e) {
        console.warn(`[Geocode ${i + 1}] 실패: ${addr} (${e.message})`);
      }

      await sleep(SLEEP_MS); // 속도 제어(쿼터/차단 방지)
    }

    const outPath = path.join(__dirname, '..', 'data', 'ec_points.min.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
    console.log(`🎉 완료! ${results.length} 개 저장됨 → ${outPath}`);
  } catch (e) {
    console.error('🔥 전체 오류:', e.message);
  }
}

main();
