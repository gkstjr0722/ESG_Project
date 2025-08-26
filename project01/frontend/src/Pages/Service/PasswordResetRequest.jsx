// frontend/src/Pages/Service/PasswordResetRequest.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../CSS/Sub.css';
import Header from '../../component/Header';
import axios from 'axios';

const API_BASE = import.meta?.env?.VITE_API_BASE || 'http://localhost:3001';

export default function PasswordResetRequest() {
  const [tab, setTab] = useState('corp'); // 'corp' | 'gov'
  const [form, setForm] = useState({ id: '', bizRegNum: '', email: '' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ 기업: 아이디 + 사업자번호 + 이메일 / 관공: 아이디 + 이메일
  const canVerify =
    form.id.trim() &&
    (tab === 'corp'
      ? form.bizRegNum.trim() && form.email.trim()
      : form.email.trim());

  const requestEmail = async () => {
    if (!canVerify) return;
    setLoading(true);
    setMsg('');
    try {
      const payload = { userType: tab, id: form.id.trim() };
      if (tab === 'corp') {
        payload.bizRegNum = form.bizRegNum.replace(/[^0-9]/g, '');
        payload.email = form.email.trim();
      } else {
        payload.email = form.email.trim();
      }

      await axios.post(`${API_BASE}/auth/email/request`, payload);

      setMsg('비밀번호 재설정 메일을 전송했습니다.');
    } catch (e) {
      const status = e?.response?.status;
      const backendMsg = e?.response?.data?.msg;

      if (status === 404) {
        setMsg('회원 정보를 찾을 수 없습니다.');
      } else if (status === 400) {
        setMsg(backendMsg || '입력값을 확인해 주세요.');
      } else if (status === 500) {
        setMsg(backendMsg || '메일 전송 중 오류가 발생했습니다.');
      } else {
        setMsg('요청 실패. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="cBox">
        {/* ⬇️ 예전과 동일하게 a 태그 유지 */}
        <a
          href="#"
          className="cBack"
          onClick={(e) => {
            e.preventDefault();
            navigate('/login');
          }}
        >
          ← 돌아가기
        </a>

        <h2>비밀번호 재설정</h2>

        <div className="cChoice">
          <button
            className={tab === 'corp' ? 'active' : ''}
            type="button"
            onClick={() => {
              setTab('corp');
              setForm({ id: '', bizRegNum: '', email: '' });
              setMsg('');
            }}
          >
            기업
          </button>
          <button
            className={tab === 'gov' ? 'active' : ''}
            type="button"
            onClick={() => {
              setTab('gov');
              setForm({ id: '', bizRegNum: '', email: '' });
              setMsg('');
            }}
          >
            관공업
          </button>
        </div>

        <div className="cContent">
          {/* 아이디 */}
          <input
            type="text"
            placeholder="아이디"
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
          />

          {/* 두 번째/세 번째 입력 */}
          {tab === 'corp' ? (
            <>
              <input
                type="text"
                placeholder="사업자등록번호 (숫자만)"
                value={form.bizRegNum}
                onChange={(e) =>
                  setForm({
                    ...form,
                    bizRegNum: e.target.value.replace(/[^0-9-]/g, ''),
                  })
                }
              />
              <input
                type="email"
                placeholder="이메일"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </>
          ) : (
            <input
              type="email"
              placeholder="이메일"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          )}

          {msg && <div className="cError sPw-Error">{msg}</div>}

          <button
            className="cBlueBtn sPw-Btn"
            disabled={loading || !canVerify}
            onClick={requestEmail}
          >
            {loading ? '요청 중...' : '메일 보내기'}
          </button>
        </div>
      </div>
    </>
  );
}

// 비번 재설정 방식 수정 2