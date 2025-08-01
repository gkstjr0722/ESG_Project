const mysql = require('mysql2');

const conn = mysql.createConnection({
  host: '192.168.1.96',
  user: 'hans123',
  password: 'hans123',     // ← 여기에 네 MySQL root 비번
  database: 'hans',      // ← DB명 CORPJS로 맞추기!
  port: 3307               // ← 명시해도 되고, 생략해도 3306은 기본값
});

conn.connect();
module.exports = conn;
