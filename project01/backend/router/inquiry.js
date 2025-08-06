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
// 문의글 수정 + 수정 히스토리 저장
router.put('/edit/:qs_id', (req, res) => {
  const { qs_id } = req.params;
  const { TITLE, CONTENT, UPDATE_DT, EDITOR_ID, EDITOR_NAME } = req.body;

  // 1. USER_QUESTION 테이블 UPDATE (실제 글 수정)
  const updateSql = `
    UPDATE USER_QUESTION 
    SET TITLE = ?, CONTENT = ?, UPDATE_DT = ? 
    WHERE QS_ID = ?
  `;
  conn.query(updateSql, [TITLE, CONTENT, UPDATE_DT, qs_id], (err, result) => {
    if (err) return res.status(500).json({ result: 'fail', msg: 'DB 오류(수정)' });

    // 2. QUESTION_EDIT 테이블 INSERT (히스토리 기록)
    const EDIT_ID = 'edit_' + Date.now(); // 예시: edit_1691234567890
    const insertSql = `
      INSERT INTO QUESTION_EDIT
      (EDIT_ID, QS_ID, EDITOR_ID, EDITOR_NAME, EDIT_TITLE, EDIT_CONTENT, EDIT_DT)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    conn.query(insertSql,
      [EDIT_ID, qs_id, EDITOR_ID, EDITOR_NAME, TITLE, CONTENT, UPDATE_DT],
      (err2, result2) => {
        if (err2) {
          console.error('수정 이력 저장 실패:', err2);
          // 메인 글은 수정 성공, 히스토리만 실패
          return res.json({ result: 'partial_success', msg: '글은 수정됐으나 히스토리 저장 실패' });
        }
        res.json({ result: 'success' });
      }
    );
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


// 5. 문의글 삭제 (QS_ID 기준)
router.delete('/delete/:qs_id', (req, res) => {
  const { qs_id } = req.params;
  const sql = `DELETE FROM USER_QUESTION WHERE QS_ID = ?`;
  conn.query(sql, [qs_id], (err, result) => {
    if (err) {
      console.error('DB 오류:', err);
      return res.status(500).json({ result: 'fail', msg: 'DB 오류' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ result: 'fail', msg: 'NOT_FOUND' });
    }
    res.json({ result: 'success' });
  });
});


module.exports = router;
