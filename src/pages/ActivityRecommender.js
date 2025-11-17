// src/pages/ActivityRecommender.js

import React, { useState, useEffect } from 'react'; // [수정] useState, useEffect 임포트
import './Page.css';
import apiClient from '../api/apiClient'; // [신규] apiClient 임포트

// [신규] sessionStorage에서 userId를 가져오는 헬퍼 (MyPage.js와 동일)
const getUserIdFromStorage = () => {
  try {
    const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
    return storedUser ? storedUser.user.userId : null;
  } catch (e) {
    return null;
  }
};


function ActivityRecommender() {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(null);
  // [신규] 사용자 점수를 저장할 state (초기값 null)
  const [userScore, setUserScore] = useState(null);

  // [신규] 페이지 로드 시 활동 목록을 가져오는 로직
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // GET /activities API 호출 (기본 파라미터 사용)
        const response = await apiClient.get('/activities', {
          params: {
            page: 1,
            size: 20,
            sort: 'createdAt,desc'
          }
        });
        
        if (response.data && response.data.items) {
          setActivities(response.data.items);
          // 첫 번째 활동을 기본 선택
          if (response.data.items.length > 0) {
            setActiveTab(response.data.items[0].activityId);
          }
        }
      } catch (error) {
        console.error("활동 목록 로딩 실패:", error);
        // 에러 시 빈 배열로 설정
        setActivities([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, []); // 페이지가 처음 로드될 때 1회 실행

  const selectedActivity = activities.find(act => act.activityId === activeTab);

  return (
    <div className="page-container">
      {/* <h2> 태그 삭제됨 */}
      {/* <p> 태그 삭제됨 */}
      
      {/* 사용자 현재 점수 표시 카드 */}
      <div style={{
        padding: '20px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        marginBottom: '0', // [수정] UI 스크롤 문제 해결 (40px -> 20px)
        textAlign: 'center'
      }}>
        <h3 style={{ margin: '0', color: '#343a40', fontSize: '1.25rem' }}>
          {/* [수정] userScore state와 연동, 로딩 중일 땐 '...' 표시 */}
          현재 점수는 
          <span style={{ color: '#007bff', fontSize: '1.5em', fontWeight: 'bold' }}>
            {userScore === null ? '...' : `${userScore}점`}
          </span> 
          입니다.
        </h3>
        <p style={{ margin: '10px 0 0', color: '#495057', fontSize: '1rem' }}>
          아래 '추천 항목'을 확인하고 목표 달성을 시작해 보세요!
        </p>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>활동 목록을 불러오는 중...</div>
      ) : (
        <div className="recommender-layout">
          <div className="task-list-card">
            <h4>활동 목록</h4>
            <ul>
              {activities.map(activity => (
                <li
                  key={activity.activityId}
                  className={activeTab === activity.activityId ? 'active' : ''}
                  onClick={() => setActiveTab(activity.activityId)}
                >
                  {activity.title}
                </li>
              ))}
            </ul>
          </div>

          {selectedActivity && (
            <div className="activity-detail-card">
              <h3>{selectedActivity.title}</h3>
              
              {selectedActivity.summary && (
                <div className="activity-section">
                  <h4>요약</h4>
                  <p>{selectedActivity.summary}</p>
                </div>
              )}
              
              {selectedActivity.content && (
                <div className="activity-section">
                  <h4>상세 내용</h4>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{selectedActivity.content}</p>
                </div>
              )}
              
              {selectedActivity.organizer && (
                <div className="activity-section">
                  <h4>주최</h4>
                  <p>{selectedActivity.organizer}</p>
                </div>
              )}
              
              {selectedActivity.location && (
                <div className="activity-section">
                  <h4>장소</h4>
                  <p>{selectedActivity.location}</p>
                </div>
              )}
              
              {selectedActivity.url && (
                <div className="activity-links">
                  <a href={selectedActivity.url} target="_blank" rel="noopener noreferrer">
                    <button>상세 페이지</button>
                  </a>
                </div>
              )}
              
              {selectedActivity.tags && selectedActivity.tags.length > 0 && (
                <div className="activity-section">
                  <h4>태그</h4>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {selectedActivity.tags.map((tag, idx) => (
                      <span 
                        key={idx} 
                        style={{
                          padding: '4px 12px',
                          backgroundColor: '#e7f3ff',
                          color: '#007bff',
                          borderRadius: '12px',
                          fontSize: '14px'
                        }}
                      >
                        {typeof tag === 'string' ? tag : tag.tagName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ActivityRecommender;