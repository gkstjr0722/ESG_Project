const express = require('express');
const router = express.Router();
const conn = require('../config/db');

// 1. 문의글 목록 조회
router.get('/list', (req, res) => {
  const sql = `SELECT * FROM USER_QUESTION ORDER BY QS_DATE DESC`;
  conn.query(sql, (err, rows) => {
    if (err) {
      console.error('DB 오류:', err);
      return res.status(500).json({ result: 'fail', msg: 'DB 오류' });
    }
    res.json(rows); 
  });
});

// 2. 문의글 작성 (추가)
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
// (추가) 문의글 수정, 삭제 기능
// backend/router/inquiry.js
router.put('/edit/:qs_id', (req, res) => {
  const { qs_id } = req.params;
  const { TITLE, CONTENT, UPDATE_DT } = req.body;
  const sql = `
    UPDATE USER_QUESTION 
    SET TITLE = ?, CONTENT = ?, UPDATE_DT = ? 
    WHERE QS_ID = ?
  `;
  conn.query(sql, [TITLE, CONTENT, UPDATE_DT, qs_id], (err, result) => {
    if (err) return res.status(500).json({ result: 'fail', msg: 'DB 오류' });
    res.json({ result: 'success' });
  });
});


// 3. 상세 문의글 조회 (QS_ID로 단일 조회)
router.get('/:qs_id', (req, res) => {
  const { qs_id } = req.params;
  const sql = `SELECT * FROM USER_QUESTION WHERE QS_ID = ?`;
  conn.query(sql, [qs_id], (err, rows) => {
    if (err) {
      console.error('DB 오류:', err);
      return res.status(500).json({ result: 'fail', msg: 'DB 오류' });
    }
    if (rows.length === 0) {
      return res.status(404).json({ result: 'fail', msg: 'NOT_FOUND' });
    }
    res.json({ question: rows[0] });
  });
});





module.exports = router;
