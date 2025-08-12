// 메인 페이지 js 
const express = require('express');
const router = express.Router();
const conn = require('../config/db');

// 1. 메인 페이지
router.post('/', (req, res) => {
  res.send('메인 페이지입니다!');
});

// 예시: 사용자 전체 목록 출력
router.post('/users', (req, res) => {
  conn.query('SELECT * FROM users', (err, rows) => {
    if (err) return res.status(500).send('DB 오류');
    res.json(rows);
  });
});

module.exports = router;

// 2025-08-08 코드 수정 완료 