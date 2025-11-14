import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Page.css'; // 로딩 스피너 등을 위한 CSS

function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auth = useAuth();

  useEffect(() => {
    
    // [!!! 배포 확인용 테스트 코드 !!!]
    // Vercel이 이 새 코드를 실행했는지 확인하기 위해
    // 무조건 이 alert 창을 띄웁니다.
    alert('--- [새로운 코드 배포 성공!] ---');

    
    // --- (이하 모든 기존 로직을 임시 주석 처리) ---
    /*
    if (searchParams.toString() === '') {
      return; 
    }

    const accessToken = searchParams.get('accessToken');
    const userId = searchParams.get('userId');

    if (accessToken && userId) {
      // ... (login logic) ...
    } else if (accessToken && !userId) {
      alert('[프론트엔드 감지] 백엔드가 accessToken은 보냈으나, userId를 누락했습니다.');
      navigate('/login', { replace: true });
    } else if (!accessToken) {
      alert('로그인에 실패했습니다. (토큰 수신 오류)');
      navigate('/login', { replace: true });
    }
    */

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