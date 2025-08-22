// src/Pages/Service/Support.jsx
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../component/Header';
import '../../CSS/Sub.css';
import Notice from './Notice';
import FAQ from './FAQ';
import Inquiry from './Inquiry';

const Support = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const pathname = location?.pathname || '/';
  const isNoticeActive  = pathname.startsWith('/notice');
  const isInquiryActive = pathname.startsWith('/inquiry');
  const isFAQActive     = pathname.startsWith('/faq');

  // 리다이렉트 예정 여부
  const aboutToRedirect = pathname === '/support' && !location.state?.fromTab;

  // UI에서는 미리 공지 탭을 활성화로 간주


  useEffect(() => {
    if (aboutToRedirect) {
      navigate('/notice', { replace: true });
    }
  }, [aboutToRedirect, navigate]);

  return (
    <>
      <Header />

      {/* 상단 탭바 */}
      <div className="cTab">
        <button type="button" className={isNoticeActive ? 'active' : ''}  onClick={() => navigate('/notice')}>공지사항</button>
        <button type="button" className={isInquiryActive ? 'active' : ''} onClick={() => navigate('/inquiry')}>고객문의</button>
        <button type="button" className={isFAQActive ? 'active' : ''}     onClick={() => navigate('/faq')}>자주 묻는 질문</button>
      </div>

      {/* 콘텐츠 */}
      {isNoticeActive ? (
        <Notice />
      ) : isInquiryActive ? (
        <Inquiry />
      ) : isFAQActive ? (
        <FAQ />
      ) : (
        // 안전장치: 혹시라도 다른 경로면 공지로
        <Notice />
      )}
    </>
  );
};

export default Support;
