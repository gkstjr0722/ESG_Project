const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');

// 1. 관공업 회원정보 조회 기능 라우터 
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

// 2. 관공업 회원 정보 수정 기능 라우터
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

// 3. 비밀번호 변경 (관공업)
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

// 4. 관공업 회원가입 (government_users 테이블)
router.post('/join_gov', async (req, res) => {
  try {
    const {
      corpName,       
      ceo,             
      dept,           
      manager,         
      phone,          
      email,          
      corpTel,         
      address,         
      id,             
      pw               
    } = req.body;

    // (1) 필수값 검증
    if (!corpName || !ceo || !manager || !phone || !email || !address || !id || !pw) {
      return res.status(400).json({ result: 0, message: '필수값 누락' });
    }

    // (2) ID 중복 체크 (PK라 DB가 막아주긴 하지만, 사전 체크로 친절하게 메시지 제공)
    const dupSql = 'SELECT 1 FROM government_users WHERE id = ?';
    db.query(dupSql, [id], async (dupErr, dupRows) => {
      if (dupErr) {
        console.error('[join_gov] 중복체크 오류:', dupErr);
        return res.status(500).json({ result: 0, message: 'DB 오류(중복검사)' });
      }
      if (dupRows.length > 0) {
        return res.status(409).json({ result: 0, message: '이미 존재하는 ID입니다.' });
      }

      // (3) 비밀번호 해시
      let hashedPw;
      try {
        hashedPw = await bcrypt.hash(pw, 10);
      } catch (hashErr) {
        console.error('[join_gov] bcrypt 오류:', hashErr);
        return res.status(500).json({ result: 0, message: '비밀번호 암호화 실패' });
      }

      // (4) INSERT (reg_date는 DEFAULT CURRENT_TIMESTAMP)
      const insertSql = `
        INSERT INTO government_users
          (corpName, ceo, dept, manager, phone, email, corpTel, address, id, pw)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        corpName,
        ceo,
        dept ?? null,
        manager,
        phone,
        email,
        corpTel ?? null,
        address,
        id,
        hashedPw
      ];

      db.query(insertSql, params, (insErr, result) => {
        if (insErr) {
          console.error('[join_gov] DB INSERT 오류:', insErr);
          // PK 충돌 등
          if (insErr.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ result: 0, message: '이미 존재하는 ID입니다.' });
          }
          return res.status(500).json({ result: 0, message: 'DB 오류(회원가입)' });
        }
        return res.json({ result: 1, message: '회원가입 성공' });
      });
    });
  } catch (e) {
    console.error('[join_gov] 서버 오류:', e);
    return res.status(500).json({ result: 0, message: '서버 오류' });
  }
});

module.exports = router;

// 2025-08-08 코드 수정 완료
