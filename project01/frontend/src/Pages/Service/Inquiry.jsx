import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
// import '../../CSS/Faq.css';
import '../../CSS/Sub.css';
import axios from 'axios';
import Header from '../../component/Header';

const Inquiry = () => {
  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 로그인 여부 확인
  const isLoggedIn = localStorage.getItem('id') || localStorage.getItem('gov_id');
  const corpAdmin = localStorage.getItem('id') === 'admin';
  const govAdmin = localStorage.getItem('gov_id') === 'admin';
  const isAdmin = corpAdmin || govAdmin;

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
  const getStatus = (q) => (q.ANSWER && q.ANSWER.trim() !== '' ? '답변완료' : '답변대기중');

  const handleWriteClick = () => {
    navigate('/inquiry/write');
  };

  const location = useLocation();
  const pathname = location?.pathname || '/';
  const isNoticePath = pathname === '/notice' || pathname.startsWith('/notice/');
  const aboutToRedirect = pathname === '/support' && !location.state?.fromTab;
  const isNoticeActive = isNoticePath || aboutToRedirect;


  return (
    <>
      <Header/>

      <div className="cTab">
        <button
          type="button"
          className={isNoticeActive ? 'active' : ''}
          onClick={() => navigate('/notice')}
        >
          공지사항
        </button>
        <button
          type="button"
          className={!isNoticeActive ? 'active' : ''}
          onClick={() => navigate('/support', { state: { fromTab: true } })}
        >
          고객문의
        </button>
      </div>

      <br /><br />
      <div className="cWriteContent">
        <h1>고객 문의</h1>

        <div className="cSearch">
          <span>Q</span>
          <input
            className="faq-search-input"
            type="text"
            placeholder="무엇이든 찾아보세요"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="cList">
          {loading ? (
            <div>로딩 중...</div>
          ) : error ? (
            <div>{error}</div>
          ) : filteredQuestions.length === 0 ? (
            <div>등록된 질문이 없습니다.</div>
          ) : (
            filteredQuestions.map(q => (
              <div
                key={q.QS_ID}
                className="cWrite"
                onClick={() => navigate(`/inquiry/${q.QS_ID}`)}
              >
                <span>Q</span>
                {q.TITLE}
                <span className={`sInquiry-State ${getStatus(q) === '답변완료' ? 'done' : 'doing'}`}>
                  {getStatus(q)}
                </span>
              </div>
            ))
          )}
        </div>
        {isLoggedIn && !isAdmin && (
          <button className="sInquiry-Btn" onClick={handleWriteClick}>
            +
          </button>
        )}
      </div>
    </>
  );
};

export default Inquiry;
