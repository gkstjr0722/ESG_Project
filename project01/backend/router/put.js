// router/mypageR.js
const express = require('express');
const router = express.Router();
const conn = require('../config/db');

// 회원 정보 업데이트 (기업 or 관공업)
router.put('/putR', (req, res) => {
  const {
    type,     // 'corp' 또는 'gov'
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

  if (!id || !type) return res.status(400).json({ msg: 'id, type 필요' });

  // 어떤 테이블을 수정할지 구분
  let tableName;
  if (type === 'corp') {
    tableName = 'CORP_MEMBER';
  } else if (type === 'gov') {
    tableName = 'GOVERNMENT_USERS';
  } else {
    return res.status(400).json({ msg: 'type 값 오류' });
  }

  const sql = `
    UPDATE ${tableName}
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
