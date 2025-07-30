import React, { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Header from './component/Header';
import LoginCorp from './component/LoginCorp';
import MyPage from './component/MyPage';
import EditMyPage from './component/EditMyPage';
import bannerImg from './assets/banner.webp';
import './App.css';

// 유튜브 썸네일 데이터
const videoData = [
  {
    title: '한전 파워플래너 소개',
    channel: 'KEPCO 공식',
    url: 'https://www.youtube.com/watch?v=he5BxBUhOBo',
    thumbnail: 'https://img.youtube.com/vi/he5BxBUhOBo/0.jpg',
  },
  {
    title: '에너지 캐시백',
    channel: 'KEPCO 공식',
    url: 'https://youtu.be/b5Oa1T0pNho?si=Qi1g6SV_XPMeR3fJ',
    thumbnail: 'https://img.youtube.com/vi/b5Oa1T0pNho/0.jpg',
  },
  {
    title: '1kWh 줄이기 캠페인',
    channel: 'KEPCO 공식',
    url: 'https://youtu.be/4p0_F3RlBoQ?si=y1AQ35s6XzurzEBO',
    thumbnail: 'https://img.youtube.com/vi/4p0_F3RlBoQ/0.jpg',
  },
];

// 메인 페이지 컴포넌트
function MainPage() {
  const [showVideos, setShowVideos] = useState(false);

  return (
    <div>
      <Header />
      <div
        className="main-banner-bg"
        style={{ backgroundImage: `url(${bannerImg})` }}
      >
        <button className="toggle-video-btn" onClick={() => setShowVideos(v => !v)}>
          {showVideos ? '홍보영상 닫기 ▲' : '홍보영상 보기 ▼'}
        </button>
        <div className={`video-panel${showVideos ? ' open' : ''}`}>
          <div className="video-grid">
            {videoData.map((video, idx) => (
              <a
                className="video-card"
                key={idx}
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  className="video-thumbnail"
                  src={video.thumbnail}
                  alt={video.title}
                />
                <div className="video-info">
                  <div className="video-title">{video.title}</div>
                  <div className="video-channel">{video.channel}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 40 }}>
       
          {/* <Link to="/joinmain" className="main-btn">회원가입</Link> */}
        </div>
      </div>
    </div>
  );
}

// 라우터 구조
function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/login-corp" element={<LoginCorp />} />
      <Route path="/mypage" element={<MyPage />} />
      <Route path="/editmypage" element={<EditMyPage />} />
    </Routes>
  );
}

export default App;

// 테스트 중입니다 