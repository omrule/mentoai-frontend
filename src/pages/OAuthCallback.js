import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Page.css'; // 로딩 스피너 등을 위한 CSS

function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auth = useAuth();

  useEffect(() => {
    
    // 1. (레이스 컨디션 방지) 
    //    1차 렌더링: searchParams.toString() === '' 이므로 return.
    if (searchParams.toString() === '') {
      return; 
    }

    // 2. (URL 파싱 완료 후 2차 렌더링)
    //    이 코드가 실행됩니다.
    const accessToken = searchParams.get('accessToken');
    const userId = searchParams.get('userId');

    if (accessToken && userId) {
      // [정상 경로] 토큰과 ID가 모두 있음
      const refreshToken = searchParams.get('refreshToken');
      const name = searchParams.get('name');
      const isNewUser = searchParams.get('isNewUser') === 'true'; 
      const profileComplete = searchParams.get('profileComplete') === 'true';

      const userData = {
        userId: userId,
        name: name,
        isNewUser: isNewUser,
        profileComplete: profileComplete,
        accessToken: accessToken,
        refreshToken: refreshToken
      };
      
      auth.login(userData);

      if (!profileComplete) {
        navigate('/profile-setup', { replace: true });
      } else {
        navigate('/prompt', { replace: true });
      }
      
  } else if (accessToken && !userId) {
    // [백엔드 오류] accessToken은 있으나 userId가 없음
    alert('[프론트엔드 감지] 백엔드가 accessToken은 보냈으나, userId를 누락했습니다.');
    navigate('/login', { replace: true });

  } else if (!accessToken) {
    // [토큰 수신 오류] accessToken 자체가 없음
    alert('로그인에 실패했습니다. (토큰 수신 오류)');
    navigate('/login', { replace: true });
  }

  // 3. 의존성 배열에 searchParams.toString()을 넣습니다.
  }, [searchParams.toString(), navigate, auth]); 

  // 로딩 스피너를 보여줍니다.
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