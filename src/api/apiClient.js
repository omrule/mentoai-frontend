// src/api/apiClient.js
import axios from 'axios';

// 백엔드 서버 주소
const API_BASE_URL = 'https://mentoai.onrender.com';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // [수정] Bearer 토큰 방식을 사용하므로 쿠키 옵션(withCredentials)을 끕니다.
  withCredentials: false 
});

// [삭제] 모든 요청/응답 인터셉터 로직을 제거합니다.
// (토큰 주입 및 갱신은 authApi.js와 AuthContext.js에서 수동으로 처리)

export default apiClient;