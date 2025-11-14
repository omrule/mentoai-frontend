import React, { useEffect } from 'react'; // [!!!] useState는 이제 필요 없습니다.
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Page.css'; 

function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // [!!!] AuthContext.js가 useMemo로 'login' 함수를 고정시켰으므로
  //       이 'login'은 더 이상 무한 루프를 유발하지 않습니다.
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
      
      // 이 로직은 이제 단 한 번만 안전하게 실행됩니다.
    	login(userData);

    	if (!profileComplete) {
      	navigate('/profile-setup', { replace: true });
    	} else {
      	navigate('/prompt', { replace: true });
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

  }, [searchParams.toString(), navigate, login]); // 'hasRun' 제거

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

export default OAuthCallback;