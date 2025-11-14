// src/pages/Auth.js
import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google'; 
import { useAuth } from '../contexts/AuthContext'; 
import './Page.css';

function AuthPage() {
  const auth = useAuth(); 
  
  // [수정] 2개의 state로 분리하여 UI 깨짐 방지
  // 1. isLoading: UI 구조(버튼 활성/비활성)를 제어 (Original 방식)
  const [isLoading, setIsLoading] = useState(false);
  // 2. loadingMessage: 로딩 중일 때 표시할 텍스트
  const [loadingMessage, setLoadingMessage] = useState('로그인 중...');

  const handleGoogleLogin = useGoogleLogin({
    // Google 로그인 성공 시 실행되는 함수
    onSuccess: async (tokenResponse) => {
      setIsLoading(true); // <--- 버튼 비활성화
      setLoadingMessage('Google 인증 완료. MentoAI 서버에 로그인합니다...');

      // [신규] 서버 응답이 8초 이상 늦어질 경우 안내 메시지 변경
      const timer = setTimeout(() => {
        setLoadingMessage('서버 응답을 기다리는 중입니다. (최대 1분 소요)');
      }, 8000); // 8초

      try {
        await auth.login(tokenResponse);
        clearTimeout(timer); // 성공 시 타이머 제거
        
        // (성공 시 AuthContext가 user 상태를 변경하고,
        //  App.js의 PublicRoute가 자동으로 리디렉션함)

      } catch (error) {
        clearTimeout(timer); // 실패 시 타이머 제거
        console.error("로그인 처리 중 에러 발생:", error);
        
        // [수정] 사용자에게 에러 메시지 표시
        if (error.code === 'ERR_NETWORK') {
          alert('로그인에 실패했습니다. (네트워크 오류 또는 CORS 설정 확인)');
        } else if (error.code === 'ECONNABORTED') {
          alert('로그인에 실패했습니다. (서버 응답 시간 초과)');
        } else {
          // (예: loginWithGoogle API failed)
          alert(`로그인에 실패했습니다. (${error.message})`);
        }
        
        setIsLoading(false); // <--- 버튼 다시 활성화
        setLoadingMessage('로그인 중...'); // <--- 메시지 리셋
      }
    },
    // Google 로그인 실패 시
    onError: (error) => {
      console.error('Google 로그인 실패:', error);
      alert('Google 로그인에 실패했습니다. 다시 시도해주세요.');
      setIsLoading(false); // <--- 버튼 다시 활성화
    },
  });

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
          onClick={() => !isLoading && handleGoogleLogin()} 
          disabled={isLoading} 
        >
          {/* [수정] UI 구조는 isLoading으로, 내용은 loadingMessage로 제어 */}
          {isLoading ? loadingMessage : ( 
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