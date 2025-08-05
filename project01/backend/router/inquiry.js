const express = require('express');
const router = express.Router();
const conn = require('../config/db');

// 문의글 목록 조회
router.get('/list', (req, res) => {
  const sql = `SELECT * FROM USER_QUESTION ORDER BY QS_DATE DESC`;
  conn.query(sql, (err, rows) => {
    if (err) {
      console.error('DB 오류:', err);
      return res.status(500).json({ result: 'fail' });
    }
    res.json(rows); // 프론트는 res.data로 받아서 사용
  });
});

// 문의글 작성 (추가)
router.post('/add', (req, res) => {
  const {
    USER_ID, USER_NAME, EMAIL, TITLE, CONTENT,
    ANSWER, QS_DATE, QS_NUMBER, AS_DATE, UPDATE_DT, QS_ID
  } = req.body;

  const sql = `
    INSERT INTO USER_QUESTION
    (USER_ID, USER_NAME, EMAIL, TITLE, CONTENT, ANSWER, QS_DATE, QS_NUMBER, AS_DATE, UPDATE_DT, QS_ID)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  conn.query(
    sql,
    [USER_ID, USER_NAME, EMAIL, TITLE, CONTENT, ANSWER, QS_DATE, QS_NUMBER, AS_DATE, UPDATE_DT, QS_ID],
    (err, result) => {
      if (err) {
        console.error('DB 오류:', err);
        return res.status(500).json({ result: 'fail', msg: 'DB 오류' });
      }
      res.json({ result: 'success' });
    }
  );
});

// 상세 문의글 조회 (QS_ID로 단일 조회)
router.get('/:qs_id', (req, res) => {
  const { qs_id } = req.params;
  const sql = `SELECT * FROM USER_QUESTION WHERE QS_ID = ?`;
  conn.query(sql, [qs_id], (err, rows) => {
    if (err) {
      console.error('DB 오류:', err);
      return res.status(500).json({ result: 'fail' });
    }
    if (rows.length === 0) {
      return res.status(404).json({ result: 'fail', msg: 'NOT_FOUND' });
    }
    res.json(rows[0]); // 한 건만 반환!
  });
});

// 문의글 수정 기능 
module.exports = router;
