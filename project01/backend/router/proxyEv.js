const express = require('express');
const axios = require('axios');
const router = express.Router();

// 1. 전기차 충전소 정보 조회 라우터 
router.get('/list', async (req, res) => {
  const { metroCd = '11', cityCd = '11' } = req.query; 
  const apiKey = 'Ve7lfI30PMG2ue5L56UkiEr4qyhK7AIS5H955w6h';
  const url = `https://bigdata.kepco.co.kr/openapi/v1/EVcharge.do?metroCd=${metroCd}&cityCd=${cityCd}&apiKey=${apiKey}&returnType=json`;
  try {
    const { data } = await axios.get(url);
    res.json(data.data);
  } catch (e) {
    console.error('KEPCO API 에러:', e);   // 에러 로그 출력 
    res.status(500).json({ message: "충전소 데이터를 불러오지 못했습니다." });
  }
});
module.exports = router;

// 2025-08-08 코드 수정 완료