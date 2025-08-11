import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
// import '../../CSS/Faq.css';
import '../../CSS/Sub.css';
import axios from 'axios';
import Header from '../../component/Header';

const InquiryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answerInput, setAnswerInput] = useState('');
  const [showAnswerInput, setShowAnswerInput] = useState(false);
  const [answerLoading, setAnswerLoading] = useState(false);

  const userId = localStorage.getItem('id') || localStorage.getItem('gov_id');
  const corpAdmin = localStorage.getItem('id') === 'admin';
  const govAdmin = localStorage.getItem('gov_id') === 'admin';
  const isAdmin = corpAdmin || govAdmin;

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`http://localhost:3001/api/inquiry/${id}`);
        if (res.data && res.data.question) {
          setQuestion(res.data.question);  // 한 건 객체로 바로!
        } else {
          setError('해당 질문을 찾을 수 없습니다.');
        }
      } catch (err) {
        setError('질문 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  // 답변 작성/수정 토글
  const handleShowAnswerInput = () => {
    setShowAnswerInput(!showAnswerInput);
    setAnswerInput(question.ANSWER || '');
  };

  // 답변 저장
  const handleAnswerSubmit = async () => {
    if (!answerInput.trim()) {
      alert('답변 내용을 입력해주세요.');
      return;
    }
    setAnswerLoading(true);
    try {
      await axios.post(`http://localhost:3001/api/inquiry/answer/${question.QS_ID}`, {
        ANSWER: answerInput,
      });
      alert('답변이 등록되었습니다!');
      setShowAnswerInput(false);
      setQuestion((prev) => ({ ...prev, ANSWER: answerInput }));
    } catch (e) {
      alert('답변 등록에 실패했습니다.');
    } finally {
      setAnswerLoading(false);
    }
  };

  // 삭제
  const handleDelete = async () => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      try {
        const res = await axios.delete(
          `http://localhost:3001/api/inquiry/delete/${question.QS_ID}`
        );
        if (res.data.result === "success") {
          alert("삭제되었습니다!");
          navigate("/inquiry");
        } else {
          alert("삭제에 실패했습니다.");
        }
      } catch (err) {
        alert("서버 오류가 발생했습니다.");
      }
    }
  };

  if (loading) {
    return (
      <div>
        <Header/>
        <div className="faq-detail-page-wrap">
          <div className="faq-detail-notfound">
            불러오는 중...
          </div>
        </div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div>
        <Header />
        <div className="faq-detail-page-wrap">
          <div className="faq-detail-notfound">
            {error || '해당 질문을 찾을 수 없습니다.'}
            <br />
            <button className="faq-detail-backbtn" onClick={() => navigate('/inquiry')}>
              목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = question.USER_ID === userId;
  const canEditOrDelete = isOwner && (!question.ANSWER || question.ANSWER.trim() === '');

  return (
    <div>
      <Header />
      <br /><br /><br />
      <div className="faq-detail-page-wrap">
        <a className="faq-detail-backbtn" onClick={() => navigate('/inquiry')}>
          ← 돌아가기
        </a>
        <br /><br />
        <div className="faq-detail-title">{question.TITLE}</div>
        <div className="faq-detail-date">
          작성일&nbsp;&nbsp;|&nbsp;&nbsp;
          {question.QS_DATE &&
            new Date(question.QS_DATE).toLocaleDateString('ko-KR', {
            timeZone: 'Asia/Seoul',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
            })
            .replace(/\./g, '-')
            .replace(/\s/g, '')       
            .replace(/-$/, '')   
          }
        </div>
        <div className="faq-detail-content">{question.CONTENT}</div>

        {/* 답변 */}
        {question.ANSWER && (
          <div className="faq-answer-box">  {/* css 존재하지 않음 */}
            <strong>관리자 답변</strong>
            <div className="faq-answer-content">{question.ANSWER}</div> {/* css 존재하지 않음 */}
          </div>
        )}

        {/* 작성자: 답변 전만 수정/삭제 가능 */}
        {canEditOrDelete && (
          <div className="faq-write-btns">
            <button className="faq-fix-submit" onClick={() => navigate(`/inquiry/edit/${question.QS_ID}`)}>수정</button>
            <button className="faq-fix1-submit" onClick={handleDelete}>삭제</button>
          </div>
        )}

        {/* 관리자: 답변/수정/삭제 가능 */}
        {isAdmin && (
          <div className='test'>
            {!showAnswerInput ? (
              <>
              <button className="common-btn button-10px28px" onClick={handleShowAnswerInput}>
                {question.ANSWER ? '답변 수정' : '답변 작성'}
              </button>
              <button className="common-btn button-10px28px faq-fix1-submit" onClick={handleDelete}>삭제</button>
              </>
            ) : (
              <div className='edit-input'>
              <div>
                 <textarea
                  value={answerInput}
                  onChange={e => setAnswerInput(e.target.value)}
                  rows={4}
                /> 
                <div>
                <button onClick={handleAnswerSubmit} disabled={answerLoading}>
                  {answerLoading ? '저장 중...' : '저장'}
                </button>
                <button onClick={handleShowAnswerInput}>취소</button>
                </div>
                </div>
                <button className="common-btn button-10px28px faq-fix1-submit" onClick={handleDelete}>삭제</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InquiryDetail;
