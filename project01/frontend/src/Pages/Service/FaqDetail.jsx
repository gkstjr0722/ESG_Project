import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../component/Header';
import '../../CSS/Faq.css';
import axios from 'axios';

const FaqDetail = () => {
  const { id } = useParams(); // id = qs_id
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError('');
      try {
        // /api/inquiry/:id와 똑같이 호출 (조회수 증가)
        const res = await axios.get(`http://localhost:3001/api/inquiry/${id}`);
        if (res.data && res.data.question) {
          setQuestion(res.data.question);
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
            <button className="faq-detail-backbtn" onClick={() => navigate('/faq')}>
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
        <a className="faq-detail-backbtn" onClick={() => navigate('/faq')}>
          ← 돌아가기
        </a>
        <br /><br />
        <div className="faq-detail-title">{question.TITLE}</div>
        <div className="faq-detail-content">{question.CONTENT}</div>
      </div>
    </div>
  );
};

export default FaqDetail;

// FAQ기능구현완료
