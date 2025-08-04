// routes/proxyEvRouter.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/list', async (req, res) => {
  const { metroCd = '11', cityCd = '11' } = req.query; // 서울 기본
  const apiKey = 'Ve7lfI30PMG2ue5L56UkiEr4qyhK7AIS5H955w6h';
  const url = `https://bigdata.kepco.co.kr/openapi/v1/EVcharge.do?metroCd=${metroCd}&cityCd=${cityCd}&apiKey=${apiKey}&returnType=json`;
  try {
    const { data } = await axios.get(url);
    res.json(data.data); // 충전소 배열만 전달
  } catch (e) {
    res.status(500).json({ message: "충전소 데이터를 불러오지 못했습니다." });
  }
});
module.exports = router;
