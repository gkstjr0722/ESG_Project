// server/routes/ev.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

// 전국/지역 겸용
router.get('/manage', async (req, res) => {
  const { addr = '', limit = 5000, page = 1 } = req.query;

  const apiKey =  process.env.KEPCOAPI_KEY;// 실제 키 사용 권장
  const base = 'https://bigdata.kepco.co.kr/openapi/v1/EVchargeManage.do';

  // ⚠️ 아래 page/numOfRows는 "추정"입니다. 문서를 확인해 정확한 파라미터로 바꾸세요.
  const url =
    `${base}?apiKey=${apiKey}&returnType=json`
    + (addr ? `&addr=${encodeURIComponent(addr)}` : '')
    + `&pageNo=${encodeURIComponent(page)}&numOfRows=${encodeURIComponent(limit)}`;

  try {
    const { data } = await axios.get(url, { timeout: 15000 });
    const list = Array.isArray(data?.data) ? data.data : [];
    res.json(list);
  } catch (e) {
    console.error('KEPCO Manage API 에러:', e?.response?.status, e?.response?.data || e.message);
    res.status(500).json({ message: 'KEPCO 관리 API 호출 실패' });
  }
});

module.exports = router;
