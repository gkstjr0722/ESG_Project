// src/Pages/App.jsx
import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import '../CSS/Main.css';
import Header from '../component/Header';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper'; // 신버전: 모듈 prop로 주입

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import photo1 from '../assets/Slider01.png'; // 폭우사진
import photo2 from '../assets/Slider02.png'; // 전기요금
import photo3 from '../assets/Slider03.png'; // 분할납부
import photo4 from '../assets/Slider01.png';
import photo5 from '../assets/Slider02.png';

/* ======================
   MOCK(임시데이터) 스위치 & 데이터
   ====================== */
const USE_MOCK = false; // CSS 작업용: true / 실제 연동: false
const MOCK_SLIDES = [
  { NOTICE_ID: 101, TITLE: '폭우로 인한 전기안전 주의 안내 ', NOTICE_DT: '2025-08-20' },
  { NOTICE_ID: 102, TITLE: '여름철 전기요금 절약 방법 안내', NOTICE_DT: '2025-08-18' },
  { NOTICE_ID: 103, TITLE: '전기요금 분할납부 한시적 확대시행 안내', NOTICE_DT: '2025-08-16' },
  // 필요하면 MOCK에 직접 IMG 필드를 넣어도 됨: { ..., IMG: 'https://...' }
];

/* 공지 개수에 맞춰 순서대로 매칭될 이미지 풀(5개) */
const IMAGE_POOL = [photo1, photo2, photo3, photo4, photo5];

/* ======================
   내부 Slider 컴포넌트
   ====================== */
const USE_ABSOLUTE = false;

function Slider({ limit = 6 }) {
  const nav = useNavigate();
  const swiperRef = useRef(null);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;

    if (USE_MOCK) {
      setItems(MOCK_SLIDES.slice(0, Math.min(limit, 10)));
      setErr('');
      setLoading(false);
      return () => { alive = false; };
    }

    (async () => {
      try {
        const url = USE_ABSOLUTE
          ? `http://192.168.111.194:3001/api/notice/banner?limit=${Math.min(limit, 10)}`
          : `/api/notice/banner?limit=${Math.min(limit, 10)}`;
        const { data } = await axios.get(url);
        if (!alive) return;
        setItems(Array.isArray(data?.notices) ? data.notices : []);
        setErr('');
      } catch (e) {
        if (!alive) return;
        setErr(String(e?.message || 'fetch failed'));
        setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [limit]);

  const goDetail = (id) => nav(`/notice/${id}`);
  const slides = useMemo(() => items, [items]);

  if (loading) {
    return <div className="mySwiper" />;
  }

  const baseSlides = slides.length
    ? slides
    : [{ NOTICE_ID: 'empty', TITLE: err ? '공지 불러오기 실패' : '등록된 공지가 없습니다', NOTICE_DT: '' }];

  /* ▲ 이미지 매칭: 각 공지에 IMG/IMAGE_URL/THUMBNAIL 없으면 IMAGE_POOL에서 순서대로 할당 */
  const renderSlides = baseSlides.map((n, i) => ({
    ...n,
    _img: n.IMG || n.IMAGE_URL || n.THUMBNAIL || IMAGE_POOL[i % IMAGE_POOL.length],
  }));

  return (
    <>
      <section className="mSlider">
        <button className="mSlider-PBtn" aria-label="Previous slide">&lt;</button>
        <button className="mSlider-NBtn" aria-label="Next slide">&gt;</button>

        <Swiper
          ref={swiperRef}
          modules={[Pagination, Navigation, Autoplay]}
          className="mySwiper"
          slidesPerView={1}
          spaceBetween={0}
          loop={renderSlides.length > 1}
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
            pauseOnMouseEnter: false,
          }}
          pagination={{ clickable: true }}
          navigation={{ prevEl: '.mSlider-PBtn', nextEl: '.mSlider-NBtn' }}
          watchOverflow={false}
        >
          {renderSlides.map((n) => (
            <SwiperSlide key={n.NOTICE_ID}>
              <div className="mSlide">
                {/* 썸네일 */}
                <img
                  className="mSlide-Img"
                  src={n._img}
                  alt={n?.TITLE || '공지 이미지'}
                />

                {/* 텍스트 */}
                <div className="mSlide-Info">
                  <div className="mSlide-Title" title={n?.TITLE || ''}>
                    {n?.TITLE || '제목 없음'}
                  </div>

                  {n.NOTICE_ID !== 'empty' && (
                    <div
                      className="mSlide-Btn"
                      role="button"
                      onClick={() => goDetail(n.NOTICE_ID)}
                    >
                      바로가기 →
                    </div>
                  )}
                </div>

              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>
    </>
  );
}

/* ======================
   메인 App 컴포넌트
   ====================== */
const videoData = [
  {
    title: '1kWh 줄이기 캠페인',
    url: 'https://youtu.be/4p0_F3RlBoQ?si=y1AQ35s6XzurzEBO',
    thumbnail: 'https://img.youtube.com/vi/4p0_F3RlBoQ/0.jpg',
  },
  {
    title: '한전 파워플래너 소개',
    url: 'https://www.youtube.com/watch?v=he5BxBUhOBo',
    thumbnail: 'https://img.youtube.com/vi/he5BxBUhOBo/0.jpg',
  },
  {
    title: '에너지 캐시백',
    url: 'https://youtu.be/b5Oa1T0pNho?si=Qi1g6SV_XPMeR3fJ',
    thumbnail: 'https://img.youtube.com/vi/b5Oa1T0pNho/0.jpg',
  },
  {
    title: '중요한 건 하려는 마음!',
    url: 'https://www.youtube.com/watch?v=isikwGssKZ0',
    thumbnail: 'https://i.ytimg.com/vi/isikwGssKZ0/maxresdefault.jpg',
  },
  {
    title: '집중호우 피해지역 복구활동',
    url: 'https://www.youtube.com/watch?v=_4DM-RaGn-E',
    thumbnail: 'https://i.ytimg.com/vi/_4DM-RaGn-E/maxresdefault.jpg',
  }
];

export default function App() {
  return (
    <>
    <main className="mMain">
      <Header />

      {/* 공지 슬라이드 */}
      <Slider />

      {/* 홍보영상 섹션 */}
      <section className="mVideo">
        <div className="mVideo-Content">
          {videoData.map((video, idx) => (
            <a
              className="mVideo-Card"
              key={idx}
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img className="mVideo-Img" src={video.thumbnail} alt={video.title} />
              <div className="mVideo-info">
                <div className="mVideo-title">{video.title}</div>
              </div>
            </a>
          ))}
        </div>
      </section>
    </main>
    </>
  );
}
