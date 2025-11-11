// src/api/authApi.js
import axios from 'axios';
import apiClient from './apiClient';

// 백엔드 서버 주소 (refresh용)
const API_BASE_URL = 'https://mentoai.onrender.com';

// [신규] API 요청 시 헤더를 동적으로 생성하는 헬퍼 함수
const getAuthHeaders = () => {
  try {
    const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
    const token = storedUser ? storedUser.accessToken : null;

    if (token) {
      return {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
    }
  } catch (e) {
    // sessionStorage 파싱 오류 등
  }
  return {}; // 토큰이 없으면 빈 헤더 객체 반환
};


// [수정] GET /auth/me - 수동으로 헤더 주입
export const checkCurrentUser = async () => {
  try {
    const response = await apiClient.get('/auth/me', getAuthHeaders());
    return { success: true, data: response.data };
  } catch (error) {
    console.warn("GET /auth/me 실패 (401 예상):", error.response);
    return { success: false, data: null };
  }
};

// [수정] POST /auth/logout - 수동으로 헤더 주입
export const logoutUser = async () => {
  try {
    // 로그아웃 시에도 현재 토큰을 보내야 할 수 있음
    await apiClient.post('/auth/logout', null, getAuthHeaders());
    return { success: true };
  } catch (error) {
    console.error("로그아웃 실패:", error);
    return { success: false };
  }
};

// [신규] POST /auth/refresh - 토큰 갱신 전용 API
export const refreshAccessToken = async () => {
  try {
    const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
    const refreshToken = storedUser ? storedUser.refreshToken : null;

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    // [중요] 이 요청은 apiClient의 인터셉터(지금은 없지만)를 타지 않도록 raw axios 사용
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken: refreshToken 
    });
    
    // AuthTokens 스키마 반환
    return { success: true, data: response.data }; 

  } catch (error) {
    console.error("토큰 갱신 실패:", error);
    return { success: false, data: null };
  }
};


// [수정] 프로필 저장 함수 - 수동으로 헤더 주입
export const saveUserProfile = async (profileData) => {
  console.log("진짜 백엔드로 전송할 프로필 데이터:", profileData);

  // 🚨 중요: 이 API 주소는 Swagger 스크린샷에 없습니다!
  //    팀원에게 '프로필 설정(학력, 스킬, 경험)'을 저장하는
  //    '실제 API 주소'를 물어보고 이 부분을 수정해야 합니다.
  const ACTUAL_PROFILE_SAVE_URL = '/users/profile'; // <-- 이 주소는 '가짜'입니다.

  try {
    const response = await apiClient.post(
      ACTUAL_PROFILE_SAVE_URL, 
      profileData,
      getAuthHeaders() // 수동으로 헤더 주입
    );
    
    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    console.error("백엔드 프로필 저장 실패:", error);
    return { success: false, data: null };
  }
};