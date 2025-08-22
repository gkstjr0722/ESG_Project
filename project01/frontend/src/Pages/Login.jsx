// 로그인

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../CSS/Main.css';
import Header from '../component/Header';

// API Base (환경변수 없으면 로컬)
const API_BASE = import.meta?.env?.VITE_API_BASE || 'http://192.168.111.194:3001';

const Login = () => {
  const [mode, setMode] = useState('business');
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [saveId, setSaveId] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const savedIdKey = mode === 'business' ? 'savedId' : 'savedGovId';

  useEffect(() => {
    const saved = localStorage.getItem(savedIdKey);
    if (saved) {
      setId(saved);
      setSaveId(true);
    } else {
      setId('');
      setSaveId(false);
    }
  }, [mode]);

  // 각각 로그인 엔드포인트 지정 (fetch 그대로 유지)
  const loginEndpoints = {
    business: `${API_BASE}/loginB/corp`,
    government: `${API_BASE}/loginG/corp`,
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
        if (saveId) localStorage.setItem(savedIdKey, id);
        else localStorage.removeItem(savedIdKey);

        localStorage.setItem(mode === 'business' ? 'id' : 'gov_id', id);
        localStorage.setItem('userName', data.userName || '');
        localStorage.setItem('email', data.email || '');

        navigate('/');
      } else {
        setError(data.msg || '로그인 실패! 아이디/비밀번호를 확인하세요.');
      }
    } catch {
      setError('서버 오류! 잠시 후 다시 시도해 주세요.');
    }
  };

  return (
    <div>
      <Header />
      <div className="common-bg">
        <div className="common-box login-corp-box">
          <h2 style={{ marginTop: '22px' }}>
            {mode === 'business' ? '기업·공공기관 로그인' : '관공업 로그인'}
          </h2>
          <div className="login-switch-btn-area">
            <button
              className={mode === 'business' ? 'login-switch-btn active' : 'login-switch-btn'}
              onClick={() => {
                setMode('business');
                setId('');
                setPw('');
                setError('');
              }}
              type="button"
            >
              기업 로그인
            </button>
            <button
              className={mode === 'government' ? 'login-switch-btn active' : 'login-switch-btn'}
              onClick={() => {
                setMode('government');
                setId('');
                setPw('');
                setError('');
              }}
              type="button"
            >
              관공업 로그인
            </button>
          </div>


          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder={mode === 'business' ? '기업/기관 아이디' : '관공업 아이디'}
              value={id}
              onChange={(e) => setId(e.target.value)}
              autoFocus
              required
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              required
            />

            <div style={{ margin: '12px 0 0 0', textAlign: 'left' }}>
              <input
                type="checkbox"
                id="saveId"
                checked={saveId}
                onChange={() => setSaveId(!saveId)}
              />
              <label htmlFor="saveId" style={{ marginLeft: '6px', fontSize: '14px' }}>
                아이디 저장
              </label>
            </div>

            {error && <div className="login-error">{error}</div>}

            <button className="common-btn main-btn1" type="submit">
              로그인
            </button>
          </form>

          <div className="login-link-area">
            <a
              className="pw-find-link"
              href="/password/reset"
              >
                비밀번호 찾기
            </a>
            <span className="divider">|</span>
            <a href="/join" className="join-link">
              회원가입
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
