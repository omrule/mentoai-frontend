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
  const [activeTab, setActiveTab] = useState(null); // 선택된 공고 ID (jobId)
  const [careerGoal, setCareerGoal] = useState('');

  // 선택된 공고에 대한 분석 결과
  const [userScore, setUserScore] = useState(null);
  const [targetScore, setTargetScore] = useState(null); // 회사(공고) 요구 점수
  const [roleFitData, setRoleFitData] = useState(null);
  const [improvements, setImprovements] = useState([]); // 추천 공모전/대회
  
  const [isAnalyzing, setIsAnalyzing] = useState(false); // 분석 로딩 상태

  // 1. 초기 로드: 목표 직무 가져오기 -> 관련 공고 검색 (GET /job-postings)
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const userId = getUserIdFromStorage();
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        // 1-1. 목표 직무 가져오기
        let targetRole = null;
        const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
        
        // sessionStorage 우선 확인
        if (storedUser?.user?.interestDomains?.[0]) {
          targetRole = storedUser.user.interestDomains[0];
        } else {
          // API로 확인
          const profileResponse = await apiClient.get(`/users/${userId}/profile`);
          if (profileResponse.data?.interestDomains?.[0]) {
            targetRole = profileResponse.data.interestDomains[0];
          }
        }

        if (targetRole) {
          console.log(`[ActivityRecommender] 목표 직무 '${targetRole}' 발견. 관련 공고 조회.`);
          setCareerGoal(targetRole);

          // 1-2. 공고 검색 (GET /job-postings)
          // 명세서에 따라 targetRoleId 파라미터 사용
          const jobResponse = await apiClient.get('/job-postings', {
            params: {
              targetRoleId: targetRole, // 명세서의 targetRoleId 파라미터
              page: 1,
              size: 20
            }
          });

          console.log('[ActivityRecommender] 공고 조회 결과:', jobResponse.data);
          
          if (jobResponse.data && jobResponse.data.items) {
            setActivities(jobResponse.data.items);
          } else {
             setActivities([]);
          }
        } else {
          console.log('[ActivityRecommender] 목표 직무 없음.');
          // 목표 직무가 없으면 전체 공고를 보여주거나 안내 문구 표시
          const allJobsResponse = await apiClient.get('/job-postings', {
             params: { page: 1, size: 20 }
          });
          if (allJobsResponse.data && allJobsResponse.data.items) {
             setActivities(allJobsResponse.data.items);
          }
        }
      } catch (error) {
        console.error('[ActivityRecommender] 데이터 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // 2. 공고 클릭 시: 점수 분석 및 추천 활동(Improvements) 조회
  const handleJobClick = async (job) => {
    // job: JobPostingResponse 객체
    setActiveTab(job.jobId); 
    const userId = getUserIdFromStorage();
    if (!userId) return;

    setIsAnalyzing(true);
    setUserScore(null);
    setTargetScore(null);
    setImprovements([]);
    setRoleFitData(null);

    try {
      // 2-1. RoleFitScore 계산 (수정: GET /job-postings/{jobId}/score)
      console.log(`[ActivityRecommender] 공고 #${job.jobId}에 대한 분석 시작`);

      const roleFitResponse = await apiClient.get(
        `/job-postings/${job.jobId}/score`,
        { params: { userId } }
      );

      console.log('[ActivityRecommender] RoleFit 결과:', roleFitResponse.data);

      if (roleFitResponse.data) {
        setRoleFitData(roleFitResponse.data);
        setUserScore(roleFitResponse.data.roleFitScore);
        setTargetScore(roleFitResponse.data.targetJobScore || 90);
      }

      // 2-2. 추천 공모전/대회 (Improvements) 조회
      // API 응답의 target 또는 공고의 targetRoles 활용
      const targetRoleId = roleFitResponse.data?.target || job.targetRoles?.[0]?.targetRoleId;

      if (targetRoleId) {
        const improvementsResponse = await apiClient.get(
          `/users/${userId}/improvements`,
          {
            params: {
              roleId: targetRoleId,
              size: 5
            }
          }
        );
        console.log('[ActivityRecommender] 추천 활동(Improvements):', improvementsResponse.data);
        setImprovements(improvementsResponse.data || []);
      }

    } catch (error) {
      console.error('[ActivityRecommender] 분석 실패:', error);
      // alert('공고 분석 중 오류가 발생했습니다.'); // 사용자 경험을 위해 alert 제거하거나 토스트로 변경 권장
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 선택된 공고 찾기 (activities 배열의 요소는 JobPostingResponse 구조)
  const selectedActivity = activities.find(act => act.jobId === activeTab);

  return (
    <div className="page-container">
      <div style={{ padding: '0 10px 20px 10px' }}>
        <h2 style={{ margin: '0 0 10px 0' }}>
          {careerGoal ? `'${careerGoal}' 관련 채용 공고` : '채용 공고 목록'}
        </h2>
        <p style={{ color: '#666', margin: 0 }}>
          목표 직무에 맞는 공고를 선택하여 내 역량 점수를 확인해보세요.
        </p>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>공고를 불러오는 중...</div>
      ) : (
        <div className="recommender-layout" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          
          {/* 왼쪽: 공고 목록 */}
          <div className="task-list-card" style={{ flex: 1, minWidth: '300px', maxHeight: '80vh', overflowY: 'auto' }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {activities.map(job => (
                <li
                  key={job.jobId}
                  className={activeTab === job.jobId ? 'active' : ''}
                  onClick={() => handleJobClick(job)}
                  style={{
                    padding: '15px',
                    borderBottom: '1px solid #f1f3f4',
                    cursor: 'pointer',
                    backgroundColor: activeTab === job.jobId ? '#e8f0fe' : 'white'
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{job.title}</div>
                  <div style={{ fontSize: '0.9rem', color: '#555' }}>{job.companyName}</div>
                  <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '4px' }}>
                    {job.workPlace} 
                    {job.deadline && ` | ~${new Date(job.deadline).toLocaleDateString()}`}
                  </div>
                </li>
              ))}
            </ul>
            {activities.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                표시할 공고가 없습니다.
              </div>
            )}
          </div>

          {/* 오른쪽: 상세 정보 및 분석 결과 */}
          <div className="activity-detail-card" style={{ flex: 2, padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
            {selectedActivity ? (
              <>
                <div style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
                  <h2 style={{ margin: '0 0 10px 0' }}>{selectedActivity.title}</h2>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333' }}>{selectedActivity.companyName}</div>
                  <div style={{ color: '#666', marginTop: '5px' }}>
                    {selectedActivity.jobSector} | {selectedActivity.employmentType}
                  </div>
                </div>
                
                {/* 1. 점수 분석 섹션 */}
                <div style={{ 
                  marginBottom: '30px',
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
                          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>{userScore.toFixed(1)}점</div>
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
                <div>
                  {selectedActivity.description && (
                    <div className="activity-section">
                      <h4>상세 내용</h4>
                      <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: '1.6' }}>
                        {selectedActivity.description}
                      </p>
                    </div>
                  )}

                  {selectedActivity.requirements && (
                    <div className="activity-section">
                      <h4>자격 요건</h4>
                      <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: '1.6' }}>
                        {selectedActivity.requirements}
                      </p>
                    </div>
                  )}

                   {selectedActivity.link && (
                    <div className="activity-links" style={{ marginTop: '20px' }}>
                      <a href={selectedActivity.link} target="_blank" rel="noopener noreferrer">
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
