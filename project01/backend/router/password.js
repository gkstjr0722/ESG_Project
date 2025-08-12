// backend/router/password.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('../config/db'); // mysql2/promise 풀
require('dotenv').config();

const router = express.Router();

// ====== 공통 설정 ======
const JWT_SECRET = process.env.RESET_JWT_SECRET || 'change-me';
const RESET_TTL_SEC = 10 * 60; // 기존 JWT 방식 토큰 유효기간 (10분)
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12); // 해시 강도 (env 우선)
const EMAIL_TTL_MIN = Number(process.env.RESET_TOKEN_TTL_MINUTES || 30); // 이메일 토큰 TTL(분)
const DEV_DISABLE_SMTP = String(process.env.DEV_DISABLE_SMTP || '0') === '1';

const TABLES = {
  corp: {
    name: 'CORP_MEMBER',
    idCol: 'id',
    pwCol: 'pw',
    regCol: 'corpRegNum',
    emailCol: 'email',
  },
  gov: {
    name: 'government_users',
    idCol: 'id',
    pwCol: 'pw',
    emailCol: 'email',
  },
};

// ====== nodemailer 트랜스포터 (포트에 따른 secure 분기 + 타임아웃) ======
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,          // 465=SSL, 587/기타=STARTTLS
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  connectionTimeout: 15000,
  greetingTimeout: 10000,
  socketTimeout: 20000,
  // tls: { rejectUnauthorized: false }, // 사설 인증서 환경에서만 임시로 사용
});

// ====== 헬퍼 ======
function genTokenRawHex(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}
function sha256hex(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

// ====== 요청 남용 방지 ======
const requestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

/* =========================================================
 * 기존 구현 ①: 본인확인 → JWT resetToken 발급 (유지)
 * body: { userType:'corp'|'gov', id:'', bizRegNum?, email? }
 * =======================================================*/
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
      const normalized = String(bizRegNum).replace(/[^0-9]/g, '');
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

    // 존재 여부 숨김
    if (!rows.length) {
      return res.status(200).json({ ok: true, step: 'verify', issued: false });
    }

    const resetToken = jwt.sign({ typ: userType, id }, JWT_SECRET, { expiresIn: RESET_TTL_SEC });

    return res.status(200).json({
      ok: true,
      step: 'verify',
      issued: true,
      resetToken,
      expiresIn: RESET_TTL_SEC,
    });
  } catch (e) {
    console.error('[reset/request] error:', e);
    return res.status(500).json({ ok: false, msg: '서버 오류' });
  }
});

/* =========================================================
 * 기존 구현 ②: JWT 토큰 검증 → 비밀번호 변경 (유지)
 * body: { resetToken:'', newPw:'' }
 * =======================================================*/
router.post('/reset/confirm', async (req, res) => {
  try {
    const { resetToken, newPw } = req.body;
    if (!resetToken || !newPw) {
      return res.status(400).json({ ok: false, msg: '필수값 누락' });
    }
    if (String(newPw).length < 8) {
      return res.status(400).json({ ok: false, msg: '비밀번호는 8자 이상' });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, JWT_SECRET); // { typ, id }
    } catch {
      return res.status(401).json({ ok: false, msg: '토큰 만료/오류' });
    }

    if (!['corp', 'gov'].includes(decoded.typ)) {
      return res.status(400).json({ ok: false, msg: '토큰 유형 오류' });
    }

    const T = TABLES[decoded.typ];
    const hash = await bcrypt.hash(newPw, BCRYPT_ROUNDS);

    const sql = `
      UPDATE \`${T.name}\`
      SET ${T.pwCol} = ?
      WHERE ${T.idCol} = ?
      LIMIT 1
    `;
    await db.promise().query(sql, [hash, decoded.id]);

    return res.status(200).json({ ok: true, step: 'done' });
  } catch (e) {
    console.error('[reset/confirm] error:', e);
    return res.status(500).json({ ok: false, msg: '서버 오류' });
  }
});

/* =========================================================
 * 신규: 이메일 방식 ① — 메일 요청
 * POST /email/request  
 * body (프론트 규격과 일치):
 *   - corp: { userType:'corp', id, bizRegNum, email }
 *   - gov : { userType:'gov',  id, email }
 * 
 * 존재하면 password_reset_tokens에 해시 저장 후 메일 발송(또는 DEV 모드로 콘솔 출력).
 * 존재하지 않아도 같은 응답으로 사용자 정보 노출 방지.
 * =======================================================*/
router.post('/email/request', requestLimiter, async (req, res) => {
  try {
    const { userType, id, bizRegNum, email } = req.body || {};
    if (!userType || !id || !email) {
      return res.status(400).json({ ok:false, msg:'필수값 누락' });
    }
    if (!['corp', 'gov'].includes(userType)) {
      return res.status(400).json({ ok:false, msg:'userType 오류' });
    }

    let ut = null, uid = null;

    if (userType === 'corp') {
      if (!bizRegNum) return res.status(400).json({ ok:false, msg:'사업자등록번호 필요' });
      const normalized = String(bizRegNum).replace(/[^0-9]/g, '');
      const [rows] = await db.promise().query(
        `SELECT id FROM CORP_MEMBER
          WHERE id=? 
            AND email=? 
            AND REPLACE(REPLACE(corpRegNum,'-',''),' ','') = ?
            AND IS_DELETED=0
          LIMIT 1`,
        [id, email, normalized]
      );
      if (rows.length) { ut = 'corp'; uid = rows[0].id; }
    } else {
      const [rows] = await db.promise().query(
        `SELECT id FROM government_users
          WHERE id=? AND email=? AND IS_DELETED=0
          LIMIT 1`,
        [id, email]
      );
      if (rows.length) { ut = 'gov'; uid = rows[0].id; }
    }

    // 계정이 있으면 토큰 발급 + 메일 발송(or DEV 출력)
    if (ut && uid) {
      const raw = genTokenRawHex(32);
      const tokenHash = sha256hex(raw);
      await db.promise().query(
        `INSERT INTO password_reset_tokens
           (user_type, login_id, email_snapshot, token_hash, expires_at)
         VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
        [ut, uid, email, tokenHash, EMAIL_TTL_MIN]
      );

      const resetUrl = `${process.env.APP_URL}/reset-password?uid=${encodeURIComponent(uid)}&ut=${ut}&token=${raw}`;

      if (DEV_DISABLE_SMTP) {
        console.log('[DEV] reset link:', resetUrl);
      } else {
        try {
          await transporter.sendMail({
            from: `"HANS-ES" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'HANS-ES 비밀번호 재설정 안내',
            html: `
              <p>아래 버튼을 눌러 비밀번호를 재설정하세요. 링크는 ${EMAIL_TTL_MIN}분간 유효합니다.</p>
              <p><a href="${resetUrl}" target="_blank" rel="noopener">비밀번호 재설정하기</a></p>
              <p>본인이 요청하지 않았다면 이 메일을 무시하세요.</p>
            `,
          });
        } catch (mailErr) {
          console.error('[email/request] send error:', mailErr);
          // 사용자에게는 동일한 응답(존재여부 숨김)
        }
      }
    }

    // 존재 여부와 상관없이 동일 응답
    return res.json({ ok:true, message:'메일이 발송되었습니다(존재 시).' });
  } catch (e) {
    console.error('[email/request] error:', e);
    return res.status(500).json({ ok:false, msg:'서버 오류' });
  }
});

/* =========================================================
 * 신규: 이메일 방식 ② — 토큰 유효성 검사
 * GET /email/verify?uid=&ut=&token=
 * =======================================================*/
router.get('/email/verify', async (req, res) => {
  const { uid, ut, token } = req.query || {};
  if (!uid || !ut || !token) return res.status(400).json({ ok:false });

  try {
    const tokenHash = sha256hex(token);
    const [rows] = await db.promise().query(
      `SELECT id FROM password_reset_tokens
       WHERE user_type=? AND login_id=? AND token_hash=? AND used=0 AND expires_at>NOW()
       LIMIT 1`,
      [ut, uid, tokenHash]
    );
    return res.json({ ok: !!rows.length });
  } catch (e) {
    console.error('[email/verify] error:', e);
    return res.status(500).json({ ok:false });
  }
});

/* =========================================================
 * 신규: 이메일 방식 ③ — 비밀번호 변경 (트랜잭션 없이 견고하게)
 * POST /email/confirm  body: { uid, ut, token, newPw }
 * 1) 유효 토큰을 조건부로 used=1로 소진 (동시성 안전)
 * 2) 성공 시 비밀번호 업데이트
 * =======================================================*/
router.post('/email/confirm', async (req, res) => {
  try {
    const { uid, ut, token, newPw } = req.body || {};
    if (!uid || !ut || !token || !newPw) {
      return res.status(400).json({ ok:false, msg:'값 누락' });
    }
    if (String(newPw).length < 8) {
      return res.status(400).json({ ok:false, msg:'비밀번호는 8자 이상' });
    }

    const tokenHash = sha256hex(token);

    // 1) 유효 토큰만 소진(used=1). 1건 갱신되면 유효했던 것.
    const [tokUpd] = await db.promise().query(
      `UPDATE password_reset_tokens
         SET used = 1
       WHERE user_type = ?
         AND login_id = ?
         AND token_hash = ?
         AND used = 0
         AND expires_at > NOW()`,
      [ut, uid, tokenHash]
    );
    if (!tokUpd || tokUpd.affectedRows !== 1) {
      return res.status(400).json({ ok:false, msg:'토큰 만료/무효' });
    }

    // 2) 비밀번호 변경
    const T = TABLES[ut];
    const hash = await bcrypt.hash(newPw, BCRYPT_ROUNDS);
    const [pwUpd] = await db.promise().query(
      `UPDATE \`${T.name}\` SET ${T.pwCol}=? WHERE ${T.idCol}=? LIMIT 1`,
      [hash, uid]
    );
    if (!pwUpd || pwUpd.affectedRows !== 1) {
      return res.status(500).json({ ok:false, msg:'비밀번호 변경 실패' });
    }

    return res.json({ ok:true, msg:'비밀번호가 변경되었습니다.' });
  } catch (e) {
    console.error('[email/confirm] error:', e);
    return res.status(500).json({ ok:false, msg:'서버 오류' });
  }
});

module.exports = router;
