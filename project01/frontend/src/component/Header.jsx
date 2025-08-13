import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import userIcon from "../assets/userIcon.png";
// import logoImg from "../assets/logo.png"
import logoImg from "../assets/logo01.png"


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

  // 마이페이지 이미지 로드 실패 시 이모지로 대체
  const handleAvatarError = (e) => {
    e.currentTarget.style.display = 'none';
    const fallback = document.createElement('span');
    fallback.setAttribute('role', 'img');
    fallback.setAttribute('aria-label', 'user');
    fallback.textContent = '👤';
    e.currentTarget.parentNode.appendChild(fallback);
  };

  return (
    <div className="menu-wrapper">
      <nav className="navbar">
        <span className="logo">
          <Link to="/" className="logo-link" aria-label="Han's">
            <img src={logoImg} alt="Han's" className="logo-img" />
          </Link>
          {isLoggedIn && (userType === 'business' || userType === 'government') && (
            // <Link to="/">
            <span className="logo-badge">
               {userType === 'business' ? '기업용' : '관공용'}
            </span>
            // </Link>
          )}
        </span>
        <div className="menu-buttons">
          {mainMenuList.map(menu => (
            <Link
              key={menu.label}
              to={menu.path}
              className="menu-main-text"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              {menu.label}
            </Link>

          ))}
        </div>
        <div className="nav-icons">
          <Link to="/mypage" className="userpage">마이페이지</Link>
          {/* <Link to="/mypage" className="userpage">
            <img
              src={userIcon}
              alt="마이페이지"
              className="nav-avatar"
              width={28}
              height={28}
              onError={handleAvatarError}
            />
          </Link> */}
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
