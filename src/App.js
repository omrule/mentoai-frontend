import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AuthPage from './pages/Auth'; 

// --- (가정) 이 컴포넌트들은 이미 존재한다고 가정합니다 ---
import Navbar from './components/Navbar';
import ActivityRecommender from './pages/ActivityRecommender';
import ProfileSetup from './pages/ProfileSetup';
import PromptInput from './pages/PromptInput';
import ScheduleCalendar from './pages/ScheduleCalendar';
import MyPage from './pages/MyPage';
import OAuthCallback from './pages/OAuthCallback';
import './App.css'; 
// ---

/**
 * sessionStorage에서 인증 정보를 읽어옵니다.
 */
const getAuthInfo = () => {
  try {
    const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
    if (storedUser && storedUser.tokens?.accessToken && storedUser.user) {
      return {
        isAuthenticated: true,
        profileComplete: storedUser.user.profileComplete || false
      };
    }
  } catch (e) { /* 파싱 실패 시 무시 */ }
  return { isAuthenticated: false, profileComplete: false };
};

/**
 * 로그인한 사용자만 접근 가능한 라우트
 */
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, profileComplete } = getAuthInfo();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!profileComplete) {
    return <Navigate to="/profile-setup" replace />;
  }
  return children;
};

/**
 * 프로필 설정 페이지만을 위한 라우트
 */
const ProfileSetupRoute = ({ children }) => {
  const { isAuthenticated, profileComplete } = getAuthInfo();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (profileComplete) {
    return <Navigate to="/recommend" replace />;
  }
  return children;
};

/**
 * 로그인 안 한 사용자만 접근 가능한 라우트
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = getAuthInfo();
  if (isAuthenticated) {
    return <Navigate to="/recommend" replace />;
  }
  return children;
};

// --- 메인 App 컴포넌트 ---
function App() {
  const location = useLocation();
  const { isAuthenticated, profileComplete } = getAuthInfo();

  const showNavbar = isAuthenticated && profileComplete;
  
  const appClassName = showNavbar ? "App" : "App-unauthed";
  const getContentClass = () => {
    if (!showNavbar) { return "content-full"; }
    if (location.pathname === '/prompt') { return "content-chat"; }
    return "content";
  };

  return (
    <div className={appClassName}>
      {showNavbar && <Navbar />}
      <main className={getContentClass()}>
        <Routes>
          {/* 1. 로그인/프로필 경로 */}
          <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
          <Route path="/profile-setup" element={<ProfileSetupRoute><ProfileSetup /></ProfileSetupRoute>} />
          
          {/* 2. 메인 서비스 경로 */}
          <Route path="/recommend" element={<PrivateRoute><ActivityRecommender /></PrivateRoute>} />
          <Route path="/prompt" element={<PrivateRoute><PromptInput /></PrivateRoute>} />
          <Route path="/schedule" element={<PrivateRoute><ScheduleCalendar /></PrivateRoute>} />
          <Route path="/mypage" element={<PrivateRoute><MyPage /></PrivateRoute>} />

          {/* 3. 기본 경로 리디렉션 */}
          <Route path="/" element={<Navigate to={isAuthenticated ? "/recommend" : "/login"} replace />} />
          <Route path="*" element={<Navigate to="/" />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;