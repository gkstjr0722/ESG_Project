const express = require('express');
const router = express.Router();
const conn = require('../config/db');

// 1. 문의글 목록 조회 라우터 
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

// 2. 문의글 작성 라우터 (추가)
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

// 3. 문의글 수정 + 이전 이력 백업 기능 라우터 
router.put('/edit/:qs_id', (req, res) => {
  const { qs_id } = req.params;
  const { TITLE, CONTENT, UPDATE_DT } = req.body;

  // (1). 현재 글 정보 SELECT (이전 데이터 백업용)
  const selectSql = `SELECT * FROM USER_QUESTION WHERE QS_ID = ?`;
  conn.query(selectSql, [qs_id], (err, rows) => {
    if (err) return res.status(500).json({ result: 'fail', msg: 'DB 오류(SELECT)' });
    if (rows.length === 0) return res.status(404).json({ result: 'fail', msg: 'NOT_FOUND' });

    const origin = rows[0];
    // (2). 백업 데이터 INSERT (수정 전 데이터 전체 복사)
    const EDIT_ID = 'edit_' + Date.now();
    const EDIT_DT = UPDATE_DT;

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
        // 백업 실패해도 수정은 계속 진행할 수 있도록 함 
      }

      // (3). 실제 글 UPDATE
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

// 4. 상세 문의글 조회 라우터 (QS_ID로 단일 조회 + 조회수 증가)
router.get('/:qs_id', (req, res) => {
  const { qs_id } = req.params;

  // (1). 조회수 증가
  const increaseSql = `UPDATE USER_QUESTION SET VIEWS = VIEWS + 1 WHERE QS_ID = ?`;
  conn.query(increaseSql, [qs_id], (err) => {
    if (err) {
      console.error('조회수 증가 오류:', err);
      // -> 에러 무시하고 글 정보만 보여줌
    }

    // (2). 글 정보 가져오기
    const sql = `SELECT * FROM USER_QUESTION WHERE QS_ID = ?`;
    conn.query(sql, [qs_id], (err2, rows) => {
      if (err2) {
        console.error('DB 오류:', err2);
        return res.status(500).json({ result: 'fail', msg: 'DB 오류' });
      }
      if (rows.length === 0) {
        return res.status(404).json({ result: 'fail', msg: 'NOT_FOUND' });
      }
      res.json({ question: rows[0] });
    });
  });
});

// 5. 문의글 삭제 기능 라우터 (QS_ID 기준으로 삭제)
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

// 6. 고객문의글 답변 가능 기능(관리자만 가능) 라우터
router.post('/answer/:qs_id', (req, res) => {
  const { qs_id } = req.params;
  const { ANSWER } = req.body;

  if (!ANSWER || !qs_id) {
    return res.status(400).json({ result: 'fail', msg: '필수값 누락' });
  }

  const sql = 'UPDATE USER_QUESTION SET ANSWER = ?, AS_DATE = NOW() WHERE QS_ID = ?';
  conn.query(sql, [ANSWER, qs_id], (err, result) => {
    if (err) {
      console.error('DB 오류(답변등록):', err);
      return res.status(500).json({ result: 'fail', msg: 'DB 오류(답변등록)' });
    }
    res.json({ result: 'success' });
  });
});

// 7. FAQ(자주묻는질문) - 문의글 중 조회수 Top5 반환(mysql연동용)
router.get('/faq/top', (req, res) => {
  const sql = `
    SELECT QS_ID, TITLE, CONTENT, ANSWER, QS_DATE, VIEWS
    FROM USER_QUESTION
    WHERE VIEWS > 0
    ORDER BY VIEWS DESC
    LIMIT 5
  `;
  conn.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ result: 'fail', msg: 'DB 오류' });
    res.json(rows);
  });
});

module.exports = router;
// 수정 
// 2025-08-08 코드 수정 완료 
// 수정 
// 수정 