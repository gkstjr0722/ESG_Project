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

  // 문의글 목록 불러오기
  useEffect(() => {
    const fetchQuestions = async () => {
      setError('');
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:3001/api/inquiry/list');
        setQuestions(res.data || []);
      } catch (err) {
        setError('문의 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  // 검색 (제목, 내용에서)
  const filteredQuestions = questions.filter(q =>
    ((q.TITLE && q.TITLE.toLowerCase().includes(search.toLowerCase())) ||
     (q.CONTENT && q.CONTENT.toLowerCase().includes(search.toLowerCase())))
  );

  // 상태 표시: 답변이 있으면 '완료', 아니면 '대기'
  const getStatus = (q) => (q.ANSWER && q.ANSWER.trim() !== '' ? '완료' : '대기');

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
          {loading ? (
            <div className="faq-question-empty">로딩 중...</div>
          ) : error ? (
            <div className="faq-question-empty">{error}</div>
          ) : filteredQuestions.length === 0 ? (
            <div className="faq-question-empty">등록된 질문이 없습니다.</div>
          ) : (
            filteredQuestions.map(q => (
              <div
                key={q.QS_ID}
                className="faq-question-item"
                onClick={() => navigate(`/inquiry/${q.QS_ID}`)}
              >
                <span className="faq-q-icon">Q</span>
                {q.TITLE}
                <span className={`inquiry-status-badge ${getStatus(q) === '완료' ? 'done' : 'doing'}`}>
                  {getStatus(q)}
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
