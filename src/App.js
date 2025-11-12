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
    return <Navigate to="/login" replace />;
  }

  if (user && !user.profileComplete) {
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

  if (user && user.profileComplete) {
    return <Navigate to="/recommend" replace />;
  }

  if (user && !user.profileComplete) {
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

  if (user && user.profileComplete) {
    return <Navigate to="/recommend" replace />;
  }
  
  return children;
}


function App() {
  const { user, loading } = useAuth();
  const location = useLocation(); // 현재 경로를 알기 위해 useLocation 사용

  if (loading) {
    return (
      <div className="auth-container">
        <div>로딩 중...</div>
      </div>
    );
  }

  const showNavbar = user && user.profileComplete && 
                     location.pathname !== '/login' && 
                     location.pathname !== '/profile-setup' && 
                     location.pathname !== '/oauth/callback';
  
  const appClassName = showNavbar ? "App" : "App-unauthed";

  // [신규] main 태그의 클래스를 동적으로 결정하는 함수
  const getContentClass = () => {
    if (!showNavbar) {
      return "content-full"; // 로그인/프로필 페이지 (패딩 0)
    }
    // [신규] /prompt (채팅) 페이지일 경우 패딩이 없는 chat 클래스 적용
    if (location.pathname === '/prompt') {
      return "content-chat"; 
    }
    // 나머지 모든 페이지는 기본 content 클래스 적용 (패딩 30px)
    return "content";
  };

  return (
    <div className={appClassName}>
      {showNavbar && <Navbar />}
      
      {/* [수정] className을 동적으로 할당 */}
      <main className={getContentClass()}>
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