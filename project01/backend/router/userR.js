// backend/router/userR.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');

// 파일 업로드 의존성
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// 업로드 디렉토리 보장
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'bizcert');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// multer 스토리지
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file?.originalname || '');
    const base = path.basename(file?.originalname || 'bizcert', ext);
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// 라우터 로드 확인
console.log('[userR] router loaded');

// 헬스체크
router.get('/_ping', (req, res) => res.json({ ok: true, where: 'userR' }));

router.all('/joinCorp', (req, res, next) => {
  console.log('[userR] hit', req.method, req.path);
  if (req.method !== 'POST') return res.status(405).json({ ok:false, msg:'POST only' });
  return next(); // 아래 실제 router.post('/joinCorp'...)로 넘김
});

// ===== 진단용: 경로/마운트 확인용 (필요 시 제거 가능) =====
router.post('/joinCorp/_ping', (req, res) => {
  return res.status(200).json({ ok: true, where: 'userR.joinCorp/_ping' });
});

// ===== 기업 회원가입 =====
// 업로드 단계에서 에러가 나더라도 라우트가 404로 죽지 않게 미들웨어로 분리
const uploadSingleBizCert = (req, res, next) => {
  upload.single('bizCert')(req, res, (err) => {
    if (err) {
      console.error('[userR:joinCorp] multer error:', err);
      return res.status(400).json({ result: 0, message: '파일 업로드 오류' });
    }
    next();
  });
};

router.post('/joinCorp', uploadSingleBizCert, async (req, res) => {
  try {
    const f = req.body || {};
    const file = req.file || null;

    // 필수값 체크
    const required = ['corpName','corpRegNum','ceo','manager','phone','email','address','id','pw'];
    for (const k of required) {
      const v = (f[k] ?? '').toString().trim();
      if (!v) return res.status(400).json({ result: 0, message: `필수값 누락: ${k}` });
    }

    const corpName   = f.corpName.trim();
    const corpRegNum = f.corpRegNum.trim();
    const ceo        = f.ceo.trim();
    const dept       = (f.dept ?? '').trim() || null;
    const manager    = f.manager.trim();
    const phone      = f.phone.trim();
    const email      = f.email.trim();
    const corpTel    = (f.corpTel ?? '').trim() || null;
    const address    = f.address.trim();
    const id         = f.id.trim();
    const pw         = String(f.pw);

    // (보강) 사업자등록번호 서버측 최소 검증: 숫자 10자리
    if (!/^\d{10}$/.test(corpRegNum)) {
      return res.status(400).json({ result: 0, message: '사업자등록번호는 숫자 10자리여야 합니다.' });
    }

    // 중복 체크 (IS_DELETED = 0) - COALESCE로 NULL 방지
    const dupSql = `
      SELECT 
        COALESCE(SUM(id = ?), 0)          AS idDup,
        COALESCE(SUM(email = ?), 0)       AS emailDup,
        COALESCE(SUM(corpRegNum = ?), 0)  AS corpRegDup
      FROM CORP_MEMBER
      WHERE IS_DELETED = 0
    `;
    const dup = await new Promise((resolve, reject) => {
      db.query(dupSql, [id, email, corpRegNum], (err, rows) => {
        if (err) return reject(err);
        resolve(rows && rows[0]);
      });
    });

    if (dup?.idDup > 0)      return res.status(409).json({ result: 0, message: '이미 사용 중인 아이디입니다.' });
    if (dup?.emailDup > 0)   return res.status(409).json({ result: 0, message: '이미 등록된 이메일입니다.' });
    if (dup?.corpRegDup > 0) return res.status(409).json({ result: 0, message: '이미 등록된 사업자등록번호입니다.' });

    // 비밀번호 해시
    const rounds = Number(process.env.BCRYPT_ROUNDS || 12);
    const hashed = await bcrypt.hash(pw, rounds);

    // 파일 경로 (선택)
    const bizCertPath = file ? path.join('uploads', 'bizcert', file.filename) : null;

    // INSERT
    const insSql = `
      INSERT INTO CORP_MEMBER
        (corpName, corpRegNum, ceo, dept, manager, phone, email, corpTel, address, id, pw, bizCert)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await new Promise((resolve, reject) => {
      db.query(
        insSql,
        [corpName, corpRegNum, ceo, dept, manager, phone, email, corpTel, address, id, hashed, bizCertPath],
        (err, r) => (err ? reject(err) : resolve(r))
      );
    });

    return res.status(201).json({ result: 1, message: '기업 회원가입 성공' });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ result: 0, message: '중복된 값이 있습니다.' });
    }
    console.error('[userR:joinCorp] error:', err);
    return res.status(500).json({ result: 0, message: '서버 오류' });
  }
});

// ===== 기업 회원정보 조회 =====
router.post('/userinfo', (req, res) => {
  let { id } = req.body || {};
  if (typeof id === 'string') id = id.trim();
  if (!id) return res.status(400).json({ result: 0, message: 'ID 누락' });

  const sql = `
    SELECT id, corpName, corpRegNum, ceo, dept, manager, phone, email, corpTel, address, bizCert
      FROM CORP_MEMBER
     WHERE id = ? AND IS_DELETED = 0
  `;
  db.query(sql, [id], (err, rows) => {
    if (err) {
      console.error('[userR:userinfo] DB 오류:', err);
      return res.status(500).json({ result: 0, message: 'DB 오류' });
    }
    if (!rows || rows.length === 0) {
      return res.status(404).json({ result: 0, message: '회원 정보 없음' });
    }
    return res.json({ result: 1, user: rows[0] });
  });
});

// ===== 기업 회원정보 수정(비밀번호 제외) =====
router.put('/update', (req, res) => {
  const { id, corpName, corpRegNum, ceo, dept, manager, phone, email, corpTel, address } = req.body || {};
  if (!id) return res.status(400).json({ msg: 'id 필요' });

  const sql = `
    UPDATE CORP_MEMBER
       SET corpName=?, corpRegNum=?, ceo=?, dept=?, manager=?, phone=?, email=?, corpTel=?, address=?
     WHERE id=? AND IS_DELETED = 0
  `;
  db.query(
    sql,
    [corpName, corpRegNum, ceo, (dept ?? null), manager, phone, email, (corpTel ?? null), address, id],
    (err, r) => {
      if (err) {
        console.error('[userR:update] DB 오류:', err);
        return res.status(500).json({ msg: 'DB 오류' });
      }
      if (r.affectedRows > 0) return res.json({ result: 'success' });
      return res.status(404).json({ msg: '회원 정보 없음' });
    }
  );
});

// ===== 기업 비밀번호 수정 =====
router.put('/password-update', async (req, res) => {
  const { id, newPassword } = req.body || {};
  if (!id || !newPassword) return res.status(400).json({ msg: 'id, newPassword 필요' });

  try {
    const rounds = Number(process.env.BCRYPT_ROUNDS || 12);
    const hashed = await bcrypt.hash(newPassword, rounds);
    db.query(
      `UPDATE CORP_MEMBER SET pw=? WHERE id=? AND IS_DELETED = 0`,
      [hashed, id],
      (err, r) => {
        if (err) {
          console.error('[userR:password-update] DB 오류:', err);
          return res.status(500).json({ msg: 'DB 오류' });
        }
        if (r.affectedRows > 0) return res.json({ result: 'success' });
        return res.status(404).json({ msg: '회원 정보 없음' });
      }
    );
  } catch (e) {
    console.error('[userR:password-update] 서버 오류:', e);
    return res.status(500).json({ msg: '서버 오류' });
  }
});

// ===== 기업 회원 탈퇴 =====
router.delete('/delete', (req, res) => {
  const { id } = req.body || {};
  if (!id) return res.status(400).json({ ok: false, msg: 'BAD_REQUEST' });

  const sql = `
    UPDATE CORP_MEMBER
       SET IS_DELETED = 1, DELETED_AT = NOW()
     WHERE id = ? AND IS_DELETED = 0
  `;
  db.query(sql, [id], (err, r) => {
    if (err) {
      console.error('[userR:delete] DB 오류:', err);
      return res.status(500).json({ ok: false, msg: 'DB_ERROR' });
    }
    if (r.affectedRows === 0) return res.status(404).json({ ok: false, msg: 'NOT_FOUND_OR_ALREADY' });
    return res.json({ ok: true });
  });
});

module.exports = router;
