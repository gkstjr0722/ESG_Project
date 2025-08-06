import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import '../CSS/Header.css';

const mainMenuList = [
  { label: '전력사용현황', path: '/calcmain' },
  { label: '위치찾기', path: '/location' },
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

  // 로고 텍스트 동적 처리
  let logoText = "Han's";
  if (isLoggedIn && userType === 'business') logoText += ' 기업용';
  if (isLoggedIn && userType === 'government') logoText += ' 관공용';

  return (
    <div className="menu-wrapper">
      <nav className="navbar">
        <span className="logo">
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}>
            {logoText}
          </Link>
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
          <Link to="/mypage" className="userpage">
            <span role="img" aria-label="user">👤</span>
          </Link>
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
