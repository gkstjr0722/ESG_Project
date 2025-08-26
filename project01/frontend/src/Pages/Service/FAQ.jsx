import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const [openIndex, setOpenIndex] = useState(null);

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

  const location = useLocation();
  const pathname = location?.pathname || '/';
  const isNoticeActive  = pathname.startsWith('/notice');
  const isInquiryActive = pathname.startsWith('/inquiry');
  const isFAQActive     = pathname.startsWith('/faq');
  const toggleAnswer = (index) => {
    setOpenIndex(prev => prev === index ? null : index);
  };

  return (
    <>
      <Header />

      <div className="cTab">
        <button type="button" className={isNoticeActive ? 'active' : ''}  onClick={() => navigate('/notice')}>공지사항</button>
        <button type="button" className={isInquiryActive ? 'active' : ''} onClick={() => navigate('/inquiry')}>고객문의</button>
        <button type="button" className={isFAQActive ? 'active' : ''}     onClick={() => navigate('/faq')}>자주 묻는 질문</button>
      </div>

      <br /><br />
      <div className="cWriteContent">
        <h1>자주 묻는 질문</h1>
        <div className="cSearch">
          <span>Q</span>
          <input
            type="text"
            placeholder="무엇이든 찾아보세요"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="cList">
          {loading ? (
            <div>불러오는 중...</div>
          ) : error ? (
            <div>{error}</div>
          ) : filteredQuestions.length === 0 ? (
            <div>등록된 질문이 없습니다.</div>
          ) : (
            filteredQuestions.map((q, index) => (
              <div key={q.QS_ID}>
                <div
                  className="cWrite"
                  onClick={() => toggleAnswer(index)} // ✅ 클릭 시 해당 항목 열기/닫기
                >
                <span>Q</span>
                {q.TITLE}
                <span></span> {/* 클래스네임 cWrite span: last-child가 Q에 붙어서 그거 떼려고 붙여놓음. 이거 떼면 Q에 last 다시 붙음 */}
              </div>

              {openIndex === index && (
                <div className=' slide-down-wrapper'>
        <div className='slide-down-content'>
      <div className="faqDetail">
        <div className="faqContent">
          <p>{q.CONTENT || '본문이 없습니다.'}</p>
        </div>
        <div className="faqContent">
          <strong>[답변]</strong>
          <p>{q.ANSWER || '답변이 없습니다.'}</p>
        </div>
        </div>
      </div>
              </div>
              )}
        </div>
            ))
          )}
          </div>
      </div>
    </>
  );
};

export default FAQ;
