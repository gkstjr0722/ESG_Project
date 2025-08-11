const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

app.use(cors());           
app.use(express.json());   

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
app.use('/main', mainRouter);
app.use('/sub', subRouter);
app.use('/user', userRouter);
app.use('/userg', userGRouter);
app.use('/loginB', loginBRouter);
app.use('/loginG', loginGRouter);
app.use('/put', putRouter);
app.use('/api/proxy', proxyEvRouter);
app.use('/api/inquiry', inquiryRouter);
app.use('/api/notice', noticeRouter);
app.use('/api/password', passwordRouter);

// 3. 파일 업로드 설정 
//    업로드된 파일 정적 제공 
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 비밀번호 재설정 관련 




// 4, 서버 시작 
app.get('/', (req, res) => {
  res.send('백엔드 서버 정상 작동 중!');
});

// 5. 서버 포트 설정 
app.listen(3001, () => {
  console.log('✅ Node 서버 실행 중: http://localhost:3001');
});

// 2025-08-08 코드 수정 완료 

