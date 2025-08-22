// src/Pages/Slider.jsx
import { useEffect, useRef, useState, useMemo } from 'react';
import axios from 'axios';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper';
import { useNavigate } from 'react-router-dom';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import '../CSS/Slider.css';

const USE_ABSOLUTE = false;

export default function Slider({ limit = 6 }) {
  const nav = useNavigate();
  const swiperRef = useRef(null);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
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
    // 로딩 중에도 최소 높이를 유지하여 레이아웃 깨짐 방지
    return <div className="mySwiper" style={{ minHeight: '450px' }} />;
  }

  const renderSlides = slides.length
    ? slides
    : [{ NOTICE_ID: 'empty', TITLE: err ? '공지 불러오기 실패' : '등록된 공지가 없습니다', NOTICE_DT: '' }];

  // [수정됨] 가장 큰 문제였던 불필요한 <section>을 제거하고 React.Fragment(<></>)로 감쌌습니다.
  return (
    <>
      <button className="custom-swiper-button-prev" aria-label="Previous slide">&lt;</button>
      <button className="custom-swiper-button-next" aria-label="Next slide">&gt;</button>

      <Swiper
        ref={swiperRef}
        modules={[Pagination, Navigation]}
        className="mySwiper"
        slidesPerView={1}
        spaceBetween={30}
        loop={renderSlides.length > 1}
        pagination={{ clickable: true }}
        navigation={{ prevEl: '.custom-swiper-button-prev', nextEl: '.custom-swiper-button-next' }}
        watchOverflow={false}
      >
        {renderSlides.map((n) => (
          <SwiperSlide key={n.NOTICE_ID}>
            <div
              className="notice-slide"
              role="button"
              onClick={() => n.NOTICE_ID !== 'empty' && goDetail(n.NOTICE_ID)}
            >
              <div className="notice-slide__combined" title={n?.TITLE || ''}>
                <strong>{n?.TITLE || '제목 없음'}</strong>
              </div>
              {n.NOTICE_ID !== 'empty' && (
                <div className="notice-slide__cta">바로가기 →</div>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </>
  );
}
