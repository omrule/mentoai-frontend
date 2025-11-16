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

        // 2) 임시 데이터 생성 (user는 아직 null)
        const tempAuthData = {
          tokens: { accessToken, refreshToken, tokenType, expiresIn },
          user: null
        };
        sessionStorage.setItem('mentoUser', JSON.stringify(tempAuthData));
        
        // 3) URL에서 토큰 정보 제거 (보안)
        window.history.replaceState(null, '', window.location.pathname);

        // 4) /auth/me API 호출 (apiClient가 임시 토큰 사용)
        setMessage('사용자 정보를 가져오는 중...');
        const meResponse = await apiClient.get('/auth/me'); 
        
        // 5) [!!!] [수정] 덮어쓰지 않고, 기존 tokens와 새 user 정보를 합칩니다.
        const finalAuthData = {
          tokens: tempAuthData.tokens,      // <-- 2단계에서 저장한 토큰
          user: meResponse.data.user      // <-- 4단계에서 받은 사용자 정보
        };
        
        // 6) [!!!] 완전한 { user, tokens } 객체를 sessionStorage에 저장
        sessionStorage.setItem('mentoUser', JSON.stringify(finalAuthData));

        // 7) 프로필 완성 여부에 따라 최종 목적지로 이동
        const profileComplete = meResponse.data.user?.profileComplete;
        const destination = profileComplete ? '/recommend' : '/profile-setup';
        
        // App.js가 새 정보를 읽도록 새로고침
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
      <div className_user="auth-card">
        <h1 className="auth-logo">MentoAI</h1>
        <p className="auth-subtitle">{message}</p>
        <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #007bff', borderRadius: '50%', margin: '20px auto', animation: 'spin 1s linear infinite' }}></div>
      </div>
    </div>
  );
}