import React, { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import '../CSS/Slider.css';

export default function Slider() {

  const swiperRef = useRef(null);

  const updateFraction = (swiper) => {
    const total = swiper.slides.length - (swiper.params.loop ? 2 : 0);
    const current = swiper.realIndex + 1;
    const fractionEl = document.querySelector('.swiper-pagination-fraction-custom');
    if (fractionEl) {
      fractionEl.textContent = `${current} / ${total}`;
    }
  };

  return (
<div>
    <section className="slider-section">
      <div className="swiper-wrapper-custom">
        <Swiper
          ref={swiperRef}
          modules={[Pagination, Navigation]}
          pagination={{
            type: 'progressbar',
            el: '.swiper-pagination-progressbar-custom'
          }}
          navigation={true}
          slidesPerView={1}
          spaceBetween={30}
          loop={true}
          className="mySwiper"
          onSlideChange={updateFraction}
          onAfterInit={updateFraction}
        >
          <SwiperSlide>슬라이드 1</SwiperSlide>
          <SwiperSlide>슬라이드 2</SwiperSlide>
          <SwiperSlide>슬라이드 3</SwiperSlide>

          <div className="swiper-pagination-progressbar-custom"></div>
          <div className="swiper-pagination-fraction-custom"></div>
        </Swiper>
      </div>
    </section>
    </div>
  );
}
