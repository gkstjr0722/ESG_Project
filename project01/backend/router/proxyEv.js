const express = require('express');
const axios = require('axios');
const router = express.Router();

// EVchargeManage: 위/경도 포함 응답
router.get('/manage', async (req, res) => {
  const { addr = '광주광역시' } = req.query;         // 예: '광주광역시 북구'
  const apiKey = process.env.KEPCO_API_KEY || 'Ve7lfI30PMG2ue5L56UkiEr4qyhK7AIS5H955w6h';
  const base = 'https://bigdata.kepco.co.kr/openapi/v1/EVchargeManage.do';

  const url =
    `${base}?apiKey=${apiKey}&returnType=json` +
    (addr ? `&addr=${encodeURIComponent(addr)}` : '');

  try {
    const { data } = await axios.get(url, { timeout: 10000 });
    // 실제 응답 구조 보호: data.data가 배열일 때만 사용
    const list = Array.isArray(data?.data) ? data.data : [];
    // 과부하 방지: 최대 100개만 전달
    res.json(list.slice(0, 100));
  } catch (e) {
    console.error('KEPCO Manage API 에러:', e?.response?.status, e?.response?.data || e.message);
    res.status(500).json({ message: 'KEPCO 관리 API 호출 실패' });
  }
});


module.exports = router;


