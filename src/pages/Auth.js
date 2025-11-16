// src/pages/Auth.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient'; // MentoAI 백엔드 요청용
import './Page.css';

function AuthPage() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // 1) 로그인 상태 확인 (/auth/me)
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        // [!!!] [수정] localStorage -> sessionStorage
        // App.js와 동일하게 sessionStorage에서 토큰을 확인합니다.
        const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
        const accessToken = storedUser ? storedUser.tokens.accessToken : null;

        if (!accessToken) {
            throw new Error("No access token found in sessionStorage");
        }
        
        // apiClient가 sessionStorage에서 토큰을 읽어 /auth/me 호출
        const response = await apiClient.get('/auth/me'); 
        const data = response.data;
        const user = data?.user;

        if (user) {
          // [수정] /auth/me로 받은 최신 정보로 sessionStorage 업데이트
          sessionStorage.setItem('mentoUser', JSON.stringify(data));
          const profileComplete = user.profileComplete;
          const destination = profileComplete ? '/recommend' : '/profile-setup';
          navigate(destination, { replace: true });
          return;
        }
      } catch (error) {
        console.error('GET /auth/me failed (Not logged in):', error.message);
      } finally {
        setIsChecking(false);
      }
    };
    checkLoginStatus();
  }, [navigate]);

  const handleGoogleLogin = () => {
    if (isLoading) return;
    setIsLoading(true);
    // 콜백 전용 페이지로 돌아오게 설정
    const redirectUri = `${window.location.origin}/oauth/callback`;

    // apiClient.defaults.baseURL에서 통합된 URL을 가져옵니다.
    const loginUrl = `${apiClient.defaults.baseURL}/auth/google/start?redirectUri=${encodeURIComponent(redirectUri)}`;
    
    window.location.href = loginUrl;
  };

  // 3) 로딩 화면 (isChecking)
  if (isChecking) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-logo">MentoAI</h1>
          <p className="auth-subtitle">로그인 상태를 확인 중입니다...</p>
        </div>
      </div>
    );
  }

  // 4) 로그인 버튼 화면
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-logo">MentoAI</h1>
        <p className="auth-subtitle">
          AI와 함께 당신의 진로를 설계하고<br />
          맞춤형 활동을 추천받아 보세요.
        </p>
        <button className="google-login-button" onClick={handleGoogleLogin} disabled={isLoading}>
          {isLoading ? (
            <span>Google로 이동 중...</span>
          ) : (
            <>
              <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Google 계정으로 시작하기</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default AuthPage;