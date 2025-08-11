const express = require('express');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db'); // mysql2/promise 풀
require('dotenv').config();

const router = express.Router();

const JWT_SECRET = process.env.RESET_JWT_SECRET || 'change-me';
const RESET_TTL_SEC = 10 * 60; // 비밀번호 재설정 토큰 유효기간 (10분)
const TABLES = {
  corp: {
    name: 'CORP_MEMBER',   
    idCol: 'id',
    pwCol: 'pw',
    regCol: 'corpRegNum',   
  },
  gov: {
    name: 'government_users', 
    idCol: 'id',
    pwCol: 'pw',
    emailCol: 'email',
  },
};

// 무차별 대입 방지
const requestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * [STEP1] 본인확인 → resetToken 발급
 * body: { userType:'corp'|'gov', id:'', bizRegNum?, email? }
 */
router.post('/reset/request', requestLimiter, async (req, res) => {
  try {
    const { userType, id, bizRegNum, email } = req.body;
    if (!userType || !id) {
      return res.status(400).json({ ok: false, msg: '필수값 누락' });
    }
    if (!['corp', 'gov'].includes(userType)) {
      return res.status(400).json({ ok: false, msg: 'userType 오류' });
    }

    const T = TABLES[userType];
    let sql, params;

    if (userType === 'corp') {
      if (!bizRegNum) return res.status(400).json({ ok: false, msg: '사업자등록번호 필요' });
      // 입력은 숫자만으로 정규화
      const normalized = String(bizRegNum).replace(/[^0-9]/g, '');
      // DB 보관값에 -나 공백이 있을 수 있어 REPLACE로 정규화 비교
      sql = `
        SELECT ${T.idCol} AS id
        FROM \`${T.name}\`
        WHERE ${T.idCol} = ?
          AND REPLACE(REPLACE(${T.regCol}, '-', ''), ' ', '') = ?
        LIMIT 1
      `;
      params = [id, normalized];
    } else {
      if (!email) return res.status(400).json({ ok: false, msg: '이메일 필요' });
      sql = `
        SELECT ${T.idCol} AS id
        FROM \`${T.name}\`
        WHERE ${T.idCol} = ? AND ${T.emailCol} = ?
        LIMIT 1
      `;
      params = [id, email];
    }

    const [rows] = await db.promise().query(sql, params);

    // 존재 여부 숨김: 같은 형태로 응답
    if (!rows.length) {
      return res.status(200).json({ ok: true, step: 'verify', issued: false });
    }

    // 토큰(payload엔 유형과 id만 넣음)
    const resetToken = jwt.sign({ typ: userType, id }, JWT_SECRET, { expiresIn: RESET_TTL_SEC });

    return res.status(200).json({
      ok: true,
      step: 'verify',
      issued: true,
      resetToken,
      expiresIn: RESET_TTL_SEC,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, msg: '서버 오류' });
  }
});

/**
 * [STEP2] 토큰 검증 → 비밀번호 변경
 * body: { resetToken:'', newPw:'' }
 */
router.post('/reset/confirm', async (req, res) => {
  try {
    const { resetToken, newPw } = req.body;
    if (!resetToken || !newPw) {
      return res.status(400).json({ ok: false, msg: '필수값 누락' });
    }
    if (newPw.length < 8) {
      return res.status(400).json({ ok: false, msg: '비밀번호는 8자 이상' });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, JWT_SECRET); // { typ:'corp'|'gov', id:'...' }
    } catch {
      return res.status(401).json({ ok: false, msg: '토큰 만료/오류' });
    }

    if (!['corp', 'gov'].includes(decoded.typ)) {
      return res.status(400).json({ ok: false, msg: '토큰 유형 오류' });
    }

    const T = TABLES[decoded.typ];
    const hash = await bcrypt.hash(newPw, 10);

    const sql = `
      UPDATE \`${T.name}\`
      SET ${T.pwCol} = ?
      WHERE ${T.idCol} = ?
      LIMIT 1
    `;
    await db.promise().query(sql, [hash, decoded.id]);

    return res.status(200).json({ ok: true, step: 'done' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, msg: '서버 오류' });
  }
});

module.exports = router;
