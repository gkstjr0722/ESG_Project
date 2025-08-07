// DB/router/mypageR.js
const express = require('express');
const router = express.Router();
const conn = require('../config/db');

// [1] POST: 사용자 정보 조회 (실제 구현 부분이 빠져 있음, 주석처리)
    // res.status(404).json({ msg: '회원 정보 없음' });

// [2] PUT: 회원 정보 수정 (비번 제외)
router.put('/update', (req, res) => {
  const { id, corpName, ceo, dept, manager, phone, email, corpTel, address } = req.body;
  if (!id) return res.status(400).json({ msg: 'id 필요' });

  const sql = `
    UPDATE CORP_MEMBER
    SET corpName=?, ceo=?, dept=?, manager=?, phone=?, email=?, corpTel=?, address=?
    WHERE id=?
  `;
  const values = [corpName, ceo, dept, manager, phone, email, corpTel, address, id];

  conn.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ msg: 'DB 오류' });
    if (result.affectedRows > 0) res.json({ result: 'success' });
    else res.status(404).json({ msg: '회원 정보 없음' });
  });
});

// [3] PUT: 비밀번호만 별도 수정
router.put('/password-update', (req, res) => {
  const { id, newPassword } = req.body;
  if (!id || !newPassword) return res.status(400).json({ msg: 'id, newPassword 필요' });

  const sql = `UPDATE CORP_MEMBER SET pw=? WHERE id=?`;
  conn.query(sql, [newPassword, id], (err, result) => {
    if (err) return res.status(500).json({ msg: 'DB 오류' });
    if (result.affectedRows > 0) res.json({ result: 'success' });
    else res.status(404).json({ msg: '회원 정보 없음' });
  });
});

module.exports = router;
