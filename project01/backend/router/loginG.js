const express = require('express');
const router = express.Router();
const conn = require('../config/db');
const bcrypt = require('bcrypt'); 

// 1. 관공업 로그인 기능 라우터 (id, pw 확인)
router.post('/corp', (req, res) => {
  const { id, pw } = req.body;

  const sql = "SELECT * FROM government_users WHERE id=?";

  conn.query(sql, [id], async (err, rows) => {
    if (err) {
      console.error('DB 오류:', err);
      return res.status(500).json({ result: 'fail', msg: 'DB 오류' });
    }
    if (rows.length === 0) {
      return res.json({ result: 'fail', msg: '아이디가 없습니다.' });
    }
    const user = rows[0];
    const isMatch = await bcrypt.compare(pw, user.pw);  
    if (isMatch) {
      return res.json({
        result: 'success',
        id: user.id,
        userName: user.manager,   
        email: user.email,
      });
    } else {
      return res.json({ result: 'fail', msg: '비밀번호가 틀렸습니다.' });
    }
  });
});

module.exports = router;

// 2025-08-08 코드 수정 완료 
