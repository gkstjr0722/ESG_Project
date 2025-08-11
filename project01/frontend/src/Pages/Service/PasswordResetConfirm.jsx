// PasswordResetConfirm.jsx  (새 파일)
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../component/Header';
import axios from 'axios';

const API_BASE = import.meta?.env?.VITE_API_BASE || 'http://localhost:3001';

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
      <div>
        <Header />
        <div className="common-bg">
          <div className="common-box login-corp-box" style={{ maxWidth: 520, padding: 24 }}>
            <h2>비밀번호 재설정</h2>
            <p style={{ marginTop: 12 }}>{msg}</p>
            <button className="linklike" type="button" onClick={() => navigate('/password-reset')}>
              메일 다시 받기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="common-bg">
        <div className="common-box login-corp-box" style={{ maxWidth: 520 }}>
          <h2 style={{ marginTop: 6 }}>새 비밀번호 설정</h2>
          <input
            type="password"
            placeholder="새 비밀번호(8자 이상)"
            value={newPw}
            onChange={e => setNewPw(e.target.value)}
            style={{ width:'100%', padding:'12px 14px', height:44, border:'1px solid #dcdcdc', borderRadius:6, marginTop:16 }}
          />
          <button
            style={{ width:'100%', padding:'14px', border:'none', borderRadius:6, background:'#3759e3ff', color:'#fff', fontWeight:600, cursor:'pointer', marginTop:12 }}
            disabled={loading || !newPw}
            onClick={submit}
          >
            비밀번호 변경하기
          </button>
          {msg && <div className="login-error" style={{ marginTop: 12 }}>{msg}</div>}
        </div>
      </div>
    </div>
  );
}
