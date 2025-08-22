import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
// import '../../CSS/Faq.css';
import '../../CSS/Sub.css';
import axios from 'axios';
import Header from '../../component/Header';

const InquiryWrite = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [form, setForm] = useState({
    TITLE: '',
    CONTENT: '',
  });
  const [loading, setLoading] = useState(false);

  // 로그인한 사용자 정보
  const USER_ID = localStorage.getItem('id') || localStorage.getItem('gov_id');
  const USER_NAME = localStorage.getItem('userName') || '';
  const EMAIL = localStorage.getItem('email') || '';

  // 수정모드면 기존 내용 불러오기
  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      axios.get(`http://192.168.111.194:3001/api/inquiry/${id}`)
        .then(res => {
          if (res.data && res.data.question) {
            // 본인 글 확인 (실제 운영에서는 백엔드에서 체크!)
            if (res.data.question.USER_ID !== USER_ID) {
              alert('본인 글만 수정할 수 있습니다.');
              navigate('/inquiry');
              return;
            }
            setForm({
              TITLE: res.data.question.TITLE || '',
              CONTENT: res.data.question.CONTENT || ''
            });
          } else {
            alert('글을 찾을 수 없습니다.');
            navigate('/inquiry');
          }
        })
        .catch(() => {
          alert('서버 오류');
          navigate('/inquiry');
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, USER_ID, navigate]);

  // 입력값 핸들러
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // 등록/수정 버튼
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        // 수정 요청 → **PUT 사용 & 경로 /edit/id**
        const now = new Date();
        const UPDATE_DT = now.toISOString().slice(0, 19).replace('T', ' ');
        const res = await axios.put(
          `http://192.168.111.194:3001/api/inquiry/edit/${id}`,
          { ...form, UPDATE_DT }
        );
        if (res.data.result === 'success') {
          alert('수정되었습니다!');
          navigate(`/inquiry/${id}`);
        } else {
          alert('수정에 실패했습니다.');
        }
      } else {
        // 작성 요청
        const now = new Date();
        const QS_ID = 'qs_' + now.getTime();
        const data = {
          USER_ID,
          USER_NAME,
          EMAIL,
          TITLE: form.TITLE,
          CONTENT: form.CONTENT,
          ANSWER: '',
          QS_DATE: now.toISOString().slice(0, 19).replace('T', ' '),
          QS_NUMBER: 1,
          AS_DATE: null,
          UPDATE_DT: null,
          QS_ID,
        };
        const res = await axios.post('http://192.168.111.194:3001/api/inquiry/add', data);
        if (res.data.result === 'success') {
          alert('문의가 등록되었습니다!');
          navigate('/inquiry');
        } else {
          alert('문의 등록에 실패했습니다.');
        }
      }

    } catch (err) {
      alert('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };


  const handleCancel = () => {
    if (isEdit) {
      navigate(`/inquiry/${id}`);
    } else {
      navigate('/inquiry');
    }
  };

  return (
    <div className='bg-common'>
      <Header/>
      <br /><br /><br />
      <div className="faq-detail-page-wrap">
        <a className="faq-detail-backbtn" onClick={handleCancel}>
          ← 돌아가기
        </a>
        <br /><br />
      
        <div className="faq-detail-title">{isEdit ? '문의 수정' : '문의 작성'}</div>
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
              placeholder="문의 제목을 입력하세요"
              disabled={loading}
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
              placeholder="문의 내용을 상세히 입력해 주세요"
              disabled={loading}
            />
          </div>
          <div className="common-btn-flexend common-btn-gap">
            <button type="submit" className="common-btn button-10px28px" disabled={loading}>
              {loading ? (isEdit ? '저장 중...' : '등록 중...') : (isEdit ? '저장' : '등록')}
            </button>
            <button type="button" className="common-btn button-10px28px faq-write-cancel" onClick={handleCancel} disabled={loading}>
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InquiryWrite;
