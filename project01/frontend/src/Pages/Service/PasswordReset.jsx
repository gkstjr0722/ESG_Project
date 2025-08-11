import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../CSS/Main.css';
import Header from '../../component/Header';
import axios from 'axios';

const API_BASE = import.meta?.env?.VITE_API_BASE || 'http://localhost:3001';

export default function PasswordReset() {
  const [tab, setTab] = useState('corp'); // 'corp' | 'gov'
  const [form, setForm] = useState({ id: '', bizRegNum: '', email: '' });
  const [resetToken, setResetToken] = useState('');
  const [newPw, setNewPw] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 통일 스타일 (기업용 기준)
  const inputBase = {
    width: '100%',
    padding: '12px 14px',
    height: 44,
    border: '1px solid #dcdcdc',
    borderRadius: 6,
    backgroundColor: '#fff',
    boxSizing: 'border-box',
    outline: 'none',
    fontSize: 14,
    WebkitAppearance: 'none',
    appearance: 'none',
  };
  // 첫 입력칸(아이디): 상단은 0, 아래로 통일 간격
  const inputFirst = { ...inputBase, marginTop: 0, marginBottom: 12 };
  // 두 번째 입력칸(사업자등록번호/이메일): 위는 0, 아래로 통일 간격
  const inputSecond = { ...inputBase, marginTop: 0, marginBottom: 12 };

  // 본인확인 버튼 스타일 
  const primaryBtnStyle = {
    width: '100%',
    padding: '14px',
    border: 'none',
    borderRadius: 6,
    background: '#3759e3ff',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
  };

  // 본인확인 가능 여부 
  const canVerify =
    form.id.trim() &&
    (tab === 'corp' ? form.bizRegNum.trim() : form.email.trim());

  // 본인확인 요청 
  const verify = async () => {
    if (!canVerify) return;
    setLoading(true); setMsg('');
    try {
      const payload = { userType: tab, id: form.id.trim() };
      if (tab === 'corp') payload.bizRegNum = form.bizRegNum.replace(/[^0-9]/g, '');
      if (tab === 'gov')  payload.email     = form.email.trim();

      const { data } = await axios.post(`${API_BASE}/api/password/reset/request`, payload);
      if (data?.ok && data?.issued && data?.resetToken) {
        setResetToken(data.resetToken);
        setMsg('본인확인이 완료되었습니다. 새 비밀번호를 입력하세요.');
      } else {
        setMsg('입력값을 확인했습니다. 조건이 맞다면 비밀번호를 설정할 수 있어요.');
      }
    } catch {
      setMsg('요청 실패. 잠시 후 다시 시도해 주세요.');
    } finally { setLoading(false); }
  };

  // 비밀번호 변경 요청 
  const confirm = async () => {
    if (!newPw || newPw.length < 8) return setMsg('비밀번호는 8자 이상이어야 합니다.');
    setLoading(true); setMsg('');
    try {
      const { data } = await axios.post(`${API_BASE}/api/password/reset/confirm`, {
        resetToken, newPw
      });
      if (data?.ok) {
        setMsg('비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.');
        setTimeout(() => navigate('/login'), 1200);
      } else {
        setMsg('토큰 만료/오류. 처음부터 다시 진행해 주세요.');
        setResetToken('');
      }
    } catch {
      setMsg('변경 실패. 잠시 후 다시 시도해 주세요.');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <Header />
      <div className="common-bg">
        <div className="common-box login-corp-box" style={{ maxWidth: 520 }}>
          <h2 style={{ marginTop: 6 }}>비밀번호 재설정</h2>

          {/* 탭 */}
          <div className="login-switch-btn-area" style={{ marginTop: 12 }}>
            <button
              className={tab === 'corp' ? 'login-switch-btn active' : 'login-switch-btn'}
              type="button"
              onClick={() => { setTab('corp'); setResetToken(''); setNewPw(''); setMsg(''); }}
            >
              기업
            </button>
            <button
              className={tab === 'gov' ? 'login-switch-btn active' : 'login-switch-btn'}
              type="button"
              onClick={() => { setTab('gov'); setResetToken(''); setNewPw(''); setMsg(''); }}
            >
              관공업
            </button>
          </div>

          {/* 폼 */}
          <div style={{ marginTop: 18 }}>
            {/* 1) 아이디 */}
            <input
              type="text"
              placeholder="아이디"
              value={form.id}
              onChange={e => setForm({ ...form, id: e.target.value })}
              style={inputFirst}
            />

            {/* 2) 두 번째 필드 (기업: 사업자등록번호 / 관공업: 이메일) */}
            {tab === 'corp' ? (
              <input
                type="text"
                placeholder="사업자등록번호 (숫자만 입력)"
                value={form.bizRegNum}
                onChange={e => setForm({ ...form, bizRegNum: e.target.value.replace(/[^0-9-]/g, '') })}
                style={inputSecond}
              />
            ) : (
              <input
                type="email"
                placeholder="이메일"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                style={inputSecond}
              />
            )}

            {/* 버튼(두 입력칸과 동일 규격 간격 후 배치) */}
            {!resetToken ? (
              <button
                style={primaryBtnStyle}
                disabled={loading || !canVerify}
                onClick={verify}
              >
                본인확인
              </button>
            ) : (
              <>
                <input
                  type="password"
                  placeholder="새 비밀번호를 입력해주세요"
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  style={inputSecond}
                />
                <button
                  style={primaryBtnStyle}
                  disabled={loading || !newPw}
                  onClick={confirm}
                >
                  비밀번호 변경하기
                </button>
              </>
            )}

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
