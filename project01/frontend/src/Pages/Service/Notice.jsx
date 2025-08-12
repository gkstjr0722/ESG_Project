// src/Pages/Service/Notice.jsx
import React, { useState, useEffect } from 'react';
import '../../CSS/Sub.css';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const Notice = () => {
  const [notices, setNotices] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('list'); // 'list' | 'view' | 'write' | 'edit'
  const [selectedNotice, setSelectedNotice] = useState(null);

  const [form, setForm] = useState({ TITLE: '', CONTENT: '' });
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const { id } = useParams();
  const navigate = useNavigate();

  const userId = localStorage.getItem('id');
  const govId = localStorage.getItem('gov_id');
  const userName = localStorage.getItem('userName') || '';
  const isAdmin = userId === 'admin' || govId === 'admin';

  const fetchNotice = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get('http://localhost:3001/api/notice/list');
      setNotices(data.notices || []);
    } catch (e) {
      setError('공지사항 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOne = async (noticeId) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(`http://localhost:3001/api/notice/${noticeId}`);
      if (data?.notice) {
        setSelectedNotice(data.notice);
        setForm({ TITLE: data.notice.TITLE, CONTENT: data.notice.CONTENT });
        setMode('view');
      } else {
        setSelectedNotice(null);
        setMode('list');
        setError('해당 공지를 찾을 수 없습니다.');
      }
    } catch (e) {
      setError('공지 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotice(); }, []);

  useEffect(() => {
    if (id) fetchOne(id);
    else {
      setMode('list');
      setSelectedNotice(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const q = (search || '').trim().toLowerCase();
  const filteredNotices = notices.filter(n =>
    (n.TITLE && String(n.TITLE).toLowerCase().includes(q)) ||
    (n.CONTENT && String(n.CONTENT).toLowerCase().includes(q))
  );

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = e => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) setPreviewUrl(URL.createObjectURL(f));
    else setPreviewUrl('');
  };

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

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
      navigate('/notice');
    } catch {
      alert('등록에 실패했습니다.');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedNotice) return;
    if (!form.TITLE || !form.CONTENT) {
      alert('제목과 내용을 입력하세요.');
      return;
    }

    const data = new FormData();
    data.append('TITLE', form.TITLE);
    data.append('CONTENT', form.CONTENT);
    data.append('EDITOR_ID', userId || govId || 'guest'); // 서버에서 'admin'만 허용
    data.append('EDITOR_NAME', userName || '관리자');
    if (file) data.append('file', file);

    try {
      await axios.put(`http://localhost:3001/api/notice/${selectedNotice.NOTICE_ID}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('수정되었습니다.');
      setFile(null);
      setPreviewUrl('');
      await fetchOne(selectedNotice.NOTICE_ID);
      setMode('view');
    } catch {
      alert('수정에 실패했습니다.');
    }
  };

  // ★ 삭제 요청
  const handleDelete = async () => {
    if (!selectedNotice) return;
    if (!window.confirm('정말 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.')) return;

    try {
      await axios.delete(`http://localhost:3001/api/notice/${selectedNotice.NOTICE_ID}`, {
        data: {
          EDITOR_ID: userId || govId,              // 서버에서 'admin' 체크
          EDITOR_NAME: userName || '관리자'
        }
      });
      alert('삭제되었습니다.');
      navigate('/notice');
      await fetchNotice();
      setMode('list');
      setSelectedNotice(null);
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  const handleCancel = () => {
    setMode('list');
    setForm({ TITLE: '', CONTENT: '' });
    setFile(null);
    setPreviewUrl('');
    setSelectedNotice(null);
    navigate('/notice');
  };

  const handleNoticeClick = (notice) => {
    navigate(`/notice/${notice.NOTICE_ID}`);
  };

  const handleViewBack = () => {
    setMode('list');
    setSelectedNotice(null);
    setForm({ TITLE: '', CONTENT: '' });
    setFile(null);
    setPreviewUrl('');
    navigate('/notice');
  };

  /* ───────── 등록 폼 (관리자만) ───────── */
  if (mode === 'write' && isAdmin) {
    return (
      <div className="faq-page-wrap">
        <h1 className="faq-title faq-tit-loca">공지사항 등록</h1>
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
            <input type="file" accept="image/*,.pdf" onChange={handleFileChange} disabled={loading} />
            {previewUrl && (
              <div style={{ marginTop: 10 }}>
                <img src={previewUrl} alt="미리보기" style={{ maxWidth: 260, height: 'auto' }} />
                <button type="button" onClick={() => { setFile(null); setPreviewUrl(''); }}>
                  파일 취소
                </button>
              </div>
            )}
          </div>
          <div className="common-btn-flexend common-btn-gap">
            <button type="submit" className="common-btn button-10px28px" disabled={loading}>
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

  /* ───────── 상세보기 ───────── */
  if (mode === 'view' && selectedNotice) {
    let fileUrl = '';
    if (selectedNotice.FILE_PATH) {
      fileUrl = selectedNotice.FILE_PATH.startsWith('http')
        ? selectedNotice.FILE_PATH
        : `http://localhost:3001${selectedNotice.FILE_PATH}`;
    }
    const isImage = fileUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl);

    const wrapSx = { paddingLeft: '24px', maxWidth: '980px', margin: 0 };
    // const backBtnSx = {
    //   background: 'transparent', border: 'none', boxShadow: 'none',
    //   color: '#000', fontWeight: 700, fontSize: '16px', padding: 0,
    //   cursor: 'pointer', margin: '0 0 12px 0'
    // };
    const zeroLeft = { marginLeft: 0, paddingLeft: 0 };

    return (
      <div className="faq-page-wrap">
        <div className="notice-detail-inner" style={wrapSx}>
          <button className="faq-detail-backbtn" onClick={handleViewBack}>
            ← 돌아가기
          </button>

          <div className="faq-detail-title notice-detail-title" style={zeroLeft}>
            {selectedNotice.TITLE}
          </div>

          <div className="faq-detail-date" style={zeroLeft}>
            {selectedNotice.NOTICE_DT?.slice(0, 10)}
          </div>

          <div className="faq-detail-content notice-detail-content" style={zeroLeft}>
            {selectedNotice.CONTENT}
          </div>

          {fileUrl && (
            isImage ? (
              <img src={fileUrl} alt="첨부파일" className="notice-detail-img" loading="lazy" style={{ ...zeroLeft }} />
            ) : (
              <a className="notice-detail-file" href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ ...zeroLeft }}>
                첨부파일 열기/다운로드
              </a>
            )
          )}

          {/* 수정/삭제 버튼: 본문 아래, 왼쪽 정렬 (관리자만) */}
          {isAdmin && (
            <div style={{ marginTop: '16px', textAlign: 'left', display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="notice-add-btn"
                onClick={() => {
                  setMode('edit');
                  setFile(null);
                  setPreviewUrl('');
                  setForm({ TITLE: selectedNotice.TITLE, CONTENT: selectedNotice.CONTENT });
                }}
              >
                수정
              </button>

              <button
                type="button"
                className="notice-add-btn"
                onClick={handleDelete}
              >
                삭제
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ───────── 수정 폼 (관리자만) ───────── */
  if (mode === 'edit' && isAdmin && selectedNotice) {
    return (
      <div className="faq-page-wrap">
        <h1 className="faq-title faq-tit-loca">공지사항 수정</h1>

        <form className="faq-write-form" onSubmit={handleUpdate} encType="multipart/form-data">
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
            <label className="faq-write-label">첨부파일 교체 (이미지/PDF)</label>
            <input type="file" accept="image/*,.pdf" onChange={handleFileChange} disabled={loading} />
            {previewUrl && (
              <div style={{ marginTop: 10 }}>
                <img src={previewUrl} alt="미리보기" style={{ maxWidth: 260, height: 'auto' }} />
                <button type="button" onClick={() => { setFile(null); setPreviewUrl(''); }}>
                  파일 선택 취소
                </button>
              </div>
            )}
          </div>

          <div className="faq-write-btns common-btn-gap common-btn-flexend">
            <button type="submit" className="common-btn button-10px28px faq-write-submit" disabled={loading}>
              {loading ? '처리 중...' : '저장'}
            </button>
            <button
              type="button"
              className="common-btn button-10px28px faq-write-cancel"
              onClick={() => {
                setMode('view');
                setFile(null);
                setPreviewUrl('');
                setForm({ TITLE: selectedNotice.TITLE, CONTENT: selectedNotice.CONTENT });
              }}
              disabled={loading}
            >
              취소
            </button>
          </div>
        </form>
      </div>
    );
  }

  /* ───────── 목록 ───────── */
  return (
    <div>
      <br /><br />
      <div className="faq-page-wrap">
        <h1 className="faq-title">공지사항</h1>

        <div className="faq-search-row" style={{ alignItems: 'center', gap: 12 }}>
          <span className="faq-search-icon">N</span>
          <input
            className="faq-search-input"
            type="text"
            placeholder="공지사항을 검색해보세요"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {isAdmin && (
            <button
              className="notice-add-btn"
              type="button"
              onClick={() => {
                setMode('write');
                setForm({ TITLE: '', CONTENT: '' });
                setFile(null);
                setPreviewUrl('');
                setSelectedNotice(null);
                navigate('/notice'); // 작성은 목록 경로에서 진행
              }}
            >
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
                <span style={{ marginLeft: 10, color: '#aaa', fontSize: '0.96em' }}>
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

// 2025-08-08 공지사항 수정/삭제 기능 구현 완료
