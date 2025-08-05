import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Header';
import '../../CSS/Faq.css';
import axios from 'axios';

const FAQ = () => {
  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFaq = async () => {
      setLoading(true);
      setError('');
      try {
        // 백엔드에서 조회수 5 이상인 문의글만 반환하도록 구현
        const res = await axios.get('http://localhost:3001/api/faq');
        setQuestions(res.data.questions || []);
      } catch (err) {
        setError('FAQ 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchFaq();
  }, []);

  const filteredQuestions = questions.filter(q =>
    q.text.includes(search)
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
          {filteredQuestions.length === 0 ? (
            <div className="faq-question-empty">등록된 질문이 없습니다.</div>
          ) : (
            filteredQuestions.map(q => (
              <div
                key={q.id}
                className="faq-question-item"
                onClick={() => navigate(`/faq/${q.id}`)}
              >
                <span className="faq-q-icon">Q</span>
                {q.text}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
