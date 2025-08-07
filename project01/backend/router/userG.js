const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');

// 관공업 회원정보 조회
router.post('/userinfo_gov', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ result: 0, message: "ID 누락" });

  const sql = "SELECT corpName, ceo, dept, manager, phone, email, corpTel, address, id FROM government_users WHERE id = ?";
  db.query(sql, [id], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ result: 0, message: "DB 오류" });
    }
    if (rows.length === 0) {
      return res.json({ result: 0, message: "회원정보 없음" });
    }
    const user = { ...rows[0] };
    res.json({ result: 1, user });
  });
});

// 관공업 회원 정보 수정
router.put('/update_gov', (req, res) => {
  const {
    id,
    corpName, ceo, dept, manager,
    phone, email, corpTel, address
  } = req.body;
  if (!id) return res.status(400).json({ result: 0, message: "ID 누락" });

  console.log('[update_gov] req.body:', req.body);

  const sql = `
    UPDATE government_users
    SET corpName=?, ceo=?, dept=?, manager=?, phone=?, email=?, corpTel=?, address=?
    WHERE id=?
  `;
  const params = [corpName, ceo, dept, manager, phone, email, corpTel, address, id];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ result: 0, message: "DB 오류" });
    }
    if (result.affectedRows > 0) {
      res.json({ result: 1, message: "정보수정 성공" });
    } else {
      res.status(404).json({ result: 0, message: "회원정보 없음" });
    }
  });
});

// 비밀번호 변경 (관공업)
router.put('/update_gov_pw', async (req, res) => {
  const { id, newPassword } = req.body;
  if (!id || !newPassword) return res.status(400).json({ result: 0, message: "필수값 누락" });

  const hash = await bcrypt.hash(newPassword, 10);

  db.query(
    "UPDATE government_users SET pw=? WHERE id=?",
    [hash, id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ result: 0, message: "DB 오류" });
      }
      if (result.affectedRows > 0) {
        res.json({ result: 1, message: "비밀번호 변경 성공" });
      } else {
        res.status(404).json({ result: 0, message: "회원정보 없음" });
      }
    }
  );
});

module.exports = router;
