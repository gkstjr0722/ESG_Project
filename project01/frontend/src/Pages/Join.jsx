// 회원가입

import '../CSS/Sub.css';
import React, { useState } from 'react';
import { useNavigate, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import Header from '../component/Header';

const API_BASE = import.meta?.env?.VITE_API_BASE || 'http://192.168.111.194:3001';

// 기업용 회원가입 페이지
function BusinessJoinForm({ goBack }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    corpName: '', corpRegNum: '', ceo: '', dept: '', manager: '', phone: '', email: '', corpTel: '', address: '', id: '', pw: '', pw2: '',
  });
  const [bizCert, setBizCert] = useState(null);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const handleChange = e => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!agreeTerms || !agreePrivacy) return alert('약관 및 개인정보 동의는 필수입니다.');
    if (formData.pw !== formData.pw2) return alert('비밀번호가 일치하지 않습니다.');
    if (!/^\d{10}$/.test(formData.corpRegNum)) return alert('사업자등록번호는 숫자 10자리여야 합니다.');

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (bizCert) data.append('bizCert', bizCert);

      // ✅ API_BASE 사용 + multipart 헤더 명시(안정성)
      const res = await axios.post(`${API_BASE}/user/joinCorp`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.status === 201 || res.data?.result === 1) {
        alert(res.data?.message || '기업 회원가입 성공!');
        navigate('/login');
      } else {
        alert(res.data?.message || '기업 회원가입 실패!');
      }
    } catch (err) {
      if (err.response?.status === 409) alert(err.response.data?.message || '중복된 값이 있습니다.');
      else if (err.response?.status === 400) alert(err.response.data?.message || '필수값을 확인하세요.');
      else alert('서버 오류 또는 네트워크 오류!');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="cContent" encType="multipart/form-data">
      <input type="text" name="corpName" placeholder="회사/기관명" value={formData.corpName} onChange={handleChange} required />
      <input type="text" name="corpRegNum" placeholder="사업자등록번호 (10자리)" maxLength={10} value={formData.corpRegNum} onChange={handleChange} required />
      <input type="text" name="ceo" placeholder="대표자명" value={formData.ceo} onChange={handleChange} required />
      <input type="text" name="dept" placeholder="부서/팀명 (선택)" value={formData.dept} onChange={handleChange} />
      <input type="text" name="manager" placeholder="담당자명" value={formData.manager} onChange={handleChange} required />
      <input type="tel" name="phone" placeholder="연락처(휴대폰)" value={formData.phone} onChange={handleChange} required />
      <input type="email" name="email" placeholder="이메일" value={formData.email} onChange={handleChange} required />
      <input type="text" name="corpTel" placeholder="회사(기관) 전화 (선택)" value={formData.corpTel} onChange={handleChange} />
      <input type="text" name="address" placeholder="회사(기관) 주소" value={formData.address} onChange={handleChange} required />
      <input type="text" name="id" placeholder="아이디 (영문+숫자)" value={formData.id} onChange={handleChange} required />
      <input type="password" name="pw" placeholder="비밀번호" value={formData.pw} onChange={handleChange} required />
      <input type="password" name="pw2" placeholder="비밀번호 확인" value={formData.pw2} onChange={handleChange} required />
      <div className="sJoin-section">
        <label>사업자등록증 첨부 (선택)</label>
        <input type="file" accept="image/*,.pdf" onChange={e => setBizCert(e.target.files[0])} />
      </div>
      <div className="cCheck sJoin-Check">
        <label>
          <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} required />
          약관 동의
        </label>
        <label>
          <input type="checkbox" checked={agreePrivacy} onChange={e => setAgreePrivacy(e.target.checked)} required />
          개인정보처리방침 동의
        </label>
      </div>
      <div className="sJoin-Option">
        <button type="button" onClick={goBack} className="cBlueBtn sJoin-Back">돌아가기</button>
        <button type="submit" className="cBlueBtn sJoin-Ok">회원가입 완료</button>
      </div>
    </form>
  );
}

// 관공업 회원가입 페이지
function GovernmentJoinForm({ goBack }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    corpName: '', ceo: '', dept: '', manager: '', phone: '', email: '', corpTel: '', address: '', id: '', pw: '', pw2: '',
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = e =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!agreeTerms || !agreePrivacy) return alert('약관 및 개인정보 동의는 필수입니다.');
    if (formData.pw !== formData.pw2) return alert('비밀번호가 일치하지 않습니다.');

    const payload = {
      corpName: formData.corpName.trim(),
      ceo: formData.ceo.trim(),
      dept: formData.dept.trim() || null,
      manager: formData.manager.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      corpTel: formData.corpTel.trim() || null,
      address: formData.address.trim(),
      id: formData.id.trim(),
      pw: formData.pw,
    };

    try {
      setLoading(true);
      const url = `${API_BASE}/userg/join_gov`;     // ✅ 경로: /userg/join_gov (소문자 g)
      console.log('[JOIN] POST', url);              // 🔎 문제시 실제 전송 경로 확인용(기능영향X)

      const res = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.data?.result === 1) {
        alert('관공업 회원가입 성공! 로그인 해주세요.');
        navigate('/login');
      } else {
        alert(res.data?.message || '관공업 회원가입 실패!');
      }
    } catch (err) {
      if (err.response?.status === 409) alert('이미 존재하는 ID입니다.');
      else if (err.response?.status === 400) alert('필수값을 확인해 주세요.');
      else alert('서버 오류 또는 네트워크 오류!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="cContent">
      <input type="text" name="corpName" placeholder="회사/기관명" value={formData.corpName} onChange={handleChange} required />
      <input type="text" name="ceo" placeholder="대표자명" value={formData.ceo} onChange={handleChange} required />
      <input type="text" name="dept" placeholder="부서/팀명 (선택)" value={formData.dept} onChange={handleChange} />
      <input type="text" name="manager" placeholder="담당자명" value={formData.manager} onChange={handleChange} required />
      <input type="tel" name="phone" placeholder="연락처(휴대폰)" value={formData.phone} onChange={handleChange} required />
      <input type="email" name="email" placeholder="이메일" value={formData.email} onChange={handleChange} required />
      <input type="text" name="corpTel" placeholder="회사(기관) 전화 (선택)" value={formData.corpTel} onChange={handleChange} />
      <input type="text" name="address" placeholder="회사(기관) 주소" value={formData.address} onChange={handleChange} required />
      <input type="text" name="id" placeholder="아이디 (영문+숫자)" value={formData.id} onChange={handleChange} required />
      <input type="password" name="pw" placeholder="비밀번호" value={formData.pw} onChange={handleChange} required />
      <input type="password" name="pw2" placeholder="비밀번호 확인" value={formData.pw2} onChange={handleChange} required />

      <div className="cCheck sJoin-Check">
        <label>
          <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} required />
          약관 동의
        </label>
        <label>
          <input type="checkbox" checked={agreePrivacy} onChange={e => setAgreePrivacy(e.target.checked)} required />
          개인정보처리방침 동의
        </label>
      </div>

      <div className="sJoin-Option">
        <button type="button" onClick={goBack} className="cBlueBtn sJoin-Back">돌아가기</button>
        <button type="submit" className="cBlueBtn sJoin-Ok" disabled={loading}>회원가입</button>
      </div>
    </form>
  );
}

const Join = () => {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <div className="cBox">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <a className="cBack" onClick={() => navigate('/login')}>
                  ← 돌아가기
                </a>
                <br />
                <h2>회원가입</h2>
                <div className="sJoin-Box">
                  <button
                    type="button"
                    className="cBlueBtn sJoin-Btn"
                    onClick={() => navigate("business")}
                  >
                    기업
                  </button>
                  <button
                    type="button"
                    className="cBlueBtn sJoin-Btn"
                    onClick={() => navigate("government")}
                  >
                    관공업
                  </button>
                </div>
              </>
            }
          />
          <Route path="business" element={<><h2>공공기관·기업 회원가입</h2><BusinessJoinForm goBack={() => navigate('/join')} /></>} />
          <Route path="government" element={<><h2>관공업 회원가입</h2><GovernmentJoinForm goBack={() => navigate('/join')} /></>} />
        </Routes>
      </div>
    </>
  );
};

export default Join;
