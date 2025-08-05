const express = require('express');
const router = express.Router();
const conn = require('../config/db');
const bcrypt = require('bcrypt'); // bcrypt 추가 


// 문의글 작성 (저장)
router.post('/add', (req,res) => {
    const { 
           USER_ID, USER_NAME, EMAIL, TITLE, CONTENT,
    ANSWER, QS_DATE, QS_NUMBER, AS_DATE, UPDATE_DT, QS_ID
    } = req.body;
   
    const sql = `
        INSERT INTO USER_QUESTION
    (USER_ID, USER_NAME, EMAIL, TITLE, CONTENT, ANSWER, QS_DATE, QS_NUMBER, AS_DATE, UPDATE_DT, QS_ID)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    conn.query(sql,
    [USER_ID, USER_NAME, EMAIL, TITLE, CONTENT, ANSWER, QS_DATE, QS_NUMBER, AS_DATE, UPDATE_DT, QS_ID],
    (err, result) => {
      if (err) {
        console.error('DB 오류:', err);
        return res.status(500).json({ result: 'fail', msg: 'DB 오류' });
      }
      res.json({ result: 'success' });
    });
}); 

// 문의글 목록 조회
router.get('/list', (req, res) => {
  const sql = `SELECT * FROM USER_QUESTION ORDER BY QS_DATE DESC`;
  conn.query(sql, (err, rows) => {
    if (err) {
      console.error('DB 오류:', err);
      return res.status(500).json({ result: 'fail' });
    }
    res.json(rows);
  });
});



module.exsports = router;

// 문의글 수정 기능 
