import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import AuthPage from './pages/Auth';
import ProfileSetup from './pages/ProfileSetup';
import PromptInput from './pages/PromptInput';
import ActivityRecommender from './pages/ActivityRecommender';
import ScheduleCalendar from './pages/ScheduleCalendar';
import MyPage from './pages/MyPage';
import { useAuth } from './contexts/AuthContext';
import './App.css';
// [삭제] import OAuthCallback from './pages/OAuthCallback'; 

// 로그인한 사용자만 접근 가능한 페이지를 감싸는 컴포넌트
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>로딩 중...</div>; 
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // [수정] AuthResponse 스키마에 따라 경로 변경
  if (user && !user.user.profileComplete) {
    return <Navigate to="/profile-setup" replace />;
  }
  
  return children;
}

// 로그인하지 않은 사용자만 접근 가능한 페이지 (로그인, 회원가입)
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>로딩 중...</div>;
  }

  // [수정] AuthResponse 스키마에 따라 경로 변경
  if (user && user.user.profileComplete) {
    return <Navigate to="/recommend" replace />;
  }

  // [수정] AuthResponse 스키마에 따라 경로 변경
  if (user && !user.user.profileComplete) {
    return <Navigate to="/profile-setup" replace />;
  }

  return children;
}

// 프로필 설정 전용 라우트
function ProfileSetupRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>로딩 중...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // [수정] AuthResponse 스키마에 따라 경로 변경
  if (user && user.user.profileComplete) {
    return <Navigate to="/recommend" replace />;
  }
  
  return children;
}


function App() {
  const { user, loading } = useAuth();
  const location = useLocation(); 

  if (loading) {
    return (
      <div className="auth-container">
        <div>로딩 중...</div>
      </div>
    );
  }

  // [수정] AuthResponse 스키마에 따라 경로 변경
  const showNavbar = user && user.user.profileComplete && 
                     location.pathname !== '/login' && 
                     location.pathname !== '/profile-setup';
                     // [삭제] /oauth/callback 경로 삭제
  
  const appClassName = showNavbar ? "App" : "App-unauthed";

  const getContentClass = () => {
    if (!showNavbar) {
      return "content-full"; 
    }
    if (location.pathname === '/prompt') {
      return "content-chat"; 
    }
    return "content";
  };

  return (
    <div className={appClassName}>
      {showNavbar && <Navbar />}
      
      <main className={getContentClass()}>
        <Routes>
          {/* 1. 로그인/프로필 설정 경로 */}
          <Route path="/login" element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          } />
          <Route path="/profile-setup" element={
            <ProfileSetupRoute>
              <ProfileSetup />
            </ProfileSetupRoute>
          } />

          {/* [삭제] /oauth/callback 경로 삭제 */}


          {/* 2. 메인 서비스 경로 */}
          <Route path="/recommend" element={
            <PrivateRoute>
              <ActivityRecommender />
            </PrivateRoute>
          } />
          <Route path="/prompt" element={
            <PrivateRoute>
              <PromptInput />
            </PrivateRoute>
          } />
          <Route path="/schedule" element={
            <PrivateRoute>
              <ScheduleCalendar />
            </PrivateRoute>
          } />
          <Route path="/mypage" element={
            <PrivateRoute>
              <MyPage />
            </PrivateRoute>
          } />

          {/* 3. 기본 경로 리디렉션 */}
          <Route path="/" element={
            user ? 
              // [수정] AuthResponse 스키마에 따라 경로 변경
              (user.user.profileComplete ? <Navigate to="/recommend" /> : <Navigate to="/profile-setup" />) : 
              <Navigate to="/login" />
          } />

          {/* 4. 일치하는 경로가 없는 경우 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;