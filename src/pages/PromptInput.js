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

  const [chatHistory, setChatHistory] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  const messagesEndRef = useRef(null);
  const prevMessagesLength = useRef(0); // 스크롤 로직을 위한 ref

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 새 메시지가 "추가"될 때만 스크롤 실행
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      scrollToBottom();
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);

  const handleRecommend = async () => {
    if (isLoading || !prompt.trim()) return;

    const guardrailResult = checkGuardrails(prompt);
    if (!guardrailResult.isSafe) {
      alert(guardrailResult.message);
      return;
    }

    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    const currentPrompt = prompt;
    setPrompt('');
    setIsLoading(true);

    console.log('[PromptInput] ===== API 요청 시작 =====');
    console.log('[PromptInput] 사용자 입력:', currentPrompt);

    // '새 채팅'인 경우, 첫 메시지를 채팅방 제목으로 설정
    const activeChat = chatHistory.find(chat => chat.id === activeChatId);
    if (activeChat && activeChat.title === '새 채팅') {
      const newTitle = currentPrompt.length > 20 ? currentPrompt.substring(0, 20) + '...' : currentPrompt;

      setChatHistory(prevHistory =>
        prevHistory.map(chat =>
          chat.id === activeChatId ? { ...chat, title: newTitle } : chat
        )
      );
    }

    try {
      const userId = getUserIdFromStorage();
      console.log('[PromptInput] sessionStorage에서 가져온 userId:', userId);

      if (!userId) {
        throw new Error("사용자 ID를 찾을 수 없습니다. (sessionStorage)");
      }

      const requestBody = {
        userId: userId,
        query: currentPrompt,
        topK: 5,
        preferTags: [], // 필요시 추출 가능
        useProfileHints: true
      };

      console.log('[PromptInput] API 엔드포인트: POST /recommend');
      console.log('[PromptInput] 요청 본문 (requestBody):', requestBody);
      console.log('[PromptInput] 요청 URL:', `${apiClient.defaults.baseURL}/recommend`);

      const response = await apiClient.post('/recommend', requestBody);

      console.log('[PromptInput] ===== API 응답 수신 =====');
      console.log('[PromptInput] 전체 응답 객체:', response);
      console.log('[PromptInput] 응답 데이터 (response.data):', response.data);
      console.log('[PromptInput] 응답 상태 코드:', response.status);
      console.log('[PromptInput] 응답 헤더:', response.headers);

      if (response.data && response.data.items && response.data.items.length > 0) {
        console.log('[PromptInput] 추천된 활동 개수:', response.data.items.length);
        console.log('[PromptInput] 추천된 활동 목록:', response.data.items);

        const aiResponses = response.data.items.map(item => {
          let tags = [];
          if (item.activity.tags && item.activity.tags.length > 0) {
            if (typeof item.activity.tags[0] === 'string') {
              tags = item.activity.tags;
            } else if (typeof item.activity.tags[0] === 'object' && item.activity.tags[0].tagName) {
              tags = item.activity.tags.map(tag => tag.tagName);
            }
          }

          const aiResponse = {
            role: 'ai',
            content: item.reason || item.activity.summary,
            title: item.activity.title,
            tags: tags
          };

          console.log('[PromptInput] 처리된 AI 응답:', aiResponse);
          return aiResponse;
        });

        console.log('[PromptInput] 모든 AI 응답 처리 완료:', aiResponses);
        setMessages(prev => [...prev, ...aiResponses]);

      } else {
        console.log('[PromptInput] 추천된 활동이 없습니다.');
        console.log('[PromptInput] 응답 데이터 구조:', response.data);
        setMessages(prev => [
          ...prev,
          { role: 'ai', content: '관련 활동을 찾지 못했습니다. 질문을 조금 더 구체적으로 해주시겠어요?' }
        ]);
      }

      console.log('[PromptInput] ===== API 요청 완료 =====');

    } catch (error) {
      console.error('[PromptInput] ===== API 호출 실패 =====');
      console.error('[PromptInput] 에러 객체:', error);
      console.error('[PromptInput] 에러 메시지:', error.message);
      console.error('[PromptInput] 에러 응답:', error.response);
      if (error.response) {
        console.error('[PromptInput] 에러 응답 데이터:', error.response.data);
        console.error('[PromptInput] 에러 응답 상태:', error.response.status);
        console.error('[PromptInput] 에러 응답 헤더:', error.response.headers);
      }
      console.error('[PromptInput] 에러 요청 설정:', error.config);

      setMessages(prev => [
        ...prev,
        { role: 'ai', content: `오류가 발생했습니다: ${error.message}` }
      ]);
    } finally {
      setIsLoading(false);
      console.log('[PromptInput] 로딩 상태 종료');
    }
  };

  const handleNewChat = () => {
    const newId = (chatHistory.length > 0 ? Math.max(...chatHistory.map(c => c.id)) : 0) + 1;
    setChatHistory(prev => [...prev, { id: newId, title: '새 채팅' }]);
    setActiveChatId(newId);
    setEditingChatId(newId); // 새 채팅 생성 시 즉시 편집 모드
    setEditingTitle('새 채팅');
    setMessages([
      { role: 'ai', content: '새 채팅을 시작합니다. 무엇을 도와드릴까요?' }
    ]);
  };

  const handleStartEdit = (chatId, currentTitle) => {
    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
  };

  const handleSaveEdit = (chatId) => {
    if (editingTitle.trim()) {
      setChatHistory(prev =>
        prev.map(chat =>
          chat.id === chatId ? { ...chat, title: editingTitle.trim() } : chat
        )
      );
    }
    setEditingChatId(null);
    setEditingTitle('');
  };

  const handleCancelEdit = () => {
    setEditingChatId(null);
    setEditingTitle('');
  };

  const handleKeyDown = (e, chatId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit(chatId);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
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
          <ul className={styles.chatHistoryList}>
            {chatHistory.map(chat => (
              <li
                key={chat.id}
                className={chat.id === activeChatId ? styles.active : ''}
                onClick={() => {
                  if (editingChatId !== chat.id) {
                    setActiveChatId(chat.id);
                  }
                }}
                onDoubleClick={() => handleStartEdit(chat.id, chat.title)}
              >
                {editingChatId === chat.id ? (
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => handleSaveEdit(chat.id)}
                    onKeyDown={(e) => handleKeyDown(e, chat.id)}
                    onClick={(e) => e.stopPropagation()}
                    className={styles.chatTitleInput}
                    autoFocus
                  />
                ) : (
                  <span>{chat.title}</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* 2. 메인 채팅창 */}
        <div className={styles.chatWindow}>

          {/* 2-1. 메시지 출력 영역 */}
          <div className={styles.chatMessagesArea}>

            {messages.map((msg, index) => (
              <div key={index} className={`${styles.chatMessage} ${styles[msg.role]}`}>
                {msg.role === 'ai' && msg.title ? (
                  <div className={styles.resultCardChat}>
                    <h4>{msg.title}</h4>
                    <p>{msg.content}</p>
                    <div className={styles.tags}>
                      {msg.tags?.map(tag => <span key={tag} className={styles.tag}>{tag}</span>)}
                    </div>
                  </div>
                ) : (
                  <p>{msg.content}</p>
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

          {/* 2-2. 메시지 입력 영역 (Gemini 스타일) */}
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