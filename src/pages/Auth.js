// src/pages/Auth.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient'; // MentoAI 백엔드 요청용
// [수정] Page.css 대신 Auth.module.css를 import
import styles from './Auth.module.css';

function AuthPage() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // 1) 로그인 상태 확인 (토큰이 있으면 /auth/me 호출하여 최신 사용자 정보 확인)
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        // sessionStorage에서 인증 정보 확인
        const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
        const accessToken = storedUser?.tokens?.accessToken;
        
        // 토큰이 없으면 로그인 화면 표시
        if (!accessToken) {
          setIsChecking(false);
          return;
        }
        
        // 토큰이 있으면 /auth/me 호출하여 최신 사용자 정보 가져오기
        const response = await apiClient.get('/auth/me'); 
        const data = response.data;
        const user = data?.user;

        // 사용자 정보를 sessionStorage에 업데이트
        if (data) {
          const updatedAuthData = {
            tokens: storedUser.tokens,  // 기존 토큰 유지
            user: data.user             // 최신 사용자 정보로 업데이트
          };
          sessionStorage.setItem('mentoUser', JSON.stringify(updatedAuthData));
        }

        if (user) {
          // 이미 로그인된 상태이므로 적절한 페이지로 리다이렉트
          const profileComplete = user.profileComplete || false;
          const destination = profileComplete ? '/recommend' : '/profile-setup';
          navigate(destination, { replace: true });
          return;
        }
        
        // 사용자 정보가 없는 경우 로그인 화면 표시
        setIsChecking(false);
      } catch (error) {
        // API 호출 실패 시 (토큰 만료 등) 로그인 화면 표시
        console.error('로그인 상태 확인 실패:', error.message);
        setIsChecking(false);
      }
    };
    
    checkLoginStatus();
  }, [navigate]);

  const handleGoogleLogin = () => {
    if (isLoading) return;
    setIsLoading(true);
    const redirectUri = `${window.location.origin}/oauth/callback`;
    const loginUrl = `${apiClient.defaults.baseURL}/auth/google/start?redirectUri=${encodeURIComponent(redirectUri)}`;
    window.location.href = loginUrl;
  };

  // 3) 로딩 화면 (isChecking)
  if (isChecking) {
    return (
      // [수정] className 적용
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <h1 className={styles.authLogo}>MentoAI</h1>
          <p className={styles.authSubtitle}>로그인 상태를 확인 중입니다...</p>
        </div>
      </div>
    );
  }

  // 4) 로그인 버튼 화면
  return (
    // [수정] className 적용
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h1 className={styles.authLogo}>MentoAI</h1>
        {/* [수정] className 적용 */}
        <p className={styles.authSubtitle}>
          AI와 함께 당신의 진로를 설계하고<br />
          맞춤형 활동을 추천받아 보세요.
        </p>
        {/* [수정] className 적용 */}
        <button className={styles.googleLoginButton} onClick={handleGoogleLogin} disabled={isLoading}>
          {isLoading ? (
            <span>Google로 이동 중...</span>
          ) : (
            <>
              {/* [수정] className 적용 */}
              <svg className={styles.googleIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
