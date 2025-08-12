const path = require('path');
const express = require('express');
const app = express();
const cors = require('cors');

require('dotenv').config();


app.use(cors({ origin: true, credentials: true })); // 요청 Origin 그대로 허용
app.use(express.json());

// 프론트 정적 파일 서빙
const STATIC_DIR = process.env.STATIC_DIR || path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(STATIC_DIR));

// 1. 라우터 설정
const mainRouter = require('./router/main');
const subRouter = require('./router/subR');
const userRouter = require('./router/userR');
const userGRouter = require('./router/userG');
const loginBRouter = require('./router/loginB');
const putRouter = require('./router/put');
const loginGRouter  = require('./router/loginG');
const proxyEvRouter = require('./router/proxyEv');
const inquiryRouter = require('./router/inquiry');
const noticeRouter = require('./router/notice');
const passwordRouter = require('./router/password');

// 2. 라우터 미들웨어 설정
// 2. 라우터 미들웨어 설정
app.use('/main', mainRouter);
app.use('/sub', subRouter);

// ✅ /user 라우트 마운트 (joinCorp는 여기 안에 있어야 함)
app.use('/user', userRouter);

// (직접 바인딩된 엔드포인트도 유지)
app.post('/user/userinfo', (req, res) => {
  return res.json({ ok: true, from : 'server.js direct' });
});

app.use('/userg', userGRouter);
app.use('/loginB', loginBRouter);
app.use('/loginG', loginGRouter);
app.use('/put', putRouter);
app.use('/api/proxy', proxyEvRouter);
app.use('/api/inquiry', inquiryRouter);
app.use('/api/notice', noticeRouter);
app.use('/api/password', passwordRouter);   // 기존 경로 유지
app.use('/auth', passwordRouter);           // ✅ (추가) 이메일 방식: /auth/email/...

// 업로드 정적 제공
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 헬스 체크 엔드포인트
app.get('/health', (req, res) => res.status(200).send('OK'));

// SPA 라우팅 처리
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
  res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

// 서버 시작
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Node 서버 실행 중: http://0.0.0.0:${PORT}`);
});
