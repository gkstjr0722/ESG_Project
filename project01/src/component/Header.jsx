import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import './Header.css';

const megaMenuList = [
  { label: '기업용', submenu: ['전기요금계산', '탄소량계산'] },
  { label: '관공업용', submenu: ['전기요금계산', '탄소량계산'] },
  { label: '위치찾기', submenu: ['전기차 충전소', '전기공사업체'] },
  { label: '고객센터', submenu: ['Hans게시판', '자료실'] },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkLogin = () => {
      const biz = localStorage.getItem('id');
      const gov = localStorage.getItem('gov_id');
      setIsLoggedIn(!!biz || !!gov);
    };
    checkLogin();
    window.addEventListener('storage', checkLogin);
    return () => window.removeEventListener('storage', checkLogin);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('id');
    localStorage.removeItem('gov_id');
    setIsLoggedIn(false);
    alert('로그아웃하셨습니다');
    navigate('/'); // 메인페이지로 이동
  };

  return (
    <div className="menu-wrapper" onMouseLeave={() => setIsMenuOpen(false)}>
      <nav className="navbar">
        <span className="logo">
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            Han's E·S
          </Link>
        </span>
        <div className="menu-buttons">
          {megaMenuList.map((menu, idx) => (
            <span
              key={menu.label}
              className="menu-main-text"
              onMouseEnter={() => setIsMenuOpen(true)}
              onFocus={() => setIsMenuOpen(true)}
            >
              {menu.label}
            </span>
          ))}
        </div>
        <div className="nav-icons">
          <span role="img" aria-label="search">🔍</span>
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
      <div className={`mega-menu-bar${isMenuOpen ? ' open' : ''}`}>
        <div className="mega-menu-row">
          {megaMenuList.map((menu, idx) => (
            <div key={menu.label} className="mega-menu-col">
              {menu.submenu.map((item, j) => {
                if (idx === 0 && j === 0) {
                  return (
                    <Link
                      to="/powercalc"
                      key={j}
                      className="mega-menu-item"
                      style={{ textDecoration: 'none', color: 'inherit' }}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item}
                    </Link>
                  );
                } else {
                  return (
                    <div key={j} className="mega-menu-item">{item}</div>
                  );
                }
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Header;
