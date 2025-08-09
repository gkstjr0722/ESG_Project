// src/Pages/Service/Support.jsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../component/Header';
import '../../CSS/Sub.css';
import Notice from './Notice';

const Support = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const pathname = location?.pathname || '/';
  const isNotice = pathname === '/notice' || pathname.startsWith('/notice/');

  return (
    <>
      <Header />

      {/* 상단 탭바 */}
      <div className="support-banner-tabbar">
        <button
          type="button"
          className={`support-banner-tab${!isNotice ? ' active' : ''}`}
          onClick={() => navigate('/support')}
        >
          고객문의
        </button>
        <button
          type="button"
          className={`support-banner-tab${isNotice ? ' active' : ''}`}
          onClick={() => navigate('/notice')}
        >
          공지사항
        </button>
      </div>

      {/* 콘텐츠 */}
      {isNotice ? (
        <Notice />
      ) : (
        <div className="support-main-wrapper">
          <div className="support-center-card">
            <button
              type="button"
              className="support-card-btn"
              onClick={() => navigate('/faq')}
            >
              자주 묻는 질문
            </button>
            <button
              type="button"
              className="support-card-btn"
              onClick={() => navigate('/inquiry')}
            >
              고객 문의
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Support;
