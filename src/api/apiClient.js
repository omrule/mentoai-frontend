// src/api/apiClient.js
import axios from 'axios';

// 백엔드 서버 주소
const API_BASE_URL = 'https://mentoai.onrender.com';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // Bearer 토큰 방식을 사용하므로 쿠키 옵션(withCredentials)을 끕니다.
  withCredentials: false 
});

// [신규] API 요청 인터셉터 (모든 요청에 'Authorization: Bearer' 헤더 자동 추가)
apiClient.interceptors.request.use((config) => {
  try {
    const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
    const token = storedUser ? storedUser.tokens.accessToken : null;

    // config.headers.Authorization이 없는 경우에만 토큰을 추가합니다.
    // (토큰 갱신 요청은 이 헤더가 없어야 할 수 있으므로)
    if (token && !config.headers.Authorization) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (e) {
    // sessionStorage가 없거나 파싱에 실패해도 무시하고 요청을 계속합니다.
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// [신규] 401 오류 시 토큰 자동 갱신 로직 (선택적이지만 강력히 권장)
// (이 로직은 AuthContext.js와 함께 작동합니다)
apiClient.interceptors.response.use(
  (response) => {
    return response; // 성공 시 그대로 반환
  },
  async (error) => {
    const originalRequest = error.config;
    
    // 401(Unauthorized) 오류이고, 재시도한 적이 없다면
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // 재시도 플래그 설정

      try {
        const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
        const refreshToken = storedUser ? storedUser.tokens.refreshToken : null;

        if (!refreshToken) throw new Error("No refresh token");

        // 갱신 API 호출 (이 요청은 인터셉터를 타지 않도록 raw axios 사용)
        const rs = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken: refreshToken 
        });

        const { accessToken, refreshToken: newRefreshToken, expiresIn } = rs.data;

        // 새 토큰 정보 업데이트
        const newTokens = { accessToken, refreshToken: newRefreshToken, expiresIn };
        const updatedUser = { ...storedUser, tokens: newTokens };
        sessionStorage.setItem('mentoUser', JSON.stringify(updatedUser));
        
        // 새 토큰으로 axios 기본 헤더 및 원본 요청 헤더 갱신
        apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + accessToken;
        originalRequest.headers['Authorization'] = 'Bearer ' + accessToken;

        // 실패했던 원본 요청 재시도
        return apiClient(originalRequest);

      } catch (refreshError) {
        // 리프레시 실패 시 (리프레시 토큰 만료 등)
        console.error("Token refresh failed:", refreshError);
        sessionStorage.removeItem('mentoUser');
        // AuthContext가 이 오류를 감지하고 로그아웃 처리하도록 이벤트를 보내거나,
        // 페이지를 강제로 리디렉션합니다.
        window.location.href = '/login'; 
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);


export default apiClient;