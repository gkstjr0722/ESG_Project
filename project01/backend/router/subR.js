const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  res.send('서브 페이지입니다!');
});

module.exports = router;

// 2025-08-08 코드 수정 완료