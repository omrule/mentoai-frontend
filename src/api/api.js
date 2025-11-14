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
      userId: storedUser ? storedUser.user.userId : null
    };
  } catch (e) {
    return { userId: null };
  }
};

// --- Auth APIs (인증) ---

// [신규] POST /users (Google 토큰으로 MentoAI 로그인/회원가입)
export const loginWithGoogle = async (googleTokenResponse) => {
  try {
    // 백엔드 UserUpsert 스키마에 맞게 데이터 가공
    // (백엔드가 access_token만 받는지, 아니면 google의 'sub' ID를 원하는지 확인 필요)
    // 우선 access_token을 'providerUserId'로 보낸다고 가정합니다.
    const payload = {
      authProvider: "GOOGLE",
      providerUserId: googleTokenResponse.access_token, // 👈 백엔드와 협의 필요!
      email: "temp@example.com", // 👈 Google 토큰에서 파싱해야 하나, API 명세에 없음
      name: "Temp Name"           // 👈 이것도 임시값
      // providerUserId에 access_token을 보내면, 백엔드가 Google에 유저 정보를
      // 직접 요청하여 email, name을 채우는 방식일 수 있습니다.
    };

    // [수정] /auth/google/start가 아닌 POST /users 호출
    const response = await apiClient.post('/users', payload);
    
    // AuthResponse 스키마 반환 (user, tokens)
    return { success: true, data: response.data }; 
  } catch (error) {
    console.error("POST /users 로그인 실패:", error);
    return { success: false, data: null };
  }
};

// (GET /auth/me)
export const checkCurrentUser = async () => {
  try {
    // apiClient가 헤더에 토큰을 자동으로 붙여서 요청합니다.
    const response = await apiClient.get('/auth/me');
    return { success: true, data: response.data }; // User 스키마 반환
  } catch (error) {
    console.warn("GET /auth/me 실패 (401 예상):", error.response);
    return { success: false, data: null };
  }
};

// (POST /auth/logout)
export const logoutUser = async () => {
  try {
    await apiClient.post('/auth/logout', null);
    return { success: true };
  } catch (error) {
    console.error("로그아웃 실패:", error);
    return { success: false };
  }
};

// (POST /auth/refresh)
// [삭제] refreshAccessToken (apiClient의 응답 인터셉터가 자동으로 처리)

// --- User Profile APIs (프로필) ---

// (GET /users/{userId}/profile)
export const getUserProfile = async () => {
  try {
    const { userId } = getAuthData();
    if (!userId) throw new Error("User ID not found");
    
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
    const formattedEvents = response.data.map(event => ({
      id: event.eventId,
      title: event.activityTitle || `이벤트 #${event.eventId}`, // (API 명세에 title이 없음)
      date: event.startAt.split('T')[0]
    }));
    return { success: true, data: formattedEvents };
  } catch (error) {
    console.error("캘린더 일정 불러오기 실패:", error);
    return { success: true, data: [] }; 
  }
};

// (POST /users/{userId}/calendar/events)
export const createCalendarEvent = async (newEvent) => {
  try {
    const { userId } = getAuthData();
    if (!userId) throw new Error("User ID not found");

    const payload = {
      // 캘린더에 일정을 추가하려면, 추천받은 활동의 'activityId'가 필요합니다.
      // 'PromptInput'에서 캘린더 추가 시 이 ID를 넘겨받도록 수정해야 합니다.
      activityId: newEvent.activityId || 1, // '1'은 임시 ID
      startAt: `${newEvent.date}T00:00:00Z` 
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
    // [수정] RecommendResponse 스키마에 따라 AI의 텍스트 답변(reason)을 추출
    const aiTextResponse = response.data.items
      .map(item => `**${item.activity.title}**\n${item.reason}`)
      .join('\n\n');
      
    return { success: true, data: aiTextResponse || "추천 결과를 찾지 못했습니다." };
  } catch (error) {
    console.error("RAG 추천 실패:", error);
    return { success: false, data: "오류가 발생했습니다." };
  }
};