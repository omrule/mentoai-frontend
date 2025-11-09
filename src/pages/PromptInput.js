import React, { useState } from 'react';
import './Page.css';
import { checkGuardrails } from '../utils/guardrails';
import { createFinalPrompt } from '../utils/prompt-engineering';

// 가짜 AI 응답 데이터 (Swagger 문서 참고)
const sampleResults = [
  // ... (이전과 동일한 샘플 데이터) ...
  {
    activityId: 1,
    title: "AI 데이터 분석 전문가 양성과정",
    summary: "Python과 머신러닝을 활용한 실전 데이터 분석 프로젝트를 경험하고, 현업 전문가의 멘토링을 받을 수 있는 기회입니다.",
    tags: ["AI", "데이터 분석", "머신러닝"],
  },
  {
    activityId: 2,
    title: "대한민국 AI 경진대회 (K-AI Challenge)",
    summary: "자연어 처리, 이미지 인식 등 다양한 AI 분야의 문제를 해결하고 자신의 실력을 증명해보세요. 수상 시 채용 연계 혜택 제공.",
    tags: ["경진대회", "자연어 처리", "포트폴리오"],
  },
  {
    activityId: 3,
    title: "AI/ML 모델 개발 스터디 모집",
    summary: "매주 1회 강남에서 모여 최신 논문을 리뷰하고, 캐글 경진대회에 함께 참여할 팀원을 모집합니다. PyTorch 경험자 우대.",
    tags: ["스터디", "논문 리뷰", "캐글"],
  }
];

// 가짜 사용자 프로필 데이터 (나중엔 AuthContext에서 가져옴)
const fakeUserProfile = {
  university: '멘토대학교',
  major: '컴퓨터공학과',
  grade: '3',
  interests: ['AI', '데이터 분석', '백엔드 개발']
};


function PromptInput() {
  const [prompt, setPrompt] = useState('컴퓨터공학과 3학년 학생입니다. AI 분야로 취업하고 싶은데, 스펙을 쌓기 위해 참여하면 좋을 활동들을 추천해주세요.');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [showToast, setShowToast] = useState(false);

  const handleRecommend = () => {
    // 1. 가드레일 기능 실행 및 콘솔 출력
    const guardrailResult = checkGuardrails(prompt);
    console.log("--- 가드레일 검사 결과 ---", guardrailResult); // <-- 콘솔 출력 추가
    if (!guardrailResult.isSafe) {
      alert(guardrailResult.message);
      return;
    }

    // 2. 프롬프트 엔지니어링 실행 및 콘솔 출력
    //const finalPrompt = createFinalPrompt(prompt, fakeUserProfile);
    // createFinalPrompt 함수 내부에서도 콘솔 출력이 있지만, 여기서 한 번 더 명시적으로 찍어줍니다.
    // console.log("--- 최종 생성된 프롬프트 ---");
    // console.log(finalPrompt);
    // console.log("--------------------------");


    // 3. (가짜) API 호출 시뮬레이션
    setIsLoading(true);
    setResults([]);

    setTimeout(() => {
      console.log("가짜 백엔드 API 호출 완료 (2초 딜레이)"); // <-- 콘솔 출력 추가
      setResults(sampleResults);
      setIsLoading(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 2000);
  };

  const handlePinClick = (activityTitle) => {
    alert(`'${activityTitle}' 활동을 캘린더에 고정하는 기능은 백엔드 연동 후 구현될 예정입니다.`);
  };

  return (
    <div className="page-container">
      {showToast && <div className="toast-popup">활동 캘린더에 일정이 추가되었습니다!</div>}
      <h2>🤖 진로 설계 AI</h2>
      <p>AI 멘토에게 진로 설계에 대한 질문을 해보세요. 관련 활동, 공모전, 스터디 등을 추천해 드립니다.</p>

      <div className="prompt-card">
        <textarea
          className="prompt-input-area"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="예시) 컴퓨터공학과 3학년 학생입니다. AI 분야로 취업하고 싶은데, 스펙을 쌓기 위해 참여하면 좋을 활동들을 추천해주세요."
        />
        <button className="prompt-button" onClick={handleRecommend} disabled={isLoading}>
          {isLoading ? '분석 중...' : '추천받기'}
        </button>
      </div>

      {isLoading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>AI가 맞춤형 활동을 찾고 있습니다. 잠시만 기다려주세요...</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="results-container">
          <h3>AI 추천 활동 목록</h3>
          {results.map((item) => (
            <div key={item.activityId} className="result-card">
               <button className="pin-button" onClick={() => handlePinClick(item.title)}>
                캘린더에 추가
              </button>
              <h4>{item.title}</h4>
              <p>{item.summary}</p>
              <div className="tags">
                {item.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PromptInput;