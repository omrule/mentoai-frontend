// src/pages/OAuthCallback.js
import React, { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom'; // useNavigate는 에러 시에만 사용
import { useAuth } from '../contexts/AuthContext';
import './Page.css'; 

function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth(); // AuthContext에서 useCallback으로 고정된 함수
  
  // useEffect가 여러 번 실행되는 것을 방지하는 안전장치
  const hasRunRef = useRef(false);

  useEffect(() => {
    // 이미 실행됐으면 즉시 중단
    if (hasRunRef.current) {
      return; 
    }
    hasRunRef.current = true; // 실행 플래그 설정

    const accessToken = searchParams.get('accessToken');
    const userId = searchParams.get('userId');

    if (accessToken && userId) {
      // 백엔드에서 받은 토큰과 정보 파싱
      const refreshToken = searchParams.get('refreshToken');
      const name = searchParams.get('name');
      const profileComplete = searchParams.get('profileComplete') === 'true';

      const authData = {
        user: {
          userId: userId,
          name: name,
          profileComplete: profileComplete
        },
        tokens: {
          accessToken: accessToken,
          refreshToken: refreshToken
        }
      };
      
      // [!!!] 'login'만 호출하고 즉시 종료합니다. (가장 중요)
      // state 업데이트가 App.js의 PublicRoute를 트리거하여
      // 올바른 페이지로 '자동으로' 리디렉션시킬 것입니다.
      login(authData);

      // [!!!] 이 navigate 로직이 PublicRoute와 충돌하여 무한 루프를 일으켰습니다.
      // (모두 제거)
      
  } else {
      // (토큰 수신 오류 시에만 navigate 사용)
      alert('로그인에 실패했습니다. (URL에서 토큰을 찾을 수 없음)');
      navigate('/login', { replace: true });
  }

  }, [searchParams, navigate, login]); // 종속성은 그대로 둠

  // 로딩 스피너 (PublicRoute가 리디렉션할 때까지 잠시 표시됨)
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-logo">MentoAI</h1>
        <div className="loading-container" style={{ padding: '40px 0' }}>
          <div className="spinner"></div>
          <p>로그인 정보를 처리 중입니다. 잠시만 기다려주세요...</p>
        </div>
      </div>
    </div>
  );
}

export default OAuthCallback;