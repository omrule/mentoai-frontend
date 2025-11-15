// src/App.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/Auth'; // 3번에서 만들 로그인 페이지

// --- (가정) ---
// 이 아래 4개 컴포넌트는 이미 구현되어 있다고 가정합니다.
// (로그인과 관련 없으므로, 기존 코드를 그대로 사용하시면 됩니다.)
import Navbar from './components/Navbar';
import ActivityRecommender from './pages/ActivityRecommender';
import ProfileSetup from './pages/ProfileSetup';
import PromptInput from './pages/PromptInput'; 
// ---

/**
 * sessionStorage에서 토큰을 읽어 로그인 여부를 반환합니다.
 */
const isAuthenticated = () => {
  try {
    const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
    // accessToken이 있으면 로그인한 것으로 간주합니다.
    return !!storedUser?.tokens?.accessToken;
  } catch (e) {
    return false;
  }
};

/**
 * (가정) 로그인 후에 보여줄 메인 앱 컴포넌트입니다.
 * (이 부분은 기존 코드를 그대로 사용하세요.)
 */
const YourAppComponents = () => (
  <div className="App">
    <Navbar />
    <main className="content"> {/* 'content-full' 등 기존 로직이 있다면 그대로 사용하세요 */}
      <Routes>
        {/*          * (참고) 
         * 실제로는 이 안에도 PrivateRoute/ProfileSetupRoute가 필요하지만,
         * 지금은 '로그인' 기능 자체에만 집중하기 위해 단순화했습니다.
         * /profile-setup 리디렉션은 Auth.js에서 직접 처리합니다.
        */}
        <Route path="/recommend" element={<ActivityRecommender />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />
        <Route path="/prompt" element={<PromptInput />} />
        {/* ... (기존의 다른 라우트들) ... */}
        <Route path="*" element={<Navigate to="/recommend" replace />} />
      </Routes>
    </main>
  </div>
);

function App() {
  const isAuth = isAuthenticated();

  return (
    <Routes>
      <Route 
        path="/login"
        element={
          isAuth ? <Navigate to="/recommend" replace /> : <AuthPage />
        } 
      />
      <Route 
        path="/*"
        element={
          isAuth ? <YourAppComponents /> : <Navigate to="/login" replace />
        } 
      />
    </Routes>
  );
}

export default App;