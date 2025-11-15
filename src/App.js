// src/App.js
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

// [!!!] B안(서버 흐름)을 위해 OAuthCallback 컴포넌트를 임포트합니다.
import OAuthCallback from './pages/OAuthCallback'; 

// (PrivateRoute, PublicRoute, ProfileSetupRoute는 기존 코드와 동일)
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) { return <div>로딩 중...</div>; }
  if (!user) { return <Navigate to="/login" replace />; }
  if (user && !user.user.profileComplete) {
    return <Navigate to="/profile-setup" replace />;
  }
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) { return <div>로딩 중...</div>; }
  if (user && user.user.profileComplete) {
    return <Navigate to="/recommend" replace />;
  }
  if (user && !user.user.profileComplete) {
    return <Navigate to="/profile-setup" replace />;
  }
  return children;
}

function ProfileSetupRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) { return <div>로딩 중...</div>; }
  if (!user) { return <Navigate to="/login" replace />; }
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

  const showNavbar = user && user.user.profileComplete && 
                     location.pathname !== '/login' && 
                     location.pathname !== '/profile-setup' &&
                     // [!!!] B안(서버 흐름)을 위해 /oauth/callback 경로를 추가합니다.
                     location.pathname !== '/oauth/callback';
  
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

          {/* [!!!] B안(서버 흐름)을 위한 콜백 라우트를 추가합니다. */}
          <Route path="/oauth/callback" element={
            <PublicRoute>
              <OAuthCallback />
            </PublicRoute>
        } />


          {/* 2. 메인 서비스 경로 (기존과 동일) */}
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

          {/* 3. 기본 경로 리디렉션 (기존과 동일) */}
          <Route path="/" element={
            user ? 
              (user.user.profileComplete ? <Navigate to="/recommend" /> : <Navigate to="/profile-setup" />) : 
              <Navigate to="/login" />
          } />

          {/* 4. 일치하는 경로가 없는 경우 (기존과 동일) */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;