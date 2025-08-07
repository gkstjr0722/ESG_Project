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

// 문의글 수정 + 이전 이력 백업
router.put('/edit/:qs_id', (req, res) => {
  const { qs_id } = req.params;
  const { TITLE, CONTENT, UPDATE_DT,  } = req.body;

  // 1. 현재 글 정보 SELECT (이전 데이터 백업용)
  const selectSql = `SELECT * FROM USER_QUESTION WHERE QS_ID = ?`;
  conn.query(selectSql, [qs_id], (err, rows) => {
    if (err) return res.status(500).json({ result: 'fail', msg: 'DB 오류(SELECT)' });
    if (rows.length === 0) return res.status(404).json({ result: 'fail', msg: 'NOT_FOUND' });

    const origin = rows[0];
    // 2. 백업 데이터 INSERT (수정 전 데이터 전체 복사)
    const EDIT_ID = 'edit_' + Date.now();
    const EDIT_DT = UPDATE_DT;  // 수정 시각을 히스토리에도 사용

    const insertSql = `
      INSERT INTO QUESTION_EDIT (
        EDIT_ID, QS_ID, USER_ID, USER_NAME, EMAIL, TITLE, CONTENT, ANSWER,
        QS_DATE, QS_NUMBER, AS_DATE, UPDATE_DT, EDIT_DT
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      EDIT_ID,
      origin.QS_ID,
      origin.USER_ID,
      origin.USER_NAME,
      origin.EMAIL,
      origin.TITLE,
      origin.CONTENT,
      origin.ANSWER,
      origin.QS_DATE,
      origin.QS_NUMBER,
      origin.AS_DATE,
      UPDATE_DT,
      EDIT_DT
    ];

    conn.query(insertSql, values, (err2, result2) => {
      if (err2) {
        console.error('이전 버전 백업 실패:', err2);
        // 백업 실패해도 수정은 계속 진행할 수 있도록
      }

      // 3. 실제 글 UPDATE
      const updateSql = `
        UPDATE USER_QUESTION SET TITLE = ?, CONTENT = ?, UPDATE_DT = ?
        WHERE QS_ID = ?
      `;
      conn.query(updateSql, [TITLE, CONTENT, UPDATE_DT, qs_id], (err3, result3) => {
        if (err3) return res.status(500).json({ result: 'fail', msg: 'DB 오류(UPDATE)' });

        res.json({ result: 'success' });
      });
    });
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
