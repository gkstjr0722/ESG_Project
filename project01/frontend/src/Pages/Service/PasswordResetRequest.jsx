// 비밀번호 재설정 요청 관련 jsx
// frontend/src/Pages/Service/PasswordResetRequest.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../CSS/Main.css';
import Header from '../../component/Header';
import axios from 'axios';

const API_BASE = import.meta?.env?.VITE_API_BASE || 'http://localhost:3001';

export default function PasswordResetRequest() {
  const [tab, setTab] = useState('corp'); // 'corp' | 'gov'
  const [form, setForm] = useState({ id: '', bizRegNum: '', email: '' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const inputBase = { width:'100%', padding:'12px 14px', height:44, border:'1px solid #dcdcdc', borderRadius:6, background:'#fff', boxSizing:'border-box', outline:'none', fontSize:14, WebkitAppearance:'none', appearance:'none' };
  const inputFirst = { ...inputBase, marginTop:0, marginBottom:12 };
  const inputSecond = { ...inputBase, marginTop:0, marginBottom:12 };
  const primaryBtnStyle = { width:'100%', padding:'14px', border:'none', borderRadius:6, background:'#3759e3ff', color:'#fff', fontWeight:600, cursor:'pointer' };

  // ✅ 기업: 아이디 + 사업자번호 + 이메일 / 관공: 아이디 + 이메일
  const canVerify =
    form.id.trim() &&
    (tab === 'corp'
      ? form.bizRegNum.trim() && form.email.trim()
      : form.email.trim());

  const requestEmail = async () => {
    if (!canVerify) return;
    setLoading(true); setMsg('');
    try {
      const payload = { userType: tab, id: form.id.trim() };
      if (tab === 'corp') {
        payload.bizRegNum = form.bizRegNum.replace(/[^0-9]/g, '');
        payload.email = form.email.trim(); // ✅ 기업도 이메일 전송
      } else {
        payload.email = form.email.trim();
      }

      await axios.post(`${API_BASE}/auth/email/request`, payload);
      // 존재여부는 숨기므로 성공적으로 요청만 되면 같은 메시지
      setMsg('입력하신 정보가 맞다면 비밀번호 재설정 메일이 전송됩니다.');
    } catch (e) {
      setMsg('요청 실패. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header />
      <div className="common-bg">
        <div className="common-box login-corp-box" style={{ maxWidth: 520 }}>
          <h2 style={{ marginTop: 6 }}>비밀번호 재설정</h2>

          <div className="login-switch-btn-area" style={{ marginTop: 12 }}>
            <button
              className={tab === 'corp' ? 'login-switch-btn active':'login-switch-btn'}
              type="button"
              onClick={() => { setTab('corp'); setForm({ id:'', bizRegNum:'', email:'' }); setMsg(''); }}>
              기업
            </button>
            <button
              className={tab === 'gov' ? 'login-switch-btn active':'login-switch-btn'}
              type="button"
              onClick={() => { setTab('gov'); setForm({ id:'', bizRegNum:'', email:'' }); setMsg(''); }}>
              관공업
            </button>
          </div>

          <div style={{ marginTop: 18 }}>
            {/* 아이디 */}
            <input
              type="text"
              placeholder="아이디"
              value={form.id}
              onChange={e => setForm({ ...form, id: e.target.value })}
              style={inputFirst}
            />

            {/* 두 번째/세 번째 입력 */}
            {tab === 'corp' ? (
              <>
                <input
                  type="text"
                  placeholder="사업자등록번호 (숫자만)"
                  value={form.bizRegNum}
                  onChange={e => setForm({ ...form, bizRegNum: e.target.value.replace(/[^0-9-]/g, '') })}
                  style={inputSecond}
                />
                {/* ✅ 기업도 이메일 입력 필요 */}
                <input
                  type="email"
                  placeholder="이메일"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  style={inputSecond}
                />
              </>
            ) : (
              <input
                type="email"
                placeholder="이메일"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                style={inputSecond}
              />
            )}

            <button style={primaryBtnStyle} disabled={loading || !canVerify} onClick={requestEmail}>
              메일 보내기
            </button>

            {msg && <div className="login-error" style={{ marginTop: 12 }}>{msg}</div>}

            <div className="login-link-area" style={{ marginTop: 14 }}>
              <button className="linklike" type="button" onClick={() => navigate('/login')}>
                로그인으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
