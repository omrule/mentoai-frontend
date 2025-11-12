import React, { useState, useRef, useEffect } from 'react';
import './Page.css';
import { checkGuardrails } from '../utils/guardrails';
// import { createFinalPrompt } from '../utils/prompt-engineering'; // (API 연동 시 주석 해제)

// 가짜 AI 응답 데이터
const sampleResults = [
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
  }
];

// 가짜 채팅 히스토리 데이터
const mockChatHistory = [
  { id: 1, title: 'AI 분야 취업 스펙' },
  { id: 2, title: '3학년 여름방학 계획' },
  { id: 3, title: '데이터 분석가 로드맵' },
];

function PromptInput() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // [신규] 채팅 메시지 배열
  // (임시) 초기 메시지 추가
  const [messages, setMessages] = useState([
    { role: 'ai', content: '안녕하세요! AI 멘토입니다. 진로 설계에 대해 무엇이든 물어보세요.' }
  ]);

  const [chatHistory, setChatHistory] = useState(mockChatHistory);
  const [activeChatId, setActiveChatId] = useState(1);

  // [신규] 메시지 목록 스크롤을 위한 ref
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]); // 메시지가 추가될 때마다 스크롤

  const handleRecommend = () => {
    if (!prompt.trim()) return; // 빈 메시지 전송 방지

    // 1. 가드레일 검사
    const guardrailResult = checkGuardrails(prompt);
    if (!guardrailResult.isSafe) {
      alert(guardrailResult.message);
      return;
    }

    // 2. 사용자 메시지 추가
    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    setPrompt(''); // 입력창 비우기
    setIsLoading(true);

    // 3. (가짜) 프롬프트 엔지니어링 및 API 호출 시뮬레이션
    // const finalPrompt = createFinalPrompt(prompt, fakeUserProfile, []); // (API 연동 시)
    console.log("RAG 프롬프트 생성 (시뮬레이션)");

    // 4. (가짜) AI 응답
    setTimeout(() => {
      // (임시) 가짜 응답 중 하나를 랜덤으로 선택
      const aiResponse = sampleResults[Math.floor(Math.random() * sampleResults.length)];
      
      setMessages(prev => [
        ...prev, 
        { 
          role: 'ai', 
          content: aiResponse.summary,
          title: aiResponse.title, // [신규] 카드 제목 추가
          tags: aiResponse.tags,   // [신규] 태그 추가
        }
      ]);
      setIsLoading(false);
    }, 2000);
  };
  
  // (임시) 새 채팅 시작
  const handleNewChat = () => {
    const newId = chatHistory.length + 1;
    setChatHistory(prev => [...prev, { id: newId, title: '새 채팅' }]);
    setActiveChatId(newId);
    setMessages([
      { role: 'ai', content: '새 채팅을 시작합니다. 무엇을 도와드릴까요?' }
    ]);
  };

  return (
    // [수정]
    // page-container 대신 새로운 chat-page-container를 사용
    // (이유: .content의 기본 padding 30px을 제거해야 함)
    <div className="chat-page-container">
      <div className="chat-layout">
        
        {/* 1. 채팅 히스토리 사이드바 */}
        <div className="chat-history-sidebar">
          <button className="new-chat-btn" onClick={handleNewChat}>
            + 새 채팅 시작
          </button>
          <ul className="chat-history-list">
            {chatHistory.map(chat => (
              <li 
                key={chat.id} 
                className={chat.id === activeChatId ? 'active' : ''}
                onClick={() => setActiveChatId(chat.id)}
              >
                {chat.title}
              </li>
            ))}
          </ul>
        </div>
        
        {/* 2. 메인 채팅창 */}
        <div className="chat-window">
          
          {/* 2-1. 메시지 출력 영역 */}
          <div className="chat-messages-area">
            {messages.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.role}`}>
                {/* [신규] AI 응답이 카드 형태일 경우 */}
                {msg.role === 'ai' && msg.title ? (
                  <div className="result-card-chat">
                    <h4>{msg.title}</h4>
                    <p>{msg.content}</p>
                    <div className="tags">
                      {msg.tags?.map(tag => <span key={tag} className="tag">{tag}</span>)}
                    </div>
                  </div>
                ) : (
                  // 일반 텍스트 메시지
                  <p>{msg.content}</p>
                )}
              </div>
            ))}
            
            {/* 로딩 스피너 */}
            {isLoading && (
              <div className="chat-message ai">
                <div className="spinner-dots">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              </div>
            )}
            {/* 스크롤을 위한 빈 div */}
            <div ref={messagesEndRef} />
          </div>
          
          {/* 2-2. 메시지 입력 영역 (기존 prompt-card 재활용) */}
          <div className="chat-input-area">
            <textarea
              className="prompt-input-area"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="AI 멘토에게 질문을 입력하세요..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleRecommend();
                }
              }}
            />
            <button className="prompt-button" onClick={handleRecommend} disabled={isLoading}>
              {isLoading ? '...' : '전송'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PromptInput;