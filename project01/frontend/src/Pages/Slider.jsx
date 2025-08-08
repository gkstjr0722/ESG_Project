import React, { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import '../CSS/Slider.css';

export default function Slider() {
  const swiperRef = useRef(null);

  // 페이지 번호 업데이트 함수 (fraction)
  const updateFraction = (swiper) => {
    const total = swiper.slides.length - (swiper.params.loop ? 2 : 0);
    const current = swiper.realIndex + 1;
    const fractionEl = document.querySelector('.swiper-pagination-fraction-custom');
    if (fractionEl) fractionEl.textContent = `${current} / ${total}`;
  };

  return (
    <section className="slider-section" style={{ position: 'relative' }}>
      {/* 좌측 네비게이션 버튼 */}
      <button className="custom-swiper-button-prev" aria-label="Previous slide">
        &lt;
      </button>

      {/* 우측 네비게이션 버튼 */}
      <button className="custom-swiper-button-next" aria-label="Next slide">
        &gt;
      </button>

      {/* 슬라이더 본체 */}
      <Swiper
        ref={swiperRef}
        modules={[Pagination, Navigation]}
        slidesPerView={1}
        spaceBetween={30}
        loop={true}
        className="mySwiper"
        pagination={{
          type: 'progressbar',
          el: '.custom-pagination-progressbar',
        }}
        navigation={{
          prevEl: '.custom-swiper-button-prev',
          nextEl: '.custom-swiper-button-next',
        }}
        onSlideChange={updateFraction}
        onAfterInit={updateFraction}
      >
        <SwiperSlide>슬라이드 1</SwiperSlide>
        <SwiperSlide>슬라이드 2</SwiperSlide>
        <SwiperSlide>슬라이드 3</SwiperSlide>
      </Swiper>

      {/* 진행바 역할 div (슬라이더 밖에 분리) */}
      <div className="custom-pagination-progressbar"></div>

      {/* 페이지 숫자 표시 (fraction) */}
      <div className="swiper-pagination-fraction-custom"></div>
    </section>
  );
}
