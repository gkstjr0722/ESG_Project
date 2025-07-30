import './Join.css'
import { useState } from "react";
import Header from './Header'; // 또는 ./components/Header
import { useNavigate } from "react-router-dom"; // ← 추가!
import axios from 'axios';
import React from 'react';


const JoinGovernment = () => {
  // 각각 입력값 상태
  const [corpName, setCorpName] = useState('');
  const [ceo, setCeo] = useState('');
  const [dept, setDept] = useState('');
  const [manager, setManager] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [corpTel, setCorpTel] = useState('');
  const [address, setAddress] = useState('');
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

    const navigate = useNavigate(); // ← 추가

  // 제출 이벤트 핸들러 예시
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!agreeTerms || !agreePrivacy) {
    alert('약관 및 개인정보 동의는 필수입니다.');
    return;
  }
  if (pw !== pw2) {
    alert('비밀번호가 일치하지 않습니다.');
    return;
  }
  // POST 요청
  try {
    const res = await axios.post('http://localhost:3001/userg/joinGovernment', {
      corpName, ceo, dept, manager, phone, email, corpTel, address, id, pw
    });
    if (res.data.result === 1) {
      alert('회원가입 성공!');
      navigate('/login');
    } else {
      alert('회원가입 실패!');
    }
  } catch (err) {
    alert('서버 오류 또는 DB 오류!');
  }
};

  return (
    <div>
    <Header />
    <div className="join-corp-bg">
      <div className="join-corp-box">
        <br /><br /><br /><br />
        <h2>관공업 회원가입</h2>
        <br /><br />
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="회사/기관명" value={corpName} onChange={e => setCorpName(e.target.value)} required />
          <input type="text" placeholder="대표자명" value={ceo} onChange={e => setCeo(e.target.value)} required />
          <input type="text" placeholder="[선택] 부서/팀명" value={dept} onChange={e => setDept(e.target.value)} />
          <input type="text" placeholder="담당자명" value={manager} onChange={e => setManager(e.target.value)} required />
          <input type="tel" placeholder="연락처(휴대폰)" value={phone} onChange={e => setPhone(e.target.value)} required />
          <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="text" placeholder="[선택] 회사(기관) 전화" value={corpTel} onChange={e => setCorpTel(e.target.value)} />
          <input type="text" placeholder="회사(기관) 주소" value={address} onChange={e => setAddress(e.target.value)} required />
          <input type="text" placeholder="아이디 (영문+숫자)" value={id} onChange={e => setId(e.target.value)} required />
          <input type="password" placeholder="비밀번호" value={pw} onChange={e => setPw(e.target.value)} required />
          <input type="password" placeholder="비밀번호 확인" value={pw2} onChange={e => setPw2(e.target.value)} required />
          <div className="terms">
            <label>
              <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} required />
              약관 동의
            </label>
            <label>
              <input type="checkbox" checked={agreePrivacy} onChange={e => setAgreePrivacy(e.target.checked)} required />
              개인정보처리방침 동의
            </label>
          </div>
          <br />
          <button className="main-btn" type="submit">회원가입 완료</button>
        </form>
      </div>
    </div>
    </div>
  );
};

export default JoinGovernment;
