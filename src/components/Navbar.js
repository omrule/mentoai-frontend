// src/components/Navbar.js
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { useAuth } from '../contexts/AuthContext'; 

function Navbar() {
  const { logout } = useAuth(); 
  const navigate = useNavigate();

  // [수정] handleLogout을 async 함수로 변경
  const handleLogout = async () => {
    await logout(); // 백엔드 API가 호출될 때까지 기다림
    navigate('/login'); 
  };

  return (
    <nav className="navbar">
      <div>
        <div className="navbar-logo">
          <NavLink to="/prompt">멘토아이</NavLink>
        </div>
        <ul className="navbar-menu">
          {/* (메뉴 항목은 이전과 동일...) */}
          <li>
            <NavLink to="/recommend" className={({ isActive }) => (isActive ? 'active' : '')}>
              📚 활동 추천 목록
            </NavLink>
          </li>
          <li>
            <NavLink to="/prompt" className={({ isActive }) => (isActive ? 'active' : '')}>
              ✨ 진로설계 AI
            </NavLink>
          </li>
          <li>
            <NavLink to="/schedule" className={({ isActive }) => (isActive ? 'active' : '')}>
              📅 활동 캘린더
            </NavLink>
          </li>
          <li>
            <NavLink to="/mypage" className={({ isActive }) => (isActive ? 'active' : '')}>
              👤 마이페이지
            </NavLink>
          </li>
        </ul>
      </div>
      <div className="navbar-footer">
        <button onClick={handleLogout} className="logout-button">
          로그아웃
        </button>
      </div>
    </nav>
  );
}

export default Navbar;