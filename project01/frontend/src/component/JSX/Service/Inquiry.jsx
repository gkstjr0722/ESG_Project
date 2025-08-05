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
      try {
        // 프록시가 설정되어 있으면 '/api/inquiry/list' 만 사용
        const res = await axios.get('http://localhost:3001/api/inquiry/list');
        // 응답 데이터 구조 확인 (콘솔로 먼저 체크해보면 더 안전)
        // console.log(res.data);
        setQuestions(res.data || []);
      } catch (err) {
        setError('문의 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);import React, { useState, useEffect } from 'react';
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
      try {
        // 프록시가 설정되어 있으면 '/api/inquiry/list' 만 사용
        const res = await axios.get('http://localhost:3001/api/inquiry/list');
        // 응답 데이터 구조 확인 (콘솔로 먼저 체크해보면 더 안전)
        // console.log(res.data);
        setQuestions(res.data || []);
      } catch (err) {
        setError('문의 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  // 검색 (대소문자 구분 없이, 제목/내용 모두에서)
  const filteredQuestions = questions.filter(q =>
    ((q.TITLE && q.TITLE.toLowerCase().includes(search.toLowerCase())) ||
     (q.CONTENT && q.CONTENT.toLowerCase().includes(search.toLowerCase())))
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
                <span className={`inquiry-status-badge ${q.STATUS === '완료' ? 'done' : 'doing'}`}>
                  {q.STATUS}
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

      }
    };
    fetchQuestions();
  }, []);

  // 검색 (대소문자 구분 없이, 제목/내용 모두에서)
  const filteredQuestions = questions.filter(q =>
    ((q.TITLE && q.TITLE.toLowerCase().includes(search.toLowerCase())) ||
     (q.CONTENT && q.CONTENT.toLowerCase().includes(search.toLowerCase())))
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
                <span className={`inquiry-status-badge ${q.STATUS === '완료' ? 'done' : 'doing'}`}>
                  {q.STATUS}
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
