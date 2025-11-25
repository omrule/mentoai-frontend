// src/pages/PromptInput.js

import React, { useState, useRef, useEffect } from 'react';
import styles from './PromptInput.module.css';
import { checkGuardrails } from '../utils/guardrails';
import apiClient from '../api/apiClient';

// sessionStorage에서 userId를 가져오는 헬퍼
const getUserIdFromStorage = () => {
  try {
    const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
    return storedUser ? storedUser.user.userId : null;
  } catch (e) {
    return null;
  }
};

function PromptInput() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState([
    { role: 'ai', content: '안녕하세요! AI 멘토입니다. 진로 설계에 대해 무엇이든 물어보세요.' }
  ]);

  // 채팅 히스토리 (백엔드 연동)
  const [chatHistory, setChatHistory] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null); // logId
  
  const messagesEndRef = useRef(null);
  const messagesAreaRef = useRef(null);
  const prevMessagesLength = useRef(0);

  const scrollToBottom = () => {
    if (messagesAreaRef.current) {
      messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      scrollToBottom();
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);

  // 1. 초기 히스토리 로드 (GET /recommend/chats)
  useEffect(() => {
    const fetchHistory = async () => {
      console.log('[PromptInput] 초기 히스토리 로드 시작...');
      try {
        const response = await apiClient.get('/recommend/chats');
        console.log('[PromptInput] 히스토리 응답:', response.data);
        if (Array.isArray(response.data)) {
          // 날짜 내림차순 정렬
          const sorted = response.data.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          );
          setChatHistory(sorted);
          console.log('[PromptInput] ✅ 히스토리 로드 완료:', sorted.length + '개');
        }
      } catch (error) {
        console.error('[PromptInput] ❌ 히스토리 로드 실패:', error);
        console.error('[PromptInput] 에러 상세:', error.response?.data || error.message);
      }
    };
    fetchHistory();
  }, []);

  // 2. 히스토리 클릭 시 상세 로드 (GET /recommend/chats/{logId})
  const handleLoadChat = async (logId) => {
    if (activeChatId === logId) return;
    setActiveChatId(logId);
    setIsLoading(true);

    try {
      const response = await apiClient.get(`/recommend/chats/${logId}`);
      const logDetail = response.data;
      console.log('[PromptInput] 상세 로그 로드:', logDetail);

      // 상세 로그를 메시지 형태로 변환하여 표시
      // 여기서는 단일 질의응답 쌍을 보여주는 구조로 가정 (User Query -> Gemini Response)
      // 만약 멀티턴 대화라면 백엔드 구조에 따라 달라짐. 현재 명세는 ragPrompt, geminiResponse 등이 단일.
      
      const loadedMessages = [];
      
      // 사용자 질문
      if (logDetail.userQuery) {
        loadedMessages.push({ role: 'user', content: logDetail.userQuery });
      }

      // AI 응답
      if (logDetail.geminiResponse) {
        // 추천 결과(items)가 responsePayload에 포함되어 있을 수 있음
        // 일단 텍스트 응답 표시
        loadedMessages.push({ role: 'ai', content: logDetail.geminiResponse });
        
        // responsePayload에 items가 있다면 추가적으로 카드 형태로 표시 가능
        if (logDetail.responsePayload && logDetail.responsePayload.items) {
           const items = logDetail.responsePayload.items;
           items.forEach(item => {
             let tags = [];
             if (item.activity.tags) {
                // 태그 처리 (string or object)
                tags = item.activity.tags.map(t => (typeof t === 'string' ? t : t.tagName));
             }
             loadedMessages.push({
               role: 'ai',
               title: item.activity.title,
               content: item.reason || item.activity.summary,
               tags: tags
             });
           });
        }
      }
      
      setMessages(loadedMessages);

    } catch (error) {
      console.error('[PromptInput] 상세 로그 로드 실패:', error);
      // 실패 시 초기화 안함 (이전 메시지 유지)
    } finally {
      setIsLoading(false);
    }
  };

  // 3. 새 채팅 시작
  const handleNewChat = () => {
    console.log('[PromptInput] 새 채팅 시작');
    setActiveChatId(null);
    setMessages([
      { role: 'ai', content: '새로운 대화를 시작합니다. 무엇을 도와드릴까요?' }
    ]);
  };

  const handleRecommend = async () => {
    if (isLoading || !prompt.trim()) return;

    const guardrailResult = checkGuardrails(prompt);
    if (!guardrailResult.isSafe) {
      alert(guardrailResult.message);
      return;
    }

    // 새 메시지 추가 (낙관적 업데이트)
    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    const currentPrompt = prompt;
    setPrompt('');
    setIsLoading(true);

    console.log('[PromptInput] ===== 추천 요청 시작 =====');
    console.log('[PromptInput] 사용자 질문:', currentPrompt);

    try {
      const userId = getUserIdFromStorage();
      if (!userId) {
        throw new Error("로그인이 필요합니다.");
      }

      const requestBody = {
        userId: userId,
        query: currentPrompt,
        topK: 5,
        useProfileHints: true
      };

      console.log('[PromptInput] 요청 데이터:', requestBody);

      // POST /recommend 호출
      const response = await apiClient.post('/recommend', requestBody);
      console.log('[PromptInput] ✅ 응답 성공:', response.data);

      // 응답 처리
      const newAiMessages = [];
      
      // items가 있으면 추천 활동 카드 생성
      if (response.data && response.data.items && response.data.items.length > 0) {
        console.log('[PromptInput] 추천 아이템 개수:', response.data.items.length);
        
        response.data.items.forEach((item, idx) => {
          let tags = [];
          if (item.activity.tags && item.activity.tags.length > 0) {
            tags = item.activity.tags.map(tag => 
              typeof tag === 'string' ? tag : tag.tagName
            );
          }

          newAiMessages.push({
            role: 'ai',
            title: item.activity.title,
            content: item.reason || item.activity.summary,
            tags: tags
          });
          console.log(`[PromptInput] 아이템 ${idx + 1}:`, item.activity.title);
        });

      } else {
        console.log('[PromptInput] ⚠️ 추천 결과 없음');
        newAiMessages.push({ 
          role: 'ai', 
          content: '관련된 추천 활동을 찾지 못했습니다. 조금 더 구체적으로 질문해 주세요.' 
        });
      }

      setMessages(prev => [...prev, ...newAiMessages]);

      // 4. 채팅 후 히스토리 갱신 (약간의 딜레이 후 재조회)
      console.log('[PromptInput] 히스토리 갱신 대기 중...');
      setTimeout(async () => {
        try {
          console.log('[PromptInput] 히스토리 재조회 시작...');
          const historyResponse = await apiClient.get('/recommend/chats');
          if (Array.isArray(historyResponse.data)) {
            const sorted = historyResponse.data.sort((a, b) => 
              new Date(b.createdAt) - new Date(a.createdAt)
            );
            setChatHistory(sorted);
            console.log('[PromptInput] ✅ 히스토리 갱신 완료:', sorted.length + '개');
            
            // 방금 생성된 로그를 활성화 (새 채팅이었던 경우)
            if (sorted.length > 0 && !activeChatId) {
              setActiveChatId(sorted[0].logId);
              console.log('[PromptInput] 새 채팅 활성화:', sorted[0].logId);
            }
          }
        } catch (histError) {
          console.error('[PromptInput] ❌ 히스토리 갱신 실패:', histError);
        }
      }, 1000); // 1초 대기 (백엔드 저장 시간 고려)

    } catch (error) {
      console.error('[PromptInput] ❌ 추천 요청 실패:', error);
      console.error('[PromptInput] 에러 상세:', error.response?.data || error.message);
      
      setMessages(prev => [
        ...prev,
        { role: 'ai', content: `오류가 발생했습니다: ${error.response?.data?.message || error.message}` }
      ]);
      
      // 사용자에게 알림
      alert(`추천 요청 실패: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
      console.log('[PromptInput] ===== 요청 종료 =====');
    }
  };

  return (
    <div className={styles.chatPageContainer}>
      <div className={styles.chatLayout}>

        {/* 1. 채팅 히스토리 사이드바 */}
        <div className={styles.chatHistorySidebar}>
          <button className={styles.newChatBtn} onClick={handleNewChat}>
            + 새 채팅
          </button>
          <div className={styles.historyListContainer} style={{ overflowY: 'auto', flex: 1 }}>
            <ul className={styles.chatHistoryList}>
              {chatHistory.map(chat => (
                <li
                  key={chat.logId}
                  className={chat.logId === activeChatId ? styles.active : ''}
                  onClick={() => handleLoadChat(chat.logId)}
                >
                  {/* 제목은 userQuery를 잘라서 표시 */}
                  <span title={chat.userQuery}>
                    {chat.userQuery 
                      ? (chat.userQuery.length > 18 ? chat.userQuery.substring(0, 18) + '...' : chat.userQuery)
                      : '대화 기록 없음'}
                  </span>
                  <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '4px' }}>
                    {new Date(chat.createdAt).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 2. 메인 채팅창 */}
        <div className={styles.chatWindow}>

          {/* 2-1. 메시지 출력 영역 */}
          <div ref={messagesAreaRef} className={styles.chatMessagesArea}>

            {messages.map((msg, index) => (
              <div key={index} className={`${styles.chatMessage} ${styles[msg.role]}`}>
                {msg.role === 'ai' && msg.title ? (
                  <div className={styles.resultCardChat}>
                    <h4>{msg.title}</h4>
                    <p>{msg.content}</p>
                    <div className={styles.tags}>
                      {msg.tags?.map((tag, tIdx) => <span key={tIdx} className={styles.tag}>{tag}</span>)}
                    </div>
                  </div>
                ) : (
                  <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                )}
              </div>
            ))}

            {isLoading && (
              <div className={`${styles.chatMessage} ${styles.ai}`}>
                <div className={styles.spinnerDots}>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 2-2. 메시지 입력 영역 */}
          <div className={styles.chatInputArea}>
            <div className={styles.chatInputWrapper}>
              <textarea
                className={styles.chatTextarea}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="AI 멘토에게 질문을 입력하세요..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleRecommend();
                  }
                }}
                rows={1}
              />
              <button
                className={styles.chatSendButton}
                onClick={handleRecommend}
                disabled={isLoading || !prompt.trim()}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  className={styles.sendIcon}
                >
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2 .01 7z"></path>
                </svg>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default PromptInput;
