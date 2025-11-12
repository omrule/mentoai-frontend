// src/api/apiClient.js
import axios from 'axios';

// 백엔드 서버 주소
const API_BASE_URL = 'https://mentoai.onrender.com';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // Bearer 토큰 방식을 사용하므로 쿠키 옵션(withCredentials)을 끕니다.
  withCredentials: false 
});

export default apiClient;