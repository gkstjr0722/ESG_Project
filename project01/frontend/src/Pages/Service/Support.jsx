// src/Pages/Service/Support.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../component/Header';
import '../../CSS/Sub.css';
import Notice from './Notice';

const Support = () => {
  const [activeTab, setActiveTab] = useState('notice'); // 기본 탭
  const navigate = useNavigate();

  return (
    <>
      <Header />

      {/* 상단 탭바 */}
      <div className="support-banner-tabbar">
        <button
          type="button"
          className={`support-banner-tab${activeTab === 'qna' ? ' active' : ''}`}
          onClick={() => setActiveTab('qna')}
        >
          고객문의
        </button>
        <button
          type="button"
          className={`support-banner-tab${activeTab === 'notice' ? ' active' : ''}`}
          onClick={() => setActiveTab('notice')}
        >
          공지사항
        </button>
      </div>

      {/* 콘텐츠 */}
      {activeTab === 'qna' ? (
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
      ) : (
        <Notice />
      )}
    </>
  );
};



export default Support;
