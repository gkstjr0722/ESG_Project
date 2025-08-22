// 이메일 링크 클릭 시 비밀번호 재설정 페이지 관련 jsx
// PasswordResetConfirm.jsx  (새 파일)
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../CSS/Sub.css';
import Header from '../../component/Header';
import axios from 'axios';

const API_BASE = import.meta?.env?.VITE_API_BASE || 'http://192.168.111.194:3001';

export default function PasswordResetConfirm() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const qs = new URLSearchParams(search);
  const uid = qs.get('uid');
  const ut = qs.get('ut');      // 'corp' | 'gov'
  const token = qs.get('token');

  const [valid, setValid] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/auth/email/verify`, { params: { uid, ut, token } });
        setValid(!!data?.ok);
        if (!data?.ok) setMsg('링크가 만료되었거나 유효하지 않습니다.');
      } catch {
        setValid(false);
        setMsg('검증 실패. 다시 요청해 주세요.');
      }
    })();
  }, [uid, ut, token]);

  const submit = async () => {
    if (!newPw || newPw.length < 8) return setMsg('비밀번호는 8자 이상이어야 합니다.');
    setLoading(true); setMsg('');
    try {
      const { data } = await axios.post(`${API_BASE}/auth/email/confirm`, { uid, ut, token, newPw });
      if (data?.ok) {
        setMsg('비밀번호 변경 완료! 로그인 화면으로 이동합니다.');
        setTimeout(() => navigate('/login'), 1200);
      } else {
        setMsg(data?.msg || '변경 실패. 링크를 다시 요청해 주세요.');
      }
    } catch {
      setMsg('변경 실패. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  if (!valid) {
    return (
      <>
        <Header />
        <div className="cBox">
          <h2>비밀번호 재설정</h2>
          <p className="cError">{msg}</p>
          <button className="cBlueBtn sPw-Btn" type="button" onClick={() => navigate('/password-reset')}>
            메일 다시 받기
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="cBox">
        <h2>새 비밀번호 설정</h2>
        <div className="cContent">
          <input
            type="password"
            placeholder="새 비밀번호(8자 이상)"
            value={newPw}
            onChange={e => setNewPw(e.target.value)}
          />
        </div>
        {msg && <div className="cError">{msg}</div>}
        <button
          className="cBlueBtn sPw-Btn"
          disabled={loading || !newPw}
          onClick={submit}
        >
          비밀번호 변경하기
        </button>
      </div>
    </>
  );
}
