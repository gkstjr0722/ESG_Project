import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../component/Header';
import axios from 'axios';
import '../CSS/Sub.css';

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
    console.log('[Mypage] id:', id, 'govId:', govId);

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
      ? 'http://192.168.111.194:3001/userg/userinfo_gov'    // ✅ 관공업: userG 라우터
      : 'http://192.168.111.194:3001/user/userinfo';        // ✅ 기업: user 라우터로 통합
      ? 'http://192.168.111.194:3001/userg/userinfo_gov'    // ✅ 관공업: userG 라우터
      : 'http://192.168.111.194:3001/user/userinfo';        // ✅ 기업: user 라우터로 통합

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
        gov_id: user.id || '', // 정부회원도 id 컬럼을 사용!
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 회원 탈퇴 처리 (오른쪽 아래 버튼용)
  const userDelete = async () => {
    if (!user) return;
    const ok = window.confirm('정말로 회원탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.');
    if (!ok) return;
    try {
      if (userType === 'business') {
        await axios.delete('http://192.168.111.194:3001/user/delete', { data: { id: user.id } });
        await axios.delete('http://192.168.111.194:3001/user/delete', { data: { id: user.id } });
      } else {
        await axios.delete('http://192.168.111.194:3001/userg/delete_gov', { data: { id: user.id } });
        await axios.delete('http://192.168.111.194:3001/userg/delete_gov', { data: { id: user.id } });
      }
      alert('탈퇴가 완료되었습니다.');
      localStorage.removeItem('id');
      localStorage.removeItem('gov_id');
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('회원 탈퇴에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  // 수정 완료 시 변경사항 즉시 반영
  const handleSubmit = async (e) => {
    e.preventDefault();

    const targetId = userType === 'business' ? formData.id : formData.gov_id;
    console.log('[handleSubmit] 요청에 들어가는 id:', targetId);

    if (!targetId) {
      alert('id가 없습니다. 로그아웃 후 다시 로그인 해보세요.');
      return;
    }

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
        // ✅ 기업: user 라우터로 통일
        await axios.put('http://192.168.111.194:3001/user/update', {
        await axios.put('http://192.168.111.194:3001/user/update', {
          ...formData,
          id: formData.id,
        });

        if (newPassword) {
          await axios.put('http://192.168.111.194:3001/user/password-update', {
          await axios.put('http://192.168.111.194:3001/user/password-update', {
            id: formData.id,
            newPassword,
          });
        }
      } else {
        // ✅ 관공업: userg 라우터 경로 유지
        await axios.put('http://192.168.111.194:3001/userg/update_gov', {
        await axios.put('http://192.168.111.194:3001/userg/update_gov', {
          corpName: formData.corpName,
          ceo: formData.ceo,
          dept: formData.dept,
          manager: formData.manager,
          phone: formData.phone,
          email: formData.email,
          corpTel: formData.corpTel,
          address: formData.address,
          id: formData.gov_id,  // 실제 ID 반드시 맞게
        });

        if (newPassword) {
          await axios.put('http://192.168.111.194:3001/userg/update_gov_pw', {
          await axios.put('http://192.168.111.194:3001/userg/update_gov_pw', {
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
      console.error(error);
    }
  };

 if (!user)
    return (
      <div className="sMypage">
        <Header />
        <div className="sMypage-Loading">사용자 정보를 불러오는 중입니다...</div>
      </div>
    );

  if (editMode) {
    // 수정 모드
    return (
      <div className="sMypage">
        <Header />
        <div className="sMypage-EditWrap">
          <h2 className="sMypage-Title">회원 정보 수정</h2>

          <form onSubmit={handleSubmit} className="sMypage-Form">
            <label className="sMypage-Field">
              <span className="sMypage-FieldLabel">회사/기관명</span>
              <input
                className="sMypage-Input"
                type="text"
                name="corpName"
                placeholder="회사/기관명"
                value={formData.corpName}
                onChange={handleChange}
                required
              />
            </label>

            {userType === 'business' && (
              <label className="sMypage-Field">
                <span className="sMypage-FieldLabel">사업자등록번호</span>
                <input
                  className="sMypage-Input"
                  type="text"
                  name="corpRegNum"
                  placeholder="사업자등록번호"
                  value={formData.corpRegNum}
                  disabled
                />
              </label>
            )}

            <label className="sMypage-Field">
              <span className="sMypage-FieldLabel">대표자명</span>
              <input
                className="sMypage-Input"
                type="text"
                name="ceo"
                placeholder="대표자명"
                value={formData.ceo}
                onChange={handleChange}
                required
              />
            </label>

            <label className="sMypage-Field">
              <span className="sMypage-FieldLabel">부서/팀명 (선택)</span>
              <input
                className="sMypage-Input"
                type="text"
                name="dept"
                placeholder="부서/팀명 (선택)"
                value={formData.dept}
                onChange={handleChange}
              />
            </label>

            <label className="sMypage-Field">
              <span className="sMypage-FieldLabel">담당자명</span>
              <input
                className="sMypage-Input"
                type="text"
                name="manager"
                placeholder="담당자명"
                value={formData.manager}
                onChange={handleChange}
                required
              />
            </label>

            <label className="sMypage-Field">
              <span className="sMypage-FieldLabel">연락처</span>
              <input
                className="sMypage-Input"
                type="tel"
                name="phone"
                placeholder="연락처(휴대폰)"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </label>

            <label className="sMypage-Field">
              <span className="sMypage-FieldLabel">이메일</span>
              <input
                className="sMypage-Input"
                type="email"
                name="email"
                placeholder="이메일"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </label>

            <label className="sMypage-Field">
              <span className="sMypage-FieldLabel">회사(기관) 전화 (선택)</span>
              <input
                className="sMypage-Input"
                type="text"
                name="corpTel"
                placeholder="회사(기관) 전화 (선택)"
                value={formData.corpTel}
                onChange={handleChange}
              />
            </label>

            <label className="sMypage-Field sMypage-Field--full">
              <span className="sMypage-FieldLabel">회사(기관) 주소</span>
              <input
                className="sMypage-Input"
                type="text"
                name="address"
                placeholder="회사(기관) 주소"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </label>

            <label className="sMypage-Field">
              <span className="sMypage-FieldLabel">새 비밀번호</span>
              <input
                className="sMypage-Input"
                type="password"
                placeholder="새 비밀번호"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </label>

            <label className="sMypage-Field">
              <span className="sMypage-FieldLabel">새 비밀번호 확인</span>
              <input
                className="sMypage-Input"
                type="password"
                placeholder="새 비밀번호 확인"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
            </label>

            <div className="sMypage-Btns">
              <button
                type="button"
                className="sMypage-BtnSecondary"
                onClick={userDelete}
              >
                회원 탈퇴
              </button>
              <button type="button" className="sMypage-BtnSecondary" onClick={() => setEditMode(false)}>취소</button>
              <button type="submit" className="sMypage-BtnPrimary">수정 완료</button>
              {/* 마지막 버튼은 오른쪽 끝 + primary 스타일 (CSS에서 처리) */}
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 보기 모드
  return (
    <div className="sMypage">
      <Header />
      <div className="sMypage-ViewWrap">
        <h2 className="sMypage-Title">마이페이지</h2>

        <div className="sMypage-Info">
          <div className="sMypage-Row">
            <span className="sMypage-Label">아이디</span>
            <span className="sMypage-Value">{user.id}</span>
          </div>

          <div className="sMypage-Row">
            <span className="sMypage-Label">회사/기관명</span>
            <span className="sMypage-Value">{user.corpName}</span>
          </div>

          {userType === 'business' && (
            <div className="sMypage-Row">
              <span className="sMypage-Label">사업자등록번호</span>
              <span className="sMypage-Value">{user.corpRegNum}</span>
            </div>
          )}

          <div className="sMypage-Row">
            <span className="sMypage-Label">대표자명</span>
            <span className="sMypage-Value">{user.ceo}</span>
          </div>

          {user.dept && (
            <div className="sMypage-Row">
              <span className="sMypage-Label">부서/팀명</span>
              <span className="sMypage-Value">{user.dept}</span>
            </div>
          )}

          <div className="sMypage-Row">
            <span className="sMypage-Label">담당자명</span>
            <span className="sMypage-Value">{user.manager}</span>
          </div>

          <div className="sMypage-Row">
            <span className="sMypage-Label">연락처(휴대폰)</span>
            <span className="sMypage-Value">{user.phone}</span>
          </div>

          <div className="sMypage-Row">
            <span className="sMypage-Label">이메일</span>
            <span className="sMypage-Value">{user.email}</span>
          </div>

          {user.corpTel && (
            <div className="sMypage-Row">
              <span className="sMypage-Label">회사(기관) 전화</span>
              <span className="sMypage-Value">{user.corpTel}</span>
            </div>
          )}

          <div className="sMypage-Row">
            <span className="sMypage-Label">회사(기관) 주소</span>
            <span className="sMypage-Value">{user.address}</span>
          </div>
        </div>

        <div className="mypage-btn-wrap btn-FEnd">
          <button className="mypage-btn-primary" onClick={() => setEditMode(true)}>정보 수정</button>
        <div className="sMypage-Btns sMypage-Btns--end">
          <button className="sMypage-BtnPrimary" onClick={() => setEditMode(true)}>정보 수정</button>
        </div>
      </div>
    </div>
  );
};

export default Mypage;