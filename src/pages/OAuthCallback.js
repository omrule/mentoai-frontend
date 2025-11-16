// src/pages/OAuthCallback.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1) fragment 파싱
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.substring(1)
      : window.location.hash;

    const params = new URLSearchParams(hash);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const tokenType = params.get('tokenType') || 'Bearer';
    const expiresIn = params.get('expiresIn') || '0';

    // 2) 저장 및 전역 헤더 설정
    if (accessToken && refreshToken) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('tokenType', tokenType);
      localStorage.setItem('expiresIn', expiresIn);
      axios.defaults.headers.common.Authorization = `${tokenType} ${accessToken}`;
    }

    // 3) URL 해시 제거
    window.history.replaceState(null, '', window.location.pathname + window.location.search);

    // 4) 보호 페이지로 이동
    navigate('/recommend', { replace: true });
  }, [navigate]);

  return null;
}