const mysql = require('mysql2');

const conn = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '12345',     // ← 여기에 네 MySQL root 비번
  database: 'CORPJS',      // ← DB명 CORPJS로 맞추기!
  port: 3306               // ← 명시해도 되고, 생략해도 3306은 기본값
});

conn.connect();
module.exports = conn;
