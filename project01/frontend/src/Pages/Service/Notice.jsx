// 공지사항

import React, { useState, useEffect } from 'react';
import '../../CSS/Faq.css';
import axios from 'axios';

const Notice = () => {
  const [notices, setNotices] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('list');
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [form, setForm] = useState({ title: '', content: '' });
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [origFileUrl, setOrigFileUrl] = useState('');

  // 관리자 아이디 맞는지 확인용
  const userId = localStorage.getItem('id');
  const govId = localStorage.getItem('gov_id');
  const isAdmin = userId === 'admin' || govId === 'admin';

  // ------------  공지사항 목록 불러오기  -------------------------
  const fetchNotice = async () => {
    setLoading(true);
    setError('');
    try {
      // 공지사항 목록 조회 요청
      const res = await axios.get('http://localhost:3001/api/notice');
      setNotices(res.data.notices || []);
    } catch (err) {
      setError('공지사항 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotice();
  }, []);

  // ------------------  검색 필터  -------------------
  const filteredNotices = notices.filter(n =>
    n.title && n.title.includes(search)
  );

  // ------------------  공지사항 등록/수정  ---------------
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // ------------------  파일 첨부 변경  --------------------
  const handleFileChange = e => {
    const file = e.target.files[0];
    setFile(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file)); // 불러온 파일 미리보기
    } else {
      setPreviewUrl('');
    }
  };

  // --------------------  기존 파일 삭제  --------------------
  const handleRemoveOrigFile = () => {
    setOrigFileUrl('');
    // 서버 반영 필요시 별도 api 호출 (아래에 설명)
  };

  // -----------  공지사항 등록/수정 요청  -----------
  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title || !form.content) {
      alert('제목과 내용을 입력하세요.');
      return;
    }
    try {
      const data = new FormData();
      data.append('title', form.title);
      data.append('content', form.content);
      data.append('writer', userId || govId);
      if (file) data.append('file', file);

      // 공지사항 등록
      if (mode === 'write') {
        const now = new Date();
        const created_at = now.toISOString().slice(0, 19).replace('T', ' ');
        data.append('created_at', created_at);

        // 공지사항 등록 요청
        const res = await axios.post('http://localhost:3001/api/notice', {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.result === 'success') {
          alert('공지사항이 등록되었습니다!');
          setMode('list');
          setForm({ title: '', content: '' });
          setFile(null);
          setPreviewUrl('');
          fetchNotice();
        } else {
          alert('등록에 실패했습니다.');
        }
      }
      // 공지사항 수정
      else if (mode === 'edit' && selectedNotice) {
        const now = new Date();
        const updated_at = now.toISOString().slice(0, 19).replace('T', ' ');
        data.append('updated_at', updated_at);

        if (!origFileUrl) data.append('deleteOrigFile', true);

        // 공지사항 수정 요청
        const res = await axios.put(
          `http://localhost:3001/api/notice/${selectedNotice.id}`,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );

        if (res.data.result === 'success') {
          alert('공지사항이 수정되었습니다!');
          setMode('list');
          setSelectedNotice(null);
          setForm({ title: '', content: '' });
          setFile(null);
          setPreviewUrl('');
          setOrigFileUrl('');
          fetchNotice();
        } else {
          alert('수정에 실패했습니다.');
        }
      }
    } catch (err) {
      alert('서버 오류가 발생했습니다.');
    }
  };

  // ------------  취소 버튼  -------------
  const handleCancel = () => {
    setMode('list');
    setForm({ title: '', content: '' });
    setFile(null);
    setPreviewUrl('');
    setOrigFileUrl('');
    setSelectedNotice(null);
  };

  // --------- 공지 클릭 시 상세/수정 모드 ------------------------
  const handleNoticeClick = (notice) => {
    setSelectedNotice(notice);
    setForm({ title: notice.title, content: notice.content });
    setFile(null);
    setPreviewUrl('');
    setOrigFileUrl(notice.file_url || '');
    setMode(isAdmin ? 'edit' : 'view');
  };

  // ------------  일반유저 상세보기 목록  --------------
  const handleViewBack = () => {
    setMode('list');
    setSelectedNotice(null);
    setForm({ title: '', content: '' });
    setFile(null);
    setPreviewUrl('');
    setOrigFileUrl('');
  };


  // 1. 관리자 등록/수정 폼
  if (mode === 'write' || (mode === 'edit' && isAdmin)) {
    return (
      <div className="faq-page-wrap">
        <h1 className="faq-title">{mode === 'write' ? '공지사항 등록' : '공지사항 수정'}</h1>
        <form className="faq-write-form" onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="faq-write-row">
            <label className="faq-write-label">제목</label>
            <input
              className="faq-write-input"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              maxLength={100}
              placeholder="공지 제목을 입력하세요"
              disabled={loading}
            />
          </div>
          <div className="faq-write-row">
            <label className="faq-write-label">내용</label>
            <textarea
              className="faq-write-textarea"
              name="content"
              value={form.content}
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
            {/* 미리보기(새 파일 선택시) */}
            {previewUrl && (
              <div style={{ marginTop: 10 }}>
                <img src={previewUrl} alt="미리보기" style={{ maxWidth: 200, maxHeight: 200 }} />
                <button type="button" onClick={() => { setFile(null); setPreviewUrl(''); }}>파일 취소</button>
              </div>
            )}
            {/* 기존 업로드 이미지/파일 */}
            {origFileUrl && !file && (
              <div style={{ marginTop: 10 }}>
                {origFileUrl.match(/\.(jpg|jpeg|png|gif)$/i) ?
                  <img src={origFileUrl} alt="첨부파일" style={{ maxWidth: 200, maxHeight: 200 }} />
                  : <a href={origFileUrl} target="_blank" rel="noopener noreferrer">첨부파일 보기</a>
                }
                <button type="button" onClick={handleRemoveOrigFile} style={{ marginLeft: 10 }}>삭제</button>
              </div>
            )}
          </div>
          <div className="faq-write-btns">
            <button type="submit" className="faq-write-submit" disabled={loading}>
              {loading ? '처리 중...' : (mode === 'write' ? '등록' : '저장')}
            </button>
            <button type="button" className="faq-write-cancel" onClick={handleCancel} disabled={loading}>
              취소
            </button>
          </div>
        </form>
      </div>
    );
  }

  // 2. 일반유저 상세 보기
  if (mode === 'view' && selectedNotice) {
    return (
      <div className="faq-page-wrap">
        <button className="faq-detail-backbtn" onClick={handleViewBack}>
          ← 돌아가기
        </button>
        <div className="faq-detail-title">{selectedNotice.title}</div>
        <div className="faq-detail-date">{selectedNotice.created_at?.slice(0, 10)}</div>
        <div className="faq-detail-content">{selectedNotice.content}</div>
        {/* 파일/이미지 */}
        {selectedNotice.file_url &&
          (selectedNotice.file_url.match(/\.(jpg|jpeg|png|gif)$/i) ?
            <img src={selectedNotice.file_url} alt="첨부파일" style={{ maxWidth: 200, maxHeight: 200 }} />
            : <a href={selectedNotice.file_url} target="_blank" rel="noopener noreferrer">첨부파일 보기</a>
          )
        }
      </div>
    );
  }

  // 공지사항 목록 (기본)
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
          {/* 관리자만 노출 */}
          {isAdmin && (
            <button onClick={() => { setMode('write'); setForm({ title: '', content: '' }); setFile(null); setPreviewUrl(''); setOrigFileUrl(''); }}>
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
                key={n.id}
                className="faq-question-item"
                onClick={() => handleNoticeClick(n)}
                style={{ cursor: 'pointer' }}
              >
                <span className="faq-q-icon">N</span>
                {n.title}
                <span style={{ marginLeft: '10px', color: '#aaa', fontSize: '0.96em' }}>
                  {n.created_at?.slice(0, 10)}
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
