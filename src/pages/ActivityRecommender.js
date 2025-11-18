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
  const [roleFitData, setRoleFitData] = useState(null);
  const [improvements, setImprovements] = useState([]);

  // sessionStorage에서 목표 직무 가져오기 (프로필 API에서 가져온 정보 사용)
  const getCareerGoalFromStorage = async (userId) => {
    try {
      // sessionStorage에서 먼저 확인
      const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
      console.log('[ActivityRecommender] sessionStorage 전체 데이터:', storedUser);
      console.log('[ActivityRecommender] storedUser?.user:', storedUser?.user);
      console.log('[ActivityRecommender] storedUser?.user?.interestDomains:', storedUser?.user?.interestDomains);
      
      if (storedUser?.user?.interestDomains?.[0]) {
        console.log('[ActivityRecommender] ✅ sessionStorage에서 목표 직무 발견:', storedUser.user.interestDomains[0]);
        return storedUser.user.interestDomains[0];
      }
      
      // 없으면 프로필 API 호출
      if (userId) {
        console.log('[ActivityRecommender] 프로필 API 호출하여 목표 직무 가져오기');
        const profileResponse = await apiClient.get(`/users/${userId}/profile`);
        console.log('[ActivityRecommender] 프로필 API 응답:', profileResponse.data);
        console.log('[ActivityRecommender] 프로필 API interestDomains:', profileResponse.data?.interestDomains);
        
        if (profileResponse.data?.interestDomains?.[0]) {
          console.log('[ActivityRecommender] ✅ 프로필 API에서 목표 직무 발견:', profileResponse.data.interestDomains[0]);
          return profileResponse.data.interestDomains[0];
        }
      }
      
      console.warn('[ActivityRecommender] ⚠️ 목표 직무를 찾을 수 없습니다.');
      return null;
    } catch (e) {
      console.error('[ActivityRecommender] 목표 직무 가져오기 실패:', e);
      return null;
    }
  };

  // [신규] 페이지 로드 시 활동 목록과 점수를 가져오는 로직
  useEffect(() => {
    const fetchData = async () => {
      const userId = getUserIdFromStorage();
      if (!userId) {
        console.warn('[ActivityRecommender] userId가 없습니다.');
        setIsLoading(false);
        return;
      }

      // 1. 활동 목록 가져오기 (독립적으로 처리 - 실패해도 점수 계산은 계속)
      try {
        console.log('[ActivityRecommender] ===== 활동 목록 조회 시작 =====');
        const activitiesResponse = await apiClient.get('/activities', {
          params: {
            page: 1,
            size: 20,
            sort: 'createdAt,desc'
          }
        });
        
        console.log('[ActivityRecommender] GET /activities 응답:', activitiesResponse.data);
        
        if (activitiesResponse.data && activitiesResponse.data.items) {
          setActivities(activitiesResponse.data.items);
          if (activitiesResponse.data.items.length > 0) {
            setActiveTab(activitiesResponse.data.items[0].activityId);
          }
        }
      } catch (activitiesError) {
        console.error('[ActivityRecommender] 활동 목록 조회 실패:', activitiesError);
        console.error('[ActivityRecommender] 에러 응답:', activitiesError.response?.data);
        console.error('[ActivityRecommender] 에러 상태:', activitiesError.response?.status);
        // 활동 목록 실패해도 점수 계산은 계속 진행
        setActivities([]);
      }

      // 2. 목표 직무 가져오기 및 점수 계산 (독립적으로 처리)
      try {
        const careerGoal = await getCareerGoalFromStorage(userId);
        if (!careerGoal) {
          console.log('[ActivityRecommender] 목표 직무가 없어 점수 계산을 건너뜁니다.');
          setIsLoading(false);
          return;
        }

        // 3. RoleFitScore 계산
        console.log('[ActivityRecommender] ===== RoleFitScore 계산 시작 =====');
        console.log('[ActivityRecommender] POST /users/{userId}/role-fit');
        console.log('[ActivityRecommender] 요청 URL:', `${apiClient.defaults.baseURL}/users/${userId}/role-fit`);
        console.log('[ActivityRecommender] 목표 직무 (target):', careerGoal);
        
        const roleFitRequestBody = {
          target: careerGoal,
          topNImprovements: 5
        };
        
        console.log('[ActivityRecommender] 요청 본문 (requestBody):', roleFitRequestBody);

        const roleFitResponse = await apiClient.post(
          `/users/${userId}/role-fit`,
          roleFitRequestBody
        );

        console.log('[ActivityRecommender] ===== RoleFitScore 계산 완료 =====');
        console.log('[ActivityRecommender] 전체 응답:', roleFitResponse.data);
        console.log('[ActivityRecommender] RoleFitScore:', roleFitResponse.data?.roleFitScore);
        console.log('[ActivityRecommender] Breakdown:', roleFitResponse.data?.breakdown);
        console.log('[ActivityRecommender] Missing Skills:', roleFitResponse.data?.missingSkills);
        console.log('[ActivityRecommender] Recommendations:', roleFitResponse.data?.recommendations);

        if (roleFitResponse.data) {
          setUserScore(roleFitResponse.data.roleFitScore);
          setRoleFitData(roleFitResponse.data);
        }

        // 4. 개선 제안 가져오기
        if (roleFitResponse.data?.target) {
          console.log('[ActivityRecommender] ===== 개선 제안 조회 시작 =====');
          console.log('[ActivityRecommender] GET /users/{userId}/improvements');
          console.log('[ActivityRecommender] 요청 URL:', `${apiClient.defaults.baseURL}/users/${userId}/improvements?roleId=${roleFitResponse.data.target}&size=10`);
          
          try {
            const improvementsResponse = await apiClient.get(
              `/users/${userId}/improvements`,
              {
                params: {
                  roleId: roleFitResponse.data.target,
                  size: 10
                }
              }
            );

            console.log('[ActivityRecommender] ===== 개선 제안 조회 완료 =====');
            console.log('[ActivityRecommender] 개선 제안 개수:', improvementsResponse.data?.length);
            console.log('[ActivityRecommender] 개선 제안 목록:', improvementsResponse.data);

            if (improvementsResponse.data) {
              setImprovements(improvementsResponse.data);
            }
          } catch (improvementsError) {
            console.error('[ActivityRecommender] 개선 제안 조회 실패:', improvementsError);
            console.error('[ActivityRecommender] 개선 제안 에러 응답:', improvementsError.response?.data);
          }
        }
      } catch (roleFitError) {
        console.error('[ActivityRecommender] RoleFitScore 계산 실패:', roleFitError);
        console.error('[ActivityRecommender] 에러 응답:', roleFitError.response?.data);
        console.error('[ActivityRecommender] 에러 상태:', roleFitError.response?.status);
        // 점수 계산 실패해도 활동 목록은 표시
      }

      setIsLoading(false);
    };

    fetchData();
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
        {roleFitData && roleFitData.breakdown && (
          <div style={{ marginTop: '15px', fontSize: '0.9rem', color: '#6c757d' }}>
            <div>스킬 적합도: {(roleFitData.breakdown.skillFit * 100).toFixed(1)}%</div>
            <div>경험 적합도: {(roleFitData.breakdown.experienceFit * 100).toFixed(1)}%</div>
            <div>학력 적합도: {(roleFitData.breakdown.educationFit * 100).toFixed(1)}%</div>
            <div>증빙 적합도: {(roleFitData.breakdown.evidenceFit * 100).toFixed(1)}%</div>
          </div>
        )}
        {improvements.length > 0 && (
          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e7f3ff', borderRadius: '4px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem' }}>개선 제안</h4>
            {improvements.slice(0, 3).map((item, idx) => (
              <div key={idx} style={{ marginBottom: '8px', fontSize: '0.85rem' }}>
                • {item.activity?.title || '활동'} (+{item.expectedScoreDelta?.toFixed(1)}점)
              </div>
            ))}
          </div>
        )}
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