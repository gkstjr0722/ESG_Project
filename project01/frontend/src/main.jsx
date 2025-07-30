// src/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import JoinMain from './component/JoinMain.jsx';
import JoinBusiness from './component/JoinBusiness.jsx'; // 경로! (component)
import JoinGovernment from './component/JoinGovernment.jsx'; // 경로! (component)
import LoginCorp from './component/LoginCorp.jsx';
import PowerCalc from './component/PowerCalc.jsx';
import MyPage from './component/MyPage.jsx';
import EditMyPage from './component/EditMyPage.jsx';

<<<<<<< HEAD:project01/src/main.jsx
// 테스트 할거야
=======


>>>>>>> 980d82e6fc6eafd73ff675a9eb1c5213c9ab7f8d:project01/frontend/src/main.jsx
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
    </Routes>
  </BrowserRouter>
);
