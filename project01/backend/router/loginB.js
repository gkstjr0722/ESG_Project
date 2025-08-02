const express = require('express');
const router = express.Router();
const conn = require('../config/db');
const bcrypt = require('bcrypt');

// 기업 로그인 (id, pw 확인)
router.post('/corp', (req, res) => {
  const { id, pw } = req.body;

  // pw는 비교할 때만 필요, SELECT는 id로만!
  const sql = "SELECT * FROM CORP_MEMBER WHERE id=?";

  conn.query(sql, [id], async (err, rows) => {
    if (err) {
      console.error('DB 에러:', err);
      return res.status(500).json({ result: 'fail', msg: 'DB 오류' });
    }
    if (rows.length === 0) {
      // ID 없음
      return res.json({ result: 'fail', msg: '아이디가 없습니다.' });
    }

    const user = rows[0];
    // DB의 암호화된 비밀번호와 입력받은 비번을 비교!
    const isMatch = await bcrypt.compare(pw, user.pw);

    if (isMatch) {
      // 로그인 성공
      return res.json({ result: 'success' });
    } else {
      // 비밀번호 불일치
      return res.json({ result: 'fail', msg: '비밀번호가 틀렸습니다.' });
    }
  });
});

module.exports = router;
