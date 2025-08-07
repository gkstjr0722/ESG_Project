import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../component/Header';
import axios from 'axios';

const Mypage = () => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState('none');
  const [editMode, setEditMode] = useState(false);

  // Edit form state
  const [formData, setFormData] = useState({
    corpName: '',
    corpRegNum: '',
    ceo: '',
    dept: '',
    manager: '',
    phone: '',
    email: '',
    corpTel: '',
    address: '',
    id: '',
    gov_id: '',
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const navigate = useNavigate();

  // 사용자 데이터 불러오기 함수 (수정 후에도 재호출 용)
  const fetchUserData = async () => {
    const id = localStorage.getItem('id');
    const govId = localStorage.getItem('gov_id');

    if (id) {
      setUserType('business');
    } else if (govId) {
      setUserType('government');
    } else {
      alert('로그인이 필요합니다!');
      navigate('/login');
      return;
    }

    const userId = id || govId;

    const endpoint = govId
      ? 'http://localhost:3001/userg/userinfo_gov'
      : 'http://localhost:3001/api/mypage/userinfo';

    try {
      const res = await axios.post(endpoint, { id: userId });
      if (res.data.user) setUser(res.data.user);
      else {
        alert('회원 정보를 찾을 수 없습니다.');
        navigate('/login');
      }
    } catch {
      alert('회원정보 조회 실패! 다시 로그인 해주세요.');
      navigate('/login');
    }
  };

  // 최초 마운트 때 사용자 데이터 fetch
  useEffect(() => {
    fetchUserData();
    // eslint-disable-next-line
  }, [navigate]);

  // user가 변경될 때 formData를 동기화
  useEffect(() => {
    if (user) {
      setFormData({
        corpName: user.corpName || '',
        corpRegNum: user.corpRegNum || '',
        ceo: user.ceo || '',
        dept: user.dept || '',
        manager: user.manager || '',
        phone: user.phone || '',
        email: user.email || '',
        corpTel: user.corpTel || '',
        address: user.address || '',
        id: user.id || '',
        gov_id: user.gov_id || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 수정 완료 시 변경사항 즉시 반영
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.corpName ||
      !formData.ceo ||
      !formData.manager ||
      !formData.phone ||
      !formData.email ||
      !formData.address
    ) {
      alert('필수 정보를 모두 입력해주세요.');
      return;
    }

    if (newPassword || confirmNewPassword) {
      if (newPassword !== confirmNewPassword) {
        alert('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
        return;
      }
      if (newPassword.length < 8) {
        alert('새 비밀번호는 8자 이상이어야 합니다.');
        return;
      }
    }

    try {
      if (userType === 'business') {
        await axios.put('http://localhost:3001/api/mypage/update', {
          ...formData,
          id: formData.id,
        });

        if (newPassword) {
          await axios.put('http://localhost:3001/api/mypage/password-update', {
            id: formData.id,
            newPassword,
          });
        }
      } else {
        await axios.put('http://localhost:3001/userg/update_gov', {
          ...formData,
          id: formData.gov_id,
        });

        if (newPassword) {
          await axios.put('http://localhost:3001/userg/password-update_gov', {
            id: formData.gov_id,
            newPassword,
          });
        }
      }

      alert('회원 정보가 성공적으로 수정되었습니다.');
      // 1. 수정 폼 닫기
      setEditMode(false);
      // 2. 최신 사용자 정보 다시 fetch - 여기서 바로 반영됨!
      await fetchUserData();
      // 3. 비밀번호 입력란 초기화
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      alert('회원 정보 수정에 실패했습니다. 다시 시도해주세요.');
    }
  };

  if (!user)
    return (
      <div>
        <Header />
        <div style={{ marginTop: 120 }}>사용자 정보를 불러오는 중입니다...</div>
      </div>
    );

  if (editMode) {
    // 수정 모드 렌더링
    return (
      <div>
        <Header />
        <div>
          <br />
          <br />
          <br />
          <br />
          <h2>회원 정보 수정 {userType === 'business' ? '(기업용)' : '(관공업용)'}</h2>
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '500px' }}
          >
            <label>
              회사/기관명 :<br />
              <input
                type="text"
                name="corpName"
                placeholder="회사/기관명"
                value={formData.corpName}
                onChange={handleChange}
                required
              />
            </label>
            {userType === 'business' && (
              <label>
                사업자등록번호 :<br />
                <input
                  type="text"
                  name="corpRegNum"
                  placeholder="사업자등록번호"
                  value={formData.corpRegNum}
                  disabled
                  style={{ backgroundColor: '#f0f0f0' }}
                />
              </label>
            )}
            <label>
              대표자명 :<br />
              <input
                type="text"
                name="ceo"
                placeholder="대표자명"
                value={formData.ceo}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              부서/팀명 [선택] :<br />
              <input
                type="text"
                name="dept"
                placeholder="부서/팀명 [선택]"
                value={formData.dept}
                onChange={handleChange}
              />
            </label>
            <label>
              담당자명 :<br />
              <input
                type="text"
                name="manager"
                placeholder="담당자명"
                value={formData.manager}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              연락처 :<br />
              <input
                type="tel"
                name="phone"
                placeholder="연락처(휴대폰)"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              이메일 :<br />
              <input
                type="email"
                name="email"
                placeholder="이메일"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              회사(기관) 전화 [선택] :<br />
              <input
                type="text"
                name="corpTel"
                placeholder="회사(기관) 전화 [선택]"
                value={formData.corpTel}
                onChange={handleChange}
              />
            </label>
            <label>
              회사(기관) 주소 :<br />
              <input
                type="text"
                name="address"
                placeholder="회사(기관) 주소"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              비밀번호 변경 :<br />
              <input
                type="password"
                placeholder="새 비밀번호"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </label>
            <label>
              새 비밀번호 확인 :<br />
              <input
                type="password"
                placeholder="새 비밀번호 확인"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
            </label>

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button type="submit" style={{ flex: 1 }}>
                정보 수정 완료
              </button>
              <button
                type="button"
                onClick={() => setEditMode(false)}
                style={{ flex: 1 }}
              >
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 기본 모드 렌더링
  return (
    <div>
      <Header />
      <div style={{ marginTop: 80 }}>
        <h2>마이페이지</h2>
        <div>
          <p>
            <strong>아이디:</strong> {user.id}
          </p>
          <p>
            <strong>회사/기관명:</strong> {user.corpName}
          </p>
          {userType === 'business' && (
            <p>
              <strong>사업자등록번호:</strong> {user.corpRegNum}
            </p>
          )}
          <p>
            <strong>대표자명:</strong> {user.ceo}
          </p>
          {user.dept && (
            <p>
              <strong>부서/팀명:</strong> {user.dept}
            </p>
          )}
          <p>
            <strong>담당자명:</strong> {user.manager}
          </p>
          <p>
            <strong>연락처(휴대폰):</strong> {user.phone}
          </p>
          <p>
            <strong>이메일:</strong> {user.email}
          </p>
          {user.corpTel && (
            <p>
              <strong>회사(기관) 전화:</strong> {user.corpTel}
            </p>
          )}
          <p>
            <strong>회사(기관) 주소:</strong> {user.address}
          </p>
        </div>
        <br />
        <button
          className="main-btn"
          onClick={() => setEditMode(true)}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          정보 수정
        </button>
      </div>
    </div>
  );
};

export default Mypage;
