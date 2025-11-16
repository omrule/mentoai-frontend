// src/api/apiClient.js

import axios from 'axios';

const API_BASE_URL = 'https://mentoai.onrender.com';

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