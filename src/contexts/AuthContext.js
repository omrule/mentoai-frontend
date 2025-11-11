// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { checkCurrentUser, saveUserProfile, logoutUser } from '../api/authApi';
// [수정] apiClient 임포트 제거 (ESLint 오류 방지)

// AuthContext 생성
const AuthContext = createContext(null);

// AuthProvider 컴포넌트
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // 로딩 상태는 '최초 인증 확인'용으로 사용

  // 컴포넌트 마운트 시, 백엔드에 '이미 로그인되어 있는지' 확인 (GET /auth/me)
  useEffect(() => {
    const verifyUser = async () => {
      // [수정] sessionStorage 확인 로직 제거
      //       -> /auth/me API 호출로 인증을 통일 (더욱 확실한 방법)
      
      // 백엔드 /auth/me 엔드포인트에 현재 사용자 정보 요청
      const response = await checkCurrentUser();
      if (response.success) {
        // AuthResponse 스키마에 따라 유저 정보와 토큰을 분리
        const userData = {
          ...response.data.user,
          accessToken: response.data.tokens.accessToken, // AuthResponse 스키마 참고
          refreshToken: response.data.tokens.refreshToken, // AuthResponse 스키마 참고
          profileComplete: response.data.user.profileComplete 
        };
        
        setUser(userData);
        sessionStorage.setItem('mentoUser', JSON.stringify(userData));
      } else {
        // /auth/me 실패 시 (로그인 안 됨)
        setUser(null);
        sessionStorage.removeItem('mentoUser');
      }
      
      setLoading(false); // 로딩 완료
    };
    
    verifyUser();
  }, []);

  // [신규] OAuthCallback 페이지가 호출할 login 함수
  // 이 함수는 API를 호출하지 않고, 전달받은 데이터를 상태에 저장합니다.
  const login = (userData) => {
    setUser(userData);
    sessionStorage.setItem('mentoUser', JSON.stringify(userData));
  };
  
  // 프로필 설정 완료 함수
  const completeProfile = async (profileData) => {
    try {
      const response = await saveUserProfile(profileData); 
      if (response.success) {
        const updatedUser = {
          ...user,
          ...response.data, // 백엔드로부터 받은 프로필 정보로 업데이트
          profileComplete: true // 프로필 설정 완료
        };
        setUser(updatedUser);
        sessionStorage.setItem('mentoUser', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error("프로필 저장 실패:", error);
    }
  };

  // 로그아웃 함수
  const logout = async () => {
    await logoutUser(); // 백엔드 /auth/logout 호출
    setUser(null);
    sessionStorage.removeItem('mentoUser');
  };

  if (loading) {
    return <div>Loading...</div>; // 앱 로딩 중 (사용자 인증 확인 중)
  }

  return (
    // [수정] value에 'login' 함수 추가
    <AuthContext.Provider value={{ user, login, logout, completeProfile, profileComplete: user?.profileComplete }}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuth 커스텀 훅
export const useAuth = () => {
  return useContext(AuthContext);
};