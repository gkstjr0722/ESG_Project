import './LoginCorp.css';
import React from 'react';
import Header from './Header';
import { Link } from 'react-router-dom';

const JoinMain = () => {
  return (
    <div>
      <Header />
      <div className="login-corp-bg">
        <div className="login-corp-box">
          <h2>회원가입</h2>
          <div>
            <Link to="/joinbusiness" className="main-btn-01">
              기업
            </Link>
            <Link to="/joingovernment" className="main-btn-01">
              관공업
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinMain;
