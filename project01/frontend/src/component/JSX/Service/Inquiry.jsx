import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Header';
import '../../CSS/Faq.css';
import axios from 'axios';

const Inquiry = () => {
  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // const isLoggedIn = localStorage.getItem('id') || localStorage.getItem('gov_id');

    // 서버에서 문의 목록 불러오기
  useEffect(() => {
    const fetchQuestions = async () => {
      // setLoading(true);
      setError('');
      try {
        const res = await axios.get('http://localhost:3001/api/inquiry'); // 실제 엔드포인트에 맞게 변경!
        setQuestions(res.data.questions || []);
      } catch (err) {
        setError('문의 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  // 검색 적용
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
        {/* 나중에 다 만들고 나서 풀기 로그인시 버튼 보이게 해둔 거임 */}
        {/* {isLoggedIn && ( */}
        <button className="floating-write-btn" onClick={handleWriteClick}>
          +
        </button>
        {/* )} */}
      </div>
    </div>
  );
};

export default Inquiry;
