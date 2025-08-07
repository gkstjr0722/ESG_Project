// DB/router/usergR.js (관공업용 router 예시 전체)
// 반드시 프로젝트 내에 userg용 라우터 파일명과 경로에 맞게 수정하세요.
const express = require('express');
const router = express.Router();
const conn = require('../config/db');

// [1] POST: 관공업 회원 정보 조회
router.post('/userinfo_gov', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ msg: 'id 필요' });

  const sql = `
    SELECT id, corpName, ceo, dept, manager, phone, email, corpTel, address
    FROM GOV_MEMBER
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

// [2] PUT: 관공업 회원 정보 수정 (비밀번호 제외)
router.put('/update_gov', (req, res) => {
  const { id, corpName, ceo, dept, manager, phone, email, corpTel, address } = req.body;
  if (!id) return res.status(400).json({ msg: 'id 필요' });

  const sql = `
    UPDATE GOV_MEMBER
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

// [3] PUT: 비밀번호만 별도 수정 (관공업)
router.put('/password-update_gov', (req, res) => {
  const { id, newPassword } = req.body;
  if (!id || !newPassword) return res.status(400).json({ msg: 'id, newPassword 필요' });

  const sql = `UPDATE GOV_MEMBER SET pw=? WHERE id=?`;
  conn.query(sql, [newPassword, id], (err, result) => {
    if (err) return res.status(500).json({ msg: 'DB 오류' });
    if (result.affectedRows > 0) res.json({ result: 'success' });
    else res.status(404).json({ msg: '회원 정보 없음' });
  });
});

module.exports = router;

