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

// 관공업용 로그인 라우터 추가
router.post('/loginG', async (req, res) => {
  const { id, pw } = req.body;
  if (!id || !pw) return res.status(400).json({ result: 0, message: "누락" });
  const sql = "SELECT * FROM government_users WHERE id = ?";
  db.query(sql, [id], async (err, rows) => {
    if (err) return res.status(500).json({ result: 0, message: "DB 오류" });
    if (!rows.length) return res.json({ result: 0, message: "아이디 없음" });
    const match = await bcrypt.compare(pw, rows[0].pw);
    if (!match) return res.json({ result: 0, message: "비밀번호 불일치" });
    const user = { ...rows[0] }; delete user.pw;
    res.json({ result: 1, user });
  });
});

// 관공업 회원 정보 수정 라우터 추가
router.put('/update_gov', (req, res) => {
  const {
    id,
    corpName, ceo, dept, manager,
    phone, email, corpTel, address
  } = req.body;

  if (!id) return res.status(400).json({ result: 0, message: "ID 누락" });

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

// 비밀번호 변경 (관공업) 라우터 추가
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

// 테스트