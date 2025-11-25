// src/pages/ActivityRecommender.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Page.css';
import apiClient from '../api/apiClient';

// sessionStorage에서 userId를 가져오는 헬퍼
const getUserIdFromStorage = () => {
  try {
    const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
    return storedUser ? storedUser.user.userId : null;
  } catch (e) {
    return null;
  }
};

function ActivityRecommender() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]); // 공고(Job Postings) 목록
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(null); // 선택된 공고 ID
  const [searchQuery, setSearchQuery] = useState('');

  // 선택된 공고에 대한 분석 결과
  const [userScore, setUserScore] = useState(null);
  const [targetScore, setTargetScore] = useState(null); // 회사(공고) 요구 점수
  const [roleFitData, setRoleFitData] = useState(null);
  const [improvements, setImprovements] = useState([]); // 추천 공모전/대회
  
  const [isAnalyzing, setIsAnalyzing] = useState(false); // 분석 로딩 상태

  const handleSearch = async (query) => {
    const term = query || searchQuery;
    if (!term.trim()) {
      alert('검색어를 입력해주세요.');
      return;
    }

    try {
      console.log('[ActivityRecommender] ===== 의미 기반 검색 시작 =====');
      console.log('[ActivityRecommender] 검색어:', term);
      setIsLoading(true);
      
      const response = await apiClient.get('/search', {
        params: {
          q: term,
          topK: 10
        }
      });

      console.log('[ActivityRecommender] 검색 결과:', response.data);
      
      if (response.data && response.data.results) {
         const searchResults = response.data.results.map(item => item.activity);
         setActivities(searchResults);
         
         // 검색 후 첫 번째 아이템 자동 선택하지 않음 (사용자가 클릭하도록 유도)
         setActiveTab(null);
         setUserScore(null);
         setTargetScore(null);
         setRoleFitData(null);
         setImprovements([]);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error('[ActivityRecommender] 검색 실패:', error);
      alert('검색 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getCareerGoalFromStorage = async (userId) => {
    try {
      const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
      if (storedUser?.user?.interestDomains?.[0]) {
        return storedUser.user.interestDomains[0];
      }
      
      if (userId) {
        const profileResponse = await apiClient.get(`/users/${userId}/profile`);
        if (profileResponse.data?.interestDomains?.[0]) {
          return profileResponse.data.interestDomains[0];
        }
      }
      return null;
    } catch (e) {
      console.error('[ActivityRecommender] 목표 직무 가져오기 실패:', e);
      return null;
    }
  };

  // 1. 초기 로드: 목표 직무 기반 공고 검색
  useEffect(() => {
    const init = async () => {
      const userId = getUserIdFromStorage();
      if (!userId) {
        setIsLoading(false);
        return;
      }

      const careerGoal = await getCareerGoalFromStorage(userId);
      if (careerGoal) {
        console.log(`[ActivityRecommender] 목표 직무 '${careerGoal}' 기반 공고 검색`);
        setSearchQuery(careerGoal); // 검색어 창에 자동 입력
        await handleSearch(careerGoal);
      } else {
        setIsLoading(false);
        // 목표 직무가 없으면 빈 화면 혹은 안내
      }
    };
    init();
  }, []);

  // 2. 공고 클릭 시: 점수 분석 및 추천 활동(Improvements) 조회
  const handleJobClick = async (activity) => {
    setActiveTab(activity.activityId);
    const userId = getUserIdFromStorage();
    if (!userId) return;

    setIsAnalyzing(true);
    setUserScore(null);
    setTargetScore(null);
    setImprovements([]);

    try {
      // 2-1. RoleFitScore 계산 (공고 제목/내용을 target으로)
      // 정확도를 위해 activity.title과 activity.summary 등을 조합해서 target으로 보낼 수 있음
      // 여기서는 title을 사용
      const targetJob = activity.title;
      console.log(`[ActivityRecommender] '${targetJob}'에 대한 분석 시작`);

      const roleFitRequestBody = {
        target: targetJob,
        topNImprovements: 5
      };

      const roleFitResponse = await apiClient.post(
        `/users/${userId}/role-fit`,
        roleFitRequestBody
      );

      console.log('[ActivityRecommender] RoleFit 결과:', roleFitResponse.data);

      if (roleFitResponse.data) {
        setRoleFitData(roleFitResponse.data);
        // API 응답 구조에 따라 매핑. 
        // 만약 API가 targetJobScore를 주지 않으면 85~95 사이의 임의 값 혹은 roleFitScore + alpha로 시뮬레이션 할 수도 있음.
        // 여기서는 roleFitScore를 userScore로 사용
        setUserScore(roleFitResponse.data.roleFitScore);
        
        // API가 targetJobScore를 반환한다고 가정 (없으면 90점으로 고정)
        setTargetScore(roleFitResponse.data.targetJobScore || 90);
      }

      // 2-2. 추천 공모전/대회 (Improvements) 조회
      if (roleFitResponse.data?.target) {
        const improvementsResponse = await apiClient.get(
          `/users/${userId}/improvements`,
          {
            params: {
              roleId: roleFitResponse.data.target,
              size: 5
            }
          }
        );
        console.log('[ActivityRecommender] 추천 활동(Improvements):', improvementsResponse.data);
        setImprovements(improvementsResponse.data || []);
      }

    } catch (error) {
      console.error('[ActivityRecommender] 분석 실패:', error);
      alert('공고 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const selectedActivity = activities.find(act => act.activityId === activeTab);

  return (
    <div className="page-container">
      {/* 상단 검색바 */}
      <div style={{ marginBottom: '20px', padding: '0 10px' }}>
        <div style={{ display: 'flex', gap: '10px', maxWidth: '800px', margin: '0 auto' }}>
          <input
            type="text"
            placeholder="목표 직무나 관심 회사를 검색해보세요"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '16px'
            }}
          />
          <button
            onClick={() => handleSearch()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#1a73e8',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            검색
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>공고를 불러오는 중...</div>
      ) : (
        <div className="recommender-layout" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          
          {/* 왼쪽: 공고 목록 */}
          <div className="task-list-card" style={{ flex: 1, minWidth: '300px', maxHeight: '80vh', overflowY: 'auto' }}>
            <h4 style={{ padding: '10px', borderBottom: '1px solid #eee', margin: 0 }}>
              추천 공고 목록
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {activities.map(activity => (
                <li
                  key={activity.activityId}
                  className={activeTab === activity.activityId ? 'active' : ''}
                  onClick={() => handleJobClick(activity)}
                  style={{
                    padding: '15px',
                    borderBottom: '1px solid #f1f3f4',
                    cursor: 'pointer',
                    backgroundColor: activeTab === activity.activityId ? '#e8f0fe' : 'white'
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{activity.title}</div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>
                    {activity.organizer || '회사명 미상'} | {activity.location || '위치 미정'}
                  </div>
                </li>
              ))}
            </ul>
            {activities.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                검색 결과가 없습니다.
              </div>
            )}
          </div>

          {/* 오른쪽: 상세 정보 및 분석 결과 */}
          <div className="activity-detail-card" style={{ flex: 2, padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
            {selectedActivity ? (
              <>
                <h2 style={{ marginTop: 0 }}>{selectedActivity.title}</h2>
                <p style={{ color: '#666' }}>{selectedActivity.organizer}</p>
                
                {/* 1. 점수 분석 섹션 */}
                <div style={{ 
                  marginTop: '20px', 
                  padding: '20px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '8px',
                  border: '1px solid #dee2e6'
                }}>
                  {isAnalyzing ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <div className="spinner" style={{ display: 'inline-block', marginBottom: '10px' }}>⏳</div>
                      <div>사용자님의 역량과 공고를 분석 중입니다...</div>
                    </div>
                  ) : userScore !== null ? (
                    <div>
                      <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', borderBottom: '2px solid #007bff', paddingBottom: '8px', display: 'inline-block' }}>
                        📊 역량 분석 결과
                      </h3>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.9rem', color: '#666' }}>나의 점수</div>
                          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>{userScore}점</div>
                        </div>
                        <div style={{ fontSize: '1.5rem', color: '#aaa' }}>VS</div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.9rem', color: '#666' }}>합격 기준(예상)</div>
                          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>{targetScore}점</div>
                        </div>
                      </div>

                      {/* 2. 추천 공모전/대회 섹션 */}
                      {improvements.length > 0 && (
                        <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                          <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>💡 점수 향상을 위한 추천 활동</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {improvements.map((item, idx) => (
                              <div key={idx} style={{ 
                                padding: '12px', 
                                backgroundColor: 'white', 
                                border: '1px solid #e0e0e0', 
                                borderRadius: '6px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}>
                                <div>
                                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                                    {item.activity?.title || '추천 활동'}
                                  </div>
                                  <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '2px' }}>
                                    {item.activity?.summary ? item.activity.summary.substring(0, 60) + '...' : '이 활동을 통해 부족한 역량을 보완할 수 있습니다.'}
                                  </div>
                                </div>
                                <div style={{ 
                                  backgroundColor: '#e7f3ff', 
                                  color: '#007bff', 
                                  padding: '4px 8px', 
                                  borderRadius: '4px', 
                                  fontSize: '0.8rem',
                                  fontWeight: 'bold',
                                  whiteSpace: 'nowrap',
                                  marginLeft: '10px'
                                }}>
                                  +{item.expectedScoreDelta?.toFixed(1)}점
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* 3. AI 질문 버튼 */}
                      <div style={{ marginTop: '20px', textAlign: 'center' }}>
                        <button 
                          onClick={() => navigate('/prompt')}
                          style={{
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                          }}
                        >
                          💬 AI에게 상세 조언 구하기
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#666' }}>
                      분석 결과를 불러오지 못했습니다.
                    </div>
                  )}
                </div>

                {/* 공고 상세 내용 */}
                <div style={{ marginTop: '30px' }}>
                  {selectedActivity.summary && (
                    <div className="activity-section">
                      <h4>요약</h4>
                      <p>{selectedActivity.summary}</p>
                    </div>
                  )}
                  
                  {selectedActivity.content && (
                    <div className="activity-section">
                      <h4>상세 내용</h4>
                      <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: '1.6' }}>{selectedActivity.content}</p>
                    </div>
                  )}

                   {selectedActivity.url && (
                    <div className="activity-links" style={{ marginTop: '20px' }}>
                      <a href={selectedActivity.url} target="_blank" rel="noopener noreferrer">
                        <button style={{ width: '100%', padding: '12px' }}>공고 원문 보기</button>
                      </a>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#888' }}>
                왼쪽 목록에서 공고를 선택하여<br/>역량 분석과 추천 활동을 확인하세요.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ActivityRecommender;
