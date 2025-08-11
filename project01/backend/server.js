// import 'dotenv/config'            // ❌ (삭제) CommonJS 파일에서 ESM import 섞이면 에러납니다.
const express = require('express');
const app = express();
const cors = require('cors');

require('dotenv').config();

app.use(cors());
app.use(express.json());
// ⬇️ [추가] URL-encoded 폼 파서 (multipart는 multer가 처리하지만, 호환성 위해 켜둠)
app.use(express.urlencoded({ extended: true }));

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

app.use((req, res, next) => {
  console.log('[REQ]', req.method, req.path);
  next();
});

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

// 3. 파일 업로드 설정 (정적 제공)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 4. 서버 상태 체크
app.get('/', (req, res) => {
  res.send('백엔드 서버 정상 작동 중!');
});

// ⬇️ [추가] 디버그용: 현재 등록된 /user 하위 라우트 출력 (기능 영향 없음)
(function logUserRoutes() {
  try {
    const stack = app._router?.stack || [];
    const routes = [];
    stack.forEach(l => {
      if (l.handle && l.handle.stack && l.regexp?.toString().includes('^\\/user\\/?')) {
        l.handle.stack.forEach(r => {
          const methods = r.route && r.route.methods ? Object.keys(r.route.methods).join(',').toUpperCase() : '';
          const path = r.route && r.route.path ? r.route.path : '';
          if (methods && path) routes.push(`${methods} /user${path}`);
        });
      }
    });
    console.log('[ROUTES:/user]', routes.length ? routes : '(none)');
  } catch (e) {
    console.log('[ROUTES:/user] listing failed:', e?.message);
  }
})();

// 5. 서버 포트 설정
app.listen(3001, () => {
  console.log('✅ Node 서버 실행 중: http://localhost:3001');
});
