// src/pages/OAuthCallback.js
import React, { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Page.css'; 
// [!!!] /auth/me API를 직접 호출하기 위해 import
import { checkCurrentUser } from '../api/api'; 

function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth(); // AuthContext에서 useCallback으로 고정된 함수
  
  const hasRunRef = useRef(false); // 무한 실행 방지

  useEffect(() => {
    // [!!!] async 함수로 변경
    const handleLoginCallback = async () => {
      if (hasRunRef.current) return;
      hasRunRef.current = true;

      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');

      // [!!!] 1. URL에 accessToken이 있는지 확인
      if (!accessToken) {
        alert('로그인에 실패했습니다. (URL에서 accessToken을 찾을 수 없음)');
        navigate('/login', { replace: true });
        return;
      }

      // [!!!] 2. 토큰 객체 구성 (user는 아직 모름)
      const tokenData = {
        accessToken: accessToken,
        refreshToken: refreshToken
      };

      // [!!!] 3. apiClient가 토큰을 인식하도록 (중요)
      // 우선 user: null 상태로 sessionStorage에 저장합니다.
      // (apiClient.js의 인터셉터가 이 'tokens'를 읽어갈 것입니다)
      sessionStorage.setItem('mentoUser', JSON.stringify({ user: null, tokens: tokenData }));

      try {
        // [!!!] 4. 저장된 토큰으로 /auth/me API를 호출하여 user 정보를 가져옵니다.
        const response = await checkCurrentUser(); 

        if (!response.success) {
          throw new Error(response.data?.message || "checkCurrentUser API 실패");
        }
        
        const user = response.data; // { userId, name, profileComplete, ... }

        // [!!!] 5. 완전한 authData 객체를 만들어 login() 호출
        const authData = {
          user: user,
          tokens: tokenData
        };
        
        login(authData); // (이제 App.js의 PublicRoute가 알아서 리디렉션함)

        // [!!!] (OAuthCallback.js에서는 navigate를 호출하지 않음)
      
      } catch (error) {
        console.error("OAuthCallback 처리 중 에러:", error);
        alert(`로그인 처리에 실패했습니다: ${error.message}`);
        sessionStorage.removeItem('mentoUser'); // 실패 시 저장했던 토큰 삭제
        navigate('/login', { replace: true });
      }
    };

    handleLoginCallback();
    
  }, [searchParams, navigate, login]); 

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