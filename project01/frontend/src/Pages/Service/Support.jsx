// src/Pages/Service/Support.jsx
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../component/Header';
import '../../CSS/Sub.css';
import Notice from './Notice';

const Support = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const pathname = location?.pathname || '/';
  const isNoticePath = pathname === '/notice' || pathname.startsWith('/notice/');

  // 리다이렉트 예정 여부
  const aboutToRedirect = pathname === '/support' && !location.state?.fromTab;

  // UI에서는 미리 공지 탭을 활성화로 간주
  const isNoticeActive = isNoticePath || aboutToRedirect;

  useEffect(() => {
    if (aboutToRedirect) {
      navigate('/notice', { replace: true });
    }
  }, [aboutToRedirect, navigate]);

  return (
    <>
      <Header />

      {/* 상단 탭바 */}
      <div className="support-banner-tabbar">
        <button
          type="button"
          className={`support-banner-tab${isNoticeActive ? ' active' : ''}`}
          onClick={() => navigate('/notice')}
        >
          공지사항
        </button>
        <button
          type="button"
          className={`support-banner-tab${!isNoticeActive ? ' active' : ''}`}
          onClick={() => navigate('/support', { state: { fromTab: true } })}
        >
          고객문의
        </button>
      </div>

      {/* 콘텐츠 */}
      {isNoticeActive ? (
        <Notice />
      ) : (
        <div className="bg-common">
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
        </div>
      )}
    </>
  );
};

export default Support;
