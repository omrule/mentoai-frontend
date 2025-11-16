// src/pages/Auth.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Page.css';

const API_BASE_URL = 'http://localhost:8080';

function AuthPage() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // 1) 로그인 상태 확인 (/auth/me) — Authorization 헤더 사용
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;

        const response = await axios.get(`${API_BASE_URL}/auth/me`, { headers });
        const data = response.data;
        const user = data?.user;

        if (user) {
          sessionStorage.setItem('mentoUser', JSON.stringify(data));
          const profileComplete = user.profileComplete;
          const destination = profileComplete ? '/recommend' : '/profile-setup';
          navigate(destination, { replace: true });
          return;
        }
      } catch (error) {
        console.error('GET /auth/me failed:', error);
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
    const loginUrl = `${API_BASE_URL}/auth/google/start?redirectUri=${encodeURIComponent(redirectUri)}`;
    window.location.href = loginUrl;
  };

  if (isChecking) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-logo">MentoAI</h1>
          <p className="auth-subtitle">Checking sign-in status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-logo">MentoAI</h1>
        <p className="auth-subtitle">
          Plan your career with AI and get personalized activity recommendations.
        </p>
        <button className="google-login-button" onClick={handleGoogleLogin} disabled={isLoading}>
          {isLoading ? <>Redirecting to Google...</> : <>Sign in with Google</>}
        </button>
      </div>
    </div>
  );
}

export default AuthPage;