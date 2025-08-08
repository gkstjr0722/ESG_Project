// backend/router/notice.js
const express = require('express');
const router = express.Router();
const conn = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

/* ===============================
   1) 업로드 설정 (공지 이미지/파일)
================================ */
const uploadDir = path.join(process.cwd(), 'uploads', 'notice');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    cb(null, `notice_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

/* ===============================
   2) 공지 등록
   - form-data: TITLE, CONTENT, WRITER_ID, WRITER_NAME, (file)
================================ */
router.post('/add', upload.single('file'), (req, res) => {
  const { WRITER_ID, WRITER_NAME, TITLE, CONTENT } = req.body;
  if (!WRITER_ID || !WRITER_NAME || !TITLE || !CONTENT) {
    return res.status(400).json({ result: 'fail', msg: '필수값 누락' });
  }

  const NOTICE_ID = `notice_${Date.now()}`;
  const NOTICE_DT = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const UPDATE_DT = null;
  const FILE_PATH = req.file ? `/uploads/notice/${req.file.filename}` : null;
  const VIEW_COUNT = 0;

  const sql = `
    INSERT INTO NOTICE_BOARD
      (WRITER_ID, WRITER_NAME, TITLE, CONTENT, NOTICE_DT, UPDATE_DT, FILE_PATH, VIEW_COUNT, NOTICE_ID)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  conn.query(
    sql,
    [WRITER_ID, WRITER_NAME, TITLE, CONTENT, NOTICE_DT, UPDATE_DT, FILE_PATH, VIEW_COUNT, NOTICE_ID],
    (err) => {
      if (err) {
        console.error('DB 오류[add]:', err);
        return res.status(500).json({ result: 'fail', msg: 'DB 오류' });
      }
      res.json({ result: 'success', noticeId: NOTICE_ID });
    }
  );
});

/* ===============================
   3) 공지 목록 (최신순)
================================ */
router.get('/list', (req, res) => {
  const sql = `SELECT * FROM NOTICE_BOARD ORDER BY NOTICE_DT DESC`;
  conn.query(sql, (err, rows) => {
    if (err) {
      console.error('DB 오류[list]:', err);
      return res.status(500).json({ result: 'fail', msg: 'DB 오류' });
    }
    res.json({ notices: rows || [] });
  });
});

/* ===============================
   4) (중요) 배너용 N개
   - 반드시 상세(:notice_id) 라우트보다 "위에" 있어야 함
================================ */
router.get('/banner', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '5', 10), 10); // 최대 10개
  // IS_PINNED 컬럼을 나중에 추가한다면 ORDER BY 앞에 'IS_PINNED DESC,' 붙이면 됨
  const sql = `
    SELECT NOTICE_ID, TITLE, NOTICE_DT
    FROM NOTICE_BOARD
    ORDER BY NOTICE_DT DESC
    LIMIT ?
  `;
  conn.query(sql, [limit], (err, rows) => {
    if (err) {
      console.error('DB 오류[banner]:', err);
      return res.status(500).json({ result: 'fail', msg: 'DB 오류' });
    }
    res.json({ notices: rows || [] });
  });
});

/* ===============================
   5) 공지 상세
================================ */
router.get('/:notice_id', (req, res) => {
  const { notice_id } = req.params;
  const sql = `SELECT * FROM NOTICE_BOARD WHERE NOTICE_ID = ?`;
  conn.query(sql, [notice_id], (err, rows) => {
    if (err) {
      console.error('DB 오류[detail]:', err);
      return res.status(500).json({ result: 'fail', msg: 'DB 오류' });
    }
    if (!rows || rows.length === 0) {
      return res.status(404).json({ result: 'fail', msg: 'NOT_FOUND' });
    }

    // 조회수 +1 (에러는 무시)
    conn.query('UPDATE NOTICE_BOARD SET VIEW_COUNT = VIEW_COUNT + 1 WHERE NOTICE_ID = ?', [notice_id], () => {});
    res.json({ notice: rows[0] });
  });
});

module.exports = router;
