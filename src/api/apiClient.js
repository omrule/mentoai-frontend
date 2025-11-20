// src/api/apiClient.js

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_API_URL;

if (!API_BASE_URL) {
  throw new Error(
    'REACT_APP_BACKEND_API_URL 환경변수가 설정되지 않았습니다. ' +
    '.env.local 파일을 생성하거나 Vercel 환경변수를 설정해주세요.'
  );
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
});

apiClient.interceptors.request.use(
  (config) => {
    try {
      const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
      
      // [!!!] [수정] storedUser.tokens가 undefined일 수 있으므로 '?'를 추가합니다.
      const token = storedUser?.tokens?.accessToken;
      const tokenType = storedUser?.tokens?.tokenType || 'Bearer';

      if (token) {
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