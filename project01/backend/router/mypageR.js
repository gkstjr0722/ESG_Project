// DB/router/usercR.js
const express = require('express');
const router = express.Router();
const conn = require('../config/db');

// [1] POST: 기업 회원 정보 조회
router.post('/userinfo', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ msg: 'id 필요' });

  const sql = `
    SELECT 
      id, corpName, corpRegNum, ceo, dept, manager, phone, email, corpTel, address, bizCert
    FROM CORP_MEMBER
    WHERE id = ?
  `;
  conn.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ msg: 'DB 오류' });
    if (results.length > 0) {
      res.json({ user: results[0] });
    } else {
      res.status(404).json({ msg: '회원 정보 없음' });
    }
  });
});

// [2] PUT: 기업 회원 정보 수정 (비밀번호, bizCert 제외)
router.put('/update', (req, res) => {
  const { id, corpName, corpRegNum, ceo, dept, manager, phone, email, corpTel, address } = req.body;
  if (!id) return res.status(400).json({ msg: 'id 필요' });

  const sql = `
    UPDATE CORP_MEMBER
    SET corpName=?, corpRegNum=?, ceo=?, dept=?, manager=?, phone=?, email=?, corpTel=?, address=?
    WHERE id=?
  `;
  const values = [corpName, corpRegNum, ceo, dept, manager, phone, email, corpTel, address, id];

  conn.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ msg: 'DB 오류' });
    if (result.affectedRows > 0) res.json({ result: 'success' });
    else res.status(404).json({ msg: '회원 정보 없음' });
  });
});

// [3] PUT: 비밀번호만 별도 수정 (기업)
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

// 수정 완료