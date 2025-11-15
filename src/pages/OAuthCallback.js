// src/pages/OAuthCallback.js
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Page.css'; 

function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    // (레이스 컨디션 방지)
    if (searchParams.toString() === '') {
      return; 
    }

    const accessToken = searchParams.get('accessToken');
    const userId = searchParams.get('userId');

    if (accessToken && userId) {
      const refreshToken = searchParams.get('refreshToken');
      const name = searchParams.get('name');
      // [!!!] 백엔드에서 profileComplete를 boolean이 아닌 문자열로 주는지 확인
      const profileComplete = searchParams.get('profileComplete') === 'true';

      // [!!!] AuthContext.js의 login()이 기대하는 중첩 구조로 수정
      const authData = {
        user: {
          userId: userId,
          name: name,
          profileComplete: profileComplete
          // (백엔드가 /auth/me와 동일한 user 객체를 준다면 더 좋습니다)
        },
        tokens: {
          accessToken: accessToken,
          refreshToken: refreshToken
        }
      };
      
      login(authData);

      if (!profileComplete) {
        navigate('/profile-setup', { replace: true });
      } else {
        // [수정] A안의 잔재인 /prompt가 아닌, B안의 기본 페이지 /recommend로 이동
        navigate('/recommend', { replace: true });
      }
      
  } else {
      // (백엔드가 userId나 accessToken을 주지 않은 경우)
      if (accessToken && !userId) {
        alert('[프론트엔드 감지] 백엔드가 accessToken은 보냈으나, userId를 누락했습니다.');
      } else if (!accessToken) {
        alert('로그인에 실패했습니다. (토큰 수신 오류)');
      }
      navigate('/login', { replace: true });
  }

  // [!!!] 종속성 배열을 searchParams 객체 자체로 변경 (더 안정적)
  }, [searchParams, navigate, login]); 

  // 로딩 스피너
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

// [!!!] 이 부분이 누락되어 컴파일 에러가 발생했습니다.
export default OAuthCallback;