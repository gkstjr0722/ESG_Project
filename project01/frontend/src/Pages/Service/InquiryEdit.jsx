import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../component/Header';
import '../../CSS/Faq.css';
import axios from 'axios';

const InquiryEdit = () => {
  const { qs_id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    TITLE: '',
    CONTENT: '',
  });
  const [loading, setLoading] = useState(true);

  // 기존 데이터 불러오기
  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const res = await axios.get(`http://localhost:3001/api/inquiry/add${qs_id}`);
        if (res.data && res.data.question) {
          setForm({
            TITLE: res.data.question.TITLE,
            CONTENT: res.data.question.CONTENT,
          });
        }
      } catch (err) {
        alert('문의 정보를 불러오지 못했습니다.');
        navigate('/inquiry');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestion();
  }, [qs_id, navigate]);

  // 입력값 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 수정 저장
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.TITLE.trim() || !form.CONTENT.trim()) {
      alert('제목과 내용을 입력해 주세요.');
      return;
    }
    try {
      // 수정 날짜 추가 (YYYY-MM-DD HH:mm:ss)
      const now = new Date();
      const UPDATE_DT = now.toISOString().slice(0, 19).replace('T', ' ');

      await axios.put(
        `http://localhost:3001/api/inquiry/edit/${qs_id}`,
        { ...form, UPDATE_DT }
      );
      alert('수정이 완료되었습니다!');
      navigate(`/inquiry/${qs_id}`);
    } catch (err) {
      alert('수정에 실패했습니다.');
    }
  };

  // 취소 버튼
  const handleCancel = () => {
    navigate(`/inquiry/${qs_id}`);
  };

  if (loading) {
    return <div>불러오는 중...</div>;
  }

  return (
    <div>
      <Header />
      <div className="faq-detail-page-wrap">
        <a className="faq-detail-backbtn" onClick={handleCancel}>← 돌아가기</a>
        <div className="faq-detail-title">문의글 수정</div>
        <form className="faq-write-form" onSubmit={handleSubmit}>
          <div className="faq-write-row">
            <label className="faq-write-label">제목</label>
            <input
              className="faq-write-input"
              name="TITLE"
              value={form.TITLE}
              onChange={handleChange}
              required
              maxLength={100}
            />
          </div>
          <div className="faq-write-row">
            <label className="faq-write-label">내용</label>
            <textarea
              className="faq-write-textarea"
              name="CONTENT"
              value={form.CONTENT}
              onChange={handleChange}
              required
              rows={6}
              maxLength={1000}
            />
          </div>
          <div className="faq-write-btns">
            <button type="submit" className="faq-write-submit">수정완료</button>
            <button type="button" className="faq-write-cancel" onClick={handleCancel}>취소</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InquiryEdit;
