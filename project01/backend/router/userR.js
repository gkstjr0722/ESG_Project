const express = require('express');
const router = express.Router();
const conn = require('../config/db');
const multer = require('multer');
const bcrypt = require('bcrypt'); // bcrypt 추가!
const upload = multer({ dest: 'uploads/' }); // uploads 폴더 자동생성

router.post('/joinCorp', upload.single('bizCert'), async (req, res) => {
  try {
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);
    const {
      corpName, corpRegNum, ceo, dept,
      manager, phone, email, corpTel, address,
      id, pw
    } = req.body;

    const bizCertPath = req.file ? req.file.path : null;

    // --- 비밀번호 암호화 적용! ---
    const hashedPw = await bcrypt.hash(pw, 10);
    console.log('암호화된 pw:', hashedPw);

    const sql = `
      INSERT INTO CORP_MEMBER
      (corpName, corpRegNum, ceo, dept, manager, phone, email, corpTel, address, id, pw, bizCert)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    conn.query(
      sql,
      [corpName, corpRegNum, ceo, dept, manager, phone, email, corpTel, address, id, hashedPw, bizCertPath],
      (err, result) => {
        if (err) {
          console.error('DB 저장 실패:', err);
          return res.status(500).json({ result: 'fail' });
        }
        res.json({ result: 'success' });
      }
    );
  } catch (e) {
    console.error('서버 에러:', e);
    res.status(500).json({ result: 'fail' });
  }
});

module.exports = router;