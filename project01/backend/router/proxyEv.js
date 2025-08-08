const express = require('express');
const axios = require('axios');
const router = express.Router();

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
  }
});

module.exports = router;
