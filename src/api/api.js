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
      token: storedUser ? storedUser.accessToken : null,
      userId: storedUser ? storedUser.userId : null,
      refreshToken: storedUser ? storedUser.refreshToken : null
    };
  } catch (e) {
    return { token: null, userId: null, refreshToken: null };
  }
};

// API 요청 시 헤더를 동적으로 생성합니다.
const getAuthHeaders = () => {
  const { token } = getAuthData();
  if (token) {
    return {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
  }
  return {};
};

// --- Auth APIs (인증) ---

// (GET /auth/me)
export const checkCurrentUser = async () => {
  try {
    const response = await apiClient.get('/auth/me', getAuthHeaders());
    return { success: true, data: response.data }; // User 스키마 반환
  } catch (error) {
    console.warn("GET /auth/me 실패 (401 예상):", error.response);
    return { success: false, data: null };
  }
};

// (POST /auth/logout)
export const logoutUser = async () => {
  try {
    await apiClient.post('/auth/logout', null, getAuthHeaders());
    return { success: true };
  } catch (error) {
    console.error("로그아웃 실패:", error);
    return { success: false };
  }
};

// (POST /auth/refresh)
export const refreshAccessToken = async () => {
  try {
    const { refreshToken } = getAuthData();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken: refreshToken 
    });
    return { success: true, data: response.data }; // AuthTokens 스키마 반환
  } catch (error) {
    console.error("토큰 갱신 실패:", error);
    return { success: false, data: null };
  }
};

// --- User Profile APIs (프로필) ---

// (GET /users/{userId}/profile)
export const getUserProfile = async () => {
  try {
    const { userId } = getAuthData();
    if (!userId) throw new Error("User ID not found");
    
    const response = await apiClient.get(`/users/${userId}/profile`, getAuthHeaders());
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
      profileData, // UserProfileUpsert 스키마
      getAuthHeaders()
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
    
    const response = await apiClient.get(`/users/${userId}/calendar/events`, getAuthHeaders());
    // 백엔드 스키마(CalendarEvent)를 프론트엔드 state(id, title, date)에 맞게 변환
    const formattedEvents = response.data.map(event => ({
      id: event.eventId,
      title: event.activityTitle || "제목 없음", // (API 명세에 title이 없어서 activityTitle로 가정)
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

    // 프론트 state를 백엔드 스키마(CalendarEventUpsert)로 변환
    const payload = {
      activityId: newEvent.activityId, // (activityId가 필요 - PromptInput에서 받아와야 함)
      startAt: `${newEvent.date}T00:00:00Z` // (시간은 임의로 설정)
    };
    
    const response = await apiClient.post(
      `/users/${userId}/calendar/events`, 
      payload,
      getAuthHeaders()
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
      userId: userId || null, // 비로그인(임시) 상태일 수 있음
      query: prompt,
      useProfileHints: !!userId // 로그인 상태일 때만 프로필 사용
    };

    const response = await apiClient.post('/recommend', payload, getAuthHeaders());
    // RecommendResponse 스키마에서 AI의 텍스트 답변(reason)을 추출
    const aiTextResponse = response.data.items
      .map(item => `**${item.activity.title}**\n${item.reason}`)
      .join('\n\n');
      
    return { success: true, data: aiTextResponse || "추천 결과를 찾지 못했습니다." };
  } catch (error) {
    console.error("RAG 추천 실패:", error);
    return { success: false, data: "오류가 발생했습니다." };
  }
};

// (GET /activities) - AI 맞춤 활동 추천 페이지 (보류)
export const getActivities = async () => {
  try {
    const response = await apiClient.get('/activities', {
      params: { page: 1, size: 20 }
    });
    return { success: true, data: response.data.items }; // Activity[] 반환
  } catch (error) {
    console.error("활동 목록 불러오기 실패:", error);
    return { success: true, data: [] };
  }
};