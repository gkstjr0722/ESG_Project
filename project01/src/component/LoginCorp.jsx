import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import './LoginCorp.css'; // 기존 스타일 그대로 사용

const LoginUnified = () => {
  const [mode, setMode] = useState('business'); // 'business' or 'government'
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 각각 로그인 엔드포인트 지정
  const loginEndpoints = {
    business: 'http://localhost:3001/loginB/corp',
    government: 'http://localhost:3001/loginG/corp'
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!id || !pw) {
      setError('아이디와 비밀번호를 입력하세요.');
      return;
    }

    try {
      const res = await fetch(loginEndpoints[mode], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, pw }),
      });
      const data = await res.json();

      if (data.result === 'success') {
        // 타입별로 localStorage 구분 가능
        localStorage.setItem(mode === 'business' ? 'id' : 'gov_id', id);
        navigate('/');
      } else {
        setError(data.msg || '로그인 실패! 아이디/비밀번호를 확인하세요.');
      }
    } catch (err) {
      setError('서버 오류! 잠시 후 다시 시도해 주세요.');
    }
  };

  return (
    <div>
      <Header />
      <div className="login-corp-bg">
        <div className="login-corp-box">
          <div className="login-switch-btn-area">
            <button
              className={mode === 'business' ? 'login-switch-btn active' : 'login-switch-btn'}
              onClick={() => { setMode('business'); setId(''); setPw(''); setError(''); }}
              type="button"
            >
              기업 로그인
            </button>
            <button
              className={mode === 'government' ? 'login-switch-btn active' : 'login-switch-btn'}
              onClick={() => { setMode('government'); setId(''); setPw(''); setError(''); }}
              type="button"
            >
              관공업 로그인
            </button>
          </div>

          <h2 style={{ marginTop: '22px' }}>
            {mode === 'business' ? '기업·공공기관 로그인' : '관공업 로그인'}
          </h2>
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder={mode === 'business' ? '기업/기관 아이디' : '관공업 아이디'}
              value={id}
              onChange={e => setId(e.target.value)}
              autoFocus
              required
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={pw}
              onChange={e => setPw(e.target.value)}
              required
            />
            {error && <div className="login-error">{error}</div>}
            <button className="main-btn" type="submit">로그인</button>
          </form>
          <div className="login-link-area">
            <span>비밀번호를 잊으셨나요?</span>
            <span className="divider">|</span>
            <a href="/joinmain" className="join-link">회원가입</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginUnified;
