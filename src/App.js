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
import OAuthCallback from './pages/OAuthCallback'; 

// 로그인한 사용자만 접근 가능한 페이지를 감싸는 컴포넌트
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>로딩 중...</div>; // 인증 상태 확인 중 로딩 스피너
  }

  if (!user) {
    // 로그인하지 않은 사용자는 로그인 페이지로 리디렉션
    return <Navigate to="/login" replace />;
  }

  if (user && !user.profileComplete) {
    // 로그인은 했지만 프로필 설정이 완료되지 않은 경우
    // 현재 경로가 /profile-setup이 아니라면 리디렉션
    return <Navigate to="/profile-setup" replace />;
  }
  
  // 로그인했고 프로필 설정도 완료한 사용자
  return children;
}

// 로그인하지 않은 사용자만 접근 가능한 페이지 (로그인, 회원가입)
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>로딩 중...</div>;
  }

  if (user && user.profileComplete) {
    // [수정] 이미 로그인한 사용자는 /prompt 대신 /recommend로 이동
    return <Navigate to="/recommend" replace />;
  }

  if (user && !user.profileComplete) {
      // 로그인은 했지만 프로필 설정이 완료되지 않은 경우
    return <Navigate to="/profile-setup" replace />;
  }

  // 로그인하지 않은 사용자
  return children;
}

// 프로필 설정 전용 라우트
function ProfileSetupRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>로딩 중...</div>;
  }

  if (!user) {
    // 로그인하지 않은 사용자는 로그인 페이지로 리디렉션
    return <Navigate to="/login" replace />;
  }

  if (user && user.profileComplete) {
    // [수정] 이미 프로필 설정을 완료했다면 /prompt 대신 /recommend로 리디렉션
    return <Navigate to="/recommend" replace />;
  }
  
  // 로그인했고 프로필 설정이 필요한 사용자
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

  // [수정] 콜백 경로에서도 Navbar 숨김
  const showNavbar = user && user.profileComplete && 
                     location.pathname !== '/login' && 
                     location.pathname !== '/profile-setup' && 
                     location.pathname !== '/oauth/callback';
  
  const appClassName = showNavbar ? "App" : "App-unauthed";

  return (
    <div className={appClassName}>
      {showNavbar && <Navbar />}
      
      <main className={showNavbar ? "content" : "content-full"}>
        <Routes>
          {/* 1. 로그인/프로필 설정/콜백 경로 */}
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

          {/* [신규] 백엔드가 리디렉션할 콜백 경로. */}
          <Route path="/oauth/callback" element={<OAuthCallback />} />


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
              // [수정] 기본 경로도 /prompt 대신 /recommend로
              (user.profileComplete ? <Navigate to="/recommend" /> : <Navigate to="/profile-setup" />) : 
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