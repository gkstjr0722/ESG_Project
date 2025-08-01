// DB/router/loginB.js
const express = require('express');
const router = express.Router();
const conn = require('../config/db');


// 기업 로그인 (id, pw 확인)
router.post('/corp', (req, res) => {
  const { id, pw } = req.body;

  const sql = "SELECT * FROM CORP_MEMBER WHERE id=? AND pw=?";
  conn.query(sql, [id, pw], (err, rows) => {
    if (err) {
      console.error('DB 에러:', err);
      return res.status(500).json({ result: 'fail', msg: 'DB 오류' });
    }
    if (rows.length > 0) {
      // 로그인 성공
      return res.json({ result: 'success' });
    } else {
      // 로그인 실패
      return res.json({ result: 'fail', msg: '로그인 실패' });
    }
  });
});

module.exports = router;
