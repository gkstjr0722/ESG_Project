import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import '../../CSS/Faq.css';
import '../../CSS/Sub.css';
import axios from 'axios';
import Header from '../../component/Header';

const FAQ = () => {
  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFaq = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get('http://localhost:3001/api/inquiry/faq/top');
        setQuestions(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setError('FAQ 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchFaq();
  }, []);

  // 필요에 따라 답변이 있는 질문만 노출하려면 아래처럼 필터 수정 (옵션)
  // const filteredQuestions = questions.filter(q =>
  //   q.TITLE && q.TITLE.includes(search) && q.ANSWER && q.ANSWER.trim() !== ""
  // );

  const filteredQuestions = questions.filter(q =>
    q.TITLE && q.TITLE.includes(search)
  );

  return (
    <div>
      <Header />
      <br /><br />
      <div className="faq-page-wrap">
        <h1 className="faq-title">자주 묻는 질문</h1>
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
            <div className="faq-question-empty">불러오는 중...</div>
          ) : error ? (
            <div className="faq-question-empty">{error}</div>
          ) : filteredQuestions.length === 0 ? (
            <div className="faq-question-empty">등록된 질문이 없습니다.</div>
          ) : (
            filteredQuestions.map(q => (
              <div
                key={q.QS_ID}
                className="faq-question-item"
                onClick={() => navigate(`/faq/${q.QS_ID}`)}
              >
                <span className="faq-q-icon">Q</span>
                {q.TITLE}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
