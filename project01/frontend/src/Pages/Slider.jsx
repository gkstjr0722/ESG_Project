import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import '../CSS/Slider.css'; // 슬라이더 전용 CSS 파일 (아래 참고)

export default function Slider() {
  return (
    <Swiper
      modules={[Pagination, Navigation]}
      pagination={{ type: 'progressbar' }}
      navigation={true}
      slidesPerView={1}
      spaceBetween={30}
      loop={true}
      className="mySwiper"
    >
      <SwiperSlide>슬라이드 1</SwiperSlide>
      <SwiperSlide>슬라이드 2</SwiperSlide>
      <SwiperSlide>슬라이드 3</SwiperSlide>
      {/* 필요하면 슬라이드 추가 */}
    </Swiper>
  );
}
