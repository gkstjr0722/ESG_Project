// src/Pages/App.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../CSS/Main.css';
import Header from '../component/Header';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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

// ── 메인 공지 캐러셀 (이 파일 안에 포함)
function HomeNoticeCarousel({ limit = 6, intervalMs = 4500 }) {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [idx, setIdx] = useState(0);
  const timer = useRef(null);
  const hovering = useRef(false);

  // 공지 N개 가져오기
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await axios.get(`http://localhost:3001/api/notice/banner?limit=${limit}`);
        if (alive) setItems(data.notices || []);
      } catch {
        if (alive) setItems([]);
      }
    })();
    return () => { alive = false; };
  }, [limit]);

  // 자동 넘김
  useEffect(() => {
    if (!items.length) return;
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      if (!hovering.current) setIdx(i => (i + 1) % items.length);
    }, intervalMs);
    return () => clearInterval(timer.current);
  }, [items, intervalMs]);

  const go = (i) => setIdx((i + items.length) % items.length);
  const current = useMemo(() => items[idx] || null, [items, idx]);

  if (!items.length) return null;

  return (
    <div
      className="notice-hero"
      onMouseEnter={() => (hovering.current = true)}
      onMouseLeave={() => (hovering.current = false)}
    >
      <button className="notice-hero__nav prev" onClick={() => go(idx - 1)} aria-label="이전">‹</button>

      <div
        className="notice-hero__content"
        onClick={() => nav(`/notice/${current.NOTICE_ID}`)} // 필요 시 `/notice?open=${current.NOTICE_ID}`
        role="button"
      >
        <div className="notice-hero__eyebrow">공지사항</div>
        <div className="notice-hero__title" title={current.TITLE}>{current.TITLE}</div>
        <div className="notice-hero__date">{current.NOTICE_DT?.slice(0, 10)}</div>
        <div className="notice-hero__cta">공지사항 바로가기 →</div>
      </div>

      <button className="notice-hero__nav next" onClick={() => go(idx + 1)} aria-label="다음">›</button>

      <div className="notice-hero__dots">
        {items.map((_, i) => (
          <button
            key={i}
            className={`dot ${i === idx ? 'active' : ''}`}
            onClick={() => go(i)}
            aria-label={`${i + 1}번째 공지 보기`}
          />
        ))}
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="main-page-root">
      <Header />

      <div className="app-container">
        {/* 🔹 공지 슬라이드 배너만 남김 */}
        <section className="notice-section">
          <HomeNoticeCarousel />
        </section>
      </div>

      {/* 🔹 홍보영상 섹션 */}
      <div className="video-list-section">
        <div className="video-list-section-text">
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
      </div>
    </div>
  );
}

export default App;
