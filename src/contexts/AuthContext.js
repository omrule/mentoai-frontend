// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
// [수정] loginWithGoogle 대신 checkCurrentUser, logoutUser 임포트
import { checkCurrentUser, saveUserProfile, logoutUser } from '../api/authApi';
import apiClient from '../api/apiClient'; // apiClient 임포트

// AuthContext 생성
const AuthContext = createContext(null);

// AuthProvider 컴포넌트
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // 로딩 상태는 '최초 인증 확인'용으로 사용

  // [수정]
  // 컴포넌트 마운트 시, 백엔드에 '이미 로그인되어 있는지' 확인 (GET /auth/me)
  useEffect(() => {
    const verifyUser = async () => {
      // (선택사항) sessionStorage에 저장된 토큰이 있다면 먼저 확인
      const storedUser = sessionStorage.getItem('mentoUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setLoading(false);
      } else {
        // [신규] 백엔드 /auth/me 엔드포인트에 현재 사용자 정보 요청
        const response = await checkCurrentUser();
        if (response.success) {
          // [신규] AuthResponse 스키마에 따라 유저 정보와 토큰을 분리
          // (백엔드가 user, tokens 객체를 준다고 가정)
          const userData = {
            ...response.data.user,
            accessToken: response.data.tokens.accessToken, // AuthResponse 스키마 참고
            profileComplete: response.data.user.profileComplete // (백엔드가 이걸 준다고 가정)
          };
          
          setUser(userData);
          sessionStorage.setItem('mentoUser', JSON.stringify(userData));
        } else {
          // /auth/me 실패 시 (로그인 안 됨)
          setUser(null);
          sessionStorage.removeItem('mentoUser');
        }
      }
      setLoading(false); // 로딩 완료
    };
    
    verifyUser();
  }, []);

  // [삭제] login 함수 (더 이상 프론트가 직접 로그인 처리 안 함)
  
  // 프로필 설정 완료 함수
  const completeProfile = async (profileData) => {
    try {
      // [수정] saveUserProfile이 이제 토큰을 자동으로 헤더에 담아 전송
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

  // [수정] 로그아웃 함수
  const logout = async () => {
    await logoutUser(); // 백엔드 /auth/logout 호출
    setUser(null);
    sessionStorage.removeItem('mentoUser');
    // (선택) 쿠키를 수동으로 삭제해야 할 수도 있음
  };

  if (loading) {
    return <div>Loading...</div>; // 앱 로딩 중 (사용자 인증 확인 중)
  }

  return (
    <AuthContext.Provider value={{ user, logout, completeProfile, profileComplete: user?.profileComplete }}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuth 커스텀 훅
export const useAuth = () => {
  return useContext(AuthContext);
};