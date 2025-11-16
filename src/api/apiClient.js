// src/api/apiClient.js

import axios from 'axios';

// [!!!] 모든 API 요청의 기준이 되는 주소 (여기서만 관리)
const API_BASE_URL = 'https://mentoai.onrender.com';

// 모든 API 요청을 관리할 axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 👈 타임아웃 120초 일괄 관리
});

// API 요청을 보내기 전(interceptor)에 토큰을 자동으로 헤더에 추가합니다.
apiClient.interceptors.request.use(
  (config) => {
    // [!!!] [수정] localStorage -> sessionStorage
    // App.js, OAuthCallback.js와 동일하게 sessionStorage에서 토큰을 읽습니다.
    try {
      // [수정] localStorage.getItem -> sessionStorage.getItem
      const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
      const token = storedUser ? storedUser.tokens.accessToken : null;
      const tokenType = storedUser ? (storedUser.tokens.tokenType || 'Bearer') : 'Bearer';

      if (token) {
        // [!!!] 'Authorization' 헤더에 Bearer 토큰 자동 설정
        config.headers['Authorization'] = `${tokenType} ${token}`;
      }
    } catch (e) {
      console.error("apiClient: 토큰 설정 중 오류 발생", e);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;