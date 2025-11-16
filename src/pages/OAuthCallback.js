// src/pages/OAuthCallback.js

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient'; // apiClient 임포트

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('로그인 처리 중...');

  useEffect(() => {
    const completeLogin = async () => {
      try {
        // 1) URL 해시(#)에서 토큰 파싱
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('accessToken');
        const refreshToken = params.get('refreshToken');
        const tokenType = params.get('tokenType') || 'Bearer';
        const expiresIn = params.get('expiresIn') || '0';

        if (!accessToken) {
          throw new Error("URL에서 Access Token을 찾을 수 없습니다.");
        }

        // 2) [!!!] App.js와 apiClient가 인식할 수 있도록 sessionStorage에 임시 저장
        const tempAuthData = {
          tokens: { accessToken, refreshToken, tokenType, expiresIn }
        };
        // [!!!] localStorage -> sessionStorage로 수정
        sessionStorage.setItem('mentoUser', JSON.stringify(tempAuthData));
        
        // 3) URL에서 토큰 정보 제거 (보안)
        window.history.replaceState(null, '', window.location.pathname);

        // 4) [!!!] 토큰을 사용해 즉시 /auth/me API 호출
        // (apiClient가 sessionStorage에서 토큰을 읽어 헤더에 추가)
        setMessage('사용자 정보를 가져오는 중...');
        const response = await apiClient.get('/auth/me'); 
        
        // 5) [!!!] 완전한 { user, tokens } 객체를 sessionStorage에 저장
        // (PrivateRoute가 이 객체를 사용합니다)
        sessionStorage.setItem('mentoUser', JSON.stringify(response.data));

        // 6) 프로필 완성 여부에 따라 최종 목적지로 이동
        const profileComplete = response.data.user?.profileComplete;
        const destination = profileComplete ? '/recommend' : '/profile-setup';
        
        // window.location.href를 사용해 페이지를 완전히 새로고침합니다.
        window.location.href = destination;
      
      } catch (err) {
        console.error('OAuth 콜백 처리 중 오류:', err);
        setError(`로그인에 실패했습니다: ${err.message}. 잠시 후 다시 시도하세요.`);
        sessionStorage.removeItem('mentoUser'); // 실패 시 토큰 정보 삭제
      }
    };

    completeLogin();
  }, []); // 의존성 배열 비우기 (최초 1회만 실행)

  if (error) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-logo" style={{ color: '#dc3545' }}>Error</h1>
          <p className="auth-subtitle">{error}</p>
          <button className="google-login-button" onClick={() => window.location.href = '/login'}>
            <span>로그인 페이지로 돌아가기</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-logo">MentoAI</h1>
        <p className="auth-subtitle">{message}</p>
        {/* 간단한 로딩 스피너 */}
        <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #007bff', borderRadius: '50%', margin: '20px auto', animation: 'spin 1s linear infinite' }}></div>
      </div>
    </div>
  );
}