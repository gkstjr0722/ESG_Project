// backend/router/fast.js
const express = require('express');
const axios = require('axios');

const router = express.Router();
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';

router.get('/health', async (_req, res) => {
  try {
    const { data } = await axios.get(`${FASTAPI_URL}/health`, { timeout: 5000 });
    res.json({ result: 'success', data });
  } catch (err) {
    res.status(502).json({
      result: 'fail',
      message: 'FastAPI health check failed',
      detail: err?.response?.data || err.message,
    });
  }
});

router.post('/predict', async (req, res) => {
  try {
    const { data } = await axios.post(`${FASTAPI_URL}/predict`, req.body, {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });
    res.json({ result: 'success', data });
  } catch (err) {
    const status = err?.response?.status || 502;
    res.status(status).json({
      result: 'fail',
      message: 'AI 예측 서버 통신 실패',
      detail: err?.response?.data || err.message,
    });
  }
});

module.exports = router;
