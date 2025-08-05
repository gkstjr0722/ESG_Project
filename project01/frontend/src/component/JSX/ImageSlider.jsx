import React, { useState } from 'react';
import '../CSS/ImageSlider.css'; 
import photo1 from '../../assets/photo1.jpg';
import photo2 from '../../assets/photo2.jpg';
import photo3 from '../../assets/photo3.jpg';
import photo4 from '../../assets/photo4.jpg';
import photo5 from '../../assets/photo5.jpg';

const images = [
  photo1, photo2, photo3, photo4, photo5
];

function ImageSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <div className="slider-container">
        <button onClick={handlePrev} className="slider-button prev">←</button>
  <img src={images[currentIndex]} alt={`Slide ${currentIndex + 1}`} className="slider-image" />
  <button onClick={handleNext} className="slider-button next">→</button>

  <div className="slider-index">{currentIndex + 1} / {images.length}</div>
    </div>
  );
}

export default ImageSlider;