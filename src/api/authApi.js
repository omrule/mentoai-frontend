// src/api/authApi.js
import apiClient from './apiClient';

// [신규] 앱 로드 시, 쿠키/세션을 기반으로 현재 로그인된 사용자인지 확인
// (GET /auth/me)
export const checkCurrentUser = async () => {
  try {
    const response = await apiClient.get('/auth/me');
    return { success: true, data: response.data };
  } catch (error) {
    console.warn("로그인 상태 아님:", error.response);
    return { success: false, data: null };
  }
};

// [신규] 백엔드 서버에 로그아웃 요청
// (POST /auth/logout)
export const logoutUser = async () => {
  try {
    await apiClient.post('/auth/logout');
    return { success: true };
  } catch (error) {
    console.error("로그아웃 실패:", error);
    return { success: false };
  }
};

// [수정] 프로필 저장 함수 (백엔드 인증 방식에 따라 수정됨)
export const saveUserProfile = async (profileData) => {
  console.log("진짜 백엔드로 전송할 프로필 데이터:", profileData);

  // 🚨 중요: 이 API 주소는 Swagger 스크린샷에 없습니다!
  //    팀원에게 '프로필 설정(학력, 스킬, 경험)'을 저장하는
  //    '실제 API 주소'를 물어보고 이 부분을 수정해야 합니다.
  //    (예: PUT /users/{userId} 또는 POST /users/profile 등)
  const ACTUAL_PROFILE_SAVE_URL = '/users/profile'; // <-- 이 주소는 '가짜'입니다.

  try {
    const response = await apiClient.post(ACTUAL_PROFILE_SAVE_URL, profileData);
    
    // (참고: apiClient가 헤더에 토큰을 자동으로 넣어줍니다)
    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    console.error("백엔드 프로필 저장 실패:", error);
    return { success: false, data: null };
  }
};

// [삭제] loginWithGoogle 함수는 더 이상 사용되지 않습니다.
// export const loginWithGoogle = ... (삭제)