// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react'; // useCallback 임포트
import { 
  checkCurrentUser, 
  saveUserProfile, 
  logoutUser, 
  getUserProfile 
} from '../api/api'; 

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // [!!!] useCallback으로 감싸서 함수가 재생성되는 것을 방지 (무한 루프 해결)
  const login = useCallback((authData) => {
    try {
      sessionStorage.setItem('mentoUser', JSON.stringify(authData));
      setUser(authData);
    } catch (error) {
      console.error("AuthContext login 실패:", error);
      sessionStorage.removeItem('mentoUser');
      throw error;
    }
  }, []); // 종속성 배열이 비어있음

  // (verifyUser 로직은 기존과 동일)
  useEffect(() => {
    const verifyUser = async () => {
      const storedUserJSON = sessionStorage.getItem('mentoUser');
      
      if (storedUserJSON) {
        try {
          const response = await checkCurrentUser();
          if (response.success) {
            const basicUser = response.data; 
            const storedUser = JSON.parse(storedUserJSON); 

            const finalUserData = {
              user: basicUser, 
              tokens: storedUser.tokens 
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
      setLoading(false); 
    };
    
    verifyUser();
  }, []); 
  
  // [!!!] completeProfile도 useCallback으로 감싸줍니다.
  const completeProfile = useCallback(async (profileData) => {
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
  }, [user]); // 'user' state를 참조하므로 종속성 배열에 'user' 추가

  // [!!!] logout도 useCallback으로 감싸줍니다.
  const logout = useCallback(async () => {
    try {
      await logoutUser(); 
    } catch (error) {
      console.error("백엔드 로그아웃 실패:", error);
    } finally {
      setUser(null);
      sessionStorage.removeItem('mentoUser');
    }
  }, []); // 종속성 배열이 비어있음

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