// src/pages/Auth.js
import React, { useState } from 'react';
// [!!!] useGoogleLogin은 B안(서버 흐름)에서 더 이상 사용하지 않습니다.
// import { useGoogleLogin } from '@react-oauth/google';
// import { useAuth } from '../contexts/AuthContext'; // B안에서는 login()을 직접 호출하지 않음
import './Page.css';

// [!!!] 백엔드 팀원에게 이 주소가 맞는지 꼭 확인하세요.
// 예: 'https://mentoai.onrender.com/api/v1/auth/google'
// 예: 'https://mentoai.onrender.com/oauth2/authorization/google'
// 팀원이 말한 '/auth/google/start'를 기반으로 URL을 구성합니다.
const BACKEND_GOOGLE_LOGIN_URL = 'https://mentoai.onrender.com/auth/google/start'; // <--- 팀원의 확인 필요

function AuthPage() {
  const [isLoading, setIsLoading] = useState(false); 

  const handleBackendLogin = () => {
    setIsLoading(true);
    // 백엔드 로그인 URL로 브라우저를 리디렉션시킵니다.
    // 백엔드가 Google 로그인 처리 후, /oauth/callback으로 다시 리디렉션시킵니다.
    window.location.href = BACKEND_GOOGLE_LOGIN_URL;
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-logo">MentoAI</h1>
        <p className="auth-subtitle">
          AI와 함께 당신의 진로를 설계하고<br />
          맞춤형 활동을 추천받아 보세요.
        </p>
        
        <button 
          className="google-login-button" 
          onClick={() => !isLoading && handleBackendLogin()} 
          disabled={isLoading} 
        >
          {isLoading ? '로그인 페이지로 이동 중...' : ( 
            <>
              <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google 계정으로 시작하기
            </>
          )}
        </button>

        <p className="auth-helper-text">
          계속 진행하면 MentoAI의 서비스 이용약관 및<br/>개인정보 처리방침에 동의하는 것으로 간주됩니다.
        </p>
      </div>
    </div>
  );
}

export default AuthPage;