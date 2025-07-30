import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from './Header';
import axios from 'axios';

const Mypage = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. 로그인한 id를 localStorage에서 읽음
    const id = localStorage.getItem('id');
    if (!id) {
      alert('로그인이 필요합니다!');
      navigate('/login-corp');
      return;
    }

    // 2. 서버에 내 id로 조회 요청
    axios.post('http://localhost:3001/api/mypage/userinfo', { id })
      .then(res => {
        if (res.data.user) setUser(res.data.user);
        else {
          alert('회원 정보를 찾을 수 없습니다.');
          navigate('/login-corp');
        }
      })
      .catch(err => {
        alert('회원정보 조회 실패! 다시 로그인 해주세요.');
        navigate('/login-corp');
      });
  }, [navigate]);

  if (!user) return (
    <div>
      <Header />
      <div style={{ marginTop: 120 }}>사용자 정보를 불러오는 중입니다...</div>
    </div>
  );

  return (
    <div>
      <Header />
      <div style={{ marginTop: 80 }}>
        <h2>마이페이지</h2>
        <div>
          <p><strong>아이디:</strong> {user.id}</p>
          <p><strong>회사/기관명:</strong> {user.corpName}</p>
          <p><strong>사업자등록번호:</strong> {user.corpRegNum}</p>
          <p><strong>대표자명:</strong> {user.ceo}</p>
          {user.dept && <p><strong>부서/팀명:</strong> {user.dept}</p>}
          <p><strong>담당자명:</strong> {user.manager}</p>
          <p><strong>연락처(휴대폰):</strong> {user.phone}</p>
          <p><strong>이메일:</strong> {user.email}</p>
          {user.corpTel && <p><strong>회사(기관) 전화:</strong> {user.corpTel}</p>}
          <p><strong>회사(기관) 주소:</strong> {user.address}</p>
        </div>
        <br />
        <Link to="/editmypage" className="main-btn">정보 수정</Link>
      </div>
    </div>
  );
};

export default Mypage;
