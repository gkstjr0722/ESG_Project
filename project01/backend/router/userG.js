// backend/router/userG.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');

/** ✅ 라우터 로드/마운트 확인(기능 영향 없음) */
console.log('[userG] router loaded');
router.get('/_ping', (req, res) => res.json({ ok: true, where: 'userG' }));

/* =========================
 * ✅ 관공업 회원가입 라우터 (추가)
 *    POST /userg/join_gov
 *    body: { corpName, ceo, dept?, manager, phone, email, corpTel?, address, id, pw }
 *    - 필수값 검증
 *    - id/email 중복 검증 (IS_DELETED=0)
 *    - 비번 bcrypt 해시 후 INSERT
 * ========================= */
router.post('/join_gov', async (req, res) => {
  try {
    const f = req.body || {};

    // 필수값 체크
    const required = ['corpName','ceo','manager','phone','email','address','id','pw'];
    for (const k of required) {
      const v = (f[k] ?? '').toString().trim();
      if (!v) return res.status(400).json({ result: 0, message: `필수값 누락: ${k}` });
    }

    const corpName = f.corpName.trim();
    const ceo      = f.ceo.trim();
    const dept     = (f.dept ?? '').trim() || null;
    const manager  = f.manager.trim();
    const phone    = f.phone.trim();
    const email    = f.email.trim();
    const corpTel  = (f.corpTel ?? '').trim() || null;
    const address  = f.address.trim();
    const id       = f.id.trim();
    const pw       = String(f.pw);

    // 중복 체크 (id, email) — IS_DELETED = 0
    const dupSql = `
      SELECT
        COALESCE(SUM(id = ?), 0)    AS idDup,
        COALESCE(SUM(email = ?), 0) AS emailDup
      FROM government_users
      WHERE IS_DELETED = 0
    `;
    const dup = await new Promise((resolve, reject) => {
      db.query(dupSql, [id, email], (err, rows) => {
        if (err) return reject(err);
        resolve(rows && rows[0]);
      });
    });
    if (dup?.idDup > 0)    return res.status(409).json({ result: 0, message: '이미 존재하는 ID입니다.' });
    if (dup?.emailDup > 0) return res.status(409).json({ result: 0, message: '이미 등록된 이메일입니다.' });

    // 비밀번호 해시
    const rounds = Number(process.env.BCRYPT_ROUNDS || 12);
    const hashed = await bcrypt.hash(pw, rounds);

    // INSERT
    const insSql = `
      INSERT INTO government_users
        (corpName, ceo, dept, manager, phone, email, corpTel, address, id, pw)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await new Promise((resolve, reject) => {
      db.query(
        insSql,
        [corpName, ceo, dept, manager, phone, email, corpTel, address, id, hashed],
        (err, r) => (err ? reject(err) : resolve(r))
      );
    });

    return res.status(201).json({ result: 1, message: '관공업 회원가입 성공' });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ result: 0, message: '중복된 값이 있습니다.' });
    }
    console.error('[userG:join_gov] error:', err);
    return res.status(500).json({ result: 0, message: '서버 오류' });
  }
});

// 관공업 회원정보 조회 라우터 
router.post('/userinfo_gov', (req, res) => {
  let { id } = req.body || {};
  if (typeof id === 'string') id = id.trim();
  if (!id) return res.status(400).json({ result: 0, message: 'ID 누락' });

  const sql = `
    SELECT corpName, ceo, dept, manager, phone, email, corpTel, address, id
      FROM government_users
     WHERE id = ? AND IS_DELETED = 0
  `;
  db.query(sql, [id], (err, rows) => {
    if (err) return res.status(500).json({ result: 0, message: 'DB 오류' });
    if (!rows || rows.length === 0) return res.status(404).json({ result: 0, message: '회원정보 없음' });
    return res.json({ result: 1, user: rows[0] });
  });
});

// 관공업 회원정보 수정 라우터 
router.put('/update_gov', (req, res) => {
  let { id, corpName, ceo, dept, manager, phone, email, corpTel, address } = req.body || {};
  if (typeof id === 'string') id = id.trim();
  if (!id) return res.status(400).json({ result: 0, message: 'ID 누락' });

  const sql = `
    UPDATE government_users
       SET corpName=?, ceo=?, dept=?, manager=?, phone=?, email=?, corpTel=?, address=?
     WHERE id=? AND IS_DELETED = 0
  `;
  db.query(sql, [corpName, ceo, dept, manager, phone, email, corpTel, address, id], (err, r) => {
    if (err) return res.status(500).json({ result: 0, message: 'DB 오류' });
    if (r.affectedRows > 0) return res.json({ result: 1, message: '정보수정 성공' });
    return res.status(404).json({ result: 0, message: '회원정보 없음' });
  });
});

// 관공업 비밀번호 변경 라우터 
router.put('/update_gov_pw', async (req, res) => {
  let { id, newPassword } = req.body || {};
  if (typeof id === 'string') id = id.trim();
  if (!id || !newPassword) return res.status(400).json({ result: 0, message: '필수값 누락' });

  try {
    const rounds = Number(process.env.BCRYPT_ROUNDS || 12);
    const hash = await bcrypt.hash(newPassword, rounds);
    db.query(
      'UPDATE government_users SET pw=? WHERE id=? AND IS_DELETED = 0',
      [hash, id],
      (err, r) => {
        if (err) return res.status(500).json({ result: 0, message: 'DB 오류' });
        if (r.affectedRows > 0) return res.json({ result: 1, message: '비밀번호 변경 성공' });
        return res.status(404).json({ result: 0, message: '회원정보 없음' });
      }
    );
  } catch {
    return res.status(500).json({ result: 0, message: '서버 오류' });
  }
});

// 관공업 회원가입 탈퇴 라우터 
router.delete('/delete_gov', (req, res) => {
  let { id } = req.body || {};
  if (typeof id === 'string') id = id.trim();
  if (!id) return res.status(400).json({ ok: false, msg: 'BAD_REQUEST' });

  const sql = `
    UPDATE government_users
       SET IS_DELETED = 1, DELETED_AT = NOW()
     WHERE id = ? AND IS_DELETED = 0
  `;
  db.query(sql, [id], (err, r) => {
    if (err) return res.status(500).json({ ok: false, msg: 'DB_ERROR' });
    if (r.affectedRows === 0) return res.status(404).json({ ok: false, msg: 'NOT_FOUND_OR_ALREADY' });
    return res.json({ ok: true });
  });
});

module.exports = router;
