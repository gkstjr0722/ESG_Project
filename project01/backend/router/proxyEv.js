const express = require('express');
const axios = require('axios');
const router = express.Router();

<<<<<<< HEAD
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
=======
// 1. 전기차 충전소 정보 조회 라우터 
router.get('/list', async (req, res) => {
  console.log("🚗 /api/proxy/list 요청 받음"); // 요청 확인 로그

  const { metroCd = '11', cityCd = '11' } = req.query; 
  const apiKey = 'Ve7lfI30PMG2ue5L56UkiEr4qyhK7AIS5H955w6h';
  const url = `https://bigdata.kepco.co.kr/openapi/v1/EVcharge.do?metroCd=${metroCd}&cityCd=${cityCd}&apiKey=${apiKey}&returnType=json`;

https://bigdata.kepco.co.kr/openapi/v1/EVcharge.do?metroCd=11&cityCd=11&apiKey=Ve7lfI30PMG2ue5L56UkiEr4qyhK7AIS5H955w6h&returnType=json

  console.log("KEPCO API URL:", url); // 호출 URL 확인

  try {
    const { data } = await axios.get(url);
    console.log("KEPCO API 응답 데이터:", data); // 응답 내용 확인
    res.json(data.data);
  } catch (e) {
    console.error('⚠ KEPCO API 에러:', e.message);
    res.status(500).json({ message: "충전소 데이터를 불러오지 못했습니다.", error: e.message });
>>>>>>> b23c98c2a476e4b1dcfed79bfa821ae48f33f6a2
  }
});

module.exports = router;
