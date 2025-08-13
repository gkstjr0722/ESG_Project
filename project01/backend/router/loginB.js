// 기업 로그인 관련 js 
const express = require('express');
const router = express.Router();
const conn = require('../config/db');
const bcrypt = require('bcrypt');

// 1. 기업 로그인 기능 라우터 (id, pw 확인)
router.post('/corp', (req, res) => {
  const { id, pw } = req.body;
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

    // 기업 계정 탈퇴 시 로그인 불가 
    if ( user.IS_DELETED === 1 ) {
      return res.json({ result: 'fail', msg: '탈퇴 처리된  계정입니다.' });
    }

    const isMatch = await bcrypt.compare(pw, user.pw);

    if (isMatch) {
      // 로그인 성공 시  - 정보도 같이 응답
      return res.json({
        result: 'success',
        id: user.id,             // 아이디
        userName: user.manager,  // 담당자명
        email: user.email,       // 이메일
      });
    } else {
      // 비밀번호 불일치 시 
      return res.json({ result: 'fail', msg: '비밀번호가 틀렸습니다.' });
    }
  });

});

module.exports = router;

// 2025-08-08 코드 수정 완료 
