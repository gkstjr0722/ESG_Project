// 헤더


import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

// 로고 이미지
import logoImg from "../assets/logo.png"

// 링크 연결용
const mainMenuList = [
  { label: '전력사용현황', path: '/calcmain' },
  { label: '위치찾기', path: '/map' },
  { label: '고객센터', path: '/support' }
];

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState('none');
  const navigate = useNavigate();

  useEffect(() => {
    const checkLogin = () => {
      const biz = localStorage.getItem('id');
      const gov = localStorage.getItem('gov_id');
      if (biz) {
        setIsLoggedIn(true);
        setUserType('business');
      } else if (gov) {
        setIsLoggedIn(true);
        setUserType('government');
      } else {
        setIsLoggedIn(false);
        setUserType('none');
      }
    };
    checkLogin();
    window.addEventListener('storage', checkLogin);
    return () => window.removeEventListener('storage', checkLogin);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('id');
    localStorage.removeItem('gov_id');
    setIsLoggedIn(false);
    setUserType('none');
    alert('로그아웃하셨습니다');
    navigate('/');
  };

  return (
    <div className="menu-wrapper">
      <nav className="navbar">
        <span className="logo">
          <Link to="/" className="logo-link" aria-label="Han's">
            <img src={logoImg} alt="Han's" className="logo-img" />
          </Link>
          {isLoggedIn && (userType === 'business' || userType === 'government') && (
            <Link className="logo-badge" to="/">
               {userType === 'business' ? '기업용' : '관공용'}
            </Link>
          )}
        </span>
        <div className="menu-buttons">
          {mainMenuList.map(menu => (
            <Link
              key={menu.label}
              to={menu.path}
              className="menu-main-text"
            >
              {menu.label}
            </Link>

          ))}
        </div>
        <div className="nav-icons">
          <Link to="/mypage" className="userpage">마이페이지</Link>
          {isLoggedIn ? (
            <span
              className="login-text"
              style={{ cursor: 'pointer' }}
              onClick={handleLogout}
            >
              로그아웃
            </span>
          ) : (
            <Link to="/login" className="login-text">로그인</Link>
          )}
        </div>
      </nav>
    </div>
  );
};

export default Header;
