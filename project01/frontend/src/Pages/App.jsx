// import React, { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import '../CSS/Main.css';
import Header from '../component/Header';
import Slider from './Slider';

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
function App() {

  return (
    <div className="main-page-root">
      <Header/>
      <div className="app-container">
      <section className="slider-section">
        <Slider/>
      </section>
    </div>

        <button className='banner-button'>공지사항 바로가기</button>
        
        <div className="video-list-section">
          <div className='video-list-section-text'>
            <h1>홍보영상</h1>
            <h1>보러가기</h1>
          </div>
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
        {/* </div> */}
      </div>
    </div>
  );
}


export default App;
