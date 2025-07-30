const express = require('express');
const router = express.Router();
const conn = require('../config/db');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // uploads 폴더 자동생성

router.post('/joinCorp', upload.single('bizCert'), (req, res) => {
    console.log('req.body:', req.body);
  console.log('req.file:', req.file);
  const {
    corpName, corpRegNum, ceo, dept,
    manager, phone, email, corpTel, address,
    id, pw
  } = req.body;

  const bizCertPath = req.file ? req.file.path : null;

  const sql = `
    INSERT INTO CORP_MEMBER
    (corpName, corpRegNum, ceo, dept, manager, phone, email, corpTel, address, id, pw, bizCert)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  conn.query(
    sql,
    [corpName, corpRegNum, ceo, dept, manager, phone, email, corpTel, address, id, pw, bizCertPath],
    (err, result) => {
      if (err) {
        console.error('DB 저장 실패:', err); // 이 부분 터미널에서 꼭 확인!
        return res.status(500).json({ result: 'fail' });
      }
      res.json({ result: 'success' });
    }
  );
});

module.exports = router;
