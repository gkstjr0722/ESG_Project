// 공지사항 관련 js 
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

// 6. 공지사항글 수정 라우터 ( admin 관리자 전용 기능 )
router.put('/:notice_id', upload.single('file'), (req, res) => {
  const { notice_id } = req.params;
  const {
    TITLE,
    CONTENT,
    EDITOR_ID,
    EDITOR_NAME,
    WRITER_ID,
    WRITER_NAME,
    CLEAR_FILE,
  } = req.body;

  // admin만 허용 (둘 중 하나로 넘어와도 admin인지 확인)
  const editorId = (EDITOR_ID || WRITER_ID || '').trim();
  const editorName = (EDITOR_NAME || WRITER_NAME || '').trim();

  if (editorId !== 'admin') {
    return res.status(403).json({ ok: false, message: '관리자(admin)만 수정 가능' });
  }
  if (!TITLE || !CONTENT) {
    return res.status(400).json({ ok: false, message: '제목/내용은 필수' });
  }

  // 1) 기존 파일경로 조회
  const selectSql = `SELECT FILE_PATH FROM NOTICE_BOARD WHERE NOTICE_ID = ?`;
  conn.query(selectSql, [notice_id], (selErr, selRows) => {
    if (selErr) {
      console.error('DB 오류[update:select]:', selErr);
      return res.status(500).json({ ok: false, message: 'DB 오류' });
    }
    if (!selRows || selRows.length === 0) {
      return res.status(404).json({ ok: false, message: 'NOT_FOUND' });
    }

    const oldFilePath = selRows[0].FILE_PATH || null;
    let newFilePath = oldFilePath;

    // 2) 파일 교체/삭제 처리
    if (req.file) {
      newFilePath = `/uploads/notice/${req.file.filename}`;
    }
    if (!req.file && (CLEAR_FILE === '1' || CLEAR_FILE === 'true')) {
      newFilePath = null;
    }

    // 3) UPDATE
    const fileChanged = newFilePath !== oldFilePath;
    const updateSql = fileChanged
      ? `UPDATE NOTICE_BOARD SET TITLE=?, CONTENT=?, UPDATE_DT=NOW(), FILE_PATH=? WHERE NOTICE_ID=?`
      : `UPDATE NOTICE_BOARD SET TITLE=?, CONTENT=?, UPDATE_DT=NOW() WHERE NOTICE_ID=?`;

    const updateParams = fileChanged
      ? [TITLE, CONTENT, newFilePath, notice_id]
      : [TITLE, CONTENT, notice_id];

    conn.query(updateSql, updateParams, (updErr) => {
      if (updErr) {
        console.error('DB 오류[update]:', updErr);
        return res.status(500).json({ ok: false, message: 'DB 오류' });
      }

      // 4) 수정 이력 기록 (NOTICE_EDIT)
      const EDIT_ID = `edit_${Date.now()}`;
      const editSql = `
        INSERT INTO NOTICE_EDIT
          (EDIT_ID, NT_ID, EDITOR_ID, EDITOR_NAME, EDIT_TITLE, EDIT_DATE)
        VALUES (?, ?, ?, ?, ?, NOW())
      `;
      const editParams = [
        EDIT_ID,
        notice_id,
        editorId,                // 'admin'
        editorName || '관리자',
        TITLE,                   // 수정된 제목
      ];

      conn.query(editSql, editParams, (editErr) => {
        if (editErr) {
          console.error('DB 오류[edit-log]:', editErr);
          // 이력 실패해도 업데이트는 성공 처리
        }

        // 5) 기존 파일 삭제 (필요 시)
        if (fileChanged && oldFilePath) {
          const abs = path.join(process.cwd(), oldFilePath.replace(/^\//, ''));
          fs.unlink(abs, (unlinkErr) => {
            if (unlinkErr) {
              console.warn('파일 삭제 경고[update]:', unlinkErr.message);
            }
          });
        }

        return res.json({ ok: true, noticeId: notice_id, editId: EDIT_ID });
      });
    });
  });
});

// 7. 공지사항글 삭제 라우터 ( admin 관리자 전용 기능 ) 
router.delete('/:notice_id', express.json(), (req, res) => {
  const { notice_id } = req.params;
  const { EDITOR_ID, EDITOR_NAME } = req.body || {};

  if ((EDITOR_ID || '').trim() !== 'admin') {
    return res.status(403).json({ ok: false, message: '관리자만 삭제 가능' });
  }

  // 1) 기존 파일/제목 조회
  const sel = 'SELECT FILE_PATH, TITLE FROM NOTICE_BOARD WHERE NOTICE_ID = ?';
  conn.query(sel, [notice_id], (e1, rows) => {
    if (e1) return res.status(500).json({ ok: false, message: 'DB 오류(sel)' });
    if (!rows || rows.length === 0) return res.status(404).json({ ok: false, message: 'NOT_FOUND' });

    const { FILE_PATH, TITLE } = rows[0];

    // 2) 삭제
    const del = 'DELETE FROM NOTICE_BOARD WHERE NOTICE_ID = ?';
    conn.query(del, [notice_id], (e2) => {
      if (e2) return res.status(500).json({ ok: false, message: 'DB 오류(del)' });

      // 3) 파일 삭제(있으면)
      if (FILE_PATH) {
        const abs = require('path').join(process.cwd(), FILE_PATH.replace(/^\//, ''));
        require('fs').unlink(abs, () => {}); // 실패해도 무시
      }

      // (선택) 삭제 이력 기록
      const EDIT_ID = `edit_${Date.now()}`;
      const logSql = `
        INSERT INTO NOTICE_EDIT
          (EDIT_ID, NT_ID, EDITOR_ID, EDITOR_NAME, EDIT_TITLE, EDIT_DATE)
        VALUES (?, ?, ?, ?, ?, NOW())
      `;
      conn.query(logSql, [EDIT_ID, notice_id, 'admin', EDITOR_NAME || '관리자', `[삭제] ${TITLE}`], () => {
        return res.json({ ok: true, noticeId: notice_id });
      });
    });
  });
});


module.exports = router;
