import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../Header';
import '../../CSS/Faq.css';

const NoticeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`http://localhost:3001/api/notice/${id}`);
        if (res.data && res.data.notice) {
          setNotice(res.data.notice);
        } else {
          setError('해당 공지사항을 찾을 수 없습니다.');
        }
      } catch (err) {
        setError('공지사항 정보를 불러오지 못했습니다.');
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

  if (error || !notice) {
    return (
      <div>
        <Header />
        <div className="faq-detail-page-wrap">
          <div className="faq-detail-notfound">
            {error || '해당 공지사항을 찾을 수 없습니다.'}
            <br />
            <button className="faq-detail-backbtn" onClick={() => navigate('/notice')}>
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
        <a className="faq-detail-backbtn" onClick={() => navigate('/notice')}>
          ← 돌아가기
        </a>
        <br /><br />
        <div className="faq-detail-title">{notice.title}</div>
        <div className="faq-detail-date">
          {notice.created_at?.slice(0, 10)}
        </div>
        <br />
        <div className="faq-detail-content">{notice.content}</div>
      </div>
    </div>
  );
};

export default NoticeDetail;
