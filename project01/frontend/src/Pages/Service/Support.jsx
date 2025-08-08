import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // navigate 추가!
import Header from '../../component/Header';
// import '../../CSS/Support.css'
import '../../CSS/Sub.css';
import Notice from './Notice';

const Support = () => {
  const [activeTab, setActiveTab] = useState('notice');
  const navigate = useNavigate(); // << 이거 꼭 필요!

  return (
    <>
      <Header />

      {/* 배너 스타일 탭바 */}
      <div className="support-banner-tabbar">
        <button
          className={`support-banner-tab${activeTab === 'qna' ? ' active' : ''}`}
          onClick={() => setActiveTab('qna')}
        >
          고객문의
        </button>
        <button
          className={`support-banner-tab${activeTab === 'notice' ? ' active' : ''}`}
          onClick={() => setActiveTab('notice')}
        >
          공지사항
        </button>
      </div>

      {/* 중앙 카드 */}
      {activeTab === 'qna' && (
        <div className='support-main-wrapper'>
          <div className="support-center-card">
            <div
              className="support-card-btn"
              onClick={() => navigate('/faq')}
              tabIndex={0}
              role="button"
              onKeyPress={e => { if (e.key === 'Enter') navigate('/faq') }}
            >
              자주 묻는 질문
            </div>
            <div
              className="support-card-btn"
              onClick={() => navigate('/inquiry')}
              tabIndex={0}
              role="button"
              onKeyPress={e => { if (e.key === 'Enter') navigate('/inquiry') }}
            >
              고객 문의
            </div>
          </div>
        </div>
      )}
      {activeTab === 'notice' && (
        <Notice /> 
      )}
    </>
  );
};

export default Support;
