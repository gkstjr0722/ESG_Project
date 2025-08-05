// src/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import JoinMain from './component/JSX/JoinMain.jsx';
import JoinBusiness from './component/JSX/JoinBusiness.jsx'; // 경로! (component)
import JoinGovernment from './component/JSX/JoinGovernment.jsx'; // 경로! (component)
import LoginCorp from './component/JSX/LoginCorp.jsx';
import PowerCalc from './component/JSX/PowerCalc.jsx';
import MyPage from './component/JSX/MyPage.jsx';
import EditMyPage from './component/JSX/EditMyPage.jsx';
import MapEVCharger from './component/JSX/MapEVCharger.jsx';
import Support from './component/JSX/Service/Support.jsx';
import FAQ from './component/JSX/Service/FAQ.jsx'
import FaqDetail from './component/JSX/Service/FaqDetail.jsx'
import Inquiry from './component/JSX/Service/Inquiry.jsx'
import InquiryDetail from './component/JSX/Service/InquiryDetail.jsx'
import InquiryWrite from './component/JSX/Service/InquiryWrite.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/joinmain" element={<JoinMain />} />
      <Route path="/joinbusiness" element={<JoinBusiness />} />
      <Route path="/joingovernment" element={<JoinGovernment />} />
      <Route path="/login" element={<LoginCorp />} />
      <Route path="/powercalc" element={<PowerCalc />} />
      <Route path="/mypage" element={<MyPage />} />
      <Route path="/editmypage" element={<EditMyPage />} />
      <Route path="/location" element={<MapEVCharger />} />
      <Route path="/support" element={<Support />}></Route>
      <Route path="/faq" element={<FAQ />}></Route>
      <Route path="/faq/:id" element={<FaqDetail />}></Route>
      <Route path="/inquiry" element={<Inquiry />}></Route>
      <Route path="/inquiry/:id" element={<InquiryDetail />}></Route>
      <Route path="/inquiry/write" element={<InquiryWrite />}></Route>
      <Route path="/inquiry/edit/:id" element={<InquiryWrite />} />
    </Routes>
  </BrowserRouter>
);
