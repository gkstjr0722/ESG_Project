// Header.jsx (className 정리 + 검색 완전 제거)
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logoImg from "../assets/logo.png";

// 경로는 프로젝트 구조에 맞게 확인 (보통: '../CSS/Main.css')
import '../CSS/Main.css';

const mainMenuList = [
  { label: '전력사용현황', path: '/calcmain' },
  { label: '위치찾기', path: '/map' },
  { label: '고객센터', path: '/support' }
];

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState('none');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkLogin = () => {
      const biz = localStorage.getItem('id');
      const gov = localStorage.getItem('gov_id');
      if (biz) { setIsLoggedIn(true); setUserType('business'); }
      else if (gov) { setIsLoggedIn(true); setUserType('government'); }
      else { setIsLoggedIn(false); setUserType('none'); }
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
    setOpen(false);
  };

  return (
    <div className="cHeader">
      <nav className="cHeader-Nav">
        {/* 좌측: 로고 */}
        <span className="cHeader-Logo">
          <Link to="/" className="cHeader-LogoLink" aria-label="Han's">
            <img src={logoImg} alt="Han's" className="cHeader-LogoImg" />
          </Link>
          {isLoggedIn && (userType === 'business' || userType === 'government') && (
            <Link className="cHeader-Badge" to="/">
              {userType === 'business' ? '기업용' : '관공용'}
            </Link>
          )}
        </span>

        {/* 데스크탑: 메인 메뉴 */}
        <div className="cHeader-Menu">
          {mainMenuList.map(menu => (
            <Link key={menu.label} to={menu.path} className="cHeader-MenuItem">
              {menu.label}
            </Link>
          ))}
        </div>

        {/* 데스크탑: 우측 유틸 */}
        <div className="cHeader-Util">
          <Link to="/mypage" className="cHeader-UtilLink">마이페이지</Link>
          {isLoggedIn ? (
            <span className="cHeader-LoginBtn" onClick={handleLogout}>
              로그아웃
            </span>
          ) : (
            <Link to="/login" className="cHeader-LoginBtn">로그인</Link>
          )}
        </div>

        {/* 모바일: 햄버거만 */}
        <div className="cHeader-UtilMobile">
          <button
            className="cHeader-IconBtn"
            aria-label="Menu"
            onClick={() => setOpen(true)}
          >
            <svg width="26" height="26" viewBox="0 0 24 24">
              <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </nav>

      {/* 모바일 드로어 & 백드롭 */}
      <div
        className={`cHeader-DrawerBackdrop ${open ? 'is-open' : ''}`}
        onClick={() => setOpen(false)}
      />
      <aside
        className={`cHeader-Drawer ${open ? 'is-open' : ''}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="cHeader-DrawerHead">
          <span>메뉴</span>
          <button className="cHeader-IconBtn" aria-label="Close" onClick={() => setOpen(false)}>
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="cHeader-DrawerSection">
          {mainMenuList.map(m => (
            <Link
              key={m.label}
              to={m.path}
              className="cHeader-DrawerLink"
              onClick={() => setOpen(false)}
            >
              {m.label}
            </Link>
          ))}
        </div>

        <div className="cHeader-DrawerSection">
          {isLoggedIn ? (
            <>
              <Link
                to="/mypage"
                className="cHeader-DrawerLink"
                onClick={() => setOpen(false)}
              >
                마이페이지
              </Link>
              <button className="cHeader-DrawerLink cHeader-BtnLike" onClick={handleLogout}>
                로그아웃
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="cHeader-DrawerLink"
              onClick={() => setOpen(false)}
            >
              로그인
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
};

export default Header;
