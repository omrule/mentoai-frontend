// src/pages/OAuthCallback.js

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('로그인 처리 중...');

  useEffect(() => {
    const completeLogin = async () => {
      try {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('accessToken');
        const refreshToken = params.get('refreshToken');
        const tokenType = params.get('tokenType') || 'Bearer';
        const expiresIn = params.get('expiresIn') || '0';

        if (!accessToken) {
          throw new Error("URL에서 Access Token을 찾을 수 없습니다.");
        }

        const tempAuthData = {
          tokens: { accessToken, refreshToken, tokenType, expiresIn },
          user: null
        };
        sessionStorage.setItem('mentoUser', JSON.stringify(tempAuthData));

        window.history.replaceState(null, '', window.location.pathname);

        setMessage('사용자 정보를 가져오는 중...');
        const meResponse = await apiClient.get('/auth/me');

        const userWithProfileComplete = {
          ...meResponse.data.user,
          profileComplete: meResponse.data.profileComplete
        };
        const finalAuthData = {
          tokens: tempAuthData.tokens,
          user: userWithProfileComplete
        };

        sessionStorage.setItem('mentoUser', JSON.stringify(finalAuthData));

        const profileComplete = meResponse.data?.profileComplete;
        const destination = profileComplete ? '/recommend' : '/profile-setup';

        window.location.href = destination;

      } catch (err) {
        console.error('OAuth 콜백 처리 중 오류:', err);
        setError(`로그인에 실패했습니다: ${err.message}. 잠시 후 다시 시도하세요.`);
        sessionStorage.removeItem('mentoUser');
      }
    };

    completeLogin();
  }, []);

  // 인라인 스타일 정의 (CSS 파일 캐싱 문제 해결을 위해 직접 주입)
  const containerStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    zIndex: 9999,
  };

  const logoStyle = {
    fontSize: '48px',
    fontWeight: '900',
    background: 'linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '24px',
    letterSpacing: '-1px',
  };

  const textStyle = {
    fontSize: '17px',
    color: '#5f6368',
    fontWeight: '500',
    marginBottom: '40px',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  };

  // 스피너 스타일 및 애니메이션
  const spinnerStyle = `
    @keyframes spin-inline { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .spinner-inline {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(26, 115, 232, 0.1);
      border-radius: 50%;
      border-top-color: #1a73e8;
      animation: spin-inline 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
    }
  `;

  if (error) {
    return (
      <div style={containerStyle}>
        <h1 style={{ ...logoStyle, background: 'none', WebkitTextFillColor: '#dc3545', color: '#dc3545' }}>Error</h1>
        <p style={{ ...textStyle, color: '#dc3545' }}>{error}</p>
        <button 
          onClick={() => window.location.href = '/login'}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '600',
            backgroundColor: '#ffffff',
            color: '#3c4043',
            border: '1px solid #dadce0',
            borderRadius: '40px',
            cursor: 'pointer'
          }}
        >
          로그인 페이지로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <style>{spinnerStyle}</style>
      <h1 style={logoStyle}>MentoAI</h1>
      <p style={textStyle}>{message}</p>
      <div className="spinner-inline"></div>
    </div>
  );
}
