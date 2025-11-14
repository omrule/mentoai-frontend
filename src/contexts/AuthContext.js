import React, { createContext, useState, useContext, useEffect } from 'react';
// [수정] getUserProfile도 임포트합니다.
import { 
  checkCurrentUser, 
  saveUserProfile, 
  logoutUser, 
  refreshAccessToken, 
  getUserProfile 
} from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // login 함수는 이전 수정본과 동일 (정상)
  const login = (userData) => {
    if (!userData.expiresAt) {
      console.warn("expiresAt이 userData에 없습니다. 임시로 1시간을 설정합니다.");
      userData.expiresAt = new Date().getTime() + 3600 * 1000;
    }

    try {
      setUser(userData);
      sessionStorage.setItem('mentoUser', JSON.stringify(userData));
    } catch (error) {
      console.error("로그인 데이터 저장 실패:", error);
      sessionStorage.removeItem('mentoUser');
    }
  };

  // [!!! 핵심 수정: useEffect !!!]
  // 앱 로드 시, 기본 정보와 프로필 정보를 모두 가져오도록 수정
  useEffect(() => {
    const verifyUser = async () => {
      const storedUserJSON = sessionStorage.getItem('mentoUser');
      let tokenData = null; // 토큰 정보만 담을 변수
      
      if (storedUserJSON) {
        try {
          const storedUser = JSON.parse(storedUserJSON);
          
          // 1. 토큰 갱신 로직 (동일)
          if (storedUser.expiresAt && new Date().getTime() > storedUser.expiresAt) {
            console.log("액세스 토큰 만료. 갱신 시도...");
            const refreshResponse = await refreshAccessToken(); 
            
            if (refreshResponse.success) {
              const { accessToken, refreshToken, expiresIn } = refreshResponse.data;
              tokenData = {
                ...storedUser,
                accessToken: accessToken,
                refreshToken: refreshToken, 
                expiresAt: new Date().getTime() + parseInt(expiresIn) * 1000
              };
              sessionStorage.setItem('mentoUser', JSON.stringify(tokenData));
            } else {
              throw new Error("Token refresh failed");
            }
          } else {
            tokenData = storedUser;
          }

          // [수정됨]
          // 2. 기본 정보와 프로필 정보를 *동시에* 병렬로 요청
          const [userResponse, profileResponse] = await Promise.all([
            checkCurrentUser(), // GET /users/{userId}
            getUserProfile()    // GET /users/{userId}/profile
          ]);
          
          if (userResponse.success && profileResponse.success) {
            // 3. 세 가지 정보를 모두 합침
            // (토큰 정보, 기본 유저 정보, 프로필 정보)
            const finalUserData = {
              ...tokenData,        // accessToken, refreshToken, expiresAt 등
              ...userResponse.data,  // name, email 등 기본 정보
              ...profileResponse.data // profileComplete, interests 등 프로필 정보
            };
            setUser(finalUserData);
            sessionStorage.setItem('mentoUser', JSON.stringify(finalUserData));
          } else {
            // 둘 중 하나라도 실패하면 로그인 실패 처리
            throw new Error("Failed to fetch user or profile data");
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
      const response = await saveUserProfile(profileData); 
      if (response.success) {
        // [수정] 
        // 프로필 저장 후, 백엔드가 반환한 최신 프로필 정보(response.data)와
        // 기존 유저 정보(user)를 합침
        const updatedUser = {
          ...user,
          ...response.data, // 백엔드가 UserProfile 스키마 반환
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

  // 로그아웃 함수 (동일)
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