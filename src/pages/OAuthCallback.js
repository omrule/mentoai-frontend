// src/pages/OAuthCallback.js
import React, { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Page.css'; 
import { checkCurrentUser } from '../api/api'; 

function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth(); // AuthContext에서 useCallback으로 고정된 함수
  
  const hasRunRef = useRef(false); // 로직이 1번만 실행되도록 보장

  useEffect(() => {
    // [!!!] 1. URL에서 accessToken을 먼저 가져옵니다.
    const accessToken = searchParams.get('accessToken');

    // [!!!] 2. 아직 searchParams가 파싱되지 않았거나(accessToken is null),
    //          이미 로직이 실행되었다면(hasRunRef is true), 즉시 중단합니다.
    if (!accessToken || hasRunRef.current) {
      return; 
    }
    
    // [!!!] 3. 로직을 "지금" 실행합니다. (플래그를 true로 설정)
    hasRunRef.current = true;
    const refreshToken = searchParams.get('refreshToken');

    // async 즉시 실행 함수로 로직을 감쌉니다.
    const handleLoginCallback = async () => {
      // 4. 토큰 객체 구성
      const tokenData = {
        accessToken: accessToken,
        refreshToken: refreshToken
      };

      // 5. apiClient가 토큰을 인식하도록 sessionStorage에 임시 저장
      sessionStorage.setItem('mentoUser', JSON.stringify({ user: null, tokens: tokenData }));

      try {
        // 6. 저장된 토큰으로 /auth/me API를 호출하여 user 정보를 가져옵니다.
        const response = await checkCurrentUser(); 

        if (!response.success) {
          throw new Error(response.data?.message || "checkCurrentUser API 실패");
        }
        
        const user = response.data; // { userId, name, profileComplete, ... }

        // 7. 완전한 authData 객체를 만들어 login() 호출
        const authData = {
          user: user,
          tokens: tokenData
        };
        
        login(authData); // (이제 App.js의 PublicRoute가 알아서 리디렉션함)
      
      } catch (error) {
        console.error("OAuthCallback 처리 중 에러:", error);
        alert(`로그인 처리에 실패했습니다: ${error.message}`);
        sessionStorage.removeItem('mentoUser'); // 실패 시 저장했던 토큰 삭제
        navigate('/login', { replace: true });
      }
    };

    handleLoginCallback();
    
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