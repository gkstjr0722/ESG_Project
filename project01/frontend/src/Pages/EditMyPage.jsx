import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../component/Header';

const EditMyPage = () => {
    const navigate = useNavigate();
    const [userType, setUserType] = useState('business');
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
        gov_id: ''    // ★ id 필드 추가!
    });
    // 비밀번호 변경을 위한 새로운 상태
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
        // 기업/관공업 로그인 체크
        const id = localStorage.getItem('id');
        const govId = localStorage.getItem('gov_id');

        if (govId) {
            setUserType('government');
            // 관공업 정보 조회
            axios.post('http://localhost:3001/userg/userinfo_gov', { id: govId })
                .then(res => {
                    setFormData({ ...res.data.user, gov_id: govId });
                })
                .catch(() => {
                    alert('회원 정보를 불러올 수 없습니다.');
                    navigate('/mypage');
                })
                .finally(() => setIsLoading(false));
        } else if (id) {
            setUserType('business');
            // 기업 정보 조회
            axios.post('http://localhost:3001/api/mypage/userinfo', { id })
                .then(res => {
                    setFormData({ ...res.data.user, id });
                })
                .catch(() => {
                    alert('회원 정보를 불러올 수 없습니다.');
                    navigate('/mypage');
                })
                .finally(() => setIsLoading(false));
        } else {
            alert('로그인이 필요합니다!');
            navigate('/login');
        }
    }, [navigate]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. 일반 회원 정보 유효성 검사
        if (!formData.corpName || !formData.ceo || !formData.manager || !formData.phone || !formData.email || !formData.address) {
            alert('필수 정보를 모두 입력해주세요.');
            return;
        }

        // 2. 비밀번호 유효성 검사 (새 비밀번호 필드가 비어있지 않은 경우에만 검사)
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
            // 1️⃣ 회원 정보 업데이트 (id 반드시 포함)
            if (userType === 'business') {
                await axios.put('http://localhost:3001/api/mypage/update', {
                    ...formData, id: formData.id
                });
            
            // 2️⃣ 새 비밀번호가 입력되었다면, 비밀번호만 별도로 업데이트 요청
                if (newPassword) {
                    await axios.put('http://localhost:3001/api/mypage/password-update', {
                        id: formData.id,
                        newPassword
                    });
                }
            } else {
                await axios.put('http://localhost:3001/userg/update_gov', {
                    ...formData, id: formData.gov_id
                });
                if (newPassword) {
                    await axios.put('http://localhost:3001/userg/password-update_gov', {
                        id: formData.gov_id, newPassword
                    });
                }
            }

            alert('회원 정보가 성공적으로 수정되었습니다.');
            navigate('/mypage');

        } catch (error) {
            alert('회원 정보 수정에 실패했습니다. 다시 시도해주세요.');
        }
    };

    if (isLoading) {
        return (
            <div>
                <Header/>
                <br /><br /><br /><br /><br /><br /><br /><br />
                <div>정보를 불러오는 중입니다...</div>
            </div>
        );
    }







    return (
        <div>
            <Header />
            <div>
                <br /><br /><br /><br />
                <h2>회원 정보 수정 {userType === 'business' ? '(기업용)' : '(관공업용)'}</h2>
                <form onSubmit={handleSubmit}>
                    회사/기관명 : <input type="text" name="corpName" placeholder="회사/기관명" value={formData.corpName} onChange={handleChange} required />
                    {userType === 'business' && (
                        <>
                            사업자등록번호 : <input type="text" name="corpRegNum" placeholder="사업자등록번호" value={formData.corpRegNum} disabled style={{ backgroundColor: '#f0f0f0' }} />
                        </>
                    )}
                    대표자명 : <input type="text" name="ceo" placeholder="대표자명" value={formData.ceo} onChange={handleChange} required />
                    부서/팀명 [선택] : <input type="text" name="dept" placeholder="부서/팀명 [선택] " value={formData.dept} onChange={handleChange} />
                    담당자명 : <input type="text" name="manager" placeholder="담당자명" value={formData.manager} onChange={handleChange} required />
                    연락처 : <input type="tel" name="phone" placeholder="연락처(휴대폰)" value={formData.phone} onChange={handleChange} required />
                    이메일 : <input type="email" name="email" placeholder="이메일" value={formData.email} onChange={handleChange} required />
                    회사(기관) 전화 [선택] : <input type="text" name="corpTel" placeholder="회사(기관) 전화 [선택] " value={formData.corpTel} onChange={handleChange} />
                    회사(기관) 주소 : <input type="text" name="address" placeholder="회사(기관) 주소" value={formData.address} onChange={handleChange} required />

                    <br />
                    비밀번호 변경 :
                    <input
                        type="password"
                        placeholder="새 비밀번호"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="새 비밀번호 확인"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                    />
                    <br />
                    <button type="submit" >정보 수정 완료</button>
                    <button type="button" onClick={() => navigate('/mypage')} >취소</button>
                </form>
            </div>
        </div>
    );
};

export default EditMyPage;
