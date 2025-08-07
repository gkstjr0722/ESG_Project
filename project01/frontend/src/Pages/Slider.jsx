import React, { useState } from 'react';
import '../CSS/ImageSlider.css'; 
import photo6 from '../assets/photo6.jpg';
import photo2 from '../assets/photo2.jpg';
import photo3 from '../assets/photo3.jpg';
import photo4 from '../assets/photo4.jpg';
import photo5 from '../assets/photo5.jpg';

const images = [
  photo6, photo2, photo3, photo4, photo5
];

  const Slider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  // 이전 이미지 (처음이면 마지막으로)
  const goToPrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };
 

  return (
    <div className="slider-container">
   <span className="slider-edge left-edge" onClick={goToPrev}>
        <span className="arrow">←</span>
      </span>

      <div className="slider-wrapper">
        <img
          src={images[currentIndex]}
          alt={`Slide ${currentIndex + 1}`}
          className="slider-image slide-animation"
          key={currentIndex} // 키를 줘야 애니메이션 재실행됨
        />
      </div>

      <span className="slider-edge right-edge" onClick={goToNext}>
        <span className="arrow">→</span>
      </span>

      {/* 하단 버튼 */}
      <div className="slider-controls">
        <button className="slider-button prev" onClick={goToPrev}>◀</button>
        <span className="slider-index">{currentIndex + 1} / {images.length}</span>
        <button className="slider-button next" onClick={goToNext}>▶</button>
      </div>

      <div className="slider-index">{currentIndex + 1} / {images.length}</div>
    </div>
  );
 };

export default Slider;