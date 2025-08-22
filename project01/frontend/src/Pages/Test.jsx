import React from 'react'
import Header from '../component/Header'
import "../CSS/Sub.css";

const Test = () => {
  return (
    <>
      <Header/>
      <div className='sLogin-Box'>
        <h2>공공기관 로그인</h2>
        <div className='sLogin-Choice'>
          <button>기업 로그인</button>
          <button>관공업 로그인</button>
        </div>
        
        <form className='sLogin-Content'>
          <input type="text" placeholder='로그인'/>
          <input type="password" placeholder='비밀번호'/>

          <div className='sLogin-Save'>
            <input type="sLogin-Checkbox" id="saveId" />
            <label htmlFor="saveId">아이디저장</label>
          </div>

          <div className='sLogin-Error'>error문구뜰 때</div>

          <button className='sLogin-Btn'>로그인</button>
        </form>

        <div className='sLogin-Link'>
          <a href="/">비밀번호 찾기</a>
          |
          <a href="/">회원가입</a>
        </div>
      </div>
    </>
  )
}

export default Test