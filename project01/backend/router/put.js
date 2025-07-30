// router/mypageR.js
const express = require('express');
const router = express.Router();
const conn = require('../config/db');

// 회원 정보 업데이트
router.put('/putR', (req, res) => {
  const {
    id,
    corpName,
    ceo,
    dept,
    manager,
    phone,
    email,
    corpTel,
    address
  } = req.body;

  // **id는 로그인한 사용자 기준!**
  if (!id) return res.status(400).json({ msg: 'id 필요' });

  const sql = `
    UPDATE CORP_MEMBER
    SET corpName=?, ceo=?, dept=?, manager=?, phone=?, email=?, corpTel=?, address=?
    WHERE id=?
  `;
  const values = [corpName, ceo, dept, manager, phone, email, corpTel, address, id];

  conn.query(sql, values, (err, result) => {
    if (err) {
      console.error('DB update 오류:', err);
      return res.status(500).json({ msg: 'DB 오류' });
    }
    if (result.affectedRows > 0) {
      res.json({ result: 'success' });
    } else {
      res.status(404).json({ msg: '회원 정보 없음' });
    }
  });
});

module.exports = router;
