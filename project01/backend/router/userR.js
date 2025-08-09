const express = require('express');
const router = express.Router();
const conn = require('../config/db');
const multer = require('multer');
const bcrypt = require('bcrypt');

// 파일 업로드(사업자등록증)
const upload = multer({ dest: 'uploads/' });

/**
 * [기업] 회원가입
 * POST /joinCorp
 * - FormData 전송(bizCert 포함 가능)
 * - 응답: { result: 'success' | 'fail', msg? }
 */
router.post('/joinCorp', upload.single('bizCert'), async (req, res) => {
  try {
    const {
      corpName, corpRegNum, ceo, dept,
      manager, phone, email, corpTel, address,
      id, pw
    } = req.body;

    // 필수값 체크
    if (!corpName || !corpRegNum || !ceo || !manager || !phone || !email || !address || !id || !pw) {
      return res.status(400).json({ result: 'fail', msg: '필수값 누락' });
    }

    // ID 중복 체크
    const dupSql = 'SELECT 1 FROM CORP_MEMBER WHERE id = ?';
    conn.query(dupSql, [id], async (dupErr, dupRows) => {
      if (dupErr) {
        console.error('[corp/join] 중복검사 오류:', dupErr);
        return res.status(500).json({ result: 'fail', msg: 'DB 오류(중복검사)' });
      }
      if (dupRows.length > 0) {
        return res.status(409).json({ result: 'fail', msg: '이미 존재하는 ID입니다.' });
      }

      // 비밀번호 해시
      const hashedPw = await bcrypt.hash(pw, 10);
      const bizCertPath = req.file ? req.file.path : null;

      const sql = `
        INSERT INTO CORP_MEMBER
        (corpName, corpRegNum, ceo, dept, manager, phone, email, corpTel, address, id, pw, bizCert)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      conn.query(
        sql,
        [
          corpName,
          corpRegNum,
          ceo,
          (dept ?? null),
          manager,
          phone,
          email,
          (corpTel ?? null),
          address,
          id,
          hashedPw,
          bizCertPath
        ],
        (err) => {
          if (err) {
            console.error('[corp/join] DB INSERT 오류:', err);
            return res.status(500).json({ result: 'fail', msg: 'DB 오류(회원가입)' });
          }
          return res.json({ result: 'success' });
        }
      );
    });
  } catch (e) {
    console.error('[corp/join] 서버 오류:', e);
    return res.status(500).json({ result: 'fail', msg: '서버 오류' });
  }
});

/**
 * [기업] 회원정보 조회
 * POST /userinfo
 * - body: { id }
 * - 응답: { user: {...} } | 404
 * - 기존 mypageR.js 포맷과 동일하게 반환
 */
router.post('/userinfo', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ msg: 'id 필요' });

  const sql = `
    SELECT 
      id, corpName, corpRegNum, ceo, dept, manager, phone, email, corpTel, address, bizCert
    FROM CORP_MEMBER
    WHERE id = ?
  `;
  conn.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ msg: 'DB 오류' });
    if (results.length > 0) {
      return res.json({ user: results[0] });
    }
    return res.status(404).json({ msg: '회원 정보 없음' });
  });
});

/**
 * [기업] 회원정보 수정 (비밀번호·bizCert 제외)
 * PUT /update
 * - body: { id, corpName, corpRegNum, ceo, dept, manager, phone, email, corpTel, address }
 * - 응답: { result: 'success' } | 404
 */
router.put('/update', (req, res) => {
  const { id, corpName, corpRegNum, ceo, dept, manager, phone, email, corpTel, address } = req.body;
  if (!id) return res.status(400).json({ msg: 'id 필요' });

  const sql = `
    UPDATE CORP_MEMBER
    SET corpName=?, corpRegNum=?, ceo=?, dept=?, manager=?, phone=?, email=?, corpTel=?, address=?
    WHERE id=?
  `;
  conn.query(sql, [
    corpName, corpRegNum, ceo, (dept ?? null), manager, phone, email, (corpTel ?? null), address, id
  ], (err, result) => {
    if (err) return res.status(500).json({ msg: 'DB 오류' });
    if (result.affectedRows > 0) return res.json({ result: 'success' });
    return res.status(404).json({ msg: '회원 정보 없음' });
  });
});

/**
 * [기업] 비밀번호 변경 (bcrypt 해시 저장)
 * PUT /password-update
 * - body: { id, newPassword }
 * - 응답: { result: 'success' } | 404
 */
router.put('/password-update', async (req, res) => {
  const { id, newPassword } = req.body;
  if (!id || !newPassword) return res.status(400).json({ msg: 'id, newPassword 필요' });

  try {
    const hashed = await bcrypt.hash(newPassword, 10);
    const sql = `UPDATE CORP_MEMBER SET pw=? WHERE id=?`;
    conn.query(sql, [hashed, id], (err, result) => {
      if (err) return res.status(500).json({ msg: 'DB 오류' });
      if (result.affectedRows > 0) return res.json({ result: 'success' });
      return res.status(404).json({ msg: '회원 정보 없음' });
    });
  } catch (e) {
    console.error('[corp/password-update] bcrypt 오류:', e);
    return res.status(500).json({ msg: '서버 오류' });
  }
});

module.exports = router;

// 2025-08-08 코드 수정 완료 ( mypageR.js -> userR.js 통합 및 코드 정리 )