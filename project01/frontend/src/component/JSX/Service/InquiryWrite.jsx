import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Header';
import '../../CSS/Faq.css';
import axios from 'axios';

const InquiryWrite = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    text: '',
    detail: '',
    extra: '',
  });
  const [loading, setLoading] = useState(false);

  // 입력값 핸들러
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // 등록 버튼
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      // 실제 API 엔드포인트는 백엔드 라우터에 맞춰 수정
      const res = await axios.post('http://localhost:3001/api/inquiry', form);
      if (res.data.success) {
        alert('문의가 등록되었습니다!');
        navigate('/inquiry');
      } else {
        alert('문의 등록에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/inquiry');
  };

  return (
    <div>
      <Header />
      <br /><br /><br />
      <div className="faq-detail-page-wrap">
        <a className="faq-detail-backbtn" onClick={handleCancel}>
          ← 돌아가기
        </a>
        <br /><br />
        <div className="faq-detail-title">문의 작성</div>
        <form className="faq-write-form" onSubmit={handleSubmit}>
          <div className="faq-write-row">
            <label className="faq-write-label">제목</label>
            <input
              className="faq-write-input"
              name="text"
              value={form.text}
              onChange={handleChange}
              required
              maxLength={100}
              placeholder="문의 제목을 입력하세요"
              disabled={loading}
            />
          </div>
          <div className="faq-write-row">
            <label className="faq-write-label">내용</label>
            <textarea
              className="faq-write-textarea"
              name="detail"
              value={form.detail}
              onChange={handleChange}
              required
              rows={6}
              maxLength={1000}
              placeholder="문의 내용을 상세히 입력해 주세요"
              disabled={loading}
            />
          </div>
          <div className="faq-write-btns">
            <button type="submit" className="faq-write-submit" disabled={loading}>
              {loading ? '등록 중...' : '등록'}
            </button>
            <button type="button" className="faq-write-cancel" onClick={handleCancel} disabled={loading}>
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InquiryWrite;
