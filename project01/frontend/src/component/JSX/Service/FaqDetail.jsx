import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../Header';
import '../../CSS/Faq.css';

// DB연결 전 임시 데이터
const DUMMY_QUESTIONS = [
  { id: 1, text: '토스 앱에서 송금을 한 뒤 송금확인증은 어떻게 발급받나요?', detail: '송금 확인증은 토스 앱에서 “송금내역” 메뉴에 들어가 해당 내역을 선택한 뒤, “확인증 발급”을 누르시면 PDF로 저장 및 공유하실 수 있습니다.' },
  { id: 2, text: '오픈뱅킹 자동이체 문자를 받았어요.', detail: '오픈뱅킹 자동이체는 등록한 계좌에서 자동으로 출금되는 서비스입니다. 문자 내용과 내역을 확인 후 문의가 더 필요하시면 고객센터로 문의해주세요.' },
];

const FaqDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);

  useEffect(() => {
    // 실제론 서버 fetch
    const found = DUMMY_QUESTIONS.find(q => String(q.id) === String(id));
    setQuestion(found);
  }, [id]);

  if (!question) {
    return (
      <div>
        <Header />
        <div className="faq-detail-page-wrap">
          <div className="faq-detail-notfound">
            해당 질문을 찾을 수 없습니다.
            <br />
            <button className="faq-detail-backbtn" onClick={() => navigate('/faq')}>
              목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <br /><br /><br />
      <div className="faq-detail-page-wrap">
        <a className="faq-detail-backbtn" onClick={() => navigate('/faq')}>
          ← 돌아가기
        </a>
        <br /><br />
        <div className="faq-detail-title">{question.text}</div>
        <div className="faq-detail-content">{question.detail}</div>
      </div>
    </div>
  );
};

export default FaqDetail;
