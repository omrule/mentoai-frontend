// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
// [수정] 임포트 경로 변경 및 refreshAccessToken 임포트
import { checkCurrentUser, saveUserProfile, logoutUser, refreshAccessToken } from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // [수정] login 함수: 토큰을 받아 저장하고 유저 정보를 불러옴
  const login = async (tokenData) => {
    // 1. 토큰(accessToken, refreshToken, expiresAt)을 sessionStorage에 저장
    const partialData = {
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresAt: tokenData.expiresAt 
    };
    sessionStorage.setItem('mentoUser', JSON.stringify(partialData));

    try {
      // 2. /auth/me API를 호출하여 이 토큰에 해당하는 '유저 정보'를 가져옴
      const response = await checkCurrentUser();
      
      if (response.success) {
        // 3. 유저 정보와 토큰 정보를 합쳐서 최종 상태로 저장
        const finalUserData = {
          ...partialData, // 토큰
          ...response.data // 유저 정보 (profileComplete 포함)
        };
        setUser(finalUserData);
        sessionStorage.setItem('mentoUser', JSON.stringify(finalUserData));
      } else {
        throw new Error("/auth/me 호출 실패");
      }
    } catch (error) {
      console.error("로그인 후 유저 정보 가져오기 실패:", error);
      sessionStorage.removeItem('mentoUser');
    }
  };

  // [수정] 앱 로드 시, sessionStorage에 저장된 토큰으로 /auth/me 호출
  useEffect(() => {
    const verifyUser = async () => {
      const storedUserJSON = sessionStorage.getItem('mentoUser');
      let finalTokenData = null; 
      
      if (storedUserJSON) {
        try {
          const storedUser = JSON.parse(storedUserJSON);
          
          if (storedUser.expiresAt && new Date().getTime() > storedUser.expiresAt) {
            console.log("액세스 토큰 만료. 갱신 시도...");
            const refreshResponse = await refreshAccessToken(); 
            
            if (refreshResponse.success) {
              const { accessToken, refreshToken, expiresIn } = refreshResponse.data;
              finalTokenData = {
                ...storedUser,
                accessToken: accessToken,
                refreshToken: refreshToken, 
                expiresAt: new Date().getTime() + parseInt(expiresIn) * 1000
              };
              sessionStorage.setItem('mentoUser', JSON.stringify(finalTokenData));
            } else {
              throw new Error("Token refresh failed");
            }
          } else {
            finalTokenData = storedUser;
          }

          const response = await checkCurrentUser();
          
          if (response.success) {
            const finalUserData = {
              ...finalTokenData, 
              ...response.data 
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
  
  // [수정] completeProfile: API 호출 (saveUserProfile)
  const completeProfile = async (profileData) => {
    try {
      // profileData는 이미 ProfileSetup에서 API 스키마에 맞게 포맷팅됨
      const response = await saveUserProfile(profileData); 
      if (response.success) {
        // API가 반환한 최신 유저 프로필(response.data)로 user 상태 업데이트
        const updatedUser = {
          ...user,
          ...response.data, // (백엔드가 UserProfile 스키마 반환)
          profileComplete: true 
        };
        setUser(updatedUser);
        sessionStorage.setItem('mentoUser', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error("프로필 저장 실패:", error);
      alert("프로필 저장에 실패했습니다."); // 사용자에게 피드백
    }
  };

  // 로그아웃 함수
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
    <AuthContext.Provider value={{ user, login, logout, completeProfile, profileComplete: user?.profileComplete }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};