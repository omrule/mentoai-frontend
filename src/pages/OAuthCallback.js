import React, { useEffect } from 'react'; // useEffect는 반드시 필요합니다.
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Page.css'; // 로딩 스피너 등을 위한 CSS

function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auth = useAuth();

  // [!!! 핵심 수정 !!!]
  // 'if'문 밖, 컴포넌트 최상단에 단 하나의 useEffect만 사용합니다.
  // 모든 로직은 이 useEffect 안에서 처리합니다.
  useEffect(() => {
    
    // 1. (레이스 컨디션 방지) 
    //    URL 파싱이 덜 끝나서 쿼리 파라미터가 비어있으면,
    //    아무것도 하지 않고 다음 렌더링을 기다립니다.
    if (searchParams.toString() === '') {
      return; 
    }

    // 2. (이제 searchParams가 준비됨) 토큰을 추출합니다.
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

  // 3. 의존성 배열에 searchParams.toString()을 넣어,
  //    내용이 바뀔 때마다 이 useEffect가 다시 실행되도록 보장합니다.
  }, [searchParams, navigate, auth]); 
  // ↑↑↑
  // ESLint가 경고할 수 있으나, 이 방식이 searchParams의
  // 내용 변경을 감지하는 가장 확실한 방법입니다.
  // [searchParams, navigate, auth]로 해도 동작해야 합니다.

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