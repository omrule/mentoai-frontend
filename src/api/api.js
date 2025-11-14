// src/api/api.js
import axios from 'axios';
import apiClient from './apiClient';

// 백엔드 서버 주소 (refresh용)
const API_BASE_URL = 'https://mentoai.onrender.com';

// --- Helper Functions ---
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

// [수정] POST /users (Google 사용자 정보로 MentoAI 로그인)
export const loginWithGoogle = async (googleUserData) => {
  try {
    // 백엔드 UserUpsert 스키마에 맞게 데이터 가공
    const payload = {
      authProvider: "GOOGLE",
      providerUserId: googleUserData.providerUserId, // Google의 'sub' ID
      email: googleUserData.email,
      name: googleUserData.name,
      profileImageUrl: googleUserData.profileImageUrl // Google 프로필 사진
    };

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
    
    const response = await apiClient.get(`/users/${userId}/profile`);
    return { success: true, data: response.data }; // UserProfile 스키마 반환
  } catch (error) {
    console.error("프로필 불러오기 실패:", error);
    if (error.response && error.response.status === 404) {
      return { success: false, data: null, isNewUser: true };
    }
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
      title: event.activityTitle || `이벤트 #${event.eventId}`,
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
    
    const aiTextResponse = response.data.items
      .map(item => `**${item.activity.title}**\n${item.reason}`)
      .join('\n\n');
      
    return { success: true, data: aiTextResponse || "추천 결과를 찾지 못했습니다." };
  } catch (error) {
    console.error("RAG 추천 실패:", error);
    return { success: false, data: "오류가 발생했습니다." };
  }
};