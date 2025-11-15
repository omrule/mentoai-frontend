// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
// [!!!] axios와 loginWithGoogle은 B안의 login()에서 더 이상 필요 없습니다.
// import axios from 'axios'; 
import { 
  // loginWithGoogle, // (삭제됨)
  checkCurrentUser, 
  saveUserProfile, 
  logoutUser, 
  getUserProfile 
} from '../api/api'; 

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // [!!!] B안(서버 흐름)을 위한 새 'login' 함수
  // OAuthCallback.js가 이 함수를 호출합니다.
  const login = (authData) => {
    // authData = { user: { userId, name, profileComplete, ... }, tokens: { accessToken, refreshToken } }
    // (OAuthCallback.js에서 만든 객체 형식에 맞춰야 합니다)
    try {
      // 백엔드가 리디렉션으로 전달해준 토큰과 유저 정보를
      // 그대로 sessionStorage와 state에 저장합니다.
      sessionStorage.setItem('mentoUser', JSON.stringify(authData));
      setUser(authData);

    } catch (error) {
      console.error("AuthContext login (B안) 실패:", error);
      sessionStorage.removeItem('mentoUser');
      throw error;
    }
  };

  // [!!!] 이 함수는 A안, B안 공통으로 중요합니다. (수정 불필요, 이전 수정안 유지)
  // 앱 로드 시, sessionStorage에 저장된 토큰으로 /auth/me 호출
  useEffect(() => {
    const verifyUser = async () => {
      const storedUserJSON = sessionStorage.getItem('mentoUser');
      
      if (storedUserJSON) {
        try {
          // 1. /auth/me API 호출 (apiClient가 헤더를 붙여줌)
          const response = await checkCurrentUser();
          
          if (response.success) {
            const basicUser = response.data; // (user 객체에 profileComplete가 포함되어 있음)
            const storedUser = JSON.parse(storedUserJSON); // 기존 토큰 정보

            const finalUserData = {
              user: basicUser, // /auth/me에서 받은 최신 user 객체
              tokens: storedUser.tokens // 기존 토큰
            };

            setUser(finalUserData);
            sessionStorage.setItem('mentoUser', JSON.stringify(finalUserData));
          } else {
            throw new Error("Invalid token");
          }
        } catch (error) {
          console.warn("verifyUser 실패:", error.message);
          setUser(null);
          sessionStorage.removeItem('mentoUser');
        }
      }
      setLoading(false); // 로딩 완료
    };
    
    verifyUser();
  }, []);
  
  // (이하 completeProfile, logout 함수는 기존 코드와 동일)

  const completeProfile = async (profileData) => {
    try {
      const response = await saveUserProfile(profileData); 
      if (response.success) {
        const updatedUser = {
          ...user,
          user: { 
            ...user.user,
            profileComplete: true 
          }
        };
        setUser(updatedUser);
        sessionStorage.setItem('mentoUser', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error("프로필 저장 실패:", error);
      alert("프로필 저장에 실패했습니다.");
    }
  };

  const logout = async () => {
    try {
      await logoutUser(); 
    } catch (error) {
      console.error("백엔드 로그아웃 실패:", error);
    } finally {
      setUser(null);
      sessionStorage.removeItem('mentoUser');
    }
  };

  if (loading) {
    return <div>Loading...</div>; 
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, completeProfile, profileComplete: user?.user?.profileComplete }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};