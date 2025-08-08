import React, { useState, useEffect } from 'react';
// import '../../CSS/Faq.css';
import '../../CSS/Sub.css';
import axios from 'axios';

const Notice = () => {
  const [notices, setNotices] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('list');
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [form, setForm] = useState({ TITLE: '', CONTENT: '' });
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // 관리자 판별
  const userId = localStorage.getItem('id');
  const govId = localStorage.getItem('gov_id');
  const userName = localStorage.getItem('userName') || '';
  const isAdmin = userId === 'admin' || govId === 'admin';

  // 목록 불러오기
  const fetchNotice = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('http://localhost:3001/api/notice/list');
      setNotices(res.data.notices || []);
    } catch (err) {
      setError('공지사항 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotice(); }, []);

  // 검색 필터
  const filteredNotices = notices.filter(n =>
    (n.TITLE && n.TITLE.includes(search)) ||
    (n.CONTENT && n.CONTENT.includes(search))
  );

  // 폼 입력
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // 파일 첨부
  const handleFileChange = e => {
    const file = e.target.files[0];
    setFile(file);
    if (file) setPreviewUrl(URL.createObjectURL(file));
    else setPreviewUrl('');
  };

  // 프리뷰 메모리 해제
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // 등록 요청
  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.TITLE || !form.CONTENT) {
      alert('제목과 내용을 입력하세요.');
      return;
    }

    const data = new FormData();
    data.append('TITLE', form.TITLE);
    data.append('CONTENT', form.CONTENT);
    data.append('WRITER_ID', userId || govId || 'guest');
    data.append('WRITER_NAME', userName || '관리자');
    if (file) data.append('file', file);

    try {
      await axios.post('http://localhost:3001/api/notice/add', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('공지사항이 등록되었습니다!');
      setMode('list');
      setForm({ TITLE: '', CONTENT: '' });
      setFile(null);
      setPreviewUrl('');
      setSelectedNotice(null);
      fetchNotice();
    } catch (err) {
      alert('등록에 실패했습니다.');
    }
  };

  // 취소
  const handleCancel = () => {
    setMode('list');
    setForm({ TITLE: '', CONTENT: '' });
    setFile(null);
    setPreviewUrl('');
    setSelectedNotice(null);
  };

  // 상세 진입
  const handleNoticeClick = (notice) => {
    setSelectedNotice(notice);
    setForm({ TITLE: notice.TITLE, CONTENT: notice.CONTENT });
    setFile(null);
    setPreviewUrl('');
    setMode('view');
  };

  // 목록으로
  const handleViewBack = () => {
    setMode('list');
    setSelectedNotice(null);
    setForm({ TITLE: '', CONTENT: '' });
    setFile(null);
    setPreviewUrl('');
  };

  // -- 등록 폼 (관리자만)
  if (mode === 'write' && isAdmin) {
    return (
      <div className="faq-page-wrap">
        <h1 className="faq-title">공지사항 등록</h1>
        <form className="faq-write-form" onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="faq-write-row">
            <label className="faq-write-label">제목</label>
            <input
              className="faq-write-input"
              name="TITLE"
              value={form.TITLE}
              onChange={handleChange}
              required
              maxLength={200}
              placeholder="공지 제목을 입력하세요"
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
              maxLength={2000}
              placeholder="공지 내용을 상세히 입력해 주세요"
              disabled={loading}
            />
          </div>
          <div className="faq-write-row">
            <label className="faq-write-label">첨부파일 (이미지/PDF)</label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              disabled={loading}
            />
            {previewUrl && (
              <div style={{ marginTop: 10 }}>
                <img src={previewUrl} alt="미리보기" style={{ maxWidth: 200, maxHeight: 200 }} />
                <button type="button" onClick={() => { setFile(null); setPreviewUrl(''); }}>파일 취소</button>
              </div>
            )}
          </div>
          <div className="faq-write-btns">
            <button type="submit" className="common-btn button-10px28px faq-write-submit" disabled={loading}>
              {loading ? '처리 중...' : '등록'}
            </button>
            <button type="button" className="common-btn button-10px28px faq-write-cancel" onClick={handleCancel} disabled={loading}>
              취소
            </button>
          </div>
        </form>
      </div>
    );
  }

  // -- 상세보기 (일반유저/관리자)
  if (mode === 'view' && selectedNotice) {
    // 파일 경로 보정 (외부 URL 또는 서버 업로드 경로)
    let fileUrl = '';
    if (selectedNotice.FILE_PATH) {
      if (selectedNotice.FILE_PATH.startsWith('http')) {
        fileUrl = selectedNotice.FILE_PATH;
      } else {
        fileUrl = `http://localhost:3001${selectedNotice.FILE_PATH}`;
      }
    }

    return (
      <div className="faq-page-wrap">
        <button className="faq-detail-backbtn" onClick={handleViewBack}>
          ← 돌아가기
        </button>
        <div className="faq-detail-title">{selectedNotice.TITLE}</div>
        <div className="faq-detail-date">{selectedNotice.NOTICE_DT?.slice(0, 10)}</div>
        <div className="faq-detail-content">{selectedNotice.CONTENT}</div>
        {fileUrl && (
          fileUrl.match(/\.(jpg|jpeg|png|gif)$/i)
            ? <img src={fileUrl} alt="첨부파일" style={{ maxWidth: 200, maxHeight: 200 }} />
            : <a href={fileUrl} target="_blank" rel="noopener noreferrer">첨부파일 다운로드</a>
        )}
      </div>
    );
  }

  // -- 목록
  return (
    <div>
      <br /><br />
      <div className="faq-page-wrap">
        <h1 className="faq-title">공지사항</h1>
        <div className="faq-search-row">
          <span className="faq-search-icon">N</span>
          <input
            className="faq-search-input"
            type="text"
            placeholder="공지사항을 검색해보세요"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {isAdmin && (
            <button className='common-btn notice-main-uplode' onClick={() => {
              setMode('write');
              setForm({ TITLE: '', CONTENT: '' });
              setFile(null);
              setPreviewUrl('');
              setSelectedNotice(null);
            }}>
              공지사항 등록
            </button>
          )}
        </div>
        <div className="faq-question-list">
          {loading ? (
            <div className="faq-question-empty">불러오는 중...</div>
          ) : error ? (
            <div className="faq-question-empty">{error}</div>
          ) : filteredNotices.length === 0 ? (
            <div className="faq-question-empty">등록된 공지사항이 없습니다.</div>
          ) : (
            filteredNotices.map(n => (
              <div
                key={n.NOTICE_ID}
                className="faq-question-item"
                onClick={() => handleNoticeClick(n)}
                style={{ cursor: 'pointer' }}
              >
                <span className="faq-q-icon">N</span>
                {n.TITLE}
                <span style={{ marginLeft: '10px', color: '#aaa', fontSize: '0.96em' }}>
                  {n.NOTICE_DT?.slice(0, 10)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notice;
