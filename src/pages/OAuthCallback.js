// src/pages/OAuthCallback.js
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Page.css'; // 로딩 스피너 등을 위한 CSS

function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auth = useAuth();

  useEffect(() => {
    // 1. 백엔드가 URL 쿼리 파라미터로 넘겨준 정보들을 추출합니다.
    // (주의: 이 키(Key) 이름들은 백엔드 개발자와 일치해야 합니다!)
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const userId = searchParams.get('userId');
    const name = searchParams.get('name');
    const isNewUser = searchParams.get('isNewUser') === 'true'; // 문자열 'true'를 boolean으로
    const profileComplete = searchParams.get('profileComplete') === 'true';

    // 2. 토큰과 유저 ID가 정상적으로 넘어왔는지 확인
    if (accessToken && userId) {
      
      // 3. AuthContext에 저장할 사용자 객체 생성
      const userData = {
        userId: userId,
        name: name,
        isNewUser: isNewUser,
        profileComplete: profileComplete,
        accessToken: accessToken,
        refreshToken: refreshToken
      };

      // 4. AuthContext의 login 함수를 호출해 상태 및 세션 스토리지에 저장
      auth.login(userData);

      // 5. 사용자를 적절한 페이지로 이동
      if (!profileComplete) {
        navigate('/profile-setup', { replace: true });
      } else {
        navigate('/prompt', { replace: true });
      }
      
    } else {
      // 백엔드로부터 토큰을 받지 못한 경우
      alert('로그인에 실패했습니다. (토큰 수신 오류)');
      navigate('/login', { replace: true });
    }

  }, [searchParams, navigate, auth]);

  // 이 페이지는 사용자에게 잠깐 보입니다.
  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* [수정] 멘토아이 -> MentoAI */}
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