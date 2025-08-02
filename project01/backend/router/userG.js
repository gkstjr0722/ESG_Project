const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');

router.post('/joinGovernment', async (req, res) => {
  try {
    const {
      corpName, ceo, dept, manager,
      phone, email, corpTel, address,
      id, pw // 프론트에서 보내는 변수 그대로!
    } = req.body;

    // 필수값 체크
    if (!corpName || !ceo || !manager || !phone || !email || !address || !id || !pw) {
      return res.status(400).json({ result: 0, message: "필수값 누락" });
    }

    // 비밀번호 암호화
    const hashedPw = await bcrypt.hash(pw, 10);

    const sql = `
      INSERT INTO government_users
      (corpName, ceo, dept, manager, phone, email, corpTel, address, id, pw)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql,
      [corpName, ceo, dept, manager, phone, email, corpTel, address, id, hashedPw],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ result: 0, message: "DB 오류" });
        }
        return res.json({ result: 1, message: "회원가입 성공" });
      });
  } catch (e) {
    console.error(e);
    res.status(500).json({ result: 0, message: "서버 오류" });
  }
});

// 관공업 회원정보 조회 (마이페이지용)
router.post('/userinfo_gov', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ result: 0, message: "ID 누락" });

  const sql = "SELECT * FROM government_users WHERE id = ?";
  db.query(sql, [id], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ result: 0, message: "DB 오류" });
    }
    if (rows.length === 0) {
      return res.json({ result: 0, message: "회원정보 없음" });
    }
    // 비밀번호 등 민감 정보 제외
    const user = { ...rows[0] };
    delete user.pw;
    res.json({ result: 1, user });
  });
});

module.exports = router;
