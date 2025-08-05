const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors());           // 1. 항상 최상단!
app.use(express.json());   // 2. 그 다음 JSON 해석!

const mainRouter = require('./router/mainR');
const subRouter = require('./router/subR');
const userRouter = require('./router/userR');
const userGRouter = require('./router/userG');
const loginBRouter = require('./router/loginB');
const mypageRouter = require('./router/mypageR');
const putRouter = require('./router/put');
const loginGRouter  = require('./router/loginG');
const proxyEvRouter = require('./router/proxyEv');
const inquiryRouter = require('./router/inquiry');


app.use('/api/mypage', mypageRouter);
app.use('/main', mainRouter);
app.use('/sub', subRouter);
app.use('/user', userRouter);
app.use('/userg', userGRouter);
app.use('/loginB', loginBRouter);
app.use('/loginG', loginGRouter);
app.use('/put', putRouter);
app.use('/api/proxy', proxyEvRouter);
app.use('./api/inquiry', inquiryRouter);



app.get('/', (req, res) => {
  res.send('백엔드 서버 정상 작동 중!');
});

app.listen(3001, () => {
  console.log('✅ Node 서버 실행 중: http://localhost:3001');
});
