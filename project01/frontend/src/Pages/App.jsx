// src/Pages/App.jsx
import '../CSS/Main.css';
import Header from '../component/Header';
import Slider from './Slider.jsx';

const videoData = [
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
    title: '1kWh 줄이기 캠페인',
    url: 'https://youtu.be/4p0_F3RlBoQ?si=y1AQ35s6XzurzEBO',
    thumbnail: 'https://img.youtube.com/vi/4p0_F3RlBoQ/0.jpg',
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

function App() {
  return (
    <>
      <Header />

      {/* 공지 슬라이드 */}
      <section className="mSlider">
        <Slider />
      </section>

      {/* 홍보영상 섹션 */}
      <section className="video-list-section">
        {/* <div className="video-list-section-text">
          홍보영상
        </div> */}
        <div className="video-grid">
          {videoData.map((video, idx) => (
            <a
              className="video-card"
              key={idx}
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img className="video-thumbnail" src={video.thumbnail} alt={video.title} />
              <div className="video-info">
                <div className="video-title">{video.title}</div>
                <div className="video-channel">{video.channel}</div>
              </div>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}

export default App;