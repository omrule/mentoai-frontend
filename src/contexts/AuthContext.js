// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios'; // [신규] Google userinfo API 호출용
import { 
  loginWithGoogle, 
  checkCurrentUser, 
  saveUserProfile, 
  logoutUser, 
  getUserProfile 
} from '../api/api'; 

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // [수정] login 함수: Google 토큰을 받아 Google API -> MentoAI API 순차 호출
  const login = async (googleTokenResponse) => {
    try {
      // 1. Google access_token으로 Google userinfo API 호출
      const googleUser = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${googleTokenResponse.access_token}` }
      });

      const { sub, email, name, picture } = googleUser.data;

      // 2. MentoAI 백엔드 (POST /users) API 호출
      const response = await loginWithGoogle({ 
        providerUserId: sub, // 'sub'이 Google의 고유 ID입니다.
        email: email,
        name: name,
        profileImageUrl: picture
      }); 
      
      if (response.success) {
        // 3. API가 반환한 AuthResponse (user + tokens)를 저장
        sessionStorage.setItem('mentoUser', JSON.stringify(response.data));
        
        // 4. 프로필 정보가 있는지 확인
        const profileResponse = await getUserProfile();
        const profileComplete = !profileResponse.isNewUser; 

        const finalUserData = {
          ...response.data,
          user: {
            ...response.data.user,
            profileComplete: profileComplete
          }
        };
        
        setUser(finalUserData);
        sessionStorage.setItem('mentoUser', JSON.stringify(finalUserData));

      } else {
        throw new Error("loginWithGoogle API failed");
      }
    } catch (error) {
      console.error("AuthContext login 실패:", error);
      sessionStorage.removeItem('mentoUser');
      throw error; // Auth.js가 catch할 수 있도록 에러 다시 던지기
    }
  };

  // 앱 로드 시, sessionStorage에 저장된 토큰으로 /auth/me 호출
  useEffect(() => {
    const verifyUser = async () => {
      const storedUserJSON = sessionStorage.getItem('mentoUser');
      
      if (storedUserJSON) {
        try {
          // 1. /auth/me API 호출 (apiClient가 헤더를 붙여줌)
          const response = await checkCurrentUser();
          
          if (response.success) {
            const basicUser = response.data;
            const storedUser = JSON.parse(storedUserJSON); // 기존 토큰 정보

            // 3. (중요) /profile API를 호출하여 '확장 프로필' 정보를 가져옴
            const profileResponse = await getUserProfile();
            
            const finalUserData = {
              user: { 
                ...basicUser, 
                profileComplete: profileResponse.success 
              },
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
  
  // [수정] completeProfile: API 호출 (saveUserProfile)
  const completeProfile = async (profileData) => {
    try {
      const response = await saveUserProfile(profileData); 
      if (response.success) {
        const updatedUser = {
          ...user,
          user: { // user 객체 내부를 업데이트
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
    <AuthContext.Provider value={{ user, login, logout, completeProfile, profileComplete: user?.user?.profileComplete }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};