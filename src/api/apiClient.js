// src/api/apiClient.js
import axios from 'axios';

// 백엔드 서버 주소
const API_BASE_URL = 'https://mentoai.onrender.com';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // [중요]
  // 백엔드 서버와 쿠키(JWT 토큰)를 주고받기 위해
  // 'withCredentials' 옵션을 true로 설정합니다.
  withCredentials: true 
});

// AuthContext에서 토큰을 가져와 헤더에 설정하는 로직 (선택적)
// (쿠키 대신 Bearer 토큰을 쓴다면 이 부분이 필요합니다)
apiClient.interceptors.request.use((config) => {
  try {
    const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
    const token = storedUser ? storedUser.accessToken : null;

    if (token && !config.headers.Authorization) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (e) {
    console.warn("sessionStorage에서 사용자 정보를 가져오지 못했습니다.", e);
  }
  return config;
});

export default apiClient;