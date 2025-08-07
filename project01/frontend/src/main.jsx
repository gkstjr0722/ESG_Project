// src/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 공통 CSS
import './CSS/Common.css';

// 메인 페이지
import App from './Pages/App.jsx';
import Slider from './Pages/Slider.jsx';

// 위치찾기
import Map from './Pages/Map.jsx';

// 고객센터
import Support from './Pages/Service/Support.jsx';

// 고객문의
import FAQ from './Pages/Service/FAQ.jsx';
import FaqDetail from './Pages/Service/FaqDetail.jsx';
import Inquiry from './Pages/Service/Inquiry.jsx';
import InquiryDetail from './Pages/Service/InquiryDetail.jsx';
import InquiryWrite from './Pages/Service/InquiryWrite.jsx';

// 로그인
import Login from './Pages/Login.jsx';

// 가입
import Join from './Pages/Join.jsx';

// 마이페이지
import MyPage from './Pages/MyPage.jsx';

// 전력사용현황
import CalcMain from './Pages/CalcMain.jsx';
import PowerBill from './component/PowerBill.jsx';
import ElecUsed from './component/ElecUsed.jsx';
import MonthUsed from './component/MonthUsed.jsx';
import PowerAVG from './component/PowerAVG.jsx';
import Carbon from './component/Carbon.jsx';


// 링크연결
createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      {/* 메인페이지 */}
      <Route path="/" element={<App />} />
      <Route path="/slider" element={<Slider />} />


      {/* 위치찾기 */}
      <Route path="/map" element={<Map />} />

      {/* 고객센터 */}
      <Route path="/support" element={<Support />}></Route>

      {/* 고객문의 */}
      <Route path="/faq" element={<FAQ />}></Route>
      <Route path="/faq/:id" element={<FaqDetail />}></Route>
      <Route path="/inquiry" element={<Inquiry />}></Route>
      <Route path="/inquiry/:id" element={<InquiryDetail />}></Route>
      <Route path="/inquiry/write" element={<InquiryWrite />}></Route>
      <Route path="/inquiry/edit/:id" element={<InquiryWrite />} />

      {/* 로그인 */}
      <Route path="/login" element={<Login />} />

      {/* 가입 */}
      <Route path="/join/*" element={<Join/>} />

      {/* 마이페이지 */}
      <Route path="/mypage" element={<MyPage />} />

      {/* 전력사용현황 */}
      <Route path="/calcmain" element={<CalcMain />} />
      <Route path="/elecused" element={<ElecUsed />} />
      <Route path="/monthused" element={<MonthUsed />} />
      <Route path="/powerbill" element={<PowerBill />} />
      <Route path="/poweravg" element={<PowerAVG />} />
      <Route path="/carbon" element={<Carbon />} />
    </Routes>
  </BrowserRouter>
);
