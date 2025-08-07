const express = require('express');
const router = express.Router();
const conn = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 업로드 폴더 자동생성
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/notice';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, 'notice_' + Date.now() + ext);
  }
});
const upload = multer({ storage });

// ========== 공지 등록 ==========
router.post('/add', upload.single('file'), (req, res) => {
  const {
    WRITER_ID, WRITER_NAME, TITLE, CONTENT
  } = req.body;

  const NOTICE_ID = 'notice_' + Date.now();
  const NOTICE_DT = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const UPDATE_DT = null; // 최초 등록 시 null
  const FILE_PATH = req.file ? `/uploads/notice/${req.file.filename}` : null;
  const VIEW_COUNT = 0;

  const sql = `
    INSERT INTO NOTICE_BOARD
    (WRITER_ID, WRITER_NAME, TITLE, CONTENT, NOTICE_DT, UPDATE_DT, FILE_PATH, VIEW_COUNT, NOTICE_ID)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  conn.query(sql, [
    WRITER_ID, WRITER_NAME, TITLE, CONTENT, NOTICE_DT, UPDATE_DT, FILE_PATH, VIEW_COUNT, NOTICE_ID
  ], (err, result) => {
    if (err) {
      console.error('DB 오류:', err);
      return res.status(500).json({ result: 'fail', msg: 'DB 오류' });
    }
    res.json({ result: 'success' });
  });
});

// ========== 공지 목록 ==========
router.get('/list', (req, res) => {
  const sql = `SELECT * FROM NOTICE_BOARD ORDER BY NOTICE_DT DESC`;
  conn.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ result: 'fail', msg: 'DB 오류' });
    res.json({ notices: rows });
  });
});

// ========== 단일 공지 상세 ==========
router.get('/:notice_id', (req, res) => {
  const { notice_id } = req.params;
  const sql = `SELECT * FROM NOTICE_BOARD WHERE NOTICE_ID = ?`;
  conn.query(sql, [notice_id], (err, rows) => {
    if (err) return res.status(500).json({ result: 'fail', msg: 'DB 오류' });
    if (!rows || rows.length === 0) {
      return res.status(404).json({ result: 'fail', msg: 'NOT_FOUND' });
    }
    res.json({ notice: rows[0] });
  });
});

module.exports = router;
