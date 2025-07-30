const express = require('express');
const router = express.Router();
const conn = require('../config/db');
const bcrypt = require('bcrypt'); // 꼭 추가!!

// 관공업 로그인 (id, pw 확인)
router.post('/corp', (req, res) => {
  const { id, pw } = req.body;

  // 컬럼명 반드시 DB와 일치!
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
    // DB에 암호화된 비밀번호가 저장되어 있는지 확인!
    const isMatch = await bcrypt.compare(pw, user.pw);
    if (isMatch) {
      return res.json({ result: 'success' });
    } else {
      return res.json({ result: 'fail', msg: '비밀번호가 틀렸습니다.' });
    }
  });
});

module.exports = router;
