import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../CSS/Faq.css';
import axios from 'axios';

const Notice = () => {
  const [notices, setNotices] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const userId = localStorage.getItem('id');

  useEffect(() => {
    const fetchNotice = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get('http://localhost:3001/api/notice');
        setNotices(res.data.notices || []);
      } catch (err) {
        setError('공지사항 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchNotice();
  }, []);

  const filteredNotices = notices.filter(n =>
    n.title && n.title.includes(search)
  );

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
                onClick={() => navigate(`/notice/${n.id}`)}
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
