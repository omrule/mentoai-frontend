// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
// [수정] refreshAccessToken 임포트
import { checkCurrentUser, saveUserProfile, logoutUser, refreshAccessToken } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // [수정] login 함수: 토큰을 받아 저장하고 유저 정보를 불러옴
  const login = async (tokenData) => {
    // 1. 토큰(accessToken, refreshToken, expiresAt)을 sessionStorage에 저장
    // (OAuthCallback.js에서 expiresAt을 계산해서 넘겨줘야 함)
    const partialData = {
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresAt: tokenData.expiresAt 
    };
    sessionStorage.setItem('mentoUser', JSON.stringify(partialData));

    try {
      // 2. /auth/me API를 호출하여 이 토큰에 해당하는 '유저 정보'를 가져옴
      // (이때 authApi.js가 헤더를 붙여서 보냄)
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
        // 토큰은 받았는데 /auth/me가 실패? (이론상 401은 안 떠야 함)
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
      let finalTokenData = null; // /auth/me를 호출할 때 사용할 토큰 정보
      
      if (storedUserJSON) {
        try {
          const storedUser = JSON.parse(storedUserJSON);
          
          // 1. 토큰 만료 시간 체크
          if (storedUser.expiresAt && new Date().getTime() > storedUser.expiresAt) {
            console.log("액세스 토큰 만료. 갱신 시도...");
            const refreshResponse = await refreshAccessToken(); // 갱신 API 호출
            
            if (refreshResponse.success) {
              const { accessToken, refreshToken, expiresIn } = refreshResponse.data;
              finalTokenData = {
                ...storedUser,
                accessToken: accessToken,
                refreshToken: refreshToken, // 새 리프레시 토큰으로 갱신
                expiresAt: new Date().getTime() + parseInt(expiresIn) * 1000
              };
              sessionStorage.setItem('mentoUser', JSON.stringify(finalTokenData));
            } else {
              // 갱신 실패 (리프레시 토큰도 만료됨)
              throw new Error("Token refresh failed");
            }
          } else {
            // 토큰 유효함
            finalTokenData = storedUser;
          }

          // 2. 유효한 토큰으로 /auth/me API 호출
          // (authApi가 finalTokenData를 sessionStorage에서 읽어서 헤더에 붙임)
          const response = await checkCurrentUser();
          
          if (response.success) {
            // /auth/me로 받은 최신 유저 정보와 토큰 정보를 합쳐서 상태 업데이트
            const finalUserData = {
              ...finalTokenData, // 갱신됐거나, 원래 유효했던 토큰
              ...response.data // 최신 유저 정보
            };
            setUser(finalUserData);
            sessionStorage.setItem('mentoUser', JSON.stringify(finalUserData));
          } else {
            // 401 오류 (토큰이 유효하지 않음)
            throw new Error("Invalid token");
          }
        } catch (error) {
          // 토큰 갱신 실패 또는 /auth/me 401 오류
          console.warn("verifyUser 실패:", error.message);
          setUser(null);
          sessionStorage.removeItem('mentoUser');
        }
      }
      setLoading(false); // 로딩 완료
    };
    
    verifyUser();
  }, []);
  
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
    try {
      // 로그아웃 API 호출 (authApi가 헤더를 붙여줌)
      await logoutUser(); 
    } catch (error) {
      console.error("백엔드 로그아웃 실패:", error);
    } finally {
      // API 호출 성공 여부와 관계없이 프론트에서는 무조건 로그아웃 처리
      setUser(null);
      sessionStorage.removeItem('mentoUser');
    }
  };

  if (loading) {
    return <div>Loading...</div>; // 앱 로딩 중 (사용자 인증 확인 중)
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