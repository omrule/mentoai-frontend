// src/pages/Auth.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google'; // (기존)
import axios from 'axios';
import './Page.css';

const API_BASE_URL = 'https://mentoai.onrender.com';
// [신규] 백엔드에 등록된 리디렉션 URI (Google 콘솔의 그 주소)
const GOOGLE_REDIRECT_URI = 'https://mentoai.onrender.com/auth/google/callback';

/**
 * [수정] 백엔드 '인가 코드' 전달 API를 호출하는 함수
 * (엔드포인트는 백엔드와 협의 필요. 예: POST /auth/google/login)
 */
const loginToBackendWithCode = async (code) => {
  try {
    // [수정] 백엔드는 이 코드를 받아서 구글과 통신 후,
    // 자체 JWT(user, tokens)를 반환해야 합니다.
    const response = await axios.post(`${API_BASE_URL}/auth/google/login`, {
      code: code,
      // redirectUri: GOOGLE_REDIRECT_URI // 백엔드에 따라 이 값이 필요할 수 있음
    }, {
      timeout: 60000 
    });
    
    return { success: true, data: response.data };

  } catch (error) {
    console.error("POST /auth/google/login 로그인 실패:", error);
    const message = error.response?.data?.message || error.message;
    throw new Error(message);
  }
};


function AuthPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('로그인 중...');

  /**
   * [수정] Google 로그인 버튼 클릭 시 실행되는 메인 함수
   */
  const handleGoogleLogin = useGoogleLogin({
    // [!!!] 1. 'auth-code' 플로우로 변경
    flow: 'auth-code', 
    
    // [!!!] 2. Google이 인가 코드를 이 주소로 보내줌
    // (이 주소는 Google 콘솔 '승인된 리디렉션 URI'에 등록되어 있어야 함)
    // 하지만, 라이브러리 버그나 로직상 이 값 대신
    // 백엔드 엔드포인트를 직접 호출하는 것이 더 명확할 수 있습니다.
    // 우선 onSuccess에서 코드를 받아 백엔드로 넘기는 로직에 집중합니다.
    
    // 3. Google 로그인 팝업 성공 (인가 코드를 받음)
    onSuccess: async (codeResponse) => {
      setIsLoading(true);
      setLoadingMessage('Google 인증 완료. MentoAI 서버에 로그인합니다...');

      const timer = setTimeout(() => {
        setLoadingMessage('서버 응답을 기다리는 중입니다. (최대 1분 소요)');
      }, 8000);

      try {
        // [!!!] 4. 받은 'code'를 백엔드로 전송
        // codeResponse 객체에 'code'가 들어 있습니다.
        const { code } = codeResponse;

        // [!!!] 5. 백엔드 API 호출 (userinfo를 직접 호출하는 대신)
        const response = await loginToBackendWithCode(code);
        
        clearTimeout(timer); 

        // 6. 로그인 성공: { user, tokens }를 sessionStorage에 저장
        sessionStorage.setItem('mentoUser', JSON.stringify(response.data));

        // 7. 프로필 작성 여부에 따라 페이지 이동
        const profileComplete = response.data.user.profileComplete;
        const destination = profileComplete ? '/recommend' : '/profile-setup';
        
        window.location.href = destination;
        
      } catch (error) {
        // 8. 모든 과정 중 실패 시
        clearTimeout(timer);
        console.error("로그인 처리 중 에러 발생:", error);
        
        const alertMessage = error.message || "알 수 없는 오류";
        
        // [중요] 이 에러는 여전히 CORS 문제일 수 있습니다.
        if (error.code === 'ERR_NETWORK' || alertMessage.includes('Network Error')) {
          alert('로그인에 실패했습니다. (Network Error / CORS 오류). 백엔드 서버가 Vercel 주소를 허용하는지 확인하세요.');
        } else if (error.code === 'ECONNABORTED') {
          alert('로그인에 실패했습니다. (서버 응답 시간 초과)');
        } else {
          alert(`로그인에 실패했습니다. (${alertMessage})`);
        }
        
        setIsLoading(false); 
        setLoadingMessage('로그인 중...');
      }
    },
    // Google 로그인 팝업창 닫기 등 실패 시
    onError: (error) => {
      console.error('Google 로그인 실패:', error);
      setIsLoading(false);
    },
  });

  // (JSX는 기존과 동일)
  return (
    <div className="auth-container">
      {/* ... (이하 동일) ... */}
      <button 
        className="google-login-button" 
        onClick={() => !isLoading && handleGoogleLogin()} 
        disabled={isLoading} 
      >
      {/* ... (이하 동일) ... */}
      </button>
    </div>
  );
}

export default AuthPage;