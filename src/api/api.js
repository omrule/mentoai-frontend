// src/api/api.js
import axios from 'axios';
import apiClient from './apiClient';

// 백엔드 서버 주소 (refresh용)
const API_BASE_URL = 'https://mentoai.onrender.com';

// --- Helper Functions ---

// sessionStorage에서 토큰과 userId를 안전하게 가져옵니다.
const getAuthData = () => {
  try {
    const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
    return { 
      // AuthResponse 스키마에 맞게 경로 변경
      userId: storedUser ? storedUser.user.userId : null
    };
  } catch (e) {
    return { userId: null };
  }
};

// --- Auth APIs (인증) ---

// [!!!] A안(클라이언트 흐름)의 핵심 함수. POST /users 호출
export const loginWithGoogle = async (googleUserData) => {
  try {
    // 백엔드 UserUpsert 스키마(POST /users)에 맞게 데이터 가공
    const payload = {
      authProvider: "GOOGLE",
      providerUserId: googleUserData.providerUserId, // Google의 'sub' ID
      email: googleUserData.email,
      name: googleUserData.name,
      // [!!!] 수정된 부분: API 명세에 따라 'nickname' 필드 추가
      nickname: googleUserData.name, 
      profileImageUrl: googleUserData.profileImageUrl // Google 프로필 사진
    };

    const response = await apiClient.post('/users', payload);
    
    // 백엔드가 /users 응답으로 { user, tokens } 객체를 준다고 가정
    return { success: true, data: response.data }; 
  } catch (error) {
    console.error("POST /users 로그인 실패:", error);
    return { success: false, data: null };
  }
};

// (GET /auth/me) - 이 함수는 verifyUser를 위해 *반드시* 필요합니다.
export const checkCurrentUser = async () => {
  try {
    // apiClient가 헤더에 토큰을 자동으로 붙여서 요청합니다.
    const response = await apiClient.get('/auth/me');
    return { success: true, data: response.data }; // User 스키마 반환
  } catch (error) {
    console.warn("GET /auth/me 실패:", error.response);
    return { success: false, data: null };
  }
};

// (POST /auth/logout)
export const logoutUser = async () => {
  try {
    // apiClient가 헤더에 토큰을 자동으로 붙여서 요청합니다.
    await apiClient.post('/auth/logout', null);
    return { success: true };
  } catch (error) {
    console.error("로그아웃 실패:", error);
    return { success: false };
  }
};

// --- User Profile APIs (프로필) ---

// (GET /users/{userId}/profile)
export const getUserProfile = async () => {
  try {
    const { userId } = getAuthData();
    if (!userId) throw new Error("User ID not found");
    
    // apiClient가 헤더에 토큰을 자동으로 붙여서 요청합니다.
    const response = await apiClient.get(`/users/${userId}/profile`);
    return { success: true, data: response.data }; // UserProfile 스키마 반환
  } catch (error) {
    console.error("프로필 불러오기 실패:", error);
    return { success: false, data: null };
  }
};

// (PUT /users/{userId}/profile)
export const saveUserProfile = async (profileData) => {
  try {
    const { userId } = getAuthData();
    if (!userId) throw new Error("User ID not found");

    // apiClient가 헤더에 토큰을 자동으로 붙여서 요청합니다.
    const response = await apiClient.put(
      `/users/${userId}/profile`, 
      profileData // UserProfileUpsert 스키마
    );
    return { success: true, data: response.data }; // UserProfile 스키마 반환
  } catch (error) {
    console.error("프로필 저장 실패:", error);
    return { success: false, data: null };
  }
};

// --- Calendar APIs (캘린더) ---

// (GET /users/{userId}/calendar/events)
export const getCalendarEvents = async () => {
  try {
    const { userId } = getAuthData();
    if (!userId) throw new Error("User ID not found");
    
    const response = await apiClient.get(`/users/${userId}/calendar/events`);
    // 백엔드 스키마(CalendarEvent)를 프론트엔드 state(id, title, date)에 맞게 변환
    const formattedEvents = response.data.map(event => ({
      id: event.eventId,
      title: event.activityTitle || `이벤트 #${event.eventId}`, // (API 명세에 title이 없음)
      date: event.startAt.split('T')[0] // 'YYYY-MM-DDT...' -> 'YYYY-MM-DD'
    }));
    return { success: true, data: formattedEvents };
  } catch (error) {
    console.error("캘린더 일정 불러오기 실패:", error);
    return { success: true, data: [] }; // 실패 시 빈 배열 반환
  }
};

// (POST /users/{userId}/calendar/events)
export const createCalendarEvent = async (newEvent) => {
  try {
    const { userId } = getAuthData();
    if (!userId) throw new Error("User ID not found");

    const payload = {
      // 캘린더에 일정을 추가하려면, 추천받은 활동의 'activityId'가 필요합니다.
      activityId: newEvent.activityId || 1, // '1'은 임시 ID
      startAt: `${newEvent.date}T00:00:00Z` // (시간은 임의로 설정)
    };
    
    const response = await apiClient.post(
      `/users/${userId}/calendar/events`, 
      payload
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error("캘린더 일정 생성 실패:", error);
    return { success: false, data: null };
  }
};

// --- Recommend & Activities APIs (추천) ---

// (POST /recommend)
export const getRecommendations = async (prompt) => {
  try {
    const { userId } = getAuthData();
    const payload = {
      userId: userId || null,
      query: prompt,
      useProfileHints: !!userId 
    };

    const response = await apiClient.post('/recommend', payload);
    
    // RecommendResponse 스키마에 따라 AI의 텍스트 답변(reason)을 추출
    // API 명세의 'reason'은 LLM 요약/근거입니다.
    const aiTextResponse = response.data.items
      .map(item => `**${item.activity.title}**\n${item.reason}`)
      .join('\n\n');
      
    return { success: true, data: aiTextResponse || "추천 결과를 찾지 못했습니다." };
  } catch (error) {
    console.error("RAG 추천 실패:", error);
    return { success: false, data: "오류가 발생했습니다." };
  }
};