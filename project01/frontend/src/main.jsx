// src/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 공통 CSS
import './CSS/Common.css';

// 메인 페이지
import App from './Pages/App.jsx';

// 위치찾기
import Map from './Pages/Map.jsx';

// 고객센터
import Support from './Pages/Service/Support.jsx';
// import Notice from './Pages/Service/Notice.jsx'; // ← 더 이상 직접 라우트에서 안 씀

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
import MonthUsed from './component/MonthUsed.jsx';
import PowerAVG from './component/PowerAVG.jsx';
import Carbon from './component/Carbon.jsx';
import Model from './Pages/Model.jsx';

// 비밀번호 재설정
// ⬇️ 파일명을 소문자로 변경했다는 요청에 맞춰 경로 수정
import PasswordResetRequest from './Pages/Service/PasswordResetRequest.jsx';
import PasswordResetConfirm from './Pages/Service/PasswordResetConfirm.jsx';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      {/* 메인페이지 */}
      <Route path="/" element={<App />} />

      {/* 위치찾기 */}
      <Route path="/map" element={<Map />} />

      {/* 고객센터 */}
      <Route path="/support" element={<Support />} />

      {/* 공지사항: 헤더/탭 유지 위해 Support로 렌더 */}
      <Route path="/notice" element={<Support />} />
      <Route path="/notice/:id" element={<Support />} />

      {/* 고객문의 */}
      <Route path="/faq" element={<FAQ />} />
      <Route path="/faq/:id" element={<FaqDetail />} />
      <Route path="/inquiry" element={<Inquiry />} />
      <Route path="/inquiry/:id" element={<InquiryDetail />} />
      <Route path="/inquiry/write" element={<InquiryWrite />} />
      <Route path="/inquiry/edit/:id" element={<InquiryWrite />} />

      {/* 로그인 */}
      <Route path="/login" element={<Login />} />

      {/* 가입 */}
      <Route path="/join/*" element={<Join />} />

      {/* 마이페이지 */}
      <Route path="/mypage" element={<MyPage />} />

      {/* 전력사용현황 */}
      <Route path="/calcmain" element={<CalcMain />} />
      <Route path="/monthused" element={<MonthUsed />} />
      <Route path="/powerbill" element={<PowerBill />} />
      <Route path="/poweravg" element={<PowerAVG />} />
      <Route path="/carbon" element={<Carbon />} />
      <Route path="/model" element={<Model />} /> 

      {/* 비밀번호 재설정 */}
      {/* ⬇️ 기존 PasswordReset 컴포넌트명 대신 PasswordResetRequest 사용 */}
      <Route path="/password/reset" element={<PasswordResetRequest />} />
      <Route path="/reset-password" element={<PasswordResetConfirm />} />
      {/* 기존 경로도 임시 유지 (원하면 삭제 가능) */}
      <Route path="/passwordreset" element={<PasswordResetRequest />} />
    </Routes>
  </BrowserRouter>
);
