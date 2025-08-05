import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Header';
import '../../CSS/Faq.css';


// DB연결 전 임시 데이터
const DUMMY_QUESTIONS = [
  { id: 1, text: '토스 앱에서 송금을 한 뒤 송금확인증은 어떻게 발급받나요?', status:'진행중' },
  { id: 2, text: '오픈뱅킹 자동이체 문자를 받았어요.', status:'완료' }
];


const Inquiry = () => {
  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setQuestions(DUMMY_QUESTIONS);
  }, []);

  const filteredQuestions = questions.filter(q =>
    q.text.includes(search)
  );

  const handleWriteClick = () => {
    navigate('/inquiry/write');
  };

  return (
    <div>
      <Header />
      <br /><br />
      <div className="faq-page-wrap">
        <h1 className="faq-title">고객 문의</h1>
        <div className="faq-search-row">
          <span className="faq-search-icon">Q</span>
          <input
            className="faq-search-input"
            type="text"
            placeholder="무엇이든 찾아보세요"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="faq-question-list">
          {filteredQuestions.length === 0 ? (
            <div className="faq-question-empty">등록된 질문이 없습니다.</div>
          ) : (
            filteredQuestions.map(q => (
              <div
                key={q.id}
                className="faq-question-item"
                onClick={() => navigate(`/inquiry/${q.id}`)}
              >
                <span className="faq-q-icon">Q</span>
                {q.text}
                <span className={`inquiry-status-badge ${q.status === '완료' ? 'done' : 'doing'}`}>
                  {q.status}
                </span>
              </div>
            ))
          )}
        </div>
        <button className="floating-write-btn" onClick={handleWriteClick}>
          +
        </button>
      </div>
    </div>
  );
};

export default Inquiry;
