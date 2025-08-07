// 회원가입

import '../CSS/Join.css';
import React, { useState } from 'react';
import { useNavigate, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import Header from '../component/Header';

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
    // 기업 백엔드 연결
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (bizCert) data.append('bizCert', bizCert);
      const res = await fetch('http://localhost:3001/user/joinCorp', { method: 'POST', body: data });
      if (res.ok) {
        alert('기업 회원가입 성공!');
        navigate('/login');
      } else {
        alert('기업 회원가입 실패!');
      }
    } catch {
      alert('서버 오류 또는 네트워크 오류!');
    }
  };

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data">
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
      <div className="upload-section">
        <label>사업자등록증 첨부 (선택)</label>
        <input type="file" accept="image/*,.pdf" onChange={e => setBizCert(e.target.files[0])} />
      </div>
      <div className="terms" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label><input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} required />약관 동의</label>
        <label><input type="checkbox" checked={agreePrivacy} onChange={e => setAgreePrivacy(e.target.checked)} required />개인정보처리방침 동의</label>
      </div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
        <button type="submit" className="main-btn" style={{ flex: 1 }}>회원가입 완료</button>
        <button type="button" onClick={goBack} style={{ flex: 1, backgroundColor: '#ccc', color: '#333' }}>돌아가기</button>
      </div>
    </form>
  );
}


// 관공용  회원가입 페이지
function GovernmentJoinForm({ goBack }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    corpName: '', ceo: '', dept: '', manager: '', phone: '', email: '', corpTel: '', address: '', id: '', pw: '', pw2: '',
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const handleChange = e => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!agreeTerms || !agreePrivacy) return alert('약관 및 개인정보 동의는 필수입니다.');
    if (formData.pw !== formData.pw2) return alert('비밀번호가 일치하지 않습니다.');
    // 관공업 백엔드 연결
    try {
      const res = await axios.post('http://localhost:3001/userg/joinGovernment', formData);
      if (res.data.result === 1) {
        alert('관공업 회원가입 성공!');
        navigate('/login');
      } else {
        alert('관공업 회원가입 실패!');
      }
    } catch {
      alert('서버 오류 또는 네트워크 오류!');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
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
      <div className="terms" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label><input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} required />약관 동의</label>
        <label><input type="checkbox" checked={agreePrivacy} onChange={e => setAgreePrivacy(e.target.checked)} required />개인정보처리방침 동의</label>
      </div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
        <button type="submit" className="main-btn" style={{ flex: 1 }}>회원가입 완료</button>
        <button type="button" onClick={goBack} style={{ flex: 1, backgroundColor: '#ccc', color: '#333' }}>돌아가기</button>
      </div>
    </form>
  );
}

const Join = () => {
  const navigate = useNavigate();

  return (
    <div>
      <Header />
      <div className="join-corp-bg">
        <div className="join-corp-box" style={{ maxWidth: '600px', margin: 'auto' }}>
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <h2>회원가입</h2>
                  <div>
                    <Link to="business" className="main-btn-01">기업</Link>
                    <Link to="government" className="main-btn-01">관공업</Link>
                  </div>
                </>
              }
            />
            <Route path="business" element={<><h2>공공기관·기업 회원가입</h2><BusinessJoinForm goBack={() => navigate('/join')} /></>} />
            <Route path="government" element={<><h2>관공업 회원가입</h2><GovernmentJoinForm goBack={() => navigate('/join')} /></>} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Join;
