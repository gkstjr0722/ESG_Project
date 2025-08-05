import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../Header';
import '../../CSS/Faq.css';
import axios from 'axios';

const InquiryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userId = localStorage.getItem('id') || localStorage.getItem('gov_id');

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`http://localhost:3001/api/inquiry/${id}`);
        if (res.data && res.data.QS_ID) {
          setQuestion(res.data);  // 한 건 객체로 바로!
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

  if (loading) {
    return (
      <div>
        <Header />
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
        <div className="faq-write-btns">
          {question.USER_ID === userId && (
            <div>
              <button 
                className="faq-fix-submit"
                onClick={() => navigate(`/inquiry/edit/${question.QS_ID}`)}
                >수정
              </button>
              <button
                className="faq-fix1-submit"
                onClick={async () => {
                  if (window.confirm("정말 삭제하시겠습니까?")) {
                    try {
                      const res = await axios.delete(
                        `http://localhost:3001/api/inquiry/${question.QS_ID}/delete`
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
                }}
              >
                삭제
              </button>
            </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default InquiryDetail;
