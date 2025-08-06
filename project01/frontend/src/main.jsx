// src/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import JoinMain from './Pages/JoinMain.jsx';
import JoinBusiness from './Pages/JoinBusiness.jsx';
import JoinGovernment from './Pages/JoinGovernment.jsx';
import MyPage from './Pages/MyPage.jsx';
import Support from './Pages/Service/Support.jsx';
import FAQ from './Pages/Service/FAQ.jsx';
import FaqDetail from './Pages/Service/FaqDetail.jsx';
import Inquiry from './Pages/Service/Inquiry.jsx';
import InquiryDetail from './Pages/Service/InquiryDetail.jsx';
import InquiryWrite from './Pages/Service/InquiryWrite.jsx';


import CalcMain from './Pages/CalcMain.jsx';
import App from './Pages/App.jsx';
import Map from './Pages/Map.jsx';
import Login from './Pages/Login.jsx';
import PowerBill from './component/PowerBill.jsx';
import ElecUsed from './component/ElecUsed.jsx';
import MonthUsed from './component/MonthUsed.jsx';
import PowerAVG from './component/PowerAVG.jsx';
import Carbon from './component/Carbon.jsx';
import Slider from './Pages/Slider.jsx';


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

      {/* 로그인 */}
      <Route path="/login" element={<Login />} />

      {/* 가입 */}
      <Route path="/joinmain" element={<JoinMain />} />
      <Route path="/joinbusiness" element={<JoinBusiness />} />
      <Route path="/joingovernment" element={<JoinGovernment />} />

      {/* 마이페이지 */}
      <Route path="/mypage" element={<MyPage />} />

      {/* 고객문의 */}
      <Route path="/faq" element={<FAQ />}></Route>
      <Route path="/faq/:id" element={<FaqDetail />}></Route>
      
      <Route path="/inquiry" element={<Inquiry />}></Route>
      <Route path="/inquiry/:id" element={<InquiryDetail />}></Route>
      <Route path="/inquiry/write" element={<InquiryWrite />}></Route>
      <Route path="/inquiry/edit/:id" element={<InquiryWrite />} />
      
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
